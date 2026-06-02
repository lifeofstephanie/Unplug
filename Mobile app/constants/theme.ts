export const Colors = {
  // Primary palette
  navy:    '#2C5EAD',
  blue:    '#1591DC',
  sky:     '#4BB8FA',
  pale:    '#C4E2F5',
  white:   '#FFFFFF',

  // Derived shades
  navyDark:   '#1E4282',
  navyLight:  '#3A72C8',
  blueDark:   '#0E72B0',
  blueLight:  '#3AAEE8',
  skyDark:    '#2FA3E6',
  skyLight:   '#80CEFC',
  paleDark:   '#9ECFED',
  paleLight:  '#E8F5FC',

  // Semantic
  success:    '#22C55E',
  successBg:  '#DCFCE7',
  warning:    '#F59E0B',
  warningBg:  '#FEF3C7',
  error:      '#EF4444',
  errorBg:    '#FEE2E2',
  xp:         '#F59E0B',
  xpBg:       '#FEF9E7',

  // Neutrals
  text:       '#0F172A',
  textMuted:  '#64748B',
  textLight:  '#94A3B8',
  border:     '#E2E8F0',
  background: '#F0F8FF',
  card:       '#FFFFFF',
  overlay:    'rgba(44,94,173,0.85)',

  // Roadmap node states
  nodeComplete: '#22C55E',
  nodeActive:   '#1591DC',
  nodeLocked:   '#CBD5E1',
  nodeLockedBg: '#F1F5F9',

  // Theme variants (for ThemedText, Collapsible, TabLayout, etc.)
  light: {
    text:              '#0F172A',
    background:        '#F0F8FF',
    tint:              '#1591DC',
    icon:              '#64748B',
    tabIconDefault:    '#64748B',
    tabIconSelected:   '#1591DC',
  },
  dark: {
    text:              '#ECEDEE',
    background:        '#151718',
    tint:              '#4BB8FA',
    icon:              '#9BA1A6',
    tabIconDefault:    '#9BA1A6',
    tabIconSelected:   '#4BB8FA',
  },
};

export const Typography = {
  // Use system fonts — in production swap in custom fonts via expo-font
  heading:   { fontFamily: 'System', fontWeight: '800' },
  bold:      { fontFamily: 'System', fontWeight: '700' },
  semibold:  { fontFamily: 'System', fontWeight: '600' },
  body:      { fontFamily: 'System', fontWeight: '400' },
  caption:   { fontFamily: 'System', fontWeight: '400' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#2C5EAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#2C5EAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#2C5EAD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
};