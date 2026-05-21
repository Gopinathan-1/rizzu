import { generateVisionText, generateText } from '../_shared/gemini.ts';
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

type ScreenshotAnalysisRequest = {
  base64: string;
  mimeType: string;
};

type ScreenshotAnalysisResponse = {
  extractedText: string;
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
    console.log('[analyze-screenshot] Request received');
    const { user } = await getAuthedClient(request);
    console.log('[analyze-screenshot] Auth successful, user:', user.id);
    
    const body = (await request.json()) as ScreenshotAnalysisRequest;
    const base64 = String(body.base64 ?? '').trim();
    const mimeType = String(body.mimeType ?? 'image/jpeg').trim();

    if (!base64) {
      console.log('[analyze-screenshot] Validation failed: missing base64');
      return withCors(new Response(JSON.stringify({ error: 'Missing base64 image data' }), { status: 400 }));
    }

    console.log('[analyze-screenshot] Analyzing screenshot...');

    // Step 1: Extract text from image
    const extractionPrompt = `Extract all text from this conversation screenshot. Preserve message order and natural flow. Return only the extracted text with no markdown or extra commentary.`;

    const extractedTextResponse = await generateVisionText(extractionPrompt, base64, mimeType);
    const extractedText = extractedTextResponse.trim();
    console.log('[analyze-screenshot] Extracted text:', extractedText);

    // Step 2: Analyze the conversation
    const analysisPrompt = `You are analyzing a real conversation screenshot.

  Return JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}

  Guidelines:
  - Tone should be a short label like flirty, casual, tense, professional, playful, etc.
  - Mood should describe the other person's likely intent or emotional state in plain language.
  - replyStyles should contain 3 distinct short reply style labels that feel useful and specific.
  - Avoid vague filler unless the conversation truly lacks signal.
  - Do not include markdown, commentary, or extra text.

  Conversation:
  ${extractedText}`;

    const analysisResponse = await generateText(analysisPrompt);
    console.log('[analyze-screenshot] Analysis response:', analysisResponse);
    
    const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

    // Step 3: Generate human-like replies
    const replyPrompt = `Write 3 natural replies the user could send.

  Rules:
  - Return JSON exactly as ["reply1","reply2","reply3"].
  - Each reply must be short, human, and easy to send.
  - Make the 3 replies noticeably different in wording and energy.
  - Keep them modern, clean, and believable.
  - Avoid robotic phrasing, generic filler, and repetitive sentence patterns.
  - No markdown or extra commentary.

  Conversation:
  ${extractedText}`;

    const replyResponse = await generateText(replyPrompt);
    console.log('[analyze-screenshot] Reply response:', replyResponse);
    
    const replies = extractJson<string[]>(replyResponse);
    const slicedReplies = Array.isArray(replies) ? replies.slice(0, 3) : [];

    const result: ScreenshotAnalysisResponse = {
      extractedText,
      tone: analysis.tone,
      mood: analysis.mood,
      replyStyles: analysis.replyStyles,
      replies: slicedReplies,
    };

    console.log('[analyze-screenshot] Returning result');
    return withCors(new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    console.error('[analyze-screenshot] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return withCors(new Response(JSON.stringify({ error: message }), { status: 500 }));
  }
});
