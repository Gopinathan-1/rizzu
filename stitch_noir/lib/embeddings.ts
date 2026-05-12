import Constants from 'expo-constants';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY as string | undefined;
const EMBEDDING_MODEL = 'gemini-embedding-001';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY ?? '' });

function requireApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }
}

function extractEmbedding(values?: number[] | null) {
  if (!values?.length) {
    throw new Error('Empty Gemini embedding response');
  }

  return values;
}

export async function generateEmbedding(
  text: string,
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
  requireApiKey();

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType,
    },
  });

  return extractEmbedding(response.embeddings?.[0]?.values);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  requireApiKey();

  const response = await Promise.all(texts.map((text) => generateEmbedding(text)));
  return response;
}

export function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

export function getEmbeddingModelName() {
  return EMBEDDING_MODEL;
}
