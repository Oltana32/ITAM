import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/auth';

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

const DEFAULT_THEME: Theme = 'light';
const DEFAULT_THEME_STYLE: ThemeStyle = 'classic';
const STORAGE_KEY_PREFIX = 'awash-itam-theme';
const STYLE_STORAGE_KEY_PREFIX = 'awash-itam-theme-style';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStorageKey(prefix: string, userId?: string): string {
  return userId ? `${prefix}:${userId}` : prefix;
}

function getCurrentUserId(): string | undefined {
  const user = getStoredUser();
  return user?.id;
}

function isFinanceUser(): boolean {
  const user = getStoredUser();
  return user?.role === 'finance';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(DEFAULT_THEME_STYLE);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncThemeFromUser = () => {
      const userId = getCurrentUserId();
      if (isFinanceUser()) {
        if (userId) {
          localStorage.removeItem(getStorageKey(STORAGE_KEY_PREFIX, userId));
          localStorage.removeItem(getStorageKey(STYLE_STORAGE_KEY_PREFIX, userId));
        }
        setThemeState(DEFAULT_THEME);
        setThemeStyleState(DEFAULT_THEME_STYLE);
        return;
      }

      const storedTheme = (localStorage.getItem(getStorageKey(STORAGE_KEY_PREFIX, userId)) as Theme | null) || DEFAULT_THEME;
      const storedThemeStyle = (localStorage.getItem(getStorageKey(STYLE_STORAGE_KEY_PREFIX, userId)) as ThemeStyle | null) || DEFAULT_THEME_STYLE;
      setThemeState(storedTheme);
      setThemeStyleState(storedThemeStyle);
    };

    syncThemeFromUser();
    window.addEventListener('asset-buddy-auth-changed', syncThemeFromUser);
    window.addEventListener('asset-buddy-role-changed', syncThemeFromUser);
    return () => {
      window.removeEventListener('asset-buddy-auth-changed', syncThemeFromUser);
      window.removeEventListener('asset-buddy-role-changed', syncThemeFromUser);
    };
  }, []);

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
    const userId = getCurrentUserId();
    if (isFinanceUser()) {
      if (userId) {
        localStorage.removeItem(getStorageKey(STORAGE_KEY_PREFIX, userId));
      }
      setThemeState(DEFAULT_THEME);
      return;
    }
    const storageKey = getStorageKey(STORAGE_KEY_PREFIX, userId);
    if (t === DEFAULT_THEME) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, t);
    }
    setThemeState(t);
  };

  const setThemeStyle = (style: ThemeStyle) => {
    const userId = getCurrentUserId();
    if (isFinanceUser()) {
      if (userId) {
        localStorage.removeItem(getStorageKey(STYLE_STORAGE_KEY_PREFIX, userId));
      }
      setThemeStyleState(DEFAULT_THEME_STYLE);
      return;
    }
    const storageKey = getStorageKey(STYLE_STORAGE_KEY_PREFIX, userId);
    if (style === DEFAULT_THEME_STYLE) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, style);
    }
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