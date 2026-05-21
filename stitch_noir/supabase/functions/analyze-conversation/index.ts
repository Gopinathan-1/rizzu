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
    const analysisPrompt = `You are analyzing a real conversation.

  Return JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}

  Guidelines:
  - Tone should be a short label like flirty, casual, tense, professional, playful, etc.
  - Mood should describe the other person's likely intent or emotional state in plain language.
  - replyStyles should contain 3 distinct short reply style labels that feel useful and specific.
  - Avoid vague filler unless the conversation truly lacks signal.
  - Do not include markdown, commentary, or extra text.

  Conversation:
  ${conversation}`;

    const analysisResponse = await generateText(analysisPrompt);
    console.log('[analyze-conversation] Analysis response:', analysisResponse);
    
    const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

    // Step 2: Generate human-like replies
    const replyPrompt = `Write 3 natural replies the user could send.

  Rules:
  - Return JSON exactly as ["reply1","reply2","reply3"].
  - Each reply must be short, human, and easy to send.
  - Make the 3 replies noticeably different in wording and energy.
  - Keep them modern, clean, and believable.
  - Avoid robotic phrasing, generic filler, and repetitive sentence patterns.
  - No markdown or extra commentary.

  Conversation:
  ${conversation}`;

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
