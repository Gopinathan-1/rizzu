import Constants from 'expo-constants';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = 'gemini-3-flash-preview';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY ?? '' });

function requireApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }
}

function getTextFromResponse(response: { text?: string | null }) {
  if (!response.text) {
    throw new Error('Empty Gemini response');
  }

  return response.text;
}

export async function generateText(prompt: string): Promise<string> {
  requireApiKey();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return getTextFromResponse(response);
}

export async function generateVisionText(
  prompt: string,
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  requireApiKey();

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
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  return getTextFromResponse(response);
}
