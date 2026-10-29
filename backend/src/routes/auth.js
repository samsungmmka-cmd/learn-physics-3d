import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireUser } from '../middleware/auth.js';
import { HttpError, badRequest, must, unauthorized } from '../lib/errors.js';
import * as S from '../schemas.js';

// The signed-in user's profile, including their chosen teacher.
async function profileOut(db, token, id, email) {
  const sb = db.asUser(token);
  const prof = must(await sb.from('profiles').select('name,role,teacher_id').eq('id', id).maybeSingle());
  let teacherName = '';
  if (prof?.teacher_id) teacherName = (must(await sb.from('profiles').select('name').eq('id', prof.teacher_id).maybeSingle()) || {}).name || '';
  return { id, email, name: prof?.name || '', role: prof?.role || 'student', teacher_id: prof?.teacher_id || null, teacher_name: teacherName };
}
const sessionOut = (s) => ({ access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at });

export default function authRoutes(db, { appUrl } = {}) {
  const r = Router();

  // Create an account. Teachers must give the school's teacher code; the database checks it again
  // in a trigger, so the role can't be forged by calling Supabase directly.
  r.post('/signup', validate({ body: S.signUp }), async (req, res) => {
    const { email, password, name, role, teacherCode, teacherId } = req.valid.body;
    const sb = db.anon();
    if (role === 'teacher') {
      const ok = must(await sb.rpc('check_teacher_code', { code: teacherCode }));
      if (!ok) throw new HttpError(400, 'wrong_teacher_code', 'That teacher code is not correct');
    }
    const meta = { name, role, ...(role === 'teacher' ? { teacher_code: teacherCode } : teacherId ? { teacher_id: teacherId } : {}) };
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } });
    if (error) {
      const exists = error.status === 422 || /already registered|already exists/i.test(error.message);
      throw new HttpError(exists ? 409 : 400, exists ? 'email_taken' : 'signup_failed', exists ? 'An account with this email already exists' : error.message);
    }
    // Supabase returns a user with no identities when the email is already registered (and confirmation is on).
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new HttpError(409, 'email_taken', 'An account with this email already exists');
    }
    if (!data.session) return res.status(201).json({ needsConfirmation: true });
    const user = await profileOut(db, data.session.access_token, data.user.id, email);
    return res.status(201).json({ session: sessionOut(data.session), user: { ...user, name: user.name || name } });
  });

  // Registered teachers, for the sign-up form and the profile's "My teacher" picker.
  r.get('/teachers', async (_req, res) => {
    res.json({ teachers: must(await db.anon().rpc('list_teachers')) });
  });

  r.post('/login', validate({ body: S.signIn }), async (req, res) => {
    const { email, password } = req.valid.body;
    const { data, error } = await db.anon().auth.signInWithPassword({ email, password });
    if (error) {
      if (/confirm/i.test(error.message)) throw new HttpError(401, 'email_not_confirmed', 'Confirm your email first, then sign in');
      throw new HttpError(401, 'invalid_login', 'Email or password is incorrect');
    }
    res.json({ session: sessionOut(data.session), user: await profileOut(db, data.session.access_token, data.user.id, data.user.email) });
  });

  // Forgotten password: Supabase emails a one-time link that brings the user back to the app
  // (APP_URL/#...type=recovery). Always answers the same way, so it can't be used to find out
  // which emails have accounts.
  r.post('/forgot', validate({ body: S.forgot }), async (req, res) => {
    const { error } = await db.anon().auth.resetPasswordForEmail(req.valid.body.email, { redirectTo: appUrl ? `${appUrl}/` : undefined });
    if (error) {
      if (error.status === 429 || /rate limit/i.test(error.message)) throw new HttpError(429, 'rate_limited', 'Too many emails sent. Try again later.');
      req.log?.warn({ err: error.message }, 'resetPasswordForEmail failed');
    }
    res.json({ ok: true });
  });

  // Set a new password using the recovery session from the emailed link.
  r.post('/reset', validate({ body: S.resetPassword }), async (req, res) => {
    const { access_token, refresh_token, password } = req.valid.body;
    const sb = db.anon();
    const { data: s, error: se } = await sb.auth.setSession({ access_token, refresh_token });
    if (se || !s?.session) throw new HttpError(401, 'link_expired', 'This reset link has expired. Request a new one.');
    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      if (/different from the old|same/i.test(error.message)) throw new HttpError(400, 'same_password', 'Choose a password different from your old one');
      if (/weak|short|characters/i.test(error.message)) throw badRequest(error.message);
      throw new HttpError(401, 'link_expired', 'This reset link has expired. Request a new one.');
    }
    // Sign the user in with a fresh session.
    const { data: fresh } = await sb.auth.refreshSession({ refresh_token: s.session.refresh_token });
    const session = fresh?.session || s.session;
    res.json({ session: sessionOut(session), user: await profileOut(db, session.access_token, s.session.user.id, s.session.user.email) });
  });

  r.post('/refresh', validate({ body: S.refresh }), async (req, res) => {
    const { data, error } = await db.anon().auth.refreshSession({ refresh_token: req.valid.body.refresh_token });
    if (error || !data.session) throw unauthorized('Session expired. Sign in again.');
    res.json({ session: sessionOut(data.session) });
  });

  r.get('/me', requireUser(db), (req, res) => res.json(req.user));

  r.patch('/me', requireUser(db), validate({ body: S.updateMe }), async (req, res) => {
    const { name, teacherId } = req.valid.body; const patch = {};
    if (name !== undefined) patch.name = name;
    if (teacherId !== undefined) {
      if (req.user.role === 'teacher') throw new HttpError(400, 'invalid', 'Teachers do not choose a teacher');
      if (teacherId) {
        const t = must(await req.sb.from('profiles').select('id,role').eq('id', teacherId).maybeSingle());
        if (!t || t.role !== 'teacher') throw new HttpError(400, 'invalid', 'Choose a teacher from the list');
      }
      patch.teacher_id = teacherId;
    }
    must(await req.sb.from('profiles').update(patch).eq('id', req.user.id));
    res.json(await profileOut(db, req.get('authorization').slice(7).trim(), req.user.id, req.user.email));
  });

  return r;
}
