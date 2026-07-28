import { createContext, useContext, useEffect } from 'react';
import { defaultTheme } from '../config/themeDefaults';

const ThemeContext = createContext();

const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.keys(theme).forEach(key => {
    const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(cssVar, theme[key]);
  });
};

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminTheme');
      if (saved) {
        const savedTheme = JSON.parse(saved);
        // Always force sidebar & navbar to match the glass card style
        const mergedTheme = {
          ...defaultTheme,
          ...savedTheme,
          sidebarBg: defaultTheme.sidebarBg,
          sidebarBorder: defaultTheme.sidebarBorder,
          sidebarHoverBg: defaultTheme.sidebarHoverBg,
          navbarBg: defaultTheme.navbarBg,
          navbarBorder: defaultTheme.navbarBorder,
        };
        // Update localStorage with corrected values
        localStorage.setItem('adminTheme', JSON.stringify(mergedTheme));
        applyTheme(mergedTheme);
      } else {
        applyTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      applyTheme(defaultTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
