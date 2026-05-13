import { generateText } from '../_shared/gemini.ts';
import { getAuthedClient, handleCorsPreflight, withCors } from '../_shared/supabase.ts';

function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Could not parse response: ' + trimmed);
    }
    return JSON.parse(match[0]) as T;
  }
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

    const prompt = `Generate 3 unique replies to the following conversation.\nApply the ${tone} tone strictly.\nReplies should feel natural, not robotic.\nReturn as JSON array: ["reply1", "reply2", "reply3"]\n\nContext:\n${context}`;

    const response = await generateText(prompt);
    console.log('[generate-tone-reply] Response received');
    
    const replies = extractJson<string[]>(response);
    const slicedReplies = Array.isArray(replies) ? replies.slice(0, 3) : [];

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
