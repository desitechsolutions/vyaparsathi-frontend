import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'colorPreference';

function getSystemMode() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Provides color preference state:
 *  - colorPreference: 'light' | 'dark' | 'auto'
 *  - effectiveMode:   'light' | 'dark'  (resolved from OS when auto)
 *  - setColorPreference(pref): set explicitly
 *  - cycleColorPreference():   cycles light → dark → auto → light
 *
 * Defaults to 'light' on first visit (no stored preference).
 * Set to 'auto' to follow OS prefers-color-scheme in real time.
 */
export const ThemeContextProvider = ({ children }) => {
  const [colorPreference, setColorPreferenceSt] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  // Track the OS-level dark/light mode so we react to live changes
  const [systemMode, setSystemMode] = useState(getSystemMode);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemMode(e.matches ? 'dark' : 'light');
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      // Safari < 14 fallback
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  // Resolve the actual MUI palette mode
  const effectiveMode = colorPreference === 'auto' ? systemMode : colorPreference;

  const setColorPreference = (pref) => {
    setColorPreferenceSt(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // localStorage may be unavailable in some contexts
    }
  };

  // Cycles: light → dark → auto → light
  const cycleColorPreference = () => {
    const cycle = { light: 'dark', dark: 'auto', auto: 'light' };
    setColorPreference(cycle[colorPreference]);
  };

  return (
    <ThemeContext.Provider
      value={{ colorPreference, effectiveMode, setColorPreference, cycleColorPreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeContextProvider');
  return ctx;
};
