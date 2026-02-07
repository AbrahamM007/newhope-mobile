/**
 * NewHope.life Design System
 * Light Industrial Luxury Theme - Sleek, Sexy, Premium, Pure Light
 */

export const colors = {
  // Brand Colors
  brandDark: '#1a1a1a', // Deep Charcoal - Text Only
  brandGreen: '#15803d', // Jewel Tone Green
  brandSilver: '#F3F4F6', // Light Silver

  // Gradients (Start/End info)
  gradients: {
    primary: ['#15803d', '#166534'], // Green Depth
    silver: ['#FFFFFF', '#F3F4F6'], // Subtle Metallic
    gold: ['#FBBF24', '#D97706'], // Accent
  },

  // UI Colors
  white: '#FFFFFF',
  black: '#000000',

  // Grays (Cool Tones)
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  success: '#15803d',
  error: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',

  // Backgrounds - STRICTLY LIGHT
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA', // Almost white
    tertiary: '#F5F5F5',
    modal: 'rgba(255, 255, 255, 0.95)',
  },

  // Text
  text: {
    primary: '#111827', // Crisp Black/Charcoal
    secondary: '#4B5563', // Elegant Gray
    tertiary: '#9CA3AF', // Subtle
    inverse: '#FFFFFF',
  },

  // Borders
  border: {
    light: '#F3F4F6',
    medium: '#E5E7EB',
    subtle: 'rgba(0,0,0,0.05)',
  },
};

export const typography = {
  // Font families
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
    serif: '"Playfair Display", Georgia, serif', // Use for headers for luxury feel
  },

  // Font sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
    '6xl': 48,
  },

  // Font weights
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  // Line heights
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.6,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '8xl': 96,
};

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

// Premium Shadows (Soft, Diffused)
export const shadows = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  xl: {
    shadowColor: '#222', // Slightly darker for depth
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
  glow: {
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  }
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
