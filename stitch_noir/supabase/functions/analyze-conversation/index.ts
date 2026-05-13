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

type AnalysisRequest = {
  conversation: string;
};

type AnalysisResponse = {
  tone: string;
  mood: string;
  replyStyles: string[];
  replies: string[];
};

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    console.log('[analyze-conversation] Request received');
    const { user } = await getAuthedClient(request);
    console.log('[analyze-conversation] Auth successful, user:', user.id);
    
    const body = (await request.json()) as AnalysisRequest;
    const conversation = String(body.conversation ?? '').trim();

    if (!conversation) {
      console.log('[analyze-conversation] Validation failed: missing conversation');
      return withCors(new Response(JSON.stringify({ error: 'Missing conversation text' }), { status: 400 }));
    }

    console.log('[analyze-conversation] Analyzing conversation...');

    // Step 1: Analyze the conversation
    const analysisPrompt = `Analyze this conversation and return:\n1. The overall emotional tone (e.g., flirty, tense, casual, professional)\n2. The other person's intent or mood\n3. 3 suggested reply styles (e.g., playful, direct, empathetic)\n\nReturn JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}\n\nConversation:\n${conversation}`;

    const analysisResponse = await generateText(analysisPrompt);
    console.log('[analyze-conversation] Analysis response:', analysisResponse);
    
    const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

    // Step 2: Generate human-like replies
    const replyPrompt = `You are a helpful human-like friend. Given the conversation below, write 3 short, natural-sounding replies the user could send. Make them feel authentic, concise, and varied in tone. Return JSON exactly as ["reply1","reply2","reply3"]\n\nConversation:\n${conversation}`;

    const replyResponse = await generateText(replyPrompt);
    console.log('[analyze-conversation] Reply response:', replyResponse);
    
    const replies = extractJson<string[]>(replyResponse);
    const slicedReplies = Array.isArray(replies) ? replies.slice(0, 3) : [];

    const result: AnalysisResponse = {
      tone: analysis.tone,
      mood: analysis.mood,
      replyStyles: analysis.replyStyles,
      replies: slicedReplies,
    };

    console.log('[analyze-conversation] Returning result:', result);
    return withCors(new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    console.error('[analyze-conversation] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return withCors(new Response(JSON.stringify({ error: message }), { status: 500 }));
  }
});
