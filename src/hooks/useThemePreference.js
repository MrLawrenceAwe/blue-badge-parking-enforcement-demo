import { useEffect, useState } from 'react';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function useThemePreference() {
  const [systemTheme, setSystemTheme] = useState(getSystemPreference);

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
    root.dataset.theme = systemTheme;
    root.style.colorScheme = systemTheme;
  }, [systemTheme]);
}
