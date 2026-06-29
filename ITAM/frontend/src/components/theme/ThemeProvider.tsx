import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ThemeStyle = 'classic' | 'ocean' | 'forest' | 'sunset' | 'vintage';

interface ThemeContextValue {
  theme: Theme;
  themeStyle: ThemeStyle;
  setTheme: (t: Theme) => void;
  setThemeStyle: (style: ThemeStyle) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'awash-itam-theme';
const STYLE_STORAGE_KEY = 'awash-itam-theme-style';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
  });
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(() => {
    if (typeof window === 'undefined') return 'classic';
    return (localStorage.getItem(STYLE_STORAGE_KEY) as ThemeStyle) || 'classic';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const next = theme === 'system' ? getSystemTheme() : theme;
      root.classList.remove(
        'light',
        'dark',
        'theme-classic',
        'theme-ocean',
        'theme-forest',
        'theme-sunset',
        'theme-vintage'
      );
      root.classList.add(next);
      root.classList.add(`theme-${themeStyle}`);
      setResolvedTheme(next);
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, themeStyle]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  const setThemeStyle = (style: ThemeStyle) => {
    localStorage.setItem(STYLE_STORAGE_KEY, style);
    setThemeStyleState(style);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeStyle, setTheme, setThemeStyle, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}