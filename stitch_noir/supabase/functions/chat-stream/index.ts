import { chunkText } from '../../../lib/chunking.ts';
import { buildChunkId, buildRetrievalSummary } from '../../../lib/chroma.ts';
import { getTonePrompt, normalizeToneName } from '../../../lib/tonePrompts.ts';
import { generateChatTitle, generateEmbedding, streamText, summarizeMemory } from '../_shared/gemini.ts';
import { getAuthedClient, getServiceRoleClient, handleCorsPreflight, withCors } from '../_shared/supabase.ts';
import { queryChunks, upsertChunks } from '../_shared/chroma.ts';

declare const Deno: {
  serve: (handler: (request: Request) => Promise<Response> | Response) => void;
};

const encoder = new TextEncoder();
const CHAT_MEMORY_LIMIT = 12;
const RETRIEVAL_LIMIT = 6;

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '').slice(0, 80) || 'New chat';
}

function parseTitleResponse(text: string) {
  const jsonMatch = text.match(/"title"\s*:\s*"([^"]+)"/i);
  const fallback = text.replace(/[{}]/g, '').replace(/title\s*:\s*/i, '').trim();
  return normalizeTitle(jsonMatch?.[1] ?? fallback);
}

function buildPrompt(params: {
  chatTitle: string;
  userMessage: string;
  tonePrompt?: string;
  memories: string;
  uploads: string;
  retrieved: string;
  conversation: Array<{ role: string; content: string }>;
}) {
  const conversationBlock = params.conversation
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  return [
    'You are a ChatGPT-style personal memory assistant built into an app called Stitch Noir.',
    'Answer using a warm, concise, useful style with clean markdown.',
    'Use relevant uploaded documents, past chats, and long-term memory when helpful.',
    'If the context is not enough, say what is missing instead of inventing facts.',
    params.tonePrompt ?? '',
    `Current chat title: ${params.chatTitle}`,
    params.memories ? `Relevant memory summaries:\n${params.memories}` : '',
    params.uploads ? `Recent uploads and file context:\n${params.uploads}` : '',
    params.retrieved ? `Relevant retrieved chunks:\n${params.retrieved}` : '',
    conversationBlock ? `Conversation so far:\n${conversationBlock}` : '',
    `User message: ${params.userMessage}`,
    'Respond with exactly 3 short line replies.',
    'Do not use paragraphs or bullet lists.',
    'Keep the answer direct and natural. Use markdown only if it stays within three short lines.',
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
    const { client, user } = await getAuthedClient(request);
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
        .select('id, user_id, chat_id, filename, file_type, storage_path, created_at')
        .eq('user_id', user.id)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    console.log('[chat-stream] Chat context loaded');
    let retrievedHits: Array<{ document: string }> = [];
    try {
      console.log('[chat-stream] Generating embedding for query...');
      const queryEmbedding = await generateEmbedding(message, 'RETRIEVAL_QUERY');
      console.log('[chat-stream] Embedding generated, querying chunks...');
      retrievedHits = await queryChunks({
        userId: user.id,
        queryEmbedding,
        limit: RETRIEVAL_LIMIT,
        chatId,
      });
      console.log(`[chat-stream] Retrieved ${retrievedHits.length} chunks`);
    } catch (error) {
      console.warn('[chat-stream] Retrieval failed, continuing without Chroma context.', error);
    }
    const memoryItems = (memories ?? []) as Array<{ summary: string }>;
    const uploadItems = (uploads ?? []) as Array<{ filename: string; file_type: string }>;
    const messageItems = (messages ?? []) as Array<{ role: string; content: string }>;
    const prompt = buildPrompt({
      chatTitle: chat?.title ?? 'New chat',
      userMessage: message,
      tonePrompt: getTonePrompt(normalizeToneName(tone)),
      memories: memoryItems.map((item) => item.summary).join('\n\n'),
      uploads: uploadItems.map((item) => `${item.filename} (${item.file_type})`).join('\n'),
      retrieved: buildRetrievalSummary(retrievedHits),
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
          console.log('[chat-stream-stream] Creating text stream...');
          for await (const chunk of streamText(prompt)) {
            console.log(`[chat-stream-stream] Got chunk, length: ${chunk.length}`);
            assistantText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          console.log('[chat-stream-stream] Stream complete, summarizing memory...');
          const retrievedDocuments = retrievedHits;
          let summary = assistantText.slice(0, 500);

          try {
            summary = await summarizeMemory({
              chatTitle: chat?.title ?? 'New chat',
              extractedText: `${message}\n\n${retrievedDocuments.map((hit) => hit.document).join('\n\n')}`,
              responseText: assistantText,
            });
          } catch (error) {
            console.warn('[chat-stream-stream] Memory summary failed, using fallback text.', error);
          }

          try {
            console.log('[chat-stream-stream] Creating response chunks...');
            const assistantChunks = chunkText(assistantText).slice(0, 4);
            const assistantEmbeddings = await Promise.all(
              assistantChunks.map((chunk) => generateEmbedding(chunk.text, 'RETRIEVAL_DOCUMENT'))
            );

            console.log('[chat-stream-stream] Upserting chunks...');
            await upsertChunks({
              userId: user.id,
              chunks: assistantChunks.map((chunk, index) => ({
                id: buildChunkId({
                  userId: user.id,
                  chatId,
                  filename: 'conversation-memory',
                  chunkIndex: chunk.index,
                }),
                text: chunk.text,
                embedding: assistantEmbeddings[index],
                metadata: {
                  userId: user.id,
                  chatId,
                  filename: 'conversation-memory',
                  uploadTimestamp: new Date().toISOString(),
                  chunkIndex: chunk.index,
                  sourceType: 'chat',
                },
              })),
            });
          } catch (error) {
            console.warn('[chat-stream-stream] Chunk persistence failed, continuing.', error);
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
