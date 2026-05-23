import Constants from 'expo-constants';
import { GoogleGenAI } from '@google/genai';

// Try multiple places for the API key: Expo extra (from app.config.js) or env at build time
const GEMINI_API_KEY = (Constants.expoConfig?.extra?.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY) as string | undefined;
const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'] as const;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY ?? '' });

export function hasGeminiApiKey(): boolean {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0);
}

function requireApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }
}

function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|quota|resource_exhausted|rate limit/i.test(message);
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    isQuotaError(error) ||
    /not found|model not found|model .*not available|not available|invalid model|404|invalid_argument/i.test(message)
  );
}

async function generateWithFallback(
  contents: Parameters<typeof ai.models.generateContent>[0]['contents']
): Promise<{ text?: string | null; candidates?: unknown[] }> {
  let lastError: unknown = null;

  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? new Error('Gemini quota was exceeded for all fallback models. Please try again later.')
    : new Error('Gemini quota was exceeded for all fallback models.');
}

function getTextFromResponse(response: { text?: string | null }) {
  // GoogleGenAI may return different shapes; try common fields first, otherwise inspect for candidates
  // response may be { text } or { candidates: [{ text }] } or already a string
  if (!response) throw new Error('Empty Gemini response object');

  // direct text
  if (typeof (response as any) === 'string') return response as unknown as string;
  if ((response as any).text) return (response as any).text;

  const candidates = (response as any).candidates;
  if (Array.isArray(candidates) && candidates[0]) {
    if (typeof candidates[0] === 'string') return candidates[0];
    if (candidates[0].text) return candidates[0].text;
    if (candidates[0].content) return JSON.stringify(candidates[0].content);
  }

  // fallback: return JSON string for debugging so caller can inspect
  throw new Error('Unrecognized Gemini response shape: ' + JSON.stringify(response));
}

export async function generateText(prompt: string): Promise<string> {
  requireApiKey();

  const response = await generateWithFallback(prompt);

  return getTextFromResponse(response);
}

export async function generateVisionText(
  prompt: string,
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  requireApiKey();

  const response = await generateWithFallback([
    {
      role: 'user',
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
      ],
    },
  ]);

  return getTextFromResponse(response);
}
