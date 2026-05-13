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
    const extractionPrompt = `Extract all the text from this conversation screenshot. Preserve the flow and order of the messages. Return only the extracted text with no markdown or extra commentary.`;

    const extractedTextResponse = await generateVisionText(extractionPrompt, base64, mimeType);
    const extractedText = extractedTextResponse.trim();
    console.log('[analyze-screenshot] Extracted text:', extractedText);

    // Step 2: Analyze the conversation
    const analysisPrompt = `Analyze this conversation and return:\n1. The overall emotional tone (e.g., flirty, tense, casual, professional)\n2. The other person's intent or mood\n3. 3 suggested reply styles (e.g., playful, direct, empathetic)\n\nReturn JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}\n\nConversation:\n${extractedText}`;

    const analysisResponse = await generateText(analysisPrompt);
    console.log('[analyze-screenshot] Analysis response:', analysisResponse);
    
    const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

    // Step 3: Generate human-like replies
    const replyPrompt = `You are a helpful human-like friend. Given the conversation below, write 3 short, natural-sounding replies the user could send. Make them feel authentic, concise, and varied in tone. Return JSON exactly as ["reply1","reply2","reply3"]\n\nConversation:\n${extractedText}`;

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
