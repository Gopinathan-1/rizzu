import { supabase } from './auth';

export type ConversationAnalysisResult = {
  tone: string;
  mood: string;
  replyStyles: string[];
  replies: string[];
};

async function getAuthToken(): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is unavailable');
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('No active Supabase session');
  }

  return accessToken;
}

export async function analyzeConversation(
  conversation: string
): Promise<ConversationAnalysisResult> {
  const accessToken = await getAuthToken();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/analyze-conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify({ conversation }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMsg);
  }

  return (await response.json()) as ConversationAnalysisResult;
}
