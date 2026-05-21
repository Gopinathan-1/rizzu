import { generateText } from '../_shared/gemini.ts';
import { getAuthedClient, handleCorsPreflight, withCors } from '../_shared/supabase.ts';
import { getTonePrompt, normalizeToneName } from '../../../lib/tonePrompts.ts';

function parseReplies(text: string): string[] {
  const trimmed = text.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
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
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').replace(/^"|"$/g, '').trim())
    .filter(Boolean)
    .slice(0, 3);
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

    if (!tone || !context) {
      console.log('[generate-tone-reply] Validation failed: missing tone or context');
      return withCors(new Response(JSON.stringify({ error: 'Missing tone or context' }), { status: 400 }));
    }

    console.log('[generate-tone-reply] Generating replies for tone:', tone);

    const prompt = `${getTonePrompt(normalizeToneName(tone))}

  Context:
  ${context}

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
