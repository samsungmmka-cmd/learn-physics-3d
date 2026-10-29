import { useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { useCommunity } from '../../lib/community.jsx';
import { DISC, LABS, RESULT_TXT } from '../../data/content.js';
import { fmt, freshLab, measMeans, myShare } from '../../lib/calc.js';
import { useConfirm } from '../Confirm.jsx';

export default function Results() {
  const { L, u } = useT();
  const { st, update } = useLab();
  const comm = useCommunity();
  const confirm = useConfirm();
  const id = st.cur, lab = LABS[id], ls = st.labs[id], mm = measMeans(ls, id);
  const [shareMsg, setShareMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = [];
  lab.meas.forEach((x) => { if (mm[x.key] !== undefined) rows.push([L(x.label), fmt(mm[x.key], (x.dp || lab.dp) + 1), false]); });
  lab.calcs.forEach((c) => { const cv = ls.calc[c.key]; rows.push([L(c.label), cv && cv.ok ? `${cv.v} ${c.unit}` : null, true]); });
  const share = async () => {
    if (!comm.enabled) { setShareMsg(u('offline')); return; }
    if (!comm.uid) { setShareMsg(u('signInToJoin')); return; }
    const vals = myShare(st, id); if (!Object.keys(vals).length) { setShareMsg(u('noShare')); return; }
    if (!(await confirm({ title: u('cfShareT'), message: u('cfShareM'), ok: u('shareRes') }))) return;
    setBusy(true); const err = await comm.shareResult(id, vals); setBusy(false);
    setShareMsg(err ? u('postErr') : u('shared'));
  };
  return (
    <>
      <div><h2>{u('result')}</h2><p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{L(RESULT_TXT)}</p></div>
      <div className="tbl-wrap"><table><tbody>
        {rows.map(([a, b, bold], i) => <tr key={i}><td className="lab">{bold ? <b>{a}</b> : a}</td><td>{b === null ? <span style={{ color: 'var(--muted)', fontFamily: 'var(--f-body)' }}>{u('notYet')}</span> : bold ? <b>{b}</b> : b}</td></tr>)}
      </tbody></table></div>
      <div><h2>{u('discussion')}</h2><p style={{ fontSize: 13.5 }}>{L(DISC)}</p></div>
      <textarea aria-label={u('discussion')} placeholder={u('notesPh')} defaultValue={ls.notes || ''} onChange={(e) => { const v = e.target.value; update((n) => { n.labs[n.cur].notes = v; }); }} />
      <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>{comm.uid ? u('synced') : u('saved')}</p>
      <div className="extra"><span className="lbl-s" style={{ color: 'var(--accent-2)' }}>{u('note')}</span>{L(lab.note)}</div>
      <div className="card"><h3>{u('classResults')}</h3>
        <div className="row"><button type="button" className="btn" disabled={busy} aria-busy={busy} onClick={share}>{u('shareRes')}</button><span className="muted">{shareMsg}</span></div>
      </div>
      <div className="row">
        <button type="button" className="btn ghost sm" onClick={async () => { if (await confirm({ title: u('cfResetT'), message: u('cfResetM'), ok: u('resetLab'), danger: true })) update((n) => { n.labs[n.cur] = freshLab(n.cur); }); }}>{u('resetLab')}</button>
      </div>
    </>
  );
}
