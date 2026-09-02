'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

const STORAGE_KEY = 'admin-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always starts at 'light' — matching the server render exactly — even
  // though the inline script in app/layout.tsx may have already put the
  // `dark` class on <html> before hydration. Reading that class during the
  // initial render (client-only) would mismatch the SSR HTML for anything
  // that renders differently per theme (e.g. the Sun/Moon toggle button)
  // and trigger a hydration error. Instead, sync the real value in an
  // effect below, once hydration is safely done.
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setMounted(true);
  }, []);

  useEffect(() => {
    // Skip the very first (pre-sync) pass so we never stomp the class the
    // inline script already set before we've read the real value.
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * Inline, render-blocking script string — read the stored/system preference
 * and set the `dark` class on <html> before React hydrates, so there's no
 * flash of the wrong theme. Injected via a plain <script> tag in
 * app/layout.tsx (not a component — must run before first paint).
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
