import { useEffect } from 'react';
import { useT } from '../lib/i18n.jsx';

export default function LangSheet({ onClose }) {
  const { lang, setLang, u } = useT();
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const pickL = (l) => { setLang(l); onClose(); };
  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="sheetH">
        <h3 id="sheetH" className="sec-h" style={{ fontSize: 22 }}>{u('langTitle')}</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <button type="button" className="lopt" aria-pressed={lang === 'si'} onClick={() => pickL('si')}>සිංහල <span>{lang === 'si' ? '✓' : ''}</span></button>
          <button type="button" className="lopt" aria-pressed={lang === 'en'} onClick={() => pickL('en')}>English <span>{lang === 'en' ? '✓' : ''}</span></button>
          <button type="button" className="lopt" disabled>தமிழ் <span className="muted" style={{ fontSize: 13 }}>{u('tamilSoon')}</span></button>
        </div>
      </div>
    </div>
  );
}
