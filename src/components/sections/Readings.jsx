import { useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS } from '../../data/content.js';
import { fmt, measMeans } from '../../lib/calc.js';

const ROMAN = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)'];

function MeanInput({ k, mean, tol, saved, onSave }) {
  const [v, setV] = useState(saved ? saved.v : '');
  const cls = saved ? (saved.ok ? ' ok' : ' bad') : '';
  return <input className={`num${cls}`} inputMode="decimal" aria-label={k} value={v} onChange={(e) => setV(e.target.value)}
    onBlur={() => { if (v !== '') onSave({ v, ok: Math.abs(parseFloat(v) - mean) <= tol }); }}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

function CalcCard({ c, mm, ls, ready }) {
  const { L, u, lang } = useT();
  const { update } = useLab();
  const cv = ls.calc[c.key];
  const [v, setV] = useState(cv ? cv.v : '');
  const [msg, setMsg] = useState(null);
  const val = ready ? c.fn(mm, ls) : NaN;
  const dp = c.dp || (c.unit === 'cm³' ? 2 : 3);
  const check = () => {
    const x = parseFloat(v); const ok = Math.abs(x - val) / val <= 0.015;
    update((n) => { n.labs[n.cur].calc[c.key] = { v: String(x), ok }; });
    setMsg(['', ok ? u('correct') : L({ si: 'ගණනය නැවත පරීක්ෂා කරන්න.', en: 'Check your working again.', ta: 'உங்கள் கணிப்பை மீண்டும் சரிபார்க்கவும்.' }), ok]);
  };
  const work = () => {
    const parts = Object.entries(mm).filter(([k]) => LABS[ls._id].meas.find((x) => x.key === k && x.act === c.act)).map(([k, x]) => `${k} = ${fmt(x, 4)}`).join(', ');
    setMsg(['info', `${parts}${c.key === 'P1' ? `, N = ${ls.N}` : ''} → ${L(c.label)} = ${fmt(val, dp)} ${c.unit}`]);
  };
  const done = cv && cv.ok;
  return (
    <div className={`card${done ? ' done' : ''}`}>
      <h3>{u('calcHead')}: {L(c.label)}</h3>
      <div className="formula">{c.f}</div>
      {ready ? (
        <>
          <div className="row">
            <input className={`num${done ? ' ok' : ''}`} inputMode="decimal" aria-label={L(c.label)} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />
            <span className="unit">{c.unit}</span>
            <button type="button" className="btn sm" onClick={check}>{u('check')}</button>
            <button type="button" className="btn ghost sm" onClick={work}>{u('solution')}</button>
          </div>
          {msg ? <p className={`fb ${msg[0] === 'info' ? 'info' : msg[2] ? 'good' : 'bad'}`}>{msg[1]}</p> : null}
        </>
      ) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>{u('needReadings')}</p>}
    </div>
  );
}

export default function Readings() {
  const { L, u } = useT();
  const { st, update } = useLab();
  const id = st.cur, lab = LABS[id], ls = { ...st.labs[id], _id: id };
  if (!ls.zero) return <p className="insight">{u('needReadings')}</p>;
  const tables = {}; lab.meas.forEach((x) => { (tables[x.table] = tables[x.table] || []).push(x); });
  const mm = measMeans(ls, id);
  return (
    <>
      <p style={{ fontSize: 13.5 }}>{u('lc')} = {lab.lcAns} mm · {lab.inst === 'sphero' ? `${u('init')} = ${fmt(ls.S0rec, 2)} mm` : `${u('zero')} = ${fmt(Math.abs(ls.e), lab.inst === 'micro' ? 2 : 1)} mm (${ls.e > 0 ? u('subtract') : u('add')})`}</p>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{u('enterMeans')}</p>
      {Object.entries(tables).map(([tid, rows]) => {
        const nc = Math.max(...rows.map((r) => r.n)); const heads = (rows[0].heads || ROMAN).slice(0, nc); const hasMean = rows.some((r) => r.n > 1);
        return (
          <div className="tbl-wrap" key={tid}><table>
            <caption>{/^\d/.test(tid) ? `${tid} ${u('table')}` : L(rows[0].label)}</caption>
            <thead><tr><th>{u('corr')}</th>{heads.map((h) => <th key={h}>{h}</th>)}{hasMean ? <th>{u('mean')}</th> : null}</tr></thead>
            <tbody>
              {rows.map((r) => {
                const rec = ls.rec[r.key] || [], d = r.dp || lab.dp, full = rec.length >= r.n;
                const tol = (r.rig === 'caliper' && lab.unit === 'mm' ? 0.1 : 0.01) * 0.6 + 1e-9;
                return (
                  <tr key={r.key}>
                    <td className="lab">{L(r.label)}</td>
                    {Array.from({ length: nc }, (_, i) => <td key={i}>{i < r.n ? (rec[i] ? fmt(rec[i].corr, d) : '·') : ''}</td>)}
                    {hasMean ? <td>{r.n > 1 ? (full ? <MeanInput k={r.key} mean={mm[r.key]} tol={tol} saved={ls.means[r.key]} onSave={(s) => update((n) => { n.labs[n.cur].means[r.key] = s; })} /> : '·') : ''}</td> : null}
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        );
      })}
      {lab.calcs.map((c) => <CalcCard key={c.key} c={c} mm={mm} ls={ls} ready={lab.meas.filter((x) => x.act === c.act).every((x) => mm[x.key] !== undefined)} />)}
    </>
  );
}
