// Colour theme: 'light', 'dark' or 'system' (follow the device). Stored on this device.
import { useEffect, useState } from 'react';

const KEY = 'lp-theme';
export const readTheme = () => { try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : 'system'; } catch { return 'system'; } };
export function applyTheme(t) {
  const root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', dark ? '#15120E' : '#F8F1E6');
}
export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)'); const on = () => applyTheme('system');
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on);
  }, [theme]);
  useEffect(() => { const on = () => setThemeState(readTheme()); window.addEventListener('lp-theme', on); return () => window.removeEventListener('lp-theme', on); }, []);
  const setTheme = (t) => { try { localStorage.setItem(KEY, t); } catch { /* private mode */ } setThemeState(t); window.dispatchEvent(new Event('lp-theme')); };
  return { theme, setTheme };
}
