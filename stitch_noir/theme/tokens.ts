const lightThemeBase = {
  '--color-bg-primary': '255 255 255',
  '--color-bg-surface': '255 255 255',
  '--color-bg-elevated': '255 255 255',
  '--color-accent': '0 0 0',
  '--color-accent-subtle': '0 0 0',
  '--color-accent-glow': '0 0 0',
  '--color-text-primary': '0 0 0',
  '--color-text-secondary': '0 0 0',
  '--color-border': '0 0 0',
  '--color-danger': '0 0 0',
  '--color-user-bubble': '255 255 255',
  '--color-ai-bubble': '242 242 242',
} as const;

const darkThemeBase = {
  '--color-bg-primary': '0 0 0',
  '--color-bg-surface': '0 0 0',
  '--color-bg-elevated': '0 0 0',
  '--color-accent': '255 255 255',
  '--color-accent-subtle': '255 255 255',
  '--color-accent-glow': '255 255 255',
  '--color-text-primary': '255 255 255',
  '--color-text-secondary': '255 255 255',
  '--color-border': '255 255 255',
  '--color-danger': '255 255 255',
  '--color-user-bubble': '32 32 32',
  '--color-ai-bubble': '44 44 44',
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
