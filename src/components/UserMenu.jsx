import { useEffect, useRef, useState } from 'react';
import { useT } from '../lib/i18n.jsx';
import { useCommunity } from '../lib/community.jsx';
import { useNotifications } from '../lib/notifications.js';
import { useTheme } from '../lib/theme.js';
import { useConfirm } from './Confirm.jsx';

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

export function LangSwitch() {
  const { lang, setLang, u } = useT();
  return (
    <div className="um-lang" role="group" aria-label={u('langTitle')}>
      <span className="um-k">{u('langTitle')}</span>
      <div className="seg2">
        <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
        <button type="button" aria-pressed={lang === 'si'} onClick={() => setLang('si')} lang="si">සිං</button>
        <button type="button" aria-pressed={lang === 'ta'} onClick={() => setLang('ta')} lang="ta">தமிழ்</button>
      </div>
    </div>
  );
}

const SUN = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>;
const MOON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>;
const AUTO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" /></svg>;

export function ThemeSwitch() {
  const { u } = useT(); const { theme, setTheme } = useTheme();
  return (
    <div className="um-lang um-theme" role="group" aria-label={u('theme')}>
      <span className="um-k">{u('theme')}</span>
      <div className="seg2 seg-ic">
        {[['light', SUN, u('themeLight')], ['dark', MOON, u('themeDark')], ['system', AUTO, u('themeAuto')]].map(([k, ic, t]) => (
          <button key={k} type="button" aria-pressed={theme === k} onClick={() => setTheme(k)} title={t} aria-label={t}>{ic}</button>
        ))}
      </div>
    </div>
  );
}

// Avatar button in the navigation bar; opens the account menu (profile, language, sign in/out).
export default function UserMenu({ go, current }) {
  const { u } = useT(); const comm = useCommunity();
  const [open, setOpen] = useState(false);
  const notif = useNotifications();
  const confirm = useConfirm();
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
      <button type="button" className={`um-btn${open ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={open} aria-current={current ? 'page' : undefined}
        aria-label={`${signedIn ? name : u('signInTab')}${notif.unread ? ` · ${notif.unread} ${u('pfUnread')}` : ''}`} title={signedIn ? name : u('account')} onClick={() => setOpen((v) => !v)}>
        <span className="um-av"><Avatar name={name} size={34} signedIn={signedIn} />{notif.unread ? <span className="um-dot" aria-hidden="true">{notif.unread > 9 ? '9+' : notif.unread}</span> : null}</span>
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
            <button type="button" role="menuitem" className="um-item" onClick={() => { setOpen(false); go('profile'); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></svg>{u('pfMyProfile')}{notif.unread ? <span className="cnt acc" style={{ marginLeft: 'auto' }}>{notif.unread}</span> : null}
            </button>
          ) : (
            <div className="um-auth">
              <button type="button" className="btn sm" onClick={() => toAuth('in')}>{u('signInTab')}</button>
              <button type="button" className="btn ghost sm" onClick={() => toAuth('up')}>{u('signUpTab')}</button>
            </div>
          )}
          <LangSwitch />
          <ThemeSwitch />
          {signedIn ? (
            <button type="button" role="menuitem" className="um-item danger" onClick={async () => { setOpen(false); if (await confirm({ title: u('cfSignOutT'), message: u('cfSignOutM'), ok: u('signOut'), danger: true })) comm.signOut(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4M6 12h10" /></svg>{u('signOut')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
