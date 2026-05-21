export const TONE_OPTIONS = ['Witty', 'Mysterious', 'Savage', 'Professional', 'Flirty'] as const;

export type ToneName = (typeof TONE_OPTIONS)[number];

const tonePromptMap: Record<ToneName, string> = {
  Witty: `Write 3 short replies in a witty tone.

Rules:
- Return only the 3 replies, one per line.
- No bullets, labels, or explanations.
- Keep each line concise, clever, and modern.
- Use playful sarcasm only when it feels natural.
- Avoid sounding scripted, corny, or overly try-hard.

Target style: sharp, effortless, and socially believable.`,
  Mysterious: `Write 3 short replies in a mysterious tone.

Rules:
- Return only the 3 replies, one per line.
- No bullets, labels, or explanations.
- Keep each line calm, restrained, and intriguing.
- Hint at meaning without overexplaining.
- Avoid melodrama and fake-deep phrasing.

Target style: subtle, cool, and quietly confident.`,
  Savage: `Write 3 short replies in a savage tone.

Rules:
- Return only the 3 replies, one per line.
- No bullets, labels, or explanations.
- Keep each line sharp, controlled, and confident.
- Stay witty and composed, not childish or rude.
- Avoid repetitive clapback wording.

Target style: clean, dry, and undeniably confident.`,
  Professional: `Write 3 short replies in a professional tone.

Rules:
- Return only the 3 replies, one per line.
- No bullets, labels, or explanations.
- Keep each line polished, clear, and respectful.
- Prefer natural business-like language over stiff corporate phrasing.
- Avoid anything that feels robotic or generic.

Target style: concise, credible, and refined.`,
  Flirty: `Write 3 short replies in a flirty tone.

Rules:
- Return only the 3 replies, one per line.
- No bullets, labels, or explanations.
- Keep each line warm, playful, and smooth.
- Make it feel effortless, not thirsty.
- Avoid overused pickup-line energy.

Target style: charming, tasteful, and natural.`,
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