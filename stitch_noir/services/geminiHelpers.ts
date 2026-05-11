export function extractJson<T>(text: string): T {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Could not parse Gemini response');
    }
    return JSON.parse(match[0]) as T;
  }
}