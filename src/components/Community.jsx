import { useEffect, useState } from 'react';
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

export function AssignmentRow({ a, onOpen }) {
  const { u, lang } = useT(); const comm = useCommunity();
  const title = a.title || pracTitle(a.prac, lang);
  const st = a.my_status === 'completed' ? u('stCompleted') : a.my_status === 'enrolled' ? u('stEnrolled') : '';
  const counts = comm.teacher && a.enrolled_count !== undefined ? `${a.enrolled_count} ${u('enrolledN')} · ${a.completed_count} ${u('completedN')}` : '';
  const open = onOpen || (() => comm.setFocus(a.id));
  return (
    <div className="ai">
      <span className="badgeN">{a.prac ? String(a.prac).padStart(2, '0') : '—'}</span>
      <div><b>{title}</b><small>{[a.teacher_name ? `${u('by')} ${a.teacher_name}` : '', a.due ? `${u('due')}: ${a.due}` : '', counts].filter(Boolean).join(' · ')}</small></div>
      <div className="row">
        {st ? <span className={`stTag${a.my_status === 'completed' ? ' done' : ''}`}>{st}</span> : null}
        <button type="button" className="btn sm ghost" onClick={open}>{u('details')}</button>
      </div>
    </div>
  );
}

function errText(e, u) {
  if (!e) return '';
  if (e.code === 'wrong_teacher_code') return u('wrongCode');
  if (e.code === 'invalid_login') return u('badLogin');
  if (e.status === 503) return u('serverSoon');
  if (e.code === 'email_taken') return u('emailTaken');
  if (e.code === 'rate_limited') return u('tooMany');
  if (e.code === 'network' || e.code === 'not_api' || e.status === 404) return u('netErr');
  return e.message || u('postErr');
}

function AuthCard() {
  const { u } = useT(); const comm = useCommunity();
  const mode = comm.authMode; const setMode = comm.setAuthMode;
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'student', teacherCode: '' });
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === 'in') { const err = await comm.signIn(f.email.trim(), f.password); if (err) setMsg(['bad', errText(err, u)]); }
    else {
      const r = await comm.signUp({ name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role, teacherCode: f.role === 'teacher' ? f.teacherCode.trim() : undefined });
      if (r.error) setMsg(['bad', errText(r.error, u)]);
      else if (r.needsConfirmation) { setMsg(['good', u('checkEmail')]); setMode('in'); }
    }
    setBusy(false);
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <div className="ctabs" role="tablist">
        {[['in', u('signInTab')], ['up', u('signUpTab')]].map(([k, t]) => <button type="button" role="tab" key={k} className="chip" aria-selected={mode === k} aria-pressed={mode === k} onClick={() => { setMode(k); setMsg(null); }}>{t}</button>)}
      </div>
      <h3>{mode === 'in' ? u('signInTitle') : u('signUpTitle')}</h3>
      <p className="muted">{u('authHelp')}</p>
      {comm.ready && !comm.enabled ? <p className="fb info">{u('serverSoon')}</p> : null}
      {mode === 'up' ? <label className="fld"><span>{u('yourName')}</span><input required value={f.name} onChange={set('name')} maxLength={60} autoComplete="name" /></label> : null}
      <label className="fld"><span>{u('email')}</span><input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
      <label className="fld"><span>{u('password')}</span><input type="password" required minLength={mode === 'up' ? 8 : 1} maxLength={72} value={f.password} onChange={set('password')} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} />{mode === 'up' ? <small className="muted">{u('pwHelp')}</small> : null}</label>
      {mode === 'up' ? (
        <fieldset className="fld roles"><legend>{u('iAm')}</legend>
          {[['student', u('roleStudent')], ['teacher', u('roleTeacher')]].map(([k, t]) => (
            <label key={k} className={`roleOpt${f.role === k ? ' on' : ''}`}><input type="radio" name="role" value={k} checked={f.role === k} onChange={set('role')} />{t}</label>
          ))}
        </fieldset>
      ) : null}
      {mode === 'up' && f.role === 'teacher' ? <label className="fld"><span>{u('teacherCode')}</span><input required value={f.teacherCode} onChange={set('teacherCode')} autoComplete="off" /><small className="muted">{u('teacherCodeHelp')}</small></label> : null}
      <div className="row"><button className="btn" type="submit" disabled={busy}>{mode === 'in' ? u('signInBtn') : u('createAcct')}</button></div>
      {msg ? <p className={`fb ${msg[0]}`} role="status">{msg[1]}</p> : null}
      <p className="muted" style={{ fontSize: 13.5 }}>{mode === 'in' ? u('noAcct') : u('haveAcct')} <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null); }}>{mode === 'in' ? u('signUpTab') : u('signInTab')}</button></p>
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

