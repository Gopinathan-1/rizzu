import { GoogleGenAI } from 'npm:@google/genai';
import { getEnv } from './supabase.ts';

const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'] as const;
const EMBEDDING_MODEL = 'gemini-embedding-001';

function getClient() {
  return new GoogleGenAI({ apiKey: getEnv('GEMINI_API_KEY') });
}

function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|quota|resource_exhausted|rate limit/i.test(message);
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  // Retry on quota errors or when a model is missing/unavailable so we can fallback
  return (
    isQuotaError(error) ||
    /not found|model not found|model .*not available|not available|invalid model|404|invalid_argument/i.test(message)
  );
}

function extractText(response: { text?: string | null }) {
  if (!response.text) {
    throw new Error('Empty Gemini response');
  }

  return response.text;
}

function toBase64(data: Uint8Array) {
  let binary = '';
  for (let index = 0; index < data.length; index += 1) {
    binary += String.fromCharCode(data[index]);
  }
  return btoa(binary);
}

export async function generateText(prompt: string) {
  const ai = getClient();
  let lastError: unknown = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      return extractText(response);
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

export async function* streamText(prompt: string) {
  const ai = getClient();
  let lastError: unknown = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContentStream({
        model,
        contents: prompt,
      });

      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }

      return;
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

export async function generateEmbedding(text: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT') {
  const ai = getClient();
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values?.length) {
    throw new Error('Empty embedding response');
  }

  return values;
}

export async function extractTextFromBinary(data: Uint8Array, mimeType: string, filename: string) {
  const ai = getClient();
  const prompt = [
    'Extract the readable text from this file.',
    'Preserve headings, lists, and paragraph order.',
    'Return only the extracted text with no markdown wrapper or extra commentary.',
    `Filename: ${filename}`,
  ].join('\n');

  let lastError: unknown = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: toBase64(data),
                },
              },
            ],
          },
        ],
      });

      return extractText(response).trim();
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

export async function generateVisionText(prompt: string, base64: string, mimeType: string) {
  const ai = getClient();

  let lastError: unknown = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      return extractText(response);
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

export async function summarizeMemory(params: {
  chatTitle: string;
  extractedText: string;
  responseText: string;
}) {
  const prompt = [
    'Extract the most useful long-term memory from this conversation and file context.',
    'Focus on lasting facts, preferences, and context worth remembering later.',
    'Keep it concise, concrete, and easy to reuse.',
    'Do not mention that this is a summary.',
    'Return only plain text.',
    `Chat title: ${params.chatTitle}`,
    'Conversation context:',
    params.extractedText,
    'Assistant response:',
    params.responseText,
  ].join('\n\n');

  return generateText(prompt);
}

export async function generateChatTitle(message: string) {
  const prompt = [
    'Create a short, useful chat title from the message below.',
    'Return JSON exactly like {"title":"..."}.',
    'Make it 2 to 6 words, title case, and easy to scan.',
    'Avoid generic labels like Chat 1 or New Conversation unless nothing else fits.',
    'Do not include quotes around the title value.',
    `Message: ${message}`,
  ].join('\n\n');

  return generateText(prompt);
}
