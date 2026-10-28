import { useEffect, useState } from 'react';
import { useT } from './lib/i18n.jsx';
import { useLab } from './lib/labStore.jsx';
import { useCommunity } from './lib/community.jsx';
import { LABS } from './data/content.js';
import { progress } from './lib/calc.js';
import Home from './components/Home.jsx';
import PracticalList from './components/PracticalList.jsx';
import Lab from './components/Lab.jsx';
import Community from './components/Community.jsx';
import LangSheet from './components/LangSheet.jsx';

const NAV = [
  ['home', 'navHome', <path key="h" d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z" />],
  ['list', 'navList', [<path key="a" d="M3 6c3-1.3 6-1.3 9 1v13c-3-2.3-6-2.3-9-1Z" />, <path key="b" d="M21 6c-3-1.3-6-1.3-9 1v13c3-2.3 6-2.3 9-1Z" />]],
  ['lab', 'navLab', [<path key="a" d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />, <path key="b" d="M7.5 14h9" />]],
  ['comm', 'navComm', [<circle key="a" cx="8" cy="9" r="3" />, <circle key="b" cx="16.5" cy="10" r="2.5" />, <path key="c" d="M3 19c.6-3 2.6-5 5-5s4.4 2 5 5M13.5 19c.4-2.2 1.6-3.7 3-3.7s2.7 1.5 3.2 3.7" />]],
  ['lang', 'navLang', [<circle key="a" cx="12" cy="12" r="9" />, <path key="b" d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" />]],
];

function Clock() {
  const { lang } = useT();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const mon = now.toLocaleString(lang === 'si' ? 'si-LK' : 'en-US', { month: 'short' });
  return (
    <div className="st-r">
      <span>{lang === 'si' ? `${now.getFullYear()} ${mon} ${now.getDate()}` : `${mon} ${now.getDate()}, ${now.getFullYear()}`}</span>
      <span>{now.toLocaleTimeString('en-GB', { hour12: false })}</span>
    </div>
  );
}

export default function App() {
  const { u } = useT();
  const { st, update } = useLab();
  const comm = useCommunity();
  const [langOpen, setLangOpen] = useState(false);
  const view = st.view;
  const go = (v) => { update((n) => { n.view = v; }, true); window.scrollTo(0, 0); };
  const done = Object.keys(LABS).filter((id) => progress(st, +id) >= 0.999).length;
  const part = Object.keys(LABS).reduce((s, id) => s + progress(st, +id), 0);
  useEffect(() => { document.body.dataset.view = view; }, [view]);

  return (
    <div className="shell">
      <header className="hdr">
        <svg className="logo" viewBox="0 0 52 52" aria-hidden="true"><path d="M26 6 46 42H6Z" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinejoin="round" /><path d="M2 30 L20 26" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" /><path d="M33 25 L50 20M34 29 L50 28M34 33 L50 36" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" /></svg>
        <div className="wordmark"><h1>Learn <em>Physics</em></h1><div className="tag">{u('tagline')}</div></div>
        <span className="sp" />
        {comm.online > 0 ? <div className="hereNow"><i /><span>{comm.online} {u('hereNow')}</span></div> : null}
      </header>
      <section className="status" aria-label={u('stLabel')}>
        <div className="st-l">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"><path d="M4 9c5-2 11-2 16 2v22c-5-4-11-4-16-2Z" /><path d="M36 9c-5-2-11-2-16 2v22c5-4 11-4 16-2Z" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{u('stLabel')}</div>
            <div className="st-bar"><div className="bar"><i style={{ width: `${Math.max(2, (part / 42) * 100)}%` }} /></div><b>{done}/42</b></div>
          </div>
        </div>
        <Clock />
      </section>
      <nav className="nav" aria-label="Main">
        {NAV.map(([k, t, ic]) => (
          <button key={k} type="button" aria-current={view === k ? 'page' : undefined} onClick={() => (k === 'lang' ? setLangOpen(true) : go(k))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">{ic}</svg>
            <span>{u(t)}</span>
          </button>
        ))}
      </nav>
      <main>
        {view === 'home' && <Home go={go} />}
        {view === 'list' && <PracticalList go={go} />}
        {view === 'lab' && <Lab />}
        {view === 'comm' && <Community go={go} />}
      </main>
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </div>
  );
}
