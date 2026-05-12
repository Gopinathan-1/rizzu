export type SemanticChunk = {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  tokenEstimate: number;
};

export type ChunkTextOptions = {
  maxChunkSize?: number;
  overlapSize?: number;
  minChunkSize?: number;
};

const DEFAULT_MAX_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP_SIZE = 160;
const DEFAULT_MIN_CHUNK_SIZE = 180;

function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function splitParagraphs(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/g)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function packSegments(segments: string[], maxChunkSize: number) {
  const chunks: string[] = [];
  let current = '';

  for (const segment of segments) {
    if (!current) {
      current = segment;
      continue;
    }

    const next = `${current}\n\n${segment}`;
    if (next.length <= maxChunkSize) {
      current = next;
      continue;
    }

    chunks.push(current);
    current = segment;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function applyOverlap(chunks: string[], overlapSize: number) {
  if (!overlapSize || chunks.length < 2) {
    return chunks;
  }

  const overlapped: string[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const previous = overlapped[index - 1] ?? '';
    const prefix = previous ? previous.slice(Math.max(0, previous.length - overlapSize)) : '';
    const current = chunks[index];
    overlapped.push(prefix ? `${prefix}\n\n${current}` : current);
  }

  return overlapped;
}

export function chunkText(text: string, options: ChunkTextOptions = {}): SemanticChunk[] {
  const maxChunkSize = options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  const overlapSize = options.overlapSize ?? DEFAULT_OVERLAP_SIZE;
  const minChunkSize = options.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE;
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChunkSize) {
    return [
      {
        index: 0,
        text: normalized,
        startChar: 0,
        endChar: normalized.length,
        tokenEstimate: estimateTokenCount(normalized),
      },
    ];
  }

  const paragraphs = splitParagraphs(text);
  const paragraphChunks = packSegments(
    paragraphs.length > 0 ? paragraphs : splitSentences(normalized),
    maxChunkSize
  );
  const chunksWithOverlap = applyOverlap(paragraphChunks, overlapSize);

  return chunksWithOverlap.flatMap((chunk, index) => {
    const trimmed = chunk.trim();
    if (!trimmed || trimmed.length < minChunkSize && index > 0) {
      return [];
    }

    return [
      {
        index,
        text: trimmed,
        startChar: 0,
        endChar: trimmed.length,
        tokenEstimate: estimateTokenCount(trimmed),
      },
    ];
  });
}

export function joinChunkTexts(chunks: SemanticChunk[]) {
  return chunks.map((chunk) => chunk.text).join('\n\n');
}
