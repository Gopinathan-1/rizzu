export const TONE_OPTIONS = ['Witty', 'Mysterious', 'Savage', 'Professional', 'Flirty'] as const;

export type ToneName = (typeof TONE_OPTIONS)[number];

type ToneProfile = {
  hint: string;
  maxWords: number;
};

const toneProfiles: Record<ToneName, ToneProfile> = {
  Witty: {
    hint: 'lightly witty, like a quick text from a friend',
    maxWords: 8,
  },
  Mysterious: {
    hint: 'calm and a little mysterious, but still normal',
    maxWords: 7,
  },
  Savage: {
    hint: 'blunt and sharp, but not mean',
    maxWords: 7,
  },
  Professional: {
    hint: 'polite and direct, like a real work message',
    maxWords: 10,
  },
  Flirty: {
    hint: 'warm, playful, and natural',
    maxWords: 8,
  },
};

function buildToneConversationPrompt(tone: ToneName) {
  const profile = toneProfiles[tone];

  return [
    'You are chatting with the user like a real person.',
    `Reply in a ${tone.toLowerCase()} way, but keep it simple.`,
    `Tone hint: ${profile.hint}.`,
    `Keep it under ${profile.maxWords} words when possible.`,
    '',
    'Rules:',
    '- Reply to the user message only.',
    '- Write one short chat reply.',
    '- Sound like a person texting back.',
    '- No paragraphs, no bullets, no labels.',
    '- If the user says hi or asks how you are, answer simply and naturally.',
    '- Do not explain the tone or mention AI.',
  ].join('\n');
}

function buildToneReplyPrompt(tone: ToneName) {
  const profile = toneProfiles[tone];

  return [
    'You are chatting with the user like a real person.',
    `Write 3 simple ${tone.toLowerCase()} reply options.`,
    `Tone hint: ${profile.hint}.`,
    `Keep each reply under ${profile.maxWords} words when possible.`,
    '',
    'Rules:',
    '- Return exactly 3 replies, one per line.',
    '- Keep each reply short and text-like.',
    '- Make them sound like a person texting back.',
    '- Base them on the user message and context.',
    '- If the user says hi, include a greeting reply.',
    '- Make the 3 replies feel different from each other.',
    '- No paragraphs, bullets, numbering, labels, or explanations.',
    '- No AI-sounding phrasing.',
  ].join('\n');
}

export function normalizeToneName(tone?: string | null): ToneName {
  const normalized = (tone ?? '').trim().toLowerCase();
  if (normalized === 'witty') return 'Witty';
  if (normalized === 'mysterious') return 'Mysterious';
  if (normalized === 'savage') return 'Savage';
  if (normalized === 'professional') return 'Professional';
  if (normalized === 'flirty' || normalized === 'flitry') return 'Flirty';
  return 'Witty';
}

export function getTonePrompt(tone?: string | null) {
  return buildToneReplyPrompt(normalizeToneName(tone));
}

export function getToneConversationPrompt(tone?: string | null) {
  return buildToneConversationPrompt(normalizeToneName(tone));
}

export function getToneHint(tone?: string | null) {
  const t = normalizeToneName(tone);
  const profile = toneProfiles[t];
  return profile?.hint ?? '';
}