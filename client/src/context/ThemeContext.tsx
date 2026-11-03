import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.js';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  accentColor: string;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ACCENT_PRESETS = [
  { name: 'Indigo', value: '#6366f1', hover: '#4f46e5' },
  { name: 'Violet', value: '#8b5cf6', hover: '#7c3aed' },
  { name: 'Emerald', value: '#10b981', hover: '#059669' },
  { name: 'Cyan / Steam', value: '#06b6d4', hover: '#0891b2' },
  { name: 'Amber / Gold', value: '#f59e0b', hover: '#d97706' },
  { name: 'Crimson', value: '#ef4444', hover: '#dc2626' },
  { name: 'Rose', value: '#f43f5e', hover: '#e11d48' }
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeProfile } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>(
    (localStorage.getItem('omni_theme') as ThemeMode) || 'dark'
  );
  const [accentColor, setAccentColorState] = useState<string>(
    localStorage.getItem('omni_accent_color') || '#6366f1'
  );
  const [isDark, setIsDark] = useState<boolean>(true);

  // Sync with active profile settings if logged in
  useEffect(() => {
    if (activeProfile?.theme) {
      setThemeState(activeProfile.theme);
    }
    if (activeProfile?.accent_color) {
      setAccentColorState(activeProfile.accent_color);
    }
  }, [activeProfile]);

  // Apply theme & listen to system changes
  useEffect(() => {
    const root = document.documentElement;

    const checkSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

    const apply = () => {
      let shouldBeDark = theme === 'dark';
      if (theme === 'system') {
        shouldBeDark = checkSystemDark();
      }

      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      root.style.setProperty('--accent-color', accentColor);
      const preset = ACCENT_PRESETS.find((p) => p.value === accentColor);
      root.style.setProperty('--accent-hover', preset ? preset.hover : accentColor);
    };

    apply();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') apply();
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, accentColor]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('omni_theme', newTheme);
  };

  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
    localStorage.setItem('omni_accent_color', newColor);
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
