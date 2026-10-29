import { useEffect, useMemo, useState } from 'react';
import { useT } from '../lib/i18n.jsx';
import { useLab } from '../lib/labStore.jsx';
import { useCommunity } from '../lib/community.jsx';
import { LABS, PRAC } from '../data/content.js';
import { progress } from '../lib/calc.js';
import { fmtDate } from '../lib/dates.js';
import { Avatar, LangSwitch, ThemeSwitch } from './UserMenu.jsx';
import { useNotifications } from '../lib/notifications.js';
import Tick from './Tick.jsx';
import { useConfirm } from './Confirm.jsx';
import { usePaged } from './Pager.jsx';
import { TeacherPicker } from './Community.jsx';
import { pTitle } from '../lib/ptitle.js';

const pracName = (id, lang) => { const p = PRAC.find((x) => x[0] === String(id)); return p ? pTitle(p, lang) : ''; };

function useAgo() {
  const { lang, u } = useT();
  return (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return u('justNow');
    const m = s / 60, h = m / 60, d = h / 24;
    const TA = { d: 'நாள்', h: 'மணி', m: 'நிமிடம்' };
    const f = (n, a, b) => (lang === 'si' ? `${Math.floor(n)} ${a}කට පෙර` : lang === 'ta' ? `${Math.floor(n)} ${TA[b]} முன்` : `${Math.floor(n)}${b} ago`);
    return d >= 1 ? f(d, 'දින', 'd') : h >= 1 ? f(h, 'පැය', 'h') : f(m, 'මිනිත්තු', 'm');
  };
}

function Tile({ k, v, sub, tone, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`ptile${tone ? ` ${tone}` : ''}${onClick ? ' click' : ''}`} onClick={onClick}>
      <span className="pk">{k}</span><b className="pv">{v}</b>{sub ? <span className="ps">{sub}</span> : null}
    </Tag>
  );
}

