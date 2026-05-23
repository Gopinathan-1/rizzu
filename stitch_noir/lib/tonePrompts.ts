export const TONE_OPTIONS = ['Witty', 'Mysterious', 'Savage', 'Professional', 'Flirty'] as const;

export type ToneName = (typeof TONE_OPTIONS)[number];

type ToneProfile = {
  hint: string;
  maxWords: number;
};

export type OnboardingToneAnswers = {
  useCase: 'Dating' | 'Social' | 'Work' | 'Everything';
  energy: 'Playful' | 'Mysterious' | 'Bold' | 'Professional' | 'Flirty';
  directness: 'Soft' | 'Balanced' | 'Sharp';
  length: 'Short' | 'Balanced' | 'Flexible';
  primaryTone: string;
};

export type PersonalizedToneProfile = {
  useCase: OnboardingToneAnswers['useCase'];
  energy: OnboardingToneAnswers['energy'];
  directness: OnboardingToneAnswers['directness'];
  length: OnboardingToneAnswers['length'];
  primaryTone: string;
  extraTones: string[];
  summary: string;
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

const customToneProfiles: Record<string, ToneProfile> = {
  Teasing: { hint: 'playful with a little edge', maxWords: 8 },
  Smooth: { hint: 'confident, easy, and unforced', maxWords: 8 },
  Magnetic: { hint: 'naturally attention-grabbing without trying too hard', maxWords: 8 },
  Banter: { hint: 'fast, clever back-and-forth', maxWords: 8 },
  Casual: { hint: 'relaxed and low-pressure', maxWords: 9 },
  Playful: { hint: 'light, fun, and easy to reply to', maxWords: 8 },
  Concise: { hint: 'short, clear, and efficient', maxWords: 7 },
  Polished: { hint: 'clean, composed, and professional', maxWords: 10 },
  Direct: { hint: 'straight to the point without sounding harsh', maxWords: 7 },
  Balanced: { hint: 'calm, adaptable, and natural', maxWords: 8 },
  Adaptive: { hint: 'flexible and able to match the moment', maxWords: 8 },
  Natural: { hint: 'human and unforced', maxWords: 8 },
  Snappy: { hint: 'short and punchy', maxWords: 6 },
  Measured: { hint: 'steady and composed', maxWords: 9 },
  Versatile: { hint: 'easy to bend to the conversation', maxWords: 8 },
  Soft: { hint: 'gentle and low-pressure', maxWords: 9 },
  Sharp: { hint: 'quick, confident, and crisp', maxWords: 7 },
  Cool: { hint: 'calm, detached, and clean', maxWords: 8 },
  Charming: { hint: 'warm, likable, and easy to read', maxWords: 8 },
};

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getToneProfileForName(tone: string) {
  const normalized = normalizeToneName(tone);
  return toneProfiles[normalized as ToneName] ?? customToneProfiles[normalized] ?? {
    hint: `${normalized.toLowerCase()} and natural`,
    maxWords: 8,
  };
}

function buildToneConversationPrompt(tone: string) {
  const profile = getToneProfileForName(tone);
  const normalizedTone = normalizeToneName(tone);

  return [
    'You are chatting with the user like a real person.',
    `Reply in a ${normalizedTone.toLowerCase()} way, but keep it simple.`,
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

function buildToneReplyPrompt(tone: string) {
  const profile = getToneProfileForName(tone);
  const normalizedTone = normalizeToneName(tone);

  return [
    'You are chatting with the user like a real person.',
    `Write 3 simple ${normalizedTone.toLowerCase()} reply options.`,
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

export function normalizeToneName(tone?: string | null) {
  const normalized = (tone ?? '').trim();
  if (!normalized) return 'Witty';

  const lower = normalized.toLowerCase();
  if (lower === 'witty') return 'Witty';
  if (lower === 'mysterious') return 'Mysterious';
  if (lower === 'savage') return 'Savage';
  if (lower === 'professional') return 'Professional';
  if (lower === 'flirty' || lower === 'flitry') return 'Flirty';

  return titleCase(normalized);
}

export function buildToneProfileFromOnboarding(answers: OnboardingToneAnswers): PersonalizedToneProfile {
  const baseTone = normalizeToneName(answers.primaryTone);
  const useCaseExtras: Record<OnboardingToneAnswers['useCase'], string[]> = {
    Dating: ['Teasing', 'Smooth', 'Magnetic'],
    Social: ['Banter', 'Casual', 'Playful'],
    Work: ['Concise', 'Polished', 'Direct'],
    Everything: ['Balanced', 'Adaptive', 'Natural'],
  };

  const directnessExtras: Record<OnboardingToneAnswers['directness'], string[]> = {
    Soft: ['Soft'],
    Balanced: ['Balanced'],
    Sharp: ['Sharp'],
  };

  const energyExtras: Record<OnboardingToneAnswers['energy'], string[]> = {
    Playful: ['Playful', 'Banter'],
    Mysterious: ['Mysterious', 'Cool'],
    Bold: ['Bold', 'Sharp'],
    Professional: ['Professional', 'Polished'],
    Flirty: ['Flirty', 'Charming'],
  };

  const lengthToWords: Record<OnboardingToneAnswers['length'], number> = {
    Short: 7,
    Balanced: 9,
    Flexible: 11,
  };

  const extraTones = Array.from(
    new Set([
      ...useCaseExtras[answers.useCase],
      ...directnessExtras[answers.directness],
      ...energyExtras[answers.energy],
    ].map((tone) => normalizeToneName(tone)))
  ).filter((tone) => tone !== baseTone);

  return {
    useCase: answers.useCase,
    energy: answers.energy,
    directness: answers.directness,
    length: answers.length,
    primaryTone: baseTone,
    extraTones,
    summary: `${answers.useCase.toLowerCase()} use case with a ${answers.directness.toLowerCase()} delivery and ${answers.length.toLowerCase()} replies.`,
    maxWords: lengthToWords[answers.length],
  };
}

export function getToneOptions(profile?: PersonalizedToneProfile | null) {
  const extras = profile?.extraTones ?? [];
  return Array.from(new Set([...TONE_OPTIONS, ...(profile ? [profile.primaryTone, ...extras] : [])].map((tone) => normalizeToneName(tone))));
}

export function getTonePrompt(tone?: string | null) {
  return buildToneReplyPrompt(normalizeToneName(tone));
}

export function getToneConversationPrompt(tone?: string | null) {
  return buildToneConversationPrompt(normalizeToneName(tone));
}

export function getToneHint(tone?: string | null) {
  const normalized = normalizeToneName(tone);
  return toneProfiles[normalized as ToneName]?.hint ?? customToneProfiles[normalized]?.hint ?? '';
}