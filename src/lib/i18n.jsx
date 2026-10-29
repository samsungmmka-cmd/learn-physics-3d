import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { UI } from '../data/content.js';

const LangCtx = createContext(null);
const read = () => { try { return localStorage.getItem('quanta-lang'); } catch { return null; } };

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(read() === 'si' ? 'si' : 'en');
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => {
    const L = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] !== undefined ? o[lang] : o.en);
    const u = (k) => L(UI[k]);
    const setLang = (l) => { try { localStorage.setItem('quanta-lang', l); } catch { /* private mode */ } setLangState(l); };
    return { lang, L, u, setLang };
  }, [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
export const useT = () => useContext(LangCtx);
