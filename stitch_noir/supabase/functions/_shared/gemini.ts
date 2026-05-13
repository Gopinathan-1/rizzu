import { GoogleGenAI } from 'npm:@google/genai';
import { getEnv } from './supabase.ts';

const GEMINI_MODEL = 'gemini-3-flash-preview';
const EMBEDDING_MODEL = 'gemini-embedding-001';

function getClient() {
  return new GoogleGenAI({ apiKey: getEnv('GEMINI_API_KEY') });
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
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return extractText(response);
}

export async function* streamText(prompt: string) {
  const ai = getClient();
  const response = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
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

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
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
}

export async function generateVisionText(prompt: string, base64: string, mimeType: string) {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
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
}

export async function summarizeMemory(params: {
  chatTitle: string;
  extractedText: string;
  responseText: string;
}) {
  const prompt = [
    'Summarize the most useful long-term memory from this conversation and file context.',
    'Return a concise summary of lasting facts, preferences, and context worth remembering.',
    'Keep the summary under 5 sentences and do not mention that this is a summary.',
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
    'The title should be 2 to 6 words, title case, and not include quotes.',
    `Message: ${message}`,
  ].join('\n\n');

  return generateText(prompt);
}
