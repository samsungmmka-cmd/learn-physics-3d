import { useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS, UI } from '../../data/content.js';
import { curMeas, fmt } from '../../lib/calc.js';
import { getEngine } from '../../engine/engine.js';
import { LcCard, ZeroCard } from './Setup.jsx';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
const head = (m, i) => (m.heads ? m.heads[i] : `(${ROMAN[i]})`);

export function corrRule(m, lab, ls, u) {
  if (lab.inst === 'sphero' && !m.rig) return `${u('corr')} = ${u('reading')} − ${fmt(ls.S0rec, 2)}`;
  if (m.rig === 'caliper') return '';
  const e = lab.unit === 'cm' ? ls.e / 10 : ls.e;
  return `${u('corr')} = ${u('reading')} ${e > 0 ? '−' : '+'} ${fmt(Math.abs(e), 2)}`;
}

function MiniTable({ m, lab, ls }) {
  const { u } = useT();
  const recs = ls.rec[m.key] || [], d = m.dp || lab.dp;
  return (
    <>
      <div className="tbl-wrap"><table>
        <thead><tr><th />{recs.map((r, i) => <th key={i}>{head(m, i)}</th>)}</tr></thead>
        <tbody>
          <tr><td className="lab">{u('reading')}</td>{recs.map((r, i) => <td key={i}>{fmt(r.raw, d)}</td>)}</tr>
          <tr><td className="lab">{u('corr')}</td>{recs.map((r, i) => <td key={i}>{fmt(r.corr, d)}</td>)}</tr>
        </tbody>
      </table></div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>{corrRule(m, lab, ls, u)}</p>
    </>
  );
}

function PairNote({ pair, lang }) {
  if (lang === 'ta') return <p className="fb info">கோளமானியின் மூன்று கால்களையும் தாளில் அழுத்தியதால் A, B, C அடையாளங்கள் உண்டாயின. நிலையான தாடையின் முனை <b>{pair[0]}</b> அடையாளத்தில் உள்ளது. வழுக்கும் தாடையின் முனை <b>{pair[1]}</b> அடையாளத்தில் அமரும் வரை அதை நகர்த்தவும். (செம்மஞ்சள் கோடு = அளக்கப்படும் தூரம் {pair})</p>;
  return lang === 'si'
    ? <p className="fb info">ගෝලමානයේ පාද තුන කඩදාසිය මත තද කළ විට A, B, C සලකුණු සෑදුණි. අචල හනුවේ තුඩ <b>{pair[0]}</b> සලකුණ මත තබා, සර්පණ හනුවේ තුඩ <b>{pair[1]}</b> සලකුණ මතට ගෙන එන්න. (තැඹිලි ඉර = මනින දුර {pair})</p>
    : <p className="fb info">The marks A, B and C were made by pressing the spherometer’s three legs onto the paper. The fixed jaw tip is on mark <b>{pair[0]}</b>. Slide the moving jaw until its tip sits on mark <b>{pair[1]}</b>. (Orange line = distance {pair} being measured.)</p>;
}

