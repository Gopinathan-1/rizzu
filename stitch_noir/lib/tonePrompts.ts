export const TONE_OPTIONS = ['Witty', 'Mysterious', 'Savage', 'Professional', 'Flirty'] as const;

export type ToneName = (typeof TONE_OPTIONS)[number];

const tonePromptMap: Record<ToneName, string> = {
  Witty: `Reply in a witty tone.

Output rules:
- Return exactly 3 short line replies.
- No paragraphs.
- No bullets.
- Keep each line clever, playful, and concise.
- Use light sarcasm when it fits.

Aim for smooth one-liners that feel sharp and modern.`,
  Mysterious: `Reply in a mysterious tone.

Output rules:
- Return exactly 3 short line replies.
- No paragraphs.
- No bullets.
- Keep each line calm, reserved, and intriguing.
- Hint more than you explain.

Aim for quiet confidence and subtle depth.`,
  Savage: `Reply in a savage tone.

Output rules:
- Return exactly 3 short line replies.
- No paragraphs.
- No bullets.
- Keep each line sharp, controlled, and confident.
- Stay clever, not childish.

Aim for dry humor and clean, decisive comebacks.`,
  Professional: `Reply in a professional tone.

Output rules:
- Return exactly 3 short line replies.
- No paragraphs.
- No bullets.
- Keep each line clear, respectful, and polished.
- Prioritize clarity over personality.

Aim for concise business-appropriate replies.`,
  Flirty: `Reply in a flirty tone.

Output rules:
- Return exactly 3 short line replies.
- No paragraphs.
- No bullets.
- Keep each line warm, playful, and charming.
- Keep it light and natural.

Aim for smooth teasing and effortless charm.`,
};

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
  return tonePromptMap[normalizeToneName(tone)];
}