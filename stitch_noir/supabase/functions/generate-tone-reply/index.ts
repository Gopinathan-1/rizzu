import { generateText } from '../_shared/gemini.ts';
import { getAuthedClient, handleCorsPreflight, withCors } from '../_shared/supabase.ts';
import { getTonePrompt, normalizeToneName } from '../../../lib/tonePrompts.ts';

function parseReplies(text: string): string[] {
  const trimmed = text.trim();

  const normalizeReply = (value: string) => {
    const firstSentence = value.split(/(?<=[.!?])\s+/)[0] ?? value;
    return firstSentence
      .replace(/\s+/g, ' ')
      .replace(/^[-*•\d.)\s]+/, '')
      .replace(/^"|"$/g, '')
      .trim()
      .split(' ')
      .slice(0, 12)
      .join(' ');
  };

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeReply(String(item)))
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch {
    // Fall back to line parsing.
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeReply(line))
    .filter(Boolean)
    .slice(0, 3);
}

function compactToneContext(context: string) {
  const compact = context.replace(/\s+/g, ' ').trim();
  return compact.length > 4000 ? compact.slice(-4000) : compact;
}

declare const Deno: {
  serve: (handler: (request: Request) => Promise<Response> | Response) => void;
};

type GenerateReplyRequest = {
  tone: string;
  context: string;
};

type GenerateReplyResponse = {
  replies: string[];
};

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    console.log('[generate-tone-reply] Request received');
    const { user } = await getAuthedClient(request);
    console.log('[generate-tone-reply] Auth successful, user:', user.id);
    
    const body = (await request.json()) as GenerateReplyRequest;
    const tone = String(body.tone ?? '').trim();
    const context = String(body.context ?? '').trim();
    const trimmedContext = compactToneContext(context);

    if (!tone || !trimmedContext) {
      console.log('[generate-tone-reply] Validation failed: missing tone or context');
      return withCors(new Response(JSON.stringify({ error: 'Missing tone or context' }), { status: 400 }));
    }

    console.log('[generate-tone-reply] Generating replies for tone:', tone);

    const prompt = `${getTonePrompt(normalizeToneName(tone))}

  Context:
  ${trimmedContext}

  Keep the replies short, simple, and like a real person texting back.
  Return exactly 3 replies, one per line, with no labels, bullets, or extra commentary.`;

    const response = await generateText(prompt);
    console.log('[generate-tone-reply] Response received');
    
    const slicedReplies = parseReplies(response);

    const result: GenerateReplyResponse = {
      replies: slicedReplies,
    };

    console.log('[generate-tone-reply] Returning result with', slicedReplies.length, 'replies');
    return withCors(new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    console.error('[generate-tone-reply] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return withCors(new Response(JSON.stringify({ error: message }), { status: 500 }));
  }
});