export default function Procedure() {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const id = st.cur, lab = LABS[id], ls = st.labs[id];
  const [val, setVal] = useState('');
  const [fb, setFb] = useState(null);
  const eng = getEngine();

  const intro = <p className="book"><small>{u('fromBook')} · {L(UI.secs)[2]}</small>{L(lab.setup)}</p>;
  if (!ls.lc) return <>{intro}<LcCard /><p className="insight">{u('lockedSetup')}</p></>;
  if (!ls.zero) return <>{intro}<LcCard /><ZeroCard /><p className="insight">{u('lockedSetup')}</p></>;

  const m = curMeas(ls, id), recs = ls.rec[m.key] || [];
  const actMeas = lab.meas.filter((x) => x.act === ls.act);
  const actDone = (a) => lab.meas.filter((x) => x.act === a).every((x) => (ls.rec[x.key] || []).length >= x.n);
  const pe = (0.01 / (ls.N * 0.104)) * 100;
  const unit = m.rig === 'caliper' && lab.unit === 'mm' ? 'mm' : lab.unit;
  const setLab = (fn) => update((n) => fn(n.labs[n.cur]));

  const hint = () => { eng.setHint(true); setFb(['info', eng.rig && eng.rig.contact() ? eng.rig.hintText(lang) : m.mode === 'free' ? u('notMarks') : u('notContact')]); };
  const record = () => {
    const R = eng.rig;
    if (m.paper && pe > 1) { setFb(['bad', u('pctBad')]); return; }
    if (!R || !R.contact()) { setFb(['bad', m.mode === 'free' ? u('notMarks') : u('notContact')]); return; }
    if (R.type === 'micro' && R.squeeze > 0) { setFb(['bad', u('tightMsg')]); return; }
    const v = parseFloat(val);
    if (!Number.isFinite(v)) { setFb(['bad', u('wrongRead')]); return; }
    const inMM = lab.unit === 'cm' && !(m.rig === 'caliper' && lab.unit === 'mm') ? v * 10 : v;
    if (Math.abs(inMM - R.ideal()) > R.tol) { setFb(['bad', u('wrongRead')]); return; }
    let corr;
    if (lab.inst === 'sphero' && !m.rig) corr = v - ls.S0rec;
    else if (m.rig === 'caliper' && id === 3) corr = v;
    else corr = v - (lab.unit === 'cm' ? ls.e / 10 : ls.e);
    setLab((L2) => { (L2.rec[m.key] = L2.rec[m.key] || []).push({ raw: v, corr }); if (L2.rec[m.key].length >= m.n) L2.mk = null; });
    setVal(''); eng.setHint(false);
    setFb(['good', `${u('correct')} ${u('corr')}: ${fmt(corr, m.dp || lab.dp)}`]);
  };

  return (
    <>
      {intro}
      <LcCard />
      <ZeroCard />
      <div><span className="lbl-s">{u('activities')}</span>
        <div className="chips">
          {lab.acts.map((a, i) => (
            <button type="button" key={i} className={`chip${actDone(i) ? ' done' : ''}`} aria-pressed={i === ls.act} onClick={() => { setFb(null); setLab((L2) => { L2.act = i; L2.mk = null; }); }}>
              <span className="dot" />{i + 1}. {L(a)}
            </button>
          ))}
        </div>
      </div>
      <ol>{L(lab.steps[ls.act]).map((s, i) => <li key={i}>{s}</li>)}</ol>
      <div className="meas">
        {actMeas.map((x) => {
          const n = (ls.rec[x.key] || []).length;
          return (
            <button type="button" key={x.key} className={`mrow${n >= x.n ? ' full' : ''}`} aria-pressed={x.key === m.key} onClick={() => { setFb(null); setLab((L2) => { L2.mk = x.key; }); }}>
              <span>{L(x.label)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{/^\d/.test(x.table) ? `· ${x.table} ${u('table')}` : ''}</span></span>
              <span className="c">{n}/{x.n}</span>
            </button>
          );
        })}
      </div>
      {m.paper ? (
        <div className="card">
          <div className="ctrl"><label>{u('sheets')} <output>{ls.N}</output>
            <input type="range" min="1" max="30" step="1" value={ls.N} disabled={recs.length > 0} onChange={(e) => setLab((L2) => { L2.N = +e.target.value; })} /></label></div>
          <p className={`fb ${pe <= 1 ? 'good' : 'bad'}`}>{u('pctErr')} = 0.01 / ({ls.N} × ≈0.1) × 100 ≈ {fmt(pe, 1)}%{pe > 1 ? ` · ${u('pctBad')}` : ''}</p>
        </div>
      ) : null}
      {recs.length < m.n ? (
        <div className="card">
          <h3>{u('readingOf')}: {L(m.label)} <span className="st" style={{ color: 'var(--accent)' }}>{head(m, recs.length)}</span></h3>
          {m.mode === 'free' ? <PairNote pair={['AB', 'BC', 'CA'][recs.length % 3]} lang={lang} /> : null}
          <div className="row"><span>{u('reading')}</span>
            <input className="num" inputMode="decimal" autoComplete="off" aria-label={u('reading')} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') record(); }} />
            <span className="unit">{unit}</span></div>
          <div className="row"><button type="button" className="btn" onClick={record}>{u('record')}</button><button type="button" className="btn ghost sm" onClick={hint}>{u('hint')}</button></div>
          {fb ? <p className={`fb ${fb[0]}`}>{fb[1]}</p> : null}
        </div>
      ) : <>{fb && fb[0] === 'good' ? <p className="fb good">{fb[1]}</p> : null}<p className="insight">{u('allDone')}</p></>}
      {recs.length ? <MiniTable m={m} lab={lab} ls={ls} /> : null}
    </>
  );
}
