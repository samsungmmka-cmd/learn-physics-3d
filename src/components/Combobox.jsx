import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n.jsx';

// Searchable dropdown. Options: { value, label, sub?, search } — `search` is English text, so people can
// type English names (or numbers) whatever language the app is shown in.
export default function Combobox({ id, value, onChange, options, placeholder, label }) {
  const { u } = useT();
  const auto = useId(); const listId = `${id || auto}-list`;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const wrap = useRef(null); const input = useRef(null); const list = useRef(null);
  const sel = options.find((o) => String(o.value) === String(value));
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase(); if (!t) return options;
    const words = t.split(/\s+/);
    return options.filter((o) => { const hay = `${o.search || ''} ${o.label}`.toLowerCase(); return words.every((w) => hay.includes(w)); });
  }, [q, options]);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('pointerdown', onDoc); return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);
  useEffect(() => { if (open && list.current) { const el = list.current.children[hi]; if (el) el.scrollIntoView({ block: 'nearest' }); } }, [hi, open]);
  const pick = (o) => { onChange(o.value); setOpen(false); setQ(''); input.current?.blur(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) { setOpen(true); setHi(0); } else setHi((h) => Math.min(shown.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { if (open && shown[hi]) { e.preventDefault(); pick(shown[hi]); } }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); setQ(''); } }
  };
  return (
    <div className={`cbx${open ? ' open' : ''}`} ref={wrap}>
      <div className="cbx-field" onClick={() => { setOpen(true); input.current?.focus(); }}>
        <svg className="cbx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input
          id={id} ref={input} role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-label={label}
          aria-activedescendant={open && shown[hi] ? `${listId}-${hi}` : undefined}
          value={open ? q : (sel ? sel.label : '')} placeholder={open ? (sel ? sel.label : placeholder) : placeholder}
          onFocus={() => { setOpen(true); setHi(Math.max(0, shown.indexOf(sel))); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onKeyDown={onKey} autoComplete="off" spellCheck={false}
        />
        <svg className="cbx-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </div>
      {open ? (
        <ul className="cbx-list" role="listbox" id={listId} ref={list} aria-label={label}>
          {shown.length ? shown.map((o, i) => (
            <li key={o.value} id={`${listId}-${i}`} role="option" aria-selected={String(o.value) === String(value)}
              className={`${i === hi ? 'hi' : ''}${o.disabled ? ' dis' : ''}`}
              onPointerDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => !o.disabled && pick(o)}>
              {o.tag ? <span className="cbx-tag">{o.tag}</span> : null}
              <span className="cbx-l">{o.label}{o.sub ? <small>{o.sub}</small> : null}</span>
              {String(o.value) === String(value) ? <span className="cbx-ok" aria-hidden="true">✓</span> : null}
            </li>
          )) : <li className="cbx-empty" role="option" aria-disabled="true" aria-selected="false">{u('noMatches')}</li>}
        </ul>
      ) : null}
    </div>
  );
}
