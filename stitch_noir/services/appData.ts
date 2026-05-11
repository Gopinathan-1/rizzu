import { supabase } from '@/services/auth';

export type VaultType = 'reply' | 'bio' | 'opener';

export type VaultRecord = {
  id: string;
  user_id: string;
  type: VaultType;
  content: string;
  tone?: string | null;
  created_at?: string;
};

export type HistoryRecord = {
  id: string;
  user_id: string;
  type: 'reply' | 'bio' | 'opener' | 'analysis';
  content: string | null;
  created_at?: string;
};

export type TrendingToneRecord = {
  id: string;
  name: string;
  description: string | null;
  example: string | null;
  usage_count: number | null;
};

export async function fetchTrendingTones() {
  if (!supabase) return { data: null, error: new Error('Supabase unavailable') };

  const { data, error } = await supabase
    .from('trending_tones')
    .select('id, name, description, example, usage_count')
    .order('usage_count', { ascending: false });

  return { data: data as TrendingToneRecord[] | null, error };
}

export async function saveVaultRecord(record: {
  type: VaultType;
  content: string;
  tone?: string;
}) {
  if (!supabase) return { data: null, error: new Error('Supabase unavailable') };

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) return { data: null, error: new Error('No active session') };

  const { data, error } = await supabase
    .from('vault')
    .insert({
      user_id: userId,
      type: record.type,
      content: record.content,
      tone: record.tone ?? null,
    })
    .select()
    .single();

  return { data: data as VaultRecord | null, error };
}

export async function fetchVaultRecords() {
  if (!supabase) return { data: null, error: new Error('Supabase unavailable') };

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) return { data: null, error: new Error('No active session') };

  const { data, error } = await supabase
    .from('vault')
    .select('id, user_id, type, content, tone, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data as VaultRecord[] | null, error };
}

export async function deleteVaultRecord(id: string) {
  if (!supabase) return { error: new Error('Supabase unavailable') };
  const { error } = await supabase.from('vault').delete().eq('id', id);
  return { error };
}

export async function addHistoryRecord(record: {
  type: HistoryRecord['type'];
  content: string | null;
}) {
  if (!supabase) return { data: null, error: new Error('Supabase unavailable') };

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) return { data: null, error: new Error('No active session') };

  const { data, error } = await supabase
    .from('history')
    .insert({
      user_id: userId,
      type: record.type,
      content: record.content,
    })
    .select()
    .single();

  return { data: data as HistoryRecord | null, error };
}

export async function fetchHistoryRecords() {
  if (!supabase) return { data: null, error: new Error('Supabase unavailable') };

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) return { data: null, error: new Error('No active session') };

  const { data, error } = await supabase
    .from('history')
    .select('id, user_id, type, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data as HistoryRecord[] | null, error };
}