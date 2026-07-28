export const defaultTheme = {
  // Sidebar
  sidebarBg: 'rgba(255, 255, 255, 0.05)',
  sidebarText: '#d1d5db',
  sidebarActiveText: '#ffffff',
  sidebarHoverBg: 'rgba(147, 51, 234, 0.15)',
  sidebarBorder: 'rgba(147, 51, 234, 0.25)',

  // Navbar
  navbarBg: 'rgba(255, 255, 255, 0.05)',
  navbarText: '#d1d5db',
  navbarBorder: 'rgba(147, 51, 234, 0.25)',

  // Main Content
 mainBg: '#030712',
  cardBg: '#1f2937',
  cardBorder: 'rgba(147, 51, 234, 0.16)',
  cardText: '#e6e0ff',

  // Tables
  tableHeaderBg: '#374151',
  tableRowHoverBg: '#374151',
  tableRowBg: 'transparent',
  tableRowText: '#e0d8ff',
  tableRowHoverBg: '#31205f',
  tableBorder: 'rgba(147, 51, 234, 0.08)',

  // Inputs & Buttons
  inputBg: 'rgba(255, 255, 255, 0.08)',
  inputBorder: 'rgba(147, 51, 234, 0.18)',
  inputText: '#e7e3ff',

  // Theme Colors
  primaryColor: '#9333ea',
  secondaryColor: '#ec4899',
  accentColor: '#3b82f6',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',

  // Borders & Radius
  borderRadius: '12px',
};

export const presetThemes = {
  dark: defaultTheme,
  ocean: {
    ...defaultTheme,
    primaryColor: '#06b6d4',
    secondaryColor: '#0ea5e9',
    accentColor: '#06b6d4',
    mainBg: '#001f3f',
    cardBg: '#003d5c',
    sidebarBg: '#00253a',
  },
  neon: {
    ...defaultTheme,
    primaryColor: '#ff00ff',
    secondaryColor: '#00ff00',
    accentColor: '#00ffff',
    mainBg: '#0a0a0a',
    cardBg: '#1a1a1a',
    sidebarBg: '#0d0d0d',
  },
  sunset: {
    ...defaultTheme,
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    accentColor: '#fb923c',
    mainBg: '#1a0f0a',
    cardBg: '#2d1f15',
    sidebarBg: '#21140d',
  },
};
