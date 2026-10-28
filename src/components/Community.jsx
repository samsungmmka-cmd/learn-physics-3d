import { useState } from 'react';
import { useT } from '../lib/i18n.jsx';
import { useLab } from '../lib/labStore.jsx';
import { useCommunity } from '../lib/community.jsx';
import { LABS, PRAC } from '../data/content.js';
import { avg, shareKeys } from '../lib/calc.js';

const pracTag = (p, u) => (p ? `P${String(p).padStart(2, '0')}` : u('general'));
const pracTitle = (id, lang) => { const p = PRAC.find((x) => x[0] === String(id)); return p ? (lang === 'si' ? p[2] : p[3]) : ''; };
const COLORS = ['#E3A91C', '#2E6CD6', '#8E45CB', '#F26B1D', '#2A9A5A', '#D0453A'];
function hue(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; }

function useAgo() {
  const { lang, u } = useT();
  return (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return u('justNow');
    const m = s / 60, h = m / 60, d = h / 24;
    const f = (n, a, b) => (lang === 'si' ? `${Math.floor(n)} ${a}කට පෙර` : `${Math.floor(n)}${b} ago`);
    return d >= 1 ? f(d, 'දින', 'd') : h >= 1 ? f(h, 'පැය', 'h') : f(m, 'මිනිත්තු', 'm');
  };
}
function Avatar({ id, name, size = 40 }) {
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <span className="av" style={{ width: size, height: size, background: hue(id), fontSize: size * 0.4 }} aria-hidden="true">{initials}</span>;
}
function useName() {
  const { u } = useT(); const comm = useCommunity();
  return (id) => (id === comm.uid ? u('you') : (comm.profiles[id] && comm.profiles[id].name) || u('someone'));
}

