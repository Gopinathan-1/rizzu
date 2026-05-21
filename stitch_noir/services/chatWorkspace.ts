import { supabase } from '@/services/auth';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { buildUploadPath, inferMimeType, isSupportedUpload, type UploadSource, uploadSourceToBase64 } from '@/lib/file-processing';

export type WorkspaceChat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMessageRole = 'user' | 'assistant' | 'system';

export type WorkspaceMessage = {
  id: string;
  chat_id: string;
  user_id: string;
  role: WorkspaceMessageRole;
  content: string;
  created_at: string;
};

export type WorkspaceUpload = {
  id: string;
  user_id: string;
  chat_id: string | null;
  filename: string;
  file_type: string;
  storage_path: string;
  created_at: string;
};

export type WorkspaceMemory = {
  id: string;
  user_id: string;
  chat_id: string | null;
  summary: string;
  created_at: string;
};

const WORKSPACE_BUCKET = 'workspace_uploads';
const CHAT_STREAM_FUNCTION = 'chat-stream';
const PROCESS_UPLOAD_FUNCTION = 'process-upload';
const DEFAULT_CHAT_TITLE = 'New chat';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is unavailable');
  }

  return supabase;
}

async function getCurrentUserId() {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  const userId = data.session?.user.id;

  if (!userId) {
    throw new Error('No active Supabase session');
  }

  return userId;
}

async function getAuthToken() {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('No active Supabase session');
  }

  return accessToken;
}

async function invokeWorkspaceFunction<T>(name: string, payload: Record<string, unknown>) {
  const client = requireSupabase();
  const accessToken = await getAuthToken();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Function ${name} failed`);
  }

  return (await response.json()) as T;
}

export async function fetchWorkspaceChats(searchText = '') {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const query = client
    .from('chats')
    .select('id, user_id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (searchText.trim()) {
    query.ilike('title', `%${searchText.trim()}%`);
  }

  const { data, error } = await query;
  return { data: data as WorkspaceChat[] | null, error };
}

export async function createWorkspaceChat(title = DEFAULT_CHAT_TITLE) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from('chats')
    .insert({ user_id: userId, title })
    .select('id, user_id, title, created_at, updated_at')
    .single();

  return { data: data as WorkspaceChat | null, error };
}

export async function renameWorkspaceChat(chatId: string, title: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .eq('user_id', userId)
    .select('id, user_id, title, created_at, updated_at')
    .single();

  return { data: data as WorkspaceChat | null, error };
}

export async function deleteWorkspaceChat(chatId: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client.from('chats').delete().eq('id', chatId).eq('user_id', userId);
  return { error };
}

export async function fetchWorkspaceMessages(chatId: string, options: { limit?: number; before?: string } = {}) {
  const client = requireSupabase();
  const limit = options.limit ?? 40;
  let query = client
    .from('messages')
    .select('id, chat_id, user_id, role, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.before) {
    query = query.lt('created_at', options.before);
  }

  const { data, error } = await query;
  return { data: (data as WorkspaceMessage[] | null) ?? [], error };
}

export async function createWorkspaceMessage(chatId: string, role: WorkspaceMessageRole, content: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from('messages')
    .insert({ chat_id: chatId, user_id: userId, role, content })
    .select('id, chat_id, user_id, role, content, created_at')
    .single();

  return { data: data as WorkspaceMessage | null, error };
}

export async function fetchWorkspaceUploads(chatId?: string | null) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  let query = client
    .from('uploads')
    .select('id, user_id, chat_id, filename, file_type, storage_path, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (chatId) {
    query = query.eq('chat_id', chatId);
  }

  const { data, error } = await query;
  return { data: data as WorkspaceUpload[] | null, error };
}

export async function fetchWorkspaceMemories(chatId?: string | null) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  let query = client
    .from('memories')
    .select('id, user_id, chat_id, summary, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (chatId) {
    query = query.eq('chat_id', chatId);
  }

  const { data, error } = await query;
  return { data: data as WorkspaceMemory[] | null, error };
}

export async function uploadWorkspaceFile(source: UploadSource, chatId: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const fileName = source.name ?? 'upload';
  const mimeType = source.mimeType ?? inferMimeType(fileName);

  if (!isSupportedUpload(fileName, mimeType)) {
    throw new Error('Unsupported file type');
  }

  const storagePath = buildUploadPath(userId, chatId, fileName);
  const base64 = await uploadSourceToBase64(source);
  const fileBlob = source.file ?? base64ToBlob(base64, mimeType);

  const { error: uploadError } = await client.storage.from(WORKSPACE_BUCKET).upload(storagePath, fileBlob, {
    contentType: mimeType,
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  return invokeWorkspaceFunction<{
    upload: WorkspaceUpload;
    extractedText: string;
    chunkCount: number;
  }>(PROCESS_UPLOAD_FUNCTION, {
    chatId,
    storagePath,
    filename: fileName,
    fileType: mimeType,
  });
}

export async function streamWorkspaceReply(params: {
  chatId: string;
  message: string;
  tone?: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}) {
  const client = requireSupabase();
  const accessToken = await getAuthToken();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/${CHAT_STREAM_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Chat streaming failed');
  }

  return response;
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
  const response = await generateText(prompt);
  const parsed = extractJson<{ title: string }>(response);
  return parsed.title.trim().replace(/^"|"$/g, '').slice(0, 60) || DEFAULT_CHAT_TITLE;
}

export async function updateChatTitleIfNeeded(chatId: string, title: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .eq('user_id', userId)
    .select('id, user_id, title, created_at, updated_at')
    .single();

  return { data: data as WorkspaceChat | null, error };
}

export async function removeWorkspaceUpload(upload: WorkspaceUpload) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const [{ error: dbError }, { error: storageError }] = await Promise.all([
    client.from('uploads').delete().eq('id', upload.id).eq('user_id', userId),
    client.storage.from(WORKSPACE_BUCKET).remove([upload.storage_path]),
  ]);

  return { error: dbError ?? storageError ?? null };
}

export async function reindexWorkspaceUpload(upload: WorkspaceUpload) {
  return invokeWorkspaceFunction<{
    upload: WorkspaceUpload;
    extractedText: string;
    chunkCount: number;
  }>(PROCESS_UPLOAD_FUNCTION, {
    chatId: upload.chat_id,
    storagePath: upload.storage_path,
    filename: upload.filename,
    fileType: upload.file_type,
  });
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = typeof atob === 'function' ? atob(base64) : globalThis.Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}
