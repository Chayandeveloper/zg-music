export const THEME = {
  colors: {
    background: '#090B10',
    surface: '#11141E',
    surfaceHover: '#1A1F2C',
    card: 'rgba(22, 27, 40, 0.85)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(234, 179, 8, 0.3)',

    primary: '#EAB308', // Warm Amber Gold
    primaryHover: '#FACC15',
    primaryGlow: 'rgba(234, 179, 8, 0.25)',
    
    accent: '#8B5CF6', // Electric Violet
    accentGlow: 'rgba(139, 92, 246, 0.25)',
    
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',

    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },
  typography: {
    hero: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
    title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
    subtitle: { fontSize: 16, fontWeight: '600' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
  }
};
