import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'blue-badge-theme-preference';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';
const VALID_PREFERENCES = new Set(['system', 'light', 'dark']);

function getSystemPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function readStoredPreference() {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.has(storedValue) ? storedValue : 'system';
  } catch {
    return 'system';
  }
}

export function useThemePreference() {
  const [preference, setPreference] = useState(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState(getSystemPreference);

  const activeTheme = useMemo(
    () => (preference === 'system' ? systemTheme : preference),
    [preference, systemTheme]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.dataset.theme = activeTheme;
    root.style.colorScheme = activeTheme;
  }, [activeTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Theme persistence should never block the demo app.
    }
  }, [preference]);

  return {
    themePreference: preference,
    activeTheme,
    setThemePreference: setPreference,
  };
}
