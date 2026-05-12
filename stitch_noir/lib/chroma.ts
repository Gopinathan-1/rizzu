export const CHROMA_COLLECTION_NAME = 'stitch_noir_memory';

export type ChromaMemoryMetadata = {
  userId: string;
  chatId?: string | null;
  filename?: string | null;
  uploadTimestamp?: string | null;
  chunkIndex?: number | null;
  sourceType?: 'upload' | 'chat' | 'summary';
  messageId?: string | null;
};

export type ChromaSearchHit = {
  id: string;
  document: string;
  metadata: ChromaMemoryMetadata;
  distance?: number | null;
};

export function buildCollectionNamespace(userId: string) {
  return `${CHROMA_COLLECTION_NAME}_${userId.replace(/-/g, '')}`;
}

export function buildChunkId(metadata: Pick<ChromaMemoryMetadata, 'userId' | 'chatId' | 'filename' | 'chunkIndex'>) {
  return [metadata.userId, metadata.chatId ?? 'global', metadata.filename ?? 'memory', metadata.chunkIndex ?? 0, Date.now()].join('_');
}

export function buildRetrievalSummary(hits: ChromaSearchHit[]) {
  if (!hits.length) {
    return '';
  }

  return hits
    .map((hit, index) => {
      const source = [hit.metadata.filename, hit.metadata.chatId].filter(Boolean).join(' · ');
      const prefix = source ? `${source}: ` : '';
      return `${index + 1}. ${prefix}${hit.document}`;
    })
    .join('\n\n');
}

export function normalizeChromaMetadata(metadata: ChromaMemoryMetadata): Record<string, string | number | boolean | null> {
  return {
    userId: metadata.userId,
    chatId: metadata.chatId ?? null,
    filename: metadata.filename ?? null,
    uploadTimestamp: metadata.uploadTimestamp ?? null,
    chunkIndex: metadata.chunkIndex ?? null,
    sourceType: metadata.sourceType ?? 'upload',
    messageId: metadata.messageId ?? null,
  };
}
