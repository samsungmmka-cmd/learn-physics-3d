import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../lib/i18n.jsx';

// App-wide confirmation dialog. Usage: const confirm = useConfirm();
//   if (await confirm({ title, message, ok: 'Delete', danger: true })) { ...do it... }
const Ctx = createContext(async () => true);

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setReq({ ...opts, resolve })), []);
  const close = (v) => { if (req) req.resolve(v); setReq(null); };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {req ? createPortal(<Dialog req={req} onClose={close} />, document.body) : null}
    </Ctx.Provider>
  );
}

function Dialog({ req, onClose }) {
  const { u } = useT();
  const okRef = useRef(null);
  useEffect(() => {
    okRef.current?.focus();
    const k = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(false); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="cf-wrap" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(false); }}>
      <div className={`cf${req.danger ? ' danger' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="cfT" aria-describedby="cfM">
        <span className="cf-ic" aria-hidden="true">
          {req.danger
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2.5 20h19Z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></svg>}
        </span>
        <div className="cf-body">
          <h3 id="cfT">{req.title}</h3>
          {req.message ? <p id="cfM">{req.message}</p> : null}
          {req.quote ? <blockquote className="cf-q">{req.quote}</blockquote> : null}
        </div>
        <div className="cf-acts">
          <button type="button" className="btn ghost" onClick={() => onClose(false)}>{req.cancel || u('cancel')}</button>
          <button type="button" ref={okRef} className={`btn${req.danger ? ' danger' : ''}`} onClick={() => onClose(true)}>{req.ok || u('confirmOk')}</button>
        </div>
      </div>
    </div>
  );
}

export const useConfirm = () => useContext(Ctx);