export function PostItem({ p, compact, onReply, children }) {
  const { u } = useT(); const comm = useCommunity(); const ago = useAgo(); const nameOf = useName();
  const prof = comm.profiles[p.author];
  const text = compact && p.body.length > 160 ? `${p.body.slice(0, 160)}…` : p.body;
  return (
    <div className="post">
      <Avatar id={p.author} name={prof?.name} size={compact ? 36 : 40} />
      <div>
        <div className="meta"><b>{nameOf(p.author)}</b>{prof?.role === 'teacher' ? <span className="tagT">{u('teacher')}</span> : null}<span className="tagP">{pracTag(p.prac, u)}</span><span className="muted">{ago(p.created_at)}</span></div>
        <div className="txt">{text}</div>
        {!compact ? (
          <div className="acts">
            {!p.parent && onReply ? <button type="button" onClick={onReply}>{u('reply')}</button> : null}
            {p.author === comm.uid || comm.teacher ? <button type="button" onClick={() => comm.delPost(p.id)}>{u('del')}</button> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function AssignmentRow({ a, withDelete }) {
  const { u, lang } = useT(); const { update } = useLab(); const comm = useCommunity(); const ago = useAgo();
  const open = () => update((n) => { n.cur = a.prac; n.sec = 2; n.view = 'lab'; }, true);
  return (
    <div className="ai">
      <span className="badgeN">{String(a.prac).padStart(2, '0')}</span>
      <div><b>{pracTitle(a.prac, lang)}</b><small>{[a.due ? `${u('due')}: ${a.due}` : '', a.note || '', withDelete ? ago(a.created_at) : ''].filter(Boolean).join(' · ')}</small></div>
      <div className="row">
        <button type="button" className="btn sm ghost" onClick={open}>{u('open')}</button>
        {withDelete && comm.teacher ? <button type="button" className="btn sm ghost" onClick={() => comm.delAssignment(a.id)}>{u('del')}</button> : null}
      </div>
    </div>
  );
}

function AuthCard() {
  const { u } = useT(); const comm = useCommunity();
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [state, setState] = useState(null);
  const send = async (e) => {
    e.preventDefault(); if (!email.includes('@')) return;
    setState('busy'); const err = await comm.signIn(email.trim(), name.trim().slice(0, 60)); setState(err ? 'err' : 'sent');
  };
  return (
    <form className="card auth" onSubmit={send}>
      <h3>{u('joinClass')}</h3>
      <p className="muted">{u('joinHelp')}</p>
      <label className="fld"><span>{u('yourName')}</span><input id="authName" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" /></label>
      <label className="fld"><span>{u('email')}</span><input id="authEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <div className="row"><button className="btn" type="submit" disabled={state === 'busy'}>{u('sendLink')}</button></div>
      {state === 'sent' ? <p className="fb good">{u('linkSent')}</p> : state === 'err' ? <p className="fb bad">{u('linkErr')}</p> : null}
    </form>
  );
}

function Strip({ vals, mine, unit }) {
  const w = 640, pad = 26; const xs = vals.map((v) => v.v);
  let lo = Math.min(...xs), hi = Math.max(...xs);
  if (hi - lo < 1e-9) { lo -= Math.abs(lo) * 0.01 + 0.01; hi += Math.abs(hi) * 0.01 + 0.01; }
  const span = hi - lo; lo -= span * 0.08; hi += span * 0.08;
  const X = (v) => pad + ((v - lo) / (hi - lo)) * (w - 2 * pad); const mean = avg(xs);
  const seen = {};
  return (
    <svg className="strip" viewBox={`0 0 ${w} 86`} role="img" aria-label={`mean ${mean.toPrecision(4)} ${unit}`}>
      <line x1={pad} y1="48" x2={w - pad} y2="48" stroke="var(--line)" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => { const v = lo + ((hi - lo) * i) / 4; return <g key={i}><line x1={X(v)} y1="44" x2={X(v)} y2="52" stroke="var(--muted)" /><text x={X(v)} y="72" textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="var(--f-mono)">{v.toPrecision(4)}</text></g>; })}
      <line x1={X(mean)} y1="20" x2={X(mean)} y2="56" stroke="var(--ink)" strokeWidth="2.5" />
      <text x={X(mean)} y="14" textAnchor="middle" fontSize="12" fill="var(--ink)" fontFamily="var(--f-mono)" fontWeight="700">{mean.toPrecision(4)} {unit}</text>
      {vals.map((v) => { const x = X(v.v); const k = Math.round(x / 7); seen[k] = (seen[k] || 0) + 1; const y = 48 - (seen[k] - 1) * 9;
        return <circle key={v.uid} cx={x} cy={y} r={v.uid === mine ? 7 : 5.5} fill={v.uid === mine ? 'var(--accent)' : 'var(--c2)'} stroke="var(--card)" strokeWidth="2" opacity=".92" />; })}
    </svg>
  );
}
function keyLabel(id, k, L) {
  const lab = LABS[id]; const c = lab.calcs.find((x) => x.key === k); if (c) return [L(c.label), c.unit];
  const m = lab.meas.find((x) => x.key === k); return [L(m.label).replace(/\s*\([^)]*\)\s*$/, ''), lab.unit === 'cm' ? 'cm' : 'mm'];
}

function Discussion() {
  const { u, lang } = useT(); const comm = useCommunity();
  const [filter, setFilter] = useState('all'); const [text, setText] = useState(''); const [prac, setPrac] = useState('0');
  const [replyTo, setReplyTo] = useState(null); const [reply, setReply] = useState(''); const [err, setErr] = useState('');
  const tops = comm.posts.filter((p) => !p.parent && (filter === 'all' || String(p.prac) === filter));
  const post = async () => { if (!text.trim()) return; const e = await comm.addPost(text, +prac, null); if (e) setErr(u('postErr')); else { setText(''); setErr(''); } };
  const sendReply = async (p) => { if (!reply.trim()) return; const e = await comm.addPost(reply, p.prac, p.id); if (e) setErr(u('postErr')); else { setReply(''); setReplyTo(null); } };
  return (
    <div className="comm-grid">
      <div className="card">
        <div className="chips">
          {[['all', u('all')], ['0', u('general')], ...Object.keys(LABS).map((id) => [id, pracTag(id, u)])].map(([k, t]) => <button type="button" key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{t}</button>)}
        </div>
        <div className="compose">
          <textarea aria-label={u('askPh')} placeholder={u('askPh')} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row">
            <select aria-label="Practical" value={prac} onChange={(e) => setPrac(e.target.value)}>
              <option value="0">{u('general')}</option>
              {Object.keys(LABS).map((id) => <option key={id} value={id}>{pracTag(id, u)} · {pracTitle(id, lang)}</option>)}
            </select>
            <button type="button" className="btn" onClick={post}>{u('post')}</button>
          </div>
          {err ? <p className="fb bad">{err}</p> : null}
        </div>
        <div>
          {!tops.length ? <div className="empty">{u('noPosts')}</div> : tops.map((p) => {
            const reps = comm.posts.filter((x) => x.parent === p.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
            return (
              <PostItem key={p.id} p={p} onReply={() => { setReplyTo(replyTo === p.id ? null : p.id); setReply(''); }}>
                {reps.length || replyTo === p.id ? (
                  <div className="replies">
                    {reps.map((r) => <PostItem key={r.id} p={r} />)}
                    {replyTo === p.id ? (
                      <div className="compose" style={{ padding: '10px 0' }}>
                        <textarea aria-label={u('replyPh')} placeholder={u('replyPh')} style={{ minHeight: 64 }} value={reply} onChange={(e) => setReply(e.target.value)} autoFocus />
                        <div className="row"><button type="button" className="btn sm" onClick={() => sendReply(p)}>{u('reply')}</button><button type="button" className="btn sm ghost" onClick={() => setReplyTo(null)}>{u('cancel')}</button></div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </PostItem>
            );
          })}
        </div>
      </div>
      <div className="card">
        <h3>{u('assignments')}</h3>
        {comm.assignments.length ? comm.assignments.slice(0, 5).map((a) => <AssignmentRow key={a.id} a={a} />) : <div className="empty">{u('noAssign')}</div>}
      </div>
    </div>
  );
}

function ClassResults() {
  const { u, L, lang } = useT(); const comm = useCommunity();
  const [id, setId] = useState(1);
  const rows = comm.results.filter((r) => r.prac === id);
  const blocks = shareKeys(id).map((k) => {
    const vals = rows.filter((r) => Number.isFinite(r.vals?.[k])).map((r) => ({ uid: r.user_id, v: r.vals[k] }));
    if (!vals.length) return null; const [lb, un] = keyLabel(id, k, L);
    return (
      <div key={k} style={{ display: 'grid', gap: 6 }}>
        <div className="rowh"><h3>{lb}</h3><span className="mono muted">n = {vals.length} {u('students')}</span></div>
        <Strip vals={vals} mine={comm.uid} unit={un} />
      </div>
    );
  }).filter(Boolean);
  return (
    <div className="card">
      <div className="chips">{Object.keys(LABS).map((k) => <button type="button" key={k} className="chip" aria-pressed={id === +k} onClick={() => setId(+k)}>{pracTag(k, u)} · {pracTitle(k, lang)}</button>)}</div>
      <p className="muted">{u('resHelp')}</p>
      {blocks.length ? blocks : <div className="empty">{u('noResults')}</div>}
    </div>
  );
}

function ClassProgress() {
  const { u } = useT(); const comm = useCommunity(); const ago = useAgo(); const nameOf = useName();
  if (!comm.teacher) return <div className="card"><div className="empty">{u('onlyTeachers')}</div></div>;
  const rows = [...comm.classProgress].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (!rows.length) return <div className="card"><div className="empty">{u('noMembers')}</div></div>;
  return (
    <div className="card"><div className="tbl-wrap"><table className="prog-t">
      <thead><tr><th>{u('student')}</th>{Object.keys(LABS).map((k) => <th key={k}>{pracTag(k, u)}</th>)}<th>{u('lastActive')}</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.user_id}>
          <td className="lab">{nameOf(r.user_id)} {comm.profiles[r.user_id]?.role === 'teacher' ? <span className="tagT">{u('teacher')}</span> : null}</td>
          {Object.keys(LABS).map((k) => { const v = Math.max(0, Math.min(100, +(r.prog?.[k]) || 0)); return <td key={k} className="pc">{v}%<span className="minibar"><i style={{ width: `${v}%` }} /></span></td>; })}
          <td>{ago(r.updated_at)}</td>
        </tr>
      ))}</tbody>
    </table></div></div>
  );
}

function Assignments() {
  const { u, lang } = useT(); const comm = useCommunity();
  const [prac, setPrac] = useState(1); const [due, setDue] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  const add = async () => { const e = await comm.addAssignment(prac, due, note); if (e) setErr(u('postErr')); else { setNote(''); setErr(''); } };
  return (
    <div className="card">
      {comm.teacher ? (
        <div className="compose">
          <h3>{u('newAssign')}</h3>
          <div className="row">
            <select aria-label="Practical" value={prac} onChange={(e) => setPrac(+e.target.value)}>{Object.keys(LABS).map((id) => <option key={id} value={id}>{pracTag(id, u)} · {pracTitle(id, lang)}</option>)}</select>
            <input type="date" aria-label={u('due')} className="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <textarea aria-label={u('notePh')} placeholder={u('notePh')} maxLength={400} style={{ minHeight: 64 }} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="row"><button type="button" className="btn" onClick={add}>{u('addBtn')}</button></div>
          {err ? <p className="fb bad">{err}</p> : null}
        </div>
      ) : null}
      {comm.assignments.length ? comm.assignments.map((a) => <AssignmentRow key={a.id} a={a} withDelete />) : <div className="empty">{u('noAssign')}</div>}
    </div>
  );
}

export default function Community() {
  const { u } = useT(); const comm = useCommunity();
  const [sub, setSub] = useState('discuss');
  const [nm, setNm] = useState('');
  const tabs = [['discuss', u('discuss')], ['results', u('classResults')], ['progress', u('classProg')], ['assign', u('assignments')]];
  let body;
  if (!comm.enabled) body = <div className="empty">{u('noBackend')}</div>;
  else if (!comm.ready) body = <div className="empty">…</div>;
  else if (!comm.uid) body = <AuthCard />;
  else body = sub === 'discuss' ? <Discussion /> : sub === 'results' ? <ClassResults /> : sub === 'progress' ? <ClassProgress /> : <Assignments />;
  const needName = comm.uid && comm.me && !comm.me.name;
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="rowh">
        <h2 className="sec-h">{u('navComm')}</h2>
        {comm.uid ? <span className="row"><span className="muted">{comm.me?.name || comm.session?.user?.email}{comm.teacher ? ` · ${u('teacher')}` : ''}</span><button type="button" className="link" onClick={comm.signOut}>{u('signOut')}</button></span> : null}
      </div>
      {needName ? (
        <form className="card row" onSubmit={(e) => { e.preventDefault(); if (nm.trim()) comm.rename(nm.trim().slice(0, 60)); }}>
          <label className="fld" style={{ flex: 1 }}><span>{u('yourName')}</span><input value={nm} onChange={(e) => setNm(e.target.value)} maxLength={60} /></label>
          <button className="btn" type="submit">{u('saveName')}</button>
        </form>
      ) : null}
      {comm.uid ? <div className="ctabs">{tabs.map(([k, t]) => <button type="button" key={k} className="chip" aria-pressed={sub === k} onClick={() => setSub(k)}>{t}</button>)}</div> : null}
      {body}
    </div>
  );
}
