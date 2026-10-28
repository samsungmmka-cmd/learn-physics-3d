// Learn Physics API: one Vercel serverless function that routes every /api/* request.
// Auth uses Supabase Auth (email + password). Every data request runs AS the signed-in user
// (their access token), so the database's row-level security decides what they may do.
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPTS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/* ---------- helpers ---------- */
class HttpError extends Error { constructor(status, code, detail) { super(detail || code); this.status = status; this.code = code; this.detail = detail; } }
const bad = (detail) => new HttpError(400, 'invalid', detail);
const anonClient = () => createClient(SB_URL, SB_KEY, OPTS);
const userClient = (token) => createClient(SB_URL, SB_KEY, { ...OPTS, global: { headers: { Authorization: `Bearer ${token}` } } });
const isUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const isDate = (s) => s == null || s === '' || (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s));
const isPrac = (n, min = 1) => Number.isInteger(n) && n >= min && n <= 42;
const str = (v, max, min = 0, field = 'text') => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min || s.length > max) throw bad(`${field} must be ${min}–${max} characters`);
  return s;
};
function dbFail(e) {
  const m = e?.message || '';
  if (e?.code === '42501' || /row-level security|permission denied/i.test(m)) return new HttpError(403, 'forbidden', 'You do not have permission to do that');
  if (e?.code === '23505') return new HttpError(409, 'conflict', 'Already exists');
  if (['23514', '22P02', '23503', '22023'].includes(e?.code)) return new HttpError(400, 'invalid', m);
  return new HttpError(500, 'server_error', m);
}
const must = ({ data, error }) => { if (error) throw dbFail(error); return data; };
function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { throw bad('Body must be JSON'); } }
  return req.body;
}
const sessionOut = (s) => (s ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at } : null);

async function requireUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new HttpError(401, 'unauthorized', 'Sign in first');
  const sb = userClient(token);
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'unauthorized', 'Session expired. Sign in again.');
  const prof = must(await sb.from('profiles').select('id,name,role').eq('id', data.user.id).maybeSingle());
  return { sb, user: data.user, me: { id: data.user.id, email: data.user.email, name: prof?.name || '', role: prof?.role || 'student' } };
}
async function namesFor(sb, ids) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  const rows = must(await sb.from('profiles').select('id,name,role').in('id', uniq));
  return Object.fromEntries(rows.map((r) => [r.id, { name: r.name, role: r.role }]));
}
const withAuthor = (rows, names, key = 'author') => rows.map((r) => ({ ...r, author_name: names[r[key]]?.name || '', author_role: names[r[key]]?.role || 'student' }));
const teacherOnly = (me) => { if (me.role !== 'teacher') throw new HttpError(403, 'forbidden', 'Teachers only'); };
const studentOnly = (me) => { if (me.role !== 'student') throw new HttpError(403, 'forbidden', 'Students only'); };

/* ---------- auth ---------- */
async function signup(req) {
  const b = readBody(req);
  const email = str(b.email, 200, 3, 'email').toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw bad('Enter a valid email address');
  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < 8 || password.length > 72) throw bad('Password must be 8–72 characters');
  const name = str(b.name, 60, 1, 'name');
  const role = b.role === 'teacher' ? 'teacher' : 'student';
  const sb = anonClient();
  if (role === 'teacher') {
    const ok = must(await sb.rpc('check_teacher_code', { code: String(b.teacherCode || '') }));
    if (!ok) throw new HttpError(400, 'wrong_teacher_code', 'That teacher code is not correct');
  }
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name, role, teacher_code: role === 'teacher' ? String(b.teacherCode) : undefined } } });
  if (error) throw new HttpError(error.status === 422 || /registered/i.test(error.message) ? 409 : 400, 'signup_failed', error.message);
  if (!data.session) return [201, { needsConfirmation: true }];
  return [201, { session: sessionOut(data.session), user: { id: data.user.id, email, name, role } }];
}
async function login(req) {
  const b = readBody(req);
  const email = str(b.email, 200, 3, 'email').toLowerCase();
  const sb = anonClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password: String(b.password || '') });
  if (error) throw new HttpError(401, /confirm/i.test(error.message) ? 'email_not_confirmed' : 'invalid_login', /confirm/i.test(error.message) ? 'Confirm your email first, then sign in' : 'Email or password is incorrect');
  const prof = must(await userClient(data.session.access_token).from('profiles').select('name,role').eq('id', data.user.id).maybeSingle());
  return [200, { session: sessionOut(data.session), user: { id: data.user.id, email: data.user.email, name: prof?.name || '', role: prof?.role || 'student' } }];
}
async function refresh(req) {
  const b = readBody(req);
  if (!b.refresh_token) throw bad('refresh_token is required');
  const { data, error } = await anonClient().auth.refreshSession({ refresh_token: String(b.refresh_token) });
  if (error || !data.session) throw new HttpError(401, 'unauthorized', 'Session expired. Sign in again.');
  return [200, { session: sessionOut(data.session) }];
}

