import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../lib/i18n.jsx';
import { useCommunity } from '../lib/community.jsx';

export const initials = (s) => (s || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Rounded-square avatar, styled like the 3D toolbar buttons.
export function Avatar({ name, size = 34, signedIn = true }) {
  return (
    <span className={`uav${signedIn ? '' : ' out'}`} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {signedIn ? initials(name) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></svg>
      )}
    </span>
  );
}

function LangSwitch() {
  const { lang, setLang, u } = useT();
  return (
    <div className="um-lang" role="group" aria-label={u('langTitle')}>
      <span className="um-k">{u('langTitle')}</span>
      <div className="seg2">
        <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
        <button type="button" aria-pressed={lang === 'si'} onClick={() => setLang('si')} lang="si">සිං</button>
      </div>
    </div>
  );
}

function ProfileDialog({ onClose }) {
  const { u } = useT(); const comm = useCommunity();
  const [name, setName] = useState(comm.me?.name || '');
  const [state, setState] = useState(null);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const save = async (e) => {
    e.preventDefault(); if (!name.trim()) return; setState('busy');
    const err = await comm.rename(name.trim().slice(0, 60)); setState(err ? 'err' : 'ok');
  };
  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="profH" className="profile" onSubmit={save}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 id="profH" className="sec-h" style={{ fontSize: 22 }}>{u('profile')}</h3>
          <button type="button" className="link" onClick={onClose}>{u('close')}</button>
        </div>
        <div className="prof-top">
          <Avatar name={name || comm.me?.email} size={56} />
          <div style={{ minWidth: 0 }}>
            <b className="prof-n">{comm.me?.name || '—'}</b>
            <div className="muted prof-e">{comm.me?.email}</div>
            <span className={comm.teacher ? 'tagT' : 'stTag'}>{comm.teacher ? u('roleTeacher') : u('roleStudent')}</span>
          </div>
        </div>
        <label className="fld"><span>{u('yourName')}</span><input id="profName" value={name} maxLength={60} required onChange={(e) => { setName(e.target.value); setState(null); }} autoComplete="name" /></label>
        <label className="fld"><span>{u('email')}</span><input id="profEmail" value={comm.me?.email || ''} readOnly disabled /></label>
        <div className="row"><button type="submit" className="btn" disabled={state === 'busy'} aria-busy={state === 'busy'}>{u('saveName')}</button></div>
        {state === 'ok' ? <p className="fb good" role="status">{u('profileSaved')}</p> : state === 'err' ? <p className="fb bad" role="status">{u('postErr')}</p> : null}
      </form>
    </div>
  );
}

// Avatar button in the navigation bar; opens the account menu (profile, language, sign in/out).
export default function UserMenu({ go, current }) {
  const { u } = useT(); const comm = useCommunity();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const wrap = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc); window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDoc); window.removeEventListener('keydown', onKey); };
  }, [open]);
  const name = comm.me?.name || comm.me?.email || '';
  const signedIn = !!comm.uid;
  const toAuth = (m) => { setOpen(false); comm.setAuthMode(m); go('comm'); };
  return (
    <div className="um" ref={wrap}>
      <button type="button" className={`um-btn${open ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={open} aria-current={current ? 'page' : undefined} onClick={() => setOpen((v) => !v)}>
        <Avatar name={name} size={30} signedIn={signedIn} />
        <span className="um-name">{signedIn ? (comm.me?.name || u('profile')) : u('signInTab')}</span>
        <svg className="um-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {open ? (
        <div className="um-pop" role="menu" aria-label={u('account')}>
          <div className="um-head">
            <Avatar name={name} size={44} signedIn={signedIn} />
            <div style={{ minWidth: 0 }}>
              <b className="um-n">{signedIn ? (comm.me?.name || '—') : u('notSignedIn')}</b>
              <div className="muted um-e">{signedIn ? comm.me?.email : u('authHelp')}</div>
              {signedIn ? <span className={comm.teacher ? 'tagT' : 'stTag'}>{comm.teacher ? u('roleTeacher') : u('roleStudent')}</span> : null}
            </div>
          </div>
          {signedIn ? (
            <button type="button" role="menuitem" className="um-item" onClick={() => { setOpen(false); setProfile(true); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></svg>{u('profile')}
            </button>
          ) : (
            <div className="um-auth">
              <button type="button" className="btn sm" onClick={() => toAuth('in')}>{u('signInTab')}</button>
              <button type="button" className="btn ghost sm" onClick={() => toAuth('up')}>{u('signUpTab')}</button>
            </div>
          )}
          <LangSwitch />
          {signedIn ? (
            <button type="button" role="menuitem" className="um-item danger" onClick={() => { setOpen(false); comm.signOut(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4M6 12h10" /></svg>{u('signOut')}
            </button>
          ) : null}
        </div>
      ) : null}
      {profile ? createPortal(<ProfileDialog onClose={() => setProfile(false)} />, document.body) : null}
    </div>
  );
}
