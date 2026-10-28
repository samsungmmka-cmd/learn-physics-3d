import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LABS } from '../data/content.js';
import { freshLab } from './calc.js';

const KEY = 'quanta-practicals-v1';
const LabCtx = createContext(null);

function load() {
  let st = null;
  try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* ignore */ }
  if (!st || !st.labs) st = { cur: 1, sec: 0, labs: {} };
  if (!st.view) st.view = 'home';
  if (!LABS[st.cur]) st.cur = 1;
  Object.keys(LABS).forEach((id) => { if (!st.labs[id]) st.labs[id] = freshLab(+id); });
  return st;
}
const persist = (st) => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ } };

export function LabProvider({ children }) {
  const [st, setSt] = useState(load);
  // update(fn): fn mutates a draft copy; ui=true marks navigation-only changes that shouldn't bump the sync timestamp
  const update = useCallback((fn, ui = false) => {
    setSt((prev) => {
      const n = structuredClone(prev); fn(n);
      if (!ui) n.ts = Date.now();
      persist(n); return n;
    });
  }, []);
  const replace = useCallback((n) => { const v = { ...n }; Object.keys(LABS).forEach((id) => { if (!v.labs[id]) v.labs[id] = freshLab(+id); }); persist(v); setSt(v); }, []);
  const value = useMemo(() => ({ st, update, replace, ls: st.labs[st.cur] }), [st, update, replace]);
  return <LabCtx.Provider value={value}>{children}</LabCtx.Provider>;
}
export const useLab = () => useContext(LabCtx);
