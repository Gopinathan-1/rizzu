import { getToneConversationPrompt, normalizeToneName } from '../../../lib/tonePrompts.ts';
import { generateChatTitle, streamText, summarizeMemory } from '../_shared/gemini.ts';
import { getAuthedClient, getServiceRoleClient, handleCorsPreflight, withCors } from '../_shared/supabase.ts';

declare const Deno: {
  serve: (handler: (request: Request) => Promise<Response> | Response) => void;
};

const encoder = new TextEncoder();
const CHAT_MEMORY_LIMIT = 12;

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '').slice(0, 80) || 'New chat';
}

function parseTitleResponse(text: string) {
  const jsonMatch = text.match(/"title"\s*:\s*"([^"]+)"/i);
  const fallback = text.replace(/[{}]/g, '').replace(/title\s*:\s*/i, '').trim();
  return normalizeTitle(jsonMatch?.[1] ?? fallback);
}

function isGreetingMessage(message: string) {
  const normalized = message.trim().toLowerCase().replace(/[^a-z0-9\s'?]/g, '');
  return (
    /^(hi|hey|hello|yo|sup|hiya|hii)(\s+(how\s+(?:r|are)\s+u|how are you|how's it going|what'?s up|whats up|wyd))?[\s!?.,]*$/.test(normalized) ||
    /^(how\s+(?:r|are)\s+u|how are you|how's it going|what'?s up|whats up|wyd)[\s!?.,]*$/.test(normalized)
  );
}

function buildGreetingReply(tone: string, message: string) {
  const normalizedTone = normalizeToneName(tone);
  const asksHowAreYou = /how\s+(?:r|are)\s+u|how are you|how's it going|what'?s up|whats up|wyd/i.test(message);

  const replies: Record<string, string> = {
    Witty: asksHowAreYou ? 'Hi, I’m good. How about you?' : 'Hi there.',
    Mysterious: asksHowAreYou ? 'Hey. I’m good. You?' : 'Hey.',
    Savage: asksHowAreYou ? 'Yeah, I’m good. You?' : 'Yo.',
    Professional: asksHowAreYou ? 'Hi, I’m doing well. How are you?' : 'Hi.',
    Flirty: asksHowAreYou ? 'Hi, I’m good. How about you?' : 'Hey you.',
  };

  return replies[normalizedTone] ?? (asksHowAreYou ? 'Hi, I’m good. How are you?' : 'Hi.');
}

function buildFallbackReply(tone: string, message: string) {
  if (isGreetingMessage(message)) {
    return buildGreetingReply(tone, message);
  }

  const normalizedTone = normalizeToneName(tone);
  const replies: Record<string, string> = {
    Witty: 'Got you.',
    Mysterious: 'I see.',
    Savage: 'Yeah.',
    Professional: 'Understood.',
    Flirty: 'Okay, you.'
  };

  return replies[normalizedTone] ?? 'Got you.';
}

function buildPrompt(params: {
  chatTitle: string;
  userMessage: string;
  tonePrompt?: string;
  memories: string;
  uploads: string;
  conversation: Array<{ role: string; content: string }>;
}) {
  const conversationBlock = params.conversation
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  return [
    'Reply like a real person having a chat.',
    'Write one short message only.',
    'Keep it simple, natural, and human.',
    'Never write a paragraph.',
    params.tonePrompt ?? '',
    `Current chat title: ${params.chatTitle}`,
    params.memories ? `Relevant memory summaries:\n${params.memories}` : '',
    params.uploads ? `Recent uploads and file context:\n${params.uploads}` : '',
    conversationBlock ? `Conversation so far:\n${conversationBlock}` : '',
    `User message: ${params.userMessage}`,
    'Respond with a single short conversational reply.',
    'No bullets, no lists, no paragraph formatting.',
    'If the user greets you, greet them back simply.',
    'If the user asks a question, answer it briefly.',
    'Never write more than 2 short sentences.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    console.log('[chat-stream] Request received');
    const { user } = await getAuthedClient(request);
    console.log('[chat-stream] Auth successful, user:', user.id);
    const body = await request.json();
    const chatId = String(body.chatId ?? '');
    const message = String(body.message ?? '').trim();
    const tone = typeof body.tone === 'string' ? body.tone : undefined;

    if (!chatId || !message) {
      console.log('[chat-stream] Validation failed: missing chatId or message');
      return new Response(JSON.stringify({ error: 'Missing chatId or message' }), { status: 400 });
    }

    console.log('[chat-stream] Fetching chat context...');
    const db = getServiceRoleClient();

    const [{ data: chat }, { data: messages }, { data: memories }, { data: uploads }] = await Promise.all([
      db.from('chats').select('id, user_id, title, created_at, updated_at').eq('id', chatId).eq('user_id', user.id).single(),
      db
        .from('messages')
        .select('id, chat_id, user_id, role, content, created_at')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(CHAT_MEMORY_LIMIT),
      db
        .from('memories')
        .select('id, user_id, chat_id, summary, created_at')
        .eq('user_id', user.id)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(6),
      db
        .from('uploads')
        .select('id, user_id, chat_id, filename, file_type, extracted_text, created_at')
        .eq('user_id', user.id)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    console.log('[chat-stream] Chat context loaded');
    const memoryItems = (memories ?? []) as Array<{ summary: string }>;
    const uploadItems = (uploads ?? []) as Array<{ filename: string; file_type: string; extracted_text: string | null }>;
    const messageItems = (messages ?? []) as Array<{ role: string; content: string }>;
    const greetingShortcut = isGreetingMessage(message);

    const uploadContext = uploadItems
      .map((item) => {
        const extractedText = item.extracted_text?.trim();
        const textBlock = extractedText ? `\n${extractedText.slice(0, 3500)}` : '';
        return `${item.filename} (${item.file_type})${textBlock}`;
      })
      .join('\n\n');

    const prompt = buildPrompt({
      chatTitle: chat?.title ?? 'New chat',
      userMessage: message,
      tonePrompt: getToneConversationPrompt(normalizeToneName(tone)),
      memories: memoryItems.map((item) => item.summary).join('\n\n'),
      uploads: uploadContext,
      conversation: messageItems
        .slice()
        .reverse()
        .map((item) => ({ role: item.role, content: item.content })),
    });

    console.log('[chat-stream] Starting stream...');
    const responseStream = new ReadableStream({
      async start(controller) {
        let assistantText = '';

        try {
          if (greetingShortcut) {
            assistantText = buildGreetingReply(tone ?? 'Witty', message);
            controller.enqueue(encoder.encode(assistantText));
          } else {
            console.log('[chat-stream-stream] Creating text stream...');
            for await (const chunk of streamText(prompt)) {
              console.log(`[chat-stream-stream] Got chunk, length: ${chunk.length}`);
              assistantText += chunk;
              controller.enqueue(encoder.encode(chunk));
            }

            if (!assistantText.trim()) {
              assistantText = buildFallbackReply(tone ?? 'Witty', message);
              controller.enqueue(encoder.encode(assistantText));
            }
          }

          console.log('[chat-stream-stream] Stream complete, summarizing memory...');
          let summary = assistantText.slice(0, 500);

          try {
            summary = await summarizeMemory({
              chatTitle: chat?.title ?? 'New chat',
              extractedText: `${message}\n\n${uploadContext}`,
              responseText: assistantText,
            });
          } catch (error) {
            console.warn('[chat-stream-stream] Memory summary failed, using fallback text.', error);
          }

          console.log('[chat-stream-stream] Saving message and memory...');
          await Promise.all([
            db.from('messages').insert({
              chat_id: chatId,
              user_id: user.id,
              role: 'assistant',
              content: assistantText,
            }),
            db.from('memories').insert({
              user_id: user.id,
              chat_id: chatId,
              summary,
            }),
          ]);

          try {
            const nextTitle =
              chat?.title && chat.title !== 'New chat'
                ? chat.title
                : parseTitleResponse(await generateChatTitle(message));

            await db
              .from('chats')
              .update({
                title: nextTitle,
                updated_at: new Date().toISOString(),
              })
              .eq('id', chatId)
              .eq('user_id', user.id);
          } catch (error) {
            console.warn('[chat-stream-stream] Title update failed, keeping existing title.', error);
          }

          console.log('[chat-stream-stream] All complete, closing stream');
          controller.close();
        } catch (error) {
          console.error('[chat-stream-stream] Error in stream:', error);
          controller.error(error);
        }
      },
    });

    console.log('[chat-stream] Returning response');
    return withCors(
      new Response(responseStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      })
    );
  } catch (error) {
    console.error('[chat-stream] Error:', error);
    return withCors(
      new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Chat streaming failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
});