function AssignmentDetail({ id, onBack }) {
  const { u, lang } = useT(); const { update } = useLab(); const comm = useCommunity(); const ago = useAgo();
  const [a, setA] = useState(null); const [err, setErr] = useState(''); const [note, setNote] = useState(''); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [armed, setArmed] = useState(false);
  const load = async () => { try { const d = await comm.getAssignment(id); setA(d); setNote(d.my_enrollment?.note || ''); setErr(''); } catch (e) { setErr(errText(e, u)); } };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (fn) => { setBusy(true); const e = await fn(); setBusy(false); if (e) setErr(errText(e, u)); else load(); };
  const comment = async (e) => { e.preventDefault(); if (!text.trim()) return; setBusy(true); try { await comm.addComment(id, text.trim()); setText(''); await load(); } catch (x) { setErr(errText(x, u)); } setBusy(false); };
  const delC = async (cid) => { try { await comm.delComment(cid); load(); } catch (x) { setErr(errText(x, u)); } };
  if (!a) return <div className="card"><button type="button" className="link" onClick={onBack}>← {u('back')}</button>{err ? <p className="fb bad">{err}</p> : <div className="empty">…</div>}</div>;
  const mine = a.my_enrollment; const isAuthor = a.created_by === comm.uid;
  return (
    <div className="card adetail">
      <button type="button" className="link" style={{ justifySelf: 'start' }} onClick={onBack}>← {u('back')}</button>
      <div>
        <h3 style={{ fontSize: 22 }}>{a.title}</h3>
        <p className="muted">{[a.teacher_name ? `${u('by')} ${a.teacher_name}` : '', a.due ? `${u('due')}: ${a.due}` : '', ago(a.created_at)].filter(Boolean).join(' · ')}</p>
      </div>
      {a.prac ? <div className="row"><span className="badgeN">{String(a.prac).padStart(2, '0')}</span><b>{pracTitle(a.prac, lang)}</b>{LABS[a.prac] ? <button type="button" className="btn sm ghost" onClick={() => update((n) => { n.cur = a.prac; n.sec = 2; n.view = 'lab'; }, true)}>{u('open')}</button> : null}</div> : null}
      {a.description ? <p className="adesc">{a.description}</p> : null}
      {!comm.teacher ? (
        <div className="enrollBox">
          {!mine ? <button type="button" className="btn" disabled={busy} onClick={() => act(() => comm.enroll(id))}>{u('enroll')}</button> : (
            <>
              <div className="row"><span className={`stTag${mine.status === 'completed' ? ' done' : ''}`}>{mine.status === 'completed' ? u('stCompleted') : u('stEnrolled')}</span>{mine.completed_at ? <span className="muted">{ago(mine.completed_at)}</span> : null}</div>
              <textarea aria-label={u('doneNote')} placeholder={u('doneNote')} maxLength={1000} style={{ minHeight: 60 }} value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="row">
                {mine.status === 'completed'
                  ? <button type="button" className="btn ghost sm" disabled={busy} onClick={() => act(() => comm.complete(id, note, false))}>{u('undoDone')}</button>
                  : <button type="button" className="btn" disabled={busy} onClick={() => act(() => comm.complete(id, note, true))}>{u('markDone')}</button>}
                {mine.status !== 'completed' ? <button type="button" className="btn ghost sm" disabled={busy} onClick={() => act(() => comm.leave(id))}>{u('leaveA')}</button> : null}
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="rowh"><h3>{u('studentsList')}</h3>{isAuthor ? <button type="button" className="btn sm ghost" onClick={async () => { if (!armed) { setArmed(true); return; } const e = await comm.delAssignment(id); if (e) setErr(errText(e, u)); else { comm.setFocus(null); onBack(); } }}>{armed ? u('confirm') : u('del')}</button> : null}</div>
          {a.enrollments && a.enrollments.length ? (
            <div className="tbl-wrap"><table><thead><tr><th>{u('student')}</th><th>{u('colStatus')}</th><th>{u('colNote')}</th></tr></thead><tbody>
              {a.enrollments.map((e) => <tr key={e.student_id}><td className="lab">{e.student_name || u('someone')}</td><td><span className={`stTag${e.status === 'completed' ? ' done' : ''}`}>{e.status === 'completed' ? u('stCompleted') : u('stEnrolled')}</span></td><td style={{ fontFamily: 'var(--f-body)', textAlign: 'left' }}>{e.note}</td></tr>)}
            </tbody></table></div>
          ) : <div className="empty">{u('noEnrolled')}</div>}
        </div>
      )}
      <div>
        <h3>{u('comments')} <span className="muted mono">{a.comments.length}</span></h3>
        {a.comments.length ? a.comments.map((c) => (
          <div className="post" key={c.id}>
            <Avatar id={c.author} name={c.author_name} size={34} />
            <div>
              <div className="meta"><b>{c.author === comm.uid ? u('you') : c.author_name || u('someone')}</b>{c.author_role === 'teacher' ? <span className="tagT">{u('teacher')}</span> : null}<span className="muted">{ago(c.created_at)}</span></div>
              <div className="txt">{c.body}</div>
              {c.author === comm.uid || comm.teacher ? <div className="acts"><button type="button" onClick={() => delC(c.id)}>{u('del')}</button></div> : null}
            </div>
          </div>
        )) : <div className="empty">{u('noComments')}</div>}
        <form className="compose" onSubmit={comment}>
          <textarea aria-label={u('commentPh')} placeholder={u('commentPh')} maxLength={1000} style={{ minHeight: 60 }} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row"><button type="submit" className="btn sm" disabled={busy}>{u('send')}</button></div>
        </form>
      </div>
      {err ? <p className="fb bad">{err}</p> : null}
    </div>
  );
}

function Assignments() {
  const { u, lang } = useT(); const comm = useCommunity();
  const blank = { title: '', prac: '', due: '', description: '' };
  const [f, setF] = useState(blank); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault(); if (!f.title.trim()) return; setBusy(true);
    const x = await comm.addAssignment({ title: f.title.trim(), prac: f.prac ? +f.prac : null, due: f.due || null, description: f.description.trim() });
    setBusy(false); if (x) setErr(errText(x, u)); else { setF(blank); setErr(''); }
  };
  if (comm.focus) return <AssignmentDetail id={comm.focus} onBack={() => comm.setFocus(null)} />;
  return (
    <div className="card">
      {comm.teacher ? (
        <form className="compose" onSubmit={add}>
          <h3>{u('newAssign')}</h3>
          <label className="fld"><span>{u('aTitle')}</span><input required maxLength={120} value={f.title} onChange={set('title')} /></label>
          <div className="row">
            <label className="fld"><span>{u('aPrac')}</span><select value={f.prac} onChange={set('prac')}><option value="">{u('none')}</option>{PRAC.filter((p) => /^\d+$/.test(p[0])).map((p) => <option key={p[0]} value={p[0]}>{pracTag(p[0], u)} · {lang === 'si' ? p[2] : p[3]}</option>)}</select></label>
            <label className="fld"><span>{u('due')}</span><input type="date" className="date" value={f.due} onChange={set('due')} /></label>
          </div>
          <label className="fld"><span>{u('aDesc')}</span><textarea maxLength={2000} style={{ minHeight: 72 }} value={f.description} onChange={set('description')} /></label>
          <div className="row"><button type="submit" className="btn" disabled={busy}>{u('publish')}</button></div>
          {err ? <p className="fb bad">{err}</p> : null}
        </form>
      ) : null}
      {comm.assignments.length ? comm.assignments.map((a) => <AssignmentRow key={a.id} a={a} />) : <div className="empty">{u('noAssign')}</div>}
    </div>
  );
}

export default function Community() {
  const { u } = useT(); const comm = useCommunity();
  const [sub, setSub] = useState(comm.focus ? 'assign' : 'discuss');
  useEffect(() => { if (comm.focus) setSub('assign'); }, [comm.focus]);
  const [nm, setNm] = useState('');
  const tabs = [['discuss', u('discuss')], ['results', u('classResults')], ['progress', u('classProg')], ['assign', u('assignments')]];
  let body;
  if (!comm.uid) body = <AuthCard />;
  else if (!comm.enabled) body = <div className="empty">{u('noBackend')}</div>;
  else body = sub === 'discuss' ? <Discussion /> : sub === 'results' ? <ClassResults /> : sub === 'progress' ? <ClassProgress /> : <Assignments />;
  const needName = comm.uid && comm.me && !comm.me.name;
  return (
    <div className="comm-page">
      <div className="rowh">
        <h2 className="sec-h">{u('navComm')}</h2>
        {comm.uid ? <span className="row"><span className="muted">{comm.me?.name || comm.me?.email}{comm.teacher ? ` · ${u('teacher')}` : ''}</span><button type="button" className="link" onClick={comm.signOut}>{u('signOut')}</button></span> : null}
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
