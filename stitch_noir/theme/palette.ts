export const CHOCOLATE_TRUFFLE = {
  cream: '#FDFBD4',
  burntOrange: '#C05800',
  deepBrown: '#713600',
  espressoBlack: '#38240D',
  creamTint: '#F5F0C0',
  creamDeeper: '#EDE8B0',
  borderLight: '#E0D9A0',
  warmTan: '#A07840',
  dangerDark: '#E06020',
  userBubbleLight: '#EDE8B0',
  aiBubbleLight: '#FDFBD4',
  surfaceDark: '#4A3015',
  elevatedDark: '#5C3D1E',
  borderDark: '#5C3D1E',
  userBubbleDark: '#4A3015',
  aiBubbleDark: '#3D2810',
  dangerLight: '#C05800',
} as const;

export const CHOCOLATE_TRUFFLE_LIGHT = {
  bgPrimary: CHOCOLATE_TRUFFLE.cream,
  bgSurface: CHOCOLATE_TRUFFLE.creamTint,
  bgElevated: CHOCOLATE_TRUFFLE.creamDeeper,
  accent: CHOCOLATE_TRUFFLE.burntOrange,
  accentSubtle: 'rgba(192, 88, 0, 0.09)',
  accentGlow: 'rgba(192, 88, 0, 0.188)',
  textPrimary: CHOCOLATE_TRUFFLE.espressoBlack,
  textSecondary: CHOCOLATE_TRUFFLE.deepBrown,
  border: CHOCOLATE_TRUFFLE.borderLight,
  danger: CHOCOLATE_TRUFFLE.dangerLight,
  userBubble: CHOCOLATE_TRUFFLE.userBubbleLight,
  aiBubble: CHOCOLATE_TRUFFLE.aiBubbleLight,
} as const;

export const CHOCOLATE_TRUFFLE_DARK = {
  bgPrimary: CHOCOLATE_TRUFFLE.espressoBlack,
  bgSurface: CHOCOLATE_TRUFFLE.surfaceDark,
  bgElevated: CHOCOLATE_TRUFFLE.elevatedDark,
  accent: CHOCOLATE_TRUFFLE.burntOrange,
  accentSubtle: 'rgba(192, 88, 0, 0.125)',
  accentGlow: 'rgba(192, 88, 0, 0.251)',
  textPrimary: CHOCOLATE_TRUFFLE.cream,
  textSecondary: CHOCOLATE_TRUFFLE.warmTan,
  border: CHOCOLATE_TRUFFLE.borderDark,
  danger: CHOCOLATE_TRUFFLE.dangerDark,
  userBubble: CHOCOLATE_TRUFFLE.userBubbleDark,
  aiBubble: CHOCOLATE_TRUFFLE.aiBubbleDark,
} as const;

export const getChocolateTruffleTheme = (mode: 'light' | 'dark') =>
  mode === 'light' ? CHOCOLATE_TRUFFLE_LIGHT : CHOCOLATE_TRUFFLE_DARK;