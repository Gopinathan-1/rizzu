import { supabase } from './auth';
import { generateText, generateVisionText, hasGeminiApiKey } from './gemini';
import { extractJson } from './geminiHelpers';
import { getTonePrompt, normalizeToneName } from '@/lib/tonePrompts';

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

  const compactContext = context.replace(/\s+/g, ' ').trim();
  const trimmedContext = compactContext.length > 4000 ? compactContext.slice(-4000) : compactContext;

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate-tone-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify({ tone, context: trimmedContext }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return (await response.json()) as { replies: string[] };
}

async function analyzeConversationViaLocalGemini(conversation: string): Promise<ConversationAnalysisResult> {
  const analysisPrompt = `You are analyzing a real conversation.

Return JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}

Guidelines:
- Tone should be a short label like flirty, casual, tense, professional, playful, etc.
- Mood should describe the other person's likely intent or emotional state in plain language.
- replyStyles should contain 3 distinct short reply style labels that feel useful and specific.
- Avoid vague filler like "mixed" or "normal" unless the conversation truly lacks signal.
- Do not include markdown, commentary, or extra text.

Conversation:
${conversation}`;

  const analysisResponse = await generateText(analysisPrompt);
  const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

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
  const extractionPrompt = 'Extract all text from this conversation screenshot. Preserve message order and natural flow. Return only the extracted text with no markdown or extra commentary.';
  const extractedText = (await generateVisionText(extractionPrompt, base64, mimeType)).trim();

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
  const analysis = extractJson<{ tone: string; mood: string; replyStyles: string[] }>(analysisResponse);

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
  const compactContext = context.replace(/\s+/g, ' ').trim();
  const trimmedContext = compactContext.length > 4000 ? compactContext.slice(-4000) : compactContext;

  const prompt = `${getTonePrompt(normalizeToneName(tone))}

Conversation:
${trimmedContext}

Make the replies feel like real text messages based on the latest user input and the surrounding context.

Return exactly 3 replies, one per line, with no labels, bullets, or extra commentary.`;
  const response = await generateText(prompt);
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

  const replies = response
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeReply(line))
    .filter(Boolean)
    .slice(0, 3);

  return {
    replies,
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
