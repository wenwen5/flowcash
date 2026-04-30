import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'flowcash_theme_v1';

const DEFAULT_BRAND = '#34C759';

export const PRESET_COLORS = [
  '#34C759', '#007AFF', '#5856D6', '#AF52DE',
  '#FF2D55', '#FF3B30', '#FF9500', '#FFCC00',
  '#00C7BE', '#32ADE6', '#5AC8FA', '#A2845E',
];

interface ThemeContextValue {
  brand: string;
  setBrand: (c: string) => void;
  brandLight: string;
  brandShadow: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || DEFAULT_BRAND;
    } catch { return DEFAULT_BRAND; }
  });

  const brandLight = hexToRgba(brand, 0.15);
  const brandShadow = hexToRgba(brand, 0.30);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand', brand);
    root.style.setProperty('--brand-light', brandLight);
    root.style.setProperty('--brand-shadow', brandShadow);
    try {
      localStorage.setItem(THEME_KEY, brand);
    } catch { /* ignore */ }
  }, [brand, brandLight, brandShadow]);

  const setBrand = (c: string) => setBrandState(c);

  return (
    <ThemeContext.Provider value={{ brand, setBrand, brandLight, brandShadow }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.brand;
}

export function useThemeFull() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
