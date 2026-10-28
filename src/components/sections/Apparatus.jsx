import { useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS, UI } from '../../data/content.js';
import { getEngine } from '../../engine/engine.js';

export default function Apparatus() {
  const { L, u } = useT();
  const { st } = useLab();
  const lab = LABS[st.cur];
  const [hl, setHl] = useState(null);
  const pick = (k) => { const n = hl === k ? null : k; setHl(n); getEngine().highlight(n); };
  return (
    <>
      <div><span className="lbl-s">{u('activities')}</span><ol>{lab.acts.map((a, i) => <li key={i}>{L(a)}</li>)}</ol></div>
      <h2>{L(UI.secs)[0]}</h2>
      <p>{L(lab.materials)}</p>
      <div><h3>{u('parts')}</h3><p style={{ color: 'var(--muted)', fontSize: 13 }}>{u('partsTip')}</p></div>
      <div className="chips">{lab.parts.map(([k, n]) => <button type="button" key={k} className="chip" aria-pressed={hl === k} onClick={() => pick(k)}>{L(n)}</button>)}</div>
    </>
  );
}