export default function Profile({ go }) {
  const { u, lang } = useT();
  const { st, update } = useLab();
  const comm = useCommunity();
  const ago = useAgo();
  const notif = useNotifications();
  const confirm = useConfirm();
  const [name, setName] = useState(comm.me?.name || '');
  const [edit, setEdit] = useState(false);
  const [saveState, setSaveState] = useState(null);
  const signedIn = !!comm.uid;

  // practicals (saved on this device, same numbers as the status strip)
  const open = Object.keys(LABS);
  const done = open.filter((id) => progress(st, +id) >= 0.999).length;
  const started = open.filter((id) => { const p = progress(st, +id); return p > 0 && p < 0.999; }).length;
  const openLab = (id) => { update((n) => { n.cur = +id; n.sec = 0; n.view = 'lab'; }, true); go('lab'); };

  // assignments
  const A = comm.assignments;
  const stats = comm.teacher
    ? { mine: A.filter((a) => a.created_by === comm.uid), get enrolled() { return this.mine.reduce((s, a) => s + (a.enrolled_count || 0), 0); }, get completed() { return this.mine.reduce((s, a) => s + (a.completed_count || 0), 0); } }
    : { completed: A.filter((a) => a.my_status === 'completed'), pending: A.filter((a) => a.my_status === 'enrolled'), open: A.filter((a) => !a.my_status) };

  // posts and replies
  const myPosts = comm.posts.filter((p) => p.author === comm.uid && !p.parent);
  const repliesTo = (id) => comm.posts.filter((x) => x.parent === id && x.author !== comm.uid);
  const replyCount = myPosts.reduce((s, p) => s + repliesTo(p.id).length, 0);
  const members = new Set([...comm.posts.map((p) => p.author), ...comm.classProgress.map((r) => r.user_id)]).size;

  const asgList = comm.teacher ? (stats.mine || []) : [...(stats.pending || []), ...(stats.open || []), ...(stats.completed || [])];
  const [asgPage, asgPager] = usePaged(asgList);
  const [notifPage, notifPager] = usePaged(notif.list);
  const [postPage, postPager] = usePaged(myPosts);
  const [pracPage, pracPager] = usePaged(open);
  const myStudents = comm.teacher ? comm.classProgress.filter((r) => r.user_id !== comm.uid) : [];
  const [stuPage, stuPager] = usePaged(myStudents);

  // student's teacher
  const [teachers, setTeachers] = useState(null);
  const [tPick, setTPick] = useState(comm.me?.teacher_id || '');
  const [tState, setTState] = useState(null);
  useEffect(() => { if (signedIn && !comm.teacher && teachers === null) comm.listTeachers().then(setTeachers); }, [signedIn, comm.teacher]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setTPick(comm.me?.teacher_id || ''); }, [comm.me?.teacher_id]);
  const saveTeacher = async () => {
    const t = (teachers || []).find((x) => x.id === tPick);
    if (!(await confirm({ title: u('cfTeacherT'), message: u('cfTeacherM'), quote: t ? t.name : u('chooseLater'), ok: u('changeTeacher') }))) return;
    setTState('busy'); const err = await comm.setTeacher(tPick || null); setTState(err ? 'err' : 'ok');
  };

  const toPost = (postId) => { comm.setFocusPost(postId); go('comm'); };
  const toAssign = (aid) => { comm.setFocus(aid); go('comm'); };
  const saveName = async (e) => {
    e.preventDefault(); if (!name.trim()) return;
    if (!(await confirm({ title: u('cfNameT'), quote: name.trim(), ok: u('saveName') }))) return; setSaveState('busy');
    const err = await comm.rename(name.trim().slice(0, 60)); setSaveState(err ? 'err' : 'ok'); if (!err) setEdit(false);
  };
  const dueIn = (due) => {
    const days = Math.ceil((new Date(`${due}T23:59:59`).getTime() - Date.now()) / 86400000);
    if (days <= 0) return u('dueToday');
    return lang === 'si' ? `තව දින ${days}යි` : lang === 'ta' ? `இன்னும் ${days} நாள்` : `Due in ${days} day${days === 1 ? '' : 's'}`;
  };
  const nText = (n) => {
    if (n.kind === 'reply') return <><b>{n.who || u('someone')}</b> {u('nReplied')} <q>{n.about.slice(0, 60)}{n.about.length > 60 ? '…' : ''}</q></>;
    if (n.kind === 'due') return <>{u('nDue')} <b>{n.title}</b> · {fmtDate(n.due, lang)}</>;
    if (n.kind === 'new') return <>{u('nNew')} <b>{n.title}</b>{n.who ? ` · ${u('by')} ${n.who}` : ''}</>;
    return <><b>{n.n}/{n.m}</b> {u('nCompleted')} <b>{n.title}</b></>;
  };
  const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
  const nIcon = {
    reply: I(<path d="M4 5h16v11H9l-5 4Z" />),
    due: I(<><circle cx="12" cy="13" r="7" /><path d="M12 9v4l2.5 2M9 3h6" /></>),
    new: I(<><path d="M5 4h14v16l-7-4-7 4Z" /></>),
    completions: I(<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
  };

  return (
    <div className="pf">
      {/* header */}
      <section className="card pf-head">
        <Avatar name={comm.me?.name || comm.me?.email} size={72} signedIn={signedIn} />
        <div className="pf-id">
          {signedIn ? (
            edit ? (
              <form className="row pf-edit" onSubmit={saveName}>
                <label className="fld" style={{ flex: 1 }}><span>{u('yourName')}</span><input id="pfName" value={name} maxLength={60} required autoFocus onChange={(e) => setName(e.target.value)} /></label>
                <button type="submit" className="btn sm" disabled={saveState === 'busy'} aria-busy={saveState === 'busy'}>{u('saveName')}</button>
                <button type="button" className="btn ghost sm" onClick={() => { setEdit(false); setName(comm.me?.name || ''); }}>{u('cancel')}</button>
              </form>
            ) : (
              <>
                <h2 className="sec-h pf-name">{comm.me?.name || '—'}</h2>
                <div className="muted pf-mail">{comm.me?.email}</div>
                <div className="row" style={{ gap: 8 }}>
                  <span className={comm.teacher ? 'tagT' : 'stTag'}>{comm.teacher ? u('roleTeacher') : u('roleStudent')}</span>
                  <button type="button" className="link" onClick={() => { setEdit(true); setSaveState(null); setName(comm.me?.name || ''); }}>{u('editName')}</button>
                </div>
              </>
            )
          ) : (
            <>
              <h2 className="sec-h pf-name">{u('notSignedIn')}</h2>
              <p className="muted" style={{ margin: 0 }}>{u('pfSignedOut')}</p>
              <div className="row"><button type="button" className="btn sm" onClick={() => { comm.setAuthMode('in'); go('comm'); }}>{u('signInTab')}</button><button type="button" className="btn ghost sm" onClick={() => { comm.setAuthMode('up'); go('comm'); }}>{u('signUpTab')}</button></div>
            </>
          )}
          {saveState === 'ok' ? <p className="fb good" role="status">{u('profileSaved')}</p> : saveState === 'err' ? <p className="fb bad" role="status">{u('postErr')}</p> : null}
        </div>
        <div className="pf-side">
          <LangSwitch />
          <ThemeSwitch />
          {signedIn ? <button type="button" className="btn ghost sm" onClick={async () => { if (await confirm({ title: u('cfSignOutT'), message: u('cfSignOutM'), ok: u('signOut'), danger: true })) { comm.signOut(); go('home'); } }}>{u('signOut')}</button> : null}
        </div>
      </section>

      {/* summary tiles */}
      <section className="ptiles" aria-label={u('pfSummary')}>
        <Tile k={u('pfPracDone')} v={`${done}/42`} sub={`${started} ${u('pfInProgress')}`} tone="acc" onClick={() => go('list')} />
        {signedIn && !comm.teacher ? <>
          <Tile k={u('pfAsgDone')} v={stats.completed.length} sub={u('stCompleted')} tone="good" onClick={() => go('comm')} />
          <Tile k={u('pfAsgPending')} v={stats.pending.length} sub={u('pfEnrolledNotDone')} tone="warn" onClick={() => go('comm')} />
          <Tile k={u('pfAsgOpen')} v={stats.open.length} sub={u('pfNotEnrolled')} onClick={() => go('comm')} />
        </> : null}
        {signedIn && comm.teacher ? <>
          <Tile k={u('pfPublished')} v={stats.mine.length} sub={u('assignments')} tone="good" onClick={() => go('comm')} />
          <Tile k={u('pfEnrolments')} v={stats.enrolled} sub={u('pfAcross')} onClick={() => go('comm')} />
          <Tile k={u('pfCompletions')} v={stats.completed} sub={`${Math.max(0, stats.enrolled - stats.completed)} ${u('pfAwaiting')}`} tone="warn" onClick={() => go('comm')} />
        </> : null}
        {signedIn ? <Tile k={u('pfNotif')} v={notif.unread} sub={u('pfUnread')} tone={notif.unread ? 'acc' : ''} /> : null}
      </section>

      <div className="pf-grid">
        <div className="pf-col">
          {/* practical progress */}
          <section className="card">
            <h3>{u('pfMyPrac')}</h3>
            <div className="pf-list">
              {pracPage.map((id) => { const p = Math.round(progress(st, +id) * 100); return (
                <button type="button" key={id} className="pf-prac" onClick={() => openLab(id)}>
                  <span className="badgeN">{String(id).padStart(2, '0')}</span>
                  <span className="pf-pn">{pracName(id, lang)}<span className="pf-bar"><i style={{ width: `${Math.max(2, p)}%` }} /></span></span>
                  {p >= 100 ? <Tick label={u('stCompleted')} /> : <b className="pf-pc">{p}%</b>}
                </button>
              ); })}
            </div>
            {pracPager}
          </section>

          {/* my teacher (students) / my students (teachers) */}
          {signedIn && !comm.teacher ? (
            <section className="card">
              <h3>{u('myTeacher')}</h3>
              {comm.me?.teacher_id
                ? <div className="pf-teacher"><Avatar name={comm.me.teacher_name} size={40} /><div><b>{comm.me.teacher_name || '—'}</b><small className="muted">{u('roleTeacher')}</small></div></div>
                : <p className="muted" style={{ margin: 0 }}>{u('noTeacherSet')}</p>}
              <div className="row pf-tpick">
                <TeacherPicker id="pfTeacher" teachers={teachers} value={tPick} onChange={(v) => { setTPick(v); setTState(null); }} />
                <button type="button" className="btn sm" disabled={tState === 'busy' || (tPick || '') === (comm.me?.teacher_id || '')} aria-busy={tState === 'busy'} onClick={saveTeacher}>{u('changeTeacher')}</button>
              </div>
              {tState === 'ok' ? <p className="fb good" role="status">{u('teacherSaved')}</p> : tState === 'err' ? <p className="fb bad" role="status">{u('postErr')}</p> : null}
            </section>
          ) : null}
          {signedIn && comm.teacher ? (
            <section className="card">
              <h3>{u('myStudents')} <span className="cnt">{myStudents.length}</span></h3>
              {!myStudents.length ? <div className="empty">{u('noMembers')}</div> : (
                <div className="pf-list">
                  {stuPage.map((r) => { const vals = Object.values(r.prog || {}); const avgP = vals.length ? Math.round(vals.reduce((x, y) => x + (+y || 0), 0) / vals.length) : 0; return (
                    <div key={r.user_id} className="pf-row" style={{ cursor: 'default' }}>
                      <span className="pf-rt"><b>{r.name || u('someone')}</b><small>{u('lastActive')}: {ago(r.updated_at)}</small></span>
                      <span className="stTag">{avgP}%</span>
                    </div>
                  ); })}
                </div>
              )}
              {stuPager}
            </section>
          ) : null}

          {/* assignments */}
          {signedIn ? (
            <section className="card">
              <h3>{u('assignments')}</h3>
              {!A.length ? <div className="empty">{u('noAssign')}</div> : (
                <div className="pf-list">
                  {asgPage.map((a) => (
                    <button type="button" key={a.id} className="pf-row" onClick={() => toAssign(a.id)}>
                      <span className="pf-rt"><b>{a.title}</b><small>{[a.prac ? `P${String(a.prac).padStart(2, '0')}` : '', a.due ? `${u('due')}: ${fmtDate(a.due, lang)}` : ''].filter(Boolean).join(' · ')}</small></span>
                      {comm.teacher
                        ? <span className="stTag">{a.completed_count || 0}/{a.enrolled_count || 0} {u('completedN')}</span>
                        : <span className={`stTag${a.my_status === 'completed' ? ' done' : a.my_status ? ' pend' : ''}`}>{a.my_status === 'completed' ? u('stCompleted') : a.my_status ? u('stEnrolled') : u('pfOpen')}</span>}
                    </button>
                  ))}
                </div>
              )}
              {asgPager}
            </section>
          ) : null}
        </div>

        <div className="pf-col">
          {/* notifications */}
          {signedIn ? (
            <section className="card">
              <div className="rowh"><h3>{u('pfNotif')} {notif.unread ? <span className="cnt acc">{notif.unread}</span> : null}</h3>{notif.unread ? <button type="button" className="link" onClick={async () => { if (await confirm({ title: u('cfReadT'), ok: u('pfMarkRead') })) notif.markRead(); }}>{u('pfMarkRead')}</button> : null}</div>
              {!notif.list.length ? <div className="empty">{u('pfNoNotif')}</div> : (
                <div className="pf-list">
                  {notifPage.map((n) => (
                    <button type="button" key={n.id} className={`pf-notif${!notif.seen || n.at > notif.seen ? ' unread' : ''}`} onClick={() => (n.postId ? toPost(n.postId) : toAssign(n.aid))}>
                      <span className={`pf-ni k-${n.kind}`} aria-hidden="true">{nIcon[n.kind]}</span>
                      <span className="pf-nt"><span>{nText(n)}</span><small>{n.kind === 'due' ? dueIn(n.due) : ago(n.at)}</small></span>
                    </button>
                  ))}
                </div>
              )}
              {notifPager}
            </section>
          ) : null}

          {/* responses to my posts */}
          {signedIn ? (
            <section className="card">
              <h3>{u('pfResponses')} <span className="cnt">{replyCount}</span></h3>
              {!myPosts.length ? <div className="empty">{u('pfNoPosts')} <button type="button" className="link" onClick={() => go('comm')}>{u('toComm')}</button></div> : (
                <div className="pf-list">
                  {postPage.map((p) => { const r = repliesTo(p.id); const last = r[r.length - 1]; return (
                    <button type="button" key={p.id} className="pf-row" onClick={() => toPost(p.id)}>
                      <span className="pf-rt"><b>{p.body.length > 70 ? `${p.body.slice(0, 70)}…` : p.body}</b>
                        <small>{last ? <>{last.author_name || u('someone')}: “{last.body.slice(0, 50)}{last.body.length > 50 ? '…' : ''}”</> : ago(p.created_at)}</small></span>
                      <span className={`stTag${r.length ? ' done' : ''}`}>{r.length} {r.length === 1 ? u('pfReply') : u('pfReplies')}</span>
                    </button>
                  ); })}
                </div>
              )}
              {postPager}
            </section>
          ) : null}

          {/* class */}
          {signedIn ? (
            <section className="card">
              <h3>{u('pfClass')}</h3>
              <div className="pf-class">
                <div><b>{A.length}</b><span>{u('pfClassAsg')}</span></div>
                <div><b>{comm.posts.filter((p) => !p.parent).length}</b><span>{u('pfClassPosts')}</span></div>
                <div><b>{members}</b><span>{u('pfClassMembers')}</span></div>
              </div>
              <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => go('comm')}>{u('toComm')}</button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
