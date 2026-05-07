// ============================================================
// TIKTOK DESIGN SYSTEM - Theme & Constants
// Professional, Enterprise-Grade Design Tokens
// ============================================================

export const TikTokTheme = {
  // ============================================================
  // COLORS - TikTok Brand Palette
  // ============================================================
  colors: {
    // Backgrounds
    background: {
      primary: '#000000',      // Pure black (main background)
      secondary: '#121212',    // Dark gray (cards)
      tertiary: '#1F1F1F',     // Lighter gray (elevated cards)
      elevated: '#2F2F2F',     // Border/divider color
    },
    
    // Brand Colors
    brand: {
      cyan: '#00F2EA',         // TikTok cyan (primary accent)
      pink: '#FE2C55',         // TikTok pink (likes, hearts)
      white: '#FFFFFF',        // Pure white
      blue: '#00D4FF',         // Bright blue (secondary accent)
    },
    
    // Text
    text: {
      primary: '#FFFFFF',      // White (main text)
      secondary: '#E1E1E1',    // Light gray (secondary text)
      tertiary: '#8E8E8E',     // Mid gray (disabled/placeholder)
      muted: '#5A5A5A',        // Dark gray (subtle text)
    },
    
    // Status Colors
    status: {
      live: '#00F2EA',         // Live indicator (glowing cyan)
      success: '#00FF88',      // Success green
      warning: '#FFA500',      // Warning orange
      error: '#FF4458',        // Error red
      offline: '#5A5A5A',      // Offline gray
    },
    
    // Gradients
    gradients: {
      primary: ['#00F2EA', '#00D4FF'],           // Cyan to blue
      secondary: ['#FE2C55', '#FF6B8A'],         // Pink gradient
      glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'], // Glass effect
      dark: ['#121212', '#000000'],              // Dark gradient
      shimmer: ['#1F1F1F', '#2F2F2F', '#1F1F1F'], // Loading shimmer
    },
    
    // Chart Colors
    charts: {
      primary: '#00F2EA',
      secondary: '#FE2C55',
      tertiary: '#00FF88',
      quaternary: '#FFA500',
      accent1: '#00D4FF',
      accent2: '#FF6B8A',
      accent3: '#00FFC8',
      accent4: '#FFD93D',
    },
  },
  
  // ============================================================
  // TYPOGRAPHY
  // ============================================================
  typography: {
    // Font Families
    fontFamily: {
      regular: 'System',       // Platform default
      medium: 'System',
      bold: 'System',
      black: 'System',
    },
    
    // Font Sizes
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
      '6xl': 48,
      huge: 64,
    },
    
    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      black: '900' as const,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // ============================================================
  // SPACING - 8pt Grid System
  // ============================================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
    '6xl': 80,
  },
  
  // ============================================================
  // BORDER RADIUS - Rounded Corners
  // ============================================================
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // ============================================================
  // SHADOWS - Elevation
  // ============================================================
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#00F2EA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 12,
    },
    glow: {
      shadowColor: '#00F2EA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
      elevation: 10,
    },
  },
  
  // ============================================================
  // ANIMATIONS - Timing
  // ============================================================
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // ============================================================
  // LAYOUT
  // ============================================================
  layout: {
    containerPadding: 16,
    cardPadding: 16,
    sectionSpacing: 24,
    screenPadding: 20,
  },
  
  // ============================================================
  // ICONS
  // ============================================================
  iconSizes: {
    xs: 12,
    sm: 16,
    base: 20,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 48,
  },
};

// ============================================================
// COMMON STYLES - Reusable Style Objects
// ============================================================
export const CommonStyles = {
  // Glass Morphism Effect
  glassMorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  
  // Card Styles
  card: {
    backgroundColor: TikTokTheme.colors.background.secondary,
    borderRadius: TikTokTheme.borderRadius.lg,
    padding: TikTokTheme.layout.cardPadding,
    ...TikTokTheme.shadows.md,
  },
  
  elevatedCard: {
    backgroundColor: TikTokTheme.colors.background.tertiary,
    borderRadius: TikTokTheme.borderRadius.lg,
    padding: TikTokTheme.layout.cardPadding,
    ...TikTokTheme.shadows.lg,
  },
  
  // Live Indicator
  liveIndicator: {
    backgroundColor: TikTokTheme.colors.status.live,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: TikTokTheme.borderRadius.full,
    ...TikTokTheme.shadows.glow,
  },
  
  // Button Styles
  primaryButton: {
    backgroundColor: TikTokTheme.colors.brand.cyan,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: TikTokTheme.borderRadius.md,
    ...TikTokTheme.shadows.md,
  },
  
  secondaryButton: {
    backgroundColor: TikTokTheme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: TikTokTheme.colors.brand.cyan,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: TikTokTheme.borderRadius.md,
  },
  
  // Text Styles
  heading1: {
    fontSize: TikTokTheme.typography.fontSize['4xl'],
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    lineHeight: TikTokTheme.typography.fontSize['4xl'] * 1.2,
  },
  
  heading2: {
    fontSize: TikTokTheme.typography.fontSize['3xl'],
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    lineHeight: TikTokTheme.typography.fontSize['3xl'] * 1.2,
  },
  
  heading3: {
    fontSize: TikTokTheme.typography.fontSize['2xl'],
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.text.primary,
  },
  
  bodyText: {
    fontSize: TikTokTheme.typography.fontSize.base,
    fontWeight: TikTokTheme.typography.fontWeight.regular,
    color: TikTokTheme.colors.text.secondary,
    lineHeight: TikTokTheme.typography.fontSize.base * 1.5,
  },
  
  caption: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    fontWeight: TikTokTheme.typography.fontWeight.regular,
    color: TikTokTheme.colors.text.tertiary,
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export const getGradientColors = (type: 'primary' | 'secondary' | 'glass' | 'dark' | 'shimmer') => {
  return TikTokTheme.colors.gradients[type];
};

export const getChartColor = (index: number) => {
  const colors = Object.values(TikTokTheme.colors.charts);
  return colors[index % colors.length];
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
};

export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default TikTokTheme;