/* ---------- assignments ---------- */
async function listAssignments(req) {
  const { sb, me } = await requireUser(req);
  const rows = must(await sb.from('assignments').select('id,title,prac,description,due,created_by,created_at').order('created_at', { ascending: false }).limit(200));
  const enr = must(await sb.from('enrollments').select('assignment_id,student_id,status'));
  const names = await namesFor(sb, rows.map((r) => r.created_by));
  return [200, { assignments: rows.map((a) => {
    const es = enr.filter((e) => e.assignment_id === a.id); const mine = es.find((e) => e.student_id === me.id);
    return { ...a, teacher_name: names[a.created_by]?.name || '', my_status: mine ? mine.status : null,
      enrolled_count: me.role === 'teacher' ? es.length : undefined, completed_count: me.role === 'teacher' ? es.filter((e) => e.status === 'completed').length : undefined };
  }) }];
}
function assignmentFields(b, partial) {
  const out = {};
  if (!partial || b.title !== undefined) out.title = str(b.title, 120, 1, 'title');
  if (!partial || b.description !== undefined) out.description = str(b.description ?? '', 2000, 0, 'description');
  if (!partial || b.prac !== undefined) { const p = b.prac === null || b.prac === '' || b.prac === undefined ? null : Number(b.prac); if (p !== null && !isPrac(p)) throw bad('prac must be 1–42'); out.prac = p; }
  if (!partial || b.due !== undefined) { if (!isDate(b.due)) throw bad('due must be YYYY-MM-DD'); out.due = b.due || null; }
  return out;
}
async function createAssignment(req) {
  const { sb, me } = await requireUser(req); teacherOnly(me);
  const row = must(await sb.from('assignments').insert({ ...assignmentFields(readBody(req), false), created_by: me.id }).select().single());
  return [201, row];
}
async function getAssignment(req, id) {
  const { sb, me } = await requireUser(req);
  const a = must(await sb.from('assignments').select('id,title,prac,description,due,created_by,created_at').eq('id', id).maybeSingle());
  if (!a) throw new HttpError(404, 'not_found', 'Assignment not found');
  const comments = must(await sb.from('assignment_comments').select('id,author,body,created_at').eq('assignment_id', id).order('created_at'));
  const enr = must(await sb.from('enrollments').select('student_id,status,note,enrolled_at,completed_at').eq('assignment_id', id));
  const names = await namesFor(sb, [a.created_by, ...comments.map((c) => c.author), ...enr.map((e) => e.student_id)]);
  const mine = enr.find((e) => e.student_id === me.id) || null;
  return [200, { ...a, teacher_name: names[a.created_by]?.name || '', my_enrollment: mine, comments: withAuthor(comments, names),
    enrollments: me.role === 'teacher' ? enr.map((e) => ({ ...e, student_name: names[e.student_id]?.name || '' })) : undefined }];
}
async function updateAssignment(req, id) {
  const { sb, me } = await requireUser(req); teacherOnly(me);
  const rows = must(await sb.from('assignments').update(assignmentFields(readBody(req), true)).eq('id', id).select());
  if (!rows.length) throw new HttpError(403, 'forbidden', 'Only the teacher who published it can edit this assignment');
  return [200, rows[0]];
}
async function deleteAssignment(req, id) {
  const { sb, me } = await requireUser(req); teacherOnly(me);
  const rows = must(await sb.from('assignments').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(403, 'forbidden', 'Only the teacher who published it can delete this assignment');
  return [204, null];
}
async function enroll(req, id) {
  const { sb, me } = await requireUser(req); studentOnly(me);
  const row = must(await sb.from('enrollments').upsert({ assignment_id: id, student_id: me.id }, { onConflict: 'assignment_id,student_id', ignoreDuplicates: true }).select());
  const cur = row[0] || must(await sb.from('enrollments').select('*').eq('assignment_id', id).eq('student_id', me.id).single());
  return [200, cur];
}
async function leave(req, id) {
  const { sb, me } = await requireUser(req); studentOnly(me);
  must(await sb.from('enrollments').delete().eq('assignment_id', id).eq('student_id', me.id));
  return [204, null];
}
async function complete(req, id) {
  const { sb, me } = await requireUser(req); studentOnly(me);
  const b = readBody(req); const note = str(b.note ?? '', 1000, 0, 'note');
  const done = b.done !== false;
  const rows = must(await sb.from('enrollments').update({ status: done ? 'completed' : 'enrolled', note, completed_at: done ? new Date().toISOString() : null }).eq('assignment_id', id).eq('student_id', me.id).select());
  if (!rows.length) throw new HttpError(409, 'not_enrolled', 'Enroll in this assignment first');
  return [200, rows[0]];
}
async function addComment(req, id) {
  const { sb, me } = await requireUser(req);
  const body = str(readBody(req).body, 1000, 1, 'comment');
  const row = must(await sb.from('assignment_comments').insert({ assignment_id: id, author: me.id, body }).select().single());
  return [201, { ...row, author_name: me.name, author_role: me.role }];
}
async function deleteComment(req, id) {
  const { sb } = await requireUser(req);
  const rows = must(await sb.from('assignment_comments').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(403, 'forbidden', 'You can only delete your own comments');
  return [204, null];
}

/* ---------- community posts ---------- */
async function listPosts(req) {
  const { sb } = await requireUser(req);
  const q = req.query || {};
  let query = sb.from('posts').select('id,author,prac,body,parent,created_at').order('created_at', { ascending: false }).limit(Math.min(300, Number(q.limit) || 200));
  if (q.prac !== undefined && q.prac !== '') { const p = Number(q.prac); if (!isPrac(p, 0)) throw bad('prac must be 0–42'); query = query.eq('prac', p); }
  const rows = must(await query);
  return [200, { posts: withAuthor(rows, await namesFor(sb, rows.map((r) => r.author))) }];
}
async function createPost(req) {
  const { sb, me } = await requireUser(req);
  const b = readBody(req);
  const body = str(b.body, 2000, 1, 'post');
  const prac = b.prac === undefined ? 0 : Number(b.prac); if (!isPrac(prac, 0)) throw bad('prac must be 0–42');
  if (b.parent != null && !isUuid(b.parent)) throw bad('parent must be a post id');
  const row = must(await sb.from('posts').insert({ body, prac, parent: b.parent || null, author: me.id }).select().single());
  return [201, { ...row, author_name: me.name, author_role: me.role }];
}
async function deletePost(req, id) {
  const { sb } = await requireUser(req);
  const rows = must(await sb.from('posts').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(403, 'forbidden', 'You can only delete your own posts');
  return [204, null];
}

/* ---------- results & progress ---------- */
async function listResults(req) {
  const { sb } = await requireUser(req);
  let q = sb.from('results').select('user_id,prac,vals,updated_at');
  if (req.query?.prac) { const p = Number(req.query.prac); if (!isPrac(p)) throw bad('prac must be 1–42'); q = q.eq('prac', p); }
  return [200, { results: must(await q) }];
}
async function putResult(req) {
  const { sb, me } = await requireUser(req);
  const b = readBody(req); const prac = Number(b.prac);
  if (!isPrac(prac)) throw bad('prac must be 1–42');
  const vals = b.vals;
  if (!vals || typeof vals !== 'object' || Array.isArray(vals) || Object.keys(vals).length > 20 || !Object.values(vals).every(Number.isFinite)) throw bad('vals must be an object of up to 20 numbers');
  return [200, must(await sb.from('results').upsert({ user_id: me.id, prac, vals, updated_at: new Date().toISOString() }).select().single())];
}
async function getProgress(req) {
  const { sb, me } = await requireUser(req);
  const rows = must(await sb.from('progress').select('user_id,prog,updated_at').order('updated_at', { ascending: false }));
  const names = await namesFor(sb, rows.map((r) => r.user_id));
  return [200, { scope: me.role === 'teacher' ? 'class' : 'self', progress: rows.map((r) => ({ ...r, name: names[r.user_id]?.name || '', role: names[r.user_id]?.role || 'student' })) }];
}
async function putProgress(req) {
  const { sb, me } = await requireUser(req);
  const prog = readBody(req).prog;
  if (!prog || typeof prog !== 'object' || Array.isArray(prog) || !Object.values(prog).every((v) => Number.isFinite(v) && v >= 0 && v <= 100)) throw bad('prog must map practical numbers to 0–100');
  return [200, must(await sb.from('progress').upsert({ user_id: me.id, prog, updated_at: new Date().toISOString() }).select().single())];
}
async function getMe(req) { const { me } = await requireUser(req); return [200, me]; }
async function patchMe(req) {
  const { sb, me } = await requireUser(req);
  const name = str(readBody(req).name, 60, 1, 'name');
  must(await sb.from('profiles').update({ name }).eq('id', me.id));
  return [200, { ...me, name }];
}

/* ---------- router ---------- */
const ID = '([0-9a-fA-F-]{36})';
const ROUTES = [
  ['GET', /^health$/, async () => [200, { ok: true, service: 'learn-physics-api', configured: !!(SB_URL && SB_KEY) }]],
  ['POST', /^auth\/signup$/, signup],
  ['POST', /^auth\/login$/, login],
  ['POST', /^auth\/refresh$/, refresh],
  ['GET', /^auth\/me$/, getMe],
  ['PATCH', /^auth\/me$/, patchMe],
  ['GET', /^assignments$/, listAssignments],
  ['POST', /^assignments$/, createAssignment],
  ['GET', new RegExp(`^assignments/${ID}$`), getAssignment],
  ['PATCH', new RegExp(`^assignments/${ID}$`), updateAssignment],
  ['DELETE', new RegExp(`^assignments/${ID}$`), deleteAssignment],
  ['POST', new RegExp(`^assignments/${ID}/enroll$`), enroll],
  ['DELETE', new RegExp(`^assignments/${ID}/enroll$`), leave],
  ['POST', new RegExp(`^assignments/${ID}/complete$`), complete],
  ['POST', new RegExp(`^assignments/${ID}/comments$`), addComment],
  ['DELETE', new RegExp(`^comments/${ID}$`), deleteComment],
  ['GET', /^posts$/, listPosts],
  ['POST', /^posts$/, createPost],
  ['DELETE', new RegExp(`^posts/${ID}$`), deletePost],
  ['GET', /^results$/, listResults],
  ['PUT', /^results$/, putResult],
  ['GET', /^progress$/, getProgress],
  ['PUT', /^progress$/, putProgress],
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const path = (req.url || '').split('?')[0].replace(/^\/api\/?/, '').replace(/\/$/, '');
  try {
    if ((!SB_URL || !SB_KEY) && path !== 'health') throw new HttpError(503, 'not_configured', 'The database is not connected yet');
    const allowed = ROUTES.filter(([, re]) => re.test(path));
    if (!allowed.length) throw new HttpError(404, 'not_found', 'No such endpoint');
    const route = allowed.find(([m]) => m === req.method);
    if (!route) { res.setHeader('Allow', allowed.map(([m]) => m).join(', ')); throw new HttpError(405, 'method_not_allowed', `Use ${allowed.map(([m]) => m).join(' or ')}`); }
    const m = path.match(route[1]);
    const [status, body] = await route[2](req, m && m[1]);
    if (status === 204) res.status(204).end(); else res.status(status).json(body);
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, 'server_error', e?.message);
    if (err.status >= 500) console.error('[api]', req.method, path, e);
    res.status(err.status).json({ error: err.code, message: err.detail || err.message });
  }
}
