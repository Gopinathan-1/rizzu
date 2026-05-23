const lightThemeBase = {
  '--color-bg-primary': '253 251 212',
  '--color-bg-surface': '245 240 192',
  '--color-bg-elevated': '237 232 176',
  '--color-accent': '192 88 0',
  '--color-accent-subtle': '192 88 0 / 0.09',
  '--color-accent-glow': '192 88 0 / 0.188',
  '--color-text-primary': '56 36 13',
  '--color-text-secondary': '113 54 0',
  '--color-border': '224 217 160',
  '--color-danger': '192 88 0',
  '--color-user-bubble': '237 232 176',
  '--color-ai-bubble': '253 251 212',
} as const;

const darkThemeBase = {
  '--color-bg-primary': '56 36 13',
  '--color-bg-surface': '74 48 21',
  '--color-bg-elevated': '92 61 30',
  '--color-accent': '192 88 0',
  '--color-accent-subtle': '192 88 0 / 0.125',
  '--color-accent-glow': '192 88 0 / 0.251',
  '--color-text-primary': '253 251 212',
  '--color-text-secondary': '160 120 64',
  '--color-border': '92 61 30',
  '--color-danger': '224 96 32',
  '--color-user-bubble': '74 48 21',
  '--color-ai-bubble': '61 40 16',
} as const;

const buildThemeVars = (base: Record<string, string>) => ({
  ...base,
  '--color-background': base['--color-bg-primary'],
  '--color-surface': base['--color-bg-surface'],
  '--color-surface-dim': base['--color-bg-primary'],
  '--color-surface-bright': base['--color-bg-elevated'],
  '--color-surface-lowest': base['--color-bg-primary'],
  '--color-surface-low': base['--color-bg-surface'],
  '--color-surface-container': base['--color-bg-surface'],
  '--color-surface-container-high': base['--color-bg-elevated'],
  '--color-surface-container-highest': base['--color-bg-elevated'],
  '--color-primary': base['--color-accent'],
  '--color-primary-container': base['--color-accent-subtle'],
  '--color-on-primary-container': base['--color-bg-primary'],
  '--color-secondary': base['--color-text-secondary'],
  '--color-secondary-container': base['--color-bg-elevated'],
  '--color-on-secondary-container': base['--color-text-primary'],
  '--color-tertiary': base['--color-danger'],
  '--color-tertiary-container': base['--color-bg-elevated'],
  '--color-on-tertiary-container': base['--color-text-primary'],
  '--color-outline': base['--color-border'],
  '--color-outline-variant': base['--color-border'],
  '--color-on-surface': base['--color-text-primary'],
  '--color-on-surface-variant': base['--color-text-secondary'],
});

export const lightThemeVars = buildThemeVars(lightThemeBase);
export const darkThemeVars = buildThemeVars(darkThemeBase);
