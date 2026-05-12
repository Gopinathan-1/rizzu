import { CloudClient } from 'npm:chromadb';
import { getEnv } from './supabase.ts';
import { CHROMA_COLLECTION_NAME, buildCollectionNamespace, normalizeChromaMetadata, type ChromaMemoryMetadata, type ChromaSearchHit } from '../../../lib/chroma.ts';

function getClient() {
  return new CloudClient({
    apiKey: getEnv('CHROMA_API_KEY'),
    host: getEnv('CHROMA_HOST'),
    tenant: getEnv('CHROMA_TENANT'),
    database: getEnv('CHROMA_DATABASE'),
    port: 443,
    ssl: true,
  });
}

async function getCollection(userId: string) {
  const client = getClient();
  return client.getOrCreateCollection({
    name: buildCollectionNamespace(userId),
    metadata: {
      description: `Personal memory workspace for ${userId}`,
      baseCollection: CHROMA_COLLECTION_NAME,
    },
  });
}

export async function upsertChunks(params: {
  userId: string;
  chunks: Array<{ id: string; text: string; embedding: number[]; metadata: ChromaMemoryMetadata }>;
}) {
  if (!params.chunks.length) {
    return { inserted: 0 };
  }

  const collection = await getCollection(params.userId);
  await collection.upsert({
    ids: params.chunks.map((chunk) => chunk.id),
    documents: params.chunks.map((chunk) => chunk.text),
    embeddings: params.chunks.map((chunk) => chunk.embedding),
    metadatas: params.chunks.map((chunk) => normalizeChromaMetadata(chunk.metadata)),
  });

  return { inserted: params.chunks.length };
}

export async function queryChunks(params: {
  userId: string;
  queryEmbedding: number[];
  limit?: number;
  chatId?: string | null;
}) {
  const collection = await getCollection(params.userId);
  const where = params.chatId
    ? {
        $and: [{ userId: params.userId }, { chatId: params.chatId }],
      }
    : { userId: params.userId };

  const result = await collection.query({
    queryEmbeddings: [params.queryEmbedding],
    nResults: params.limit ?? 6,
    where,
    include: ['documents', 'metadatas', 'distances'],
  });

  const documents = result.documents?.[0] ?? [];
  const metadatas = result.metadatas?.[0] ?? [];
  const distances = result.distances?.[0] ?? [];

  return documents.flatMap((document, index) => {
    if (!document) {
      return [];
    }

    return [
      {
        id: result.ids?.[0]?.[index] ?? `${params.userId}-${index}`,
        document,
        metadata: (metadatas[index] ?? {}) as ChromaMemoryMetadata,
        distance: distances[index] ?? null,
      } satisfies ChromaSearchHit,
    ];
  });
}
