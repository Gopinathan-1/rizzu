import { supabase } from './auth';
import { generateText, generateVisionText, hasGeminiApiKey } from './gemini';
import { extractJson } from './geminiHelpers';

export type ConversationAnalysisResult = {
  tone: string;
  mood: string;
  replyStyles: string[];
  replies: string[];
};

async function getAuthToken(): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is unavailable');
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('No active Supabase session');
  }

  return accessToken;
}

async function analyzeConversationViaSupabase(conversation: string): Promise<ConversationAnalysisResult> {
  const accessToken = await getAuthToken();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/analyze-conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify({ conversation }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return (await response.json()) as ConversationAnalysisResult;
}

async function analyzeScreenshotViaSupabase(
  base64: string,
  mimeType: string
): Promise<ConversationAnalysisResult & { extractedText: string }> {
  const accessToken = await getAuthToken();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/analyze-screenshot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify({ base64, mimeType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return (await response.json()) as ConversationAnalysisResult & { extractedText: string };
}

async function generateToneRepliesViaSupabase(
  tone: string,
  context: string
): Promise<{ replies: string[] }> {
  const accessToken = await getAuthToken();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate-tone-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify({ tone, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return (await response.json()) as { replies: string[] };
}

async function analyzeConversationViaLocalGemini(conversation: string): Promise<ConversationAnalysisResult> {
  const analysisPrompt = `Analyze this conversation and return:\n1. The overall emotional tone (e.g., flirty, tense, casual, professional)\n2. The other person's intent or mood\n3. 3 suggested reply styles (e.g., playful, direct, empathetic)\n\nReturn JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}\n\nConversation:\n${conversation}`;

  const analysisResponse = await generateText(analysisPrompt);
  const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

  const replyPrompt = `You are a helpful human-like friend. Given the conversation below, write 3 short, natural-sounding replies the user could send. Make them feel authentic, concise, and varied in tone. Return JSON exactly as ["reply1","reply2","reply3"]\n\nConversation:\n${conversation}`;
  const replyResponse = await generateText(replyPrompt);
  const replies = extractJson<string[]>(replyResponse);

  return {
    tone: analysis.tone,
    mood: analysis.mood,
    replyStyles: analysis.replyStyles,
    replies: Array.isArray(replies) ? replies.slice(0, 3) : [],
  };
}

async function analyzeScreenshotViaLocalGemini(
  base64: string,
  mimeType: string
): Promise<ConversationAnalysisResult & { extractedText: string }> {
  const extractionPrompt = 'Extract all the text from this conversation screenshot. Preserve the flow and order of the messages. Return only the extracted text with no markdown or extra commentary.';
  const extractedText = (await generateVisionText(extractionPrompt, base64, mimeType)).trim();

  const analysisPrompt = `Analyze this conversation and return:\n1. The overall emotional tone (e.g., flirty, tense, casual, professional)\n2. The other person's intent or mood\n3. 3 suggested reply styles (e.g., playful, direct, empathetic)\n\nReturn JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}\n\nConversation:\n${extractedText}`;
  const analysisResponse = await generateText(analysisPrompt);
  const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

  const replyPrompt = `You are a helpful human-like friend. Given the conversation below, write 3 short, natural-sounding replies the user could send. Make them feel authentic, concise, and varied in tone. Return JSON exactly as ["reply1","reply2","reply3"]\n\nConversation:\n${extractedText}`;
  const replyResponse = await generateText(replyPrompt);
  const replies = extractJson<string[]>(replyResponse);

  return {
    extractedText,
    tone: analysis.tone,
    mood: analysis.mood,
    replyStyles: analysis.replyStyles,
    replies: Array.isArray(replies) ? replies.slice(0, 3) : [],
  };
}

async function generateToneRepliesViaLocalGemini(tone: string, context: string): Promise<{ replies: string[] }> {
  const prompt = `Generate 3 unique replies to the following conversation.\nApply the ${tone} tone strictly.\nReplies should feel natural, not robotic.\nReturn as JSON array: ["reply1", "reply2", "reply3"]\n\nContext:\n${context}`;
  const response = await generateText(prompt);
  const replies = extractJson<string[]>(response);

  return {
    replies: Array.isArray(replies) ? replies.slice(0, 3) : [],
  };
}

export async function analyzeConversation(
  conversation: string
): Promise<ConversationAnalysisResult> {
  if (hasGeminiApiKey()) {
    try {
      return await analyzeConversationViaLocalGemini(conversation);
    } catch (error) {
      console.warn('[conversationAnalysis] Local Gemini failed. Falling back to Supabase.', error);
    }
  }

  return analyzeConversationViaSupabase(conversation);
}

export async function analyzeScreenshot(
  base64: string,
  mimeType: string
): Promise<ConversationAnalysisResult & { extractedText: string }> {
  if (hasGeminiApiKey()) {
    try {
      return await analyzeScreenshotViaLocalGemini(base64, mimeType);
    } catch (error) {
      console.warn('[conversationAnalysis] Local Gemini failed. Falling back to Supabase.', error);
    }
  }

  return analyzeScreenshotViaSupabase(base64, mimeType);
}

export async function generateToneReplies(
  tone: string,
  context: string
): Promise<{ replies: string[] }> {
  if (hasGeminiApiKey()) {
    try {
      return await generateToneRepliesViaLocalGemini(tone, context);
    } catch (error) {
      console.warn('[conversationAnalysis] Local Gemini failed. Falling back to Supabase.', error);
    }
  }

  return generateToneRepliesViaSupabase(tone, context);
}
