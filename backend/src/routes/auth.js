import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireUser } from '../middleware/auth.js';
import { HttpError, badRequest, must, unauthorized } from '../lib/errors.js';
import * as S from '../schemas.js';

const sessionOut = (s) => ({ access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at });

export default function authRoutes(db, { appUrl } = {}) {
  const r = Router();

  // Create an account. Teachers must give the school's teacher code; the database checks it again
  // in a trigger, so the role can't be forged by calling Supabase directly.
  r.post('/signup', validate({ body: S.signUp }), async (req, res) => {
    const { email, password, name, role, teacherCode } = req.valid.body;
    const sb = db.anon();
    if (role === 'teacher') {
      const ok = must(await sb.rpc('check_teacher_code', { code: teacherCode }));
      if (!ok) throw new HttpError(400, 'wrong_teacher_code', 'That teacher code is not correct');
    }
    const meta = { name, role, ...(role === 'teacher' ? { teacher_code: teacherCode } : {}) };
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
    const prof = must(await db.asUser(data.session.access_token).from('profiles').select('name,role').eq('id', data.user.id).maybeSingle());
    return res.status(201).json({
      session: sessionOut(data.session),
      user: { id: data.user.id, email, name: prof?.name ?? name, role: prof?.role ?? 'student' },
    });
  });

  r.post('/login', validate({ body: S.signIn }), async (req, res) => {
    const { email, password } = req.valid.body;
    const { data, error } = await db.anon().auth.signInWithPassword({ email, password });
    if (error) {
      if (/confirm/i.test(error.message)) throw new HttpError(401, 'email_not_confirmed', 'Confirm your email first, then sign in');
      throw new HttpError(401, 'invalid_login', 'Email or password is incorrect');
    }
    const prof = must(await db.asUser(data.session.access_token).from('profiles').select('name,role').eq('id', data.user.id).maybeSingle());
    res.json({
      session: sessionOut(data.session),
      user: { id: data.user.id, email: data.user.email, name: prof?.name || '', role: prof?.role || 'student' },
    });
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
    const prof = must(await db.asUser(session.access_token).from('profiles').select('name,role').eq('id', s.session.user.id).maybeSingle());
    res.json({
      session: sessionOut(session),
      user: { id: s.session.user.id, email: s.session.user.email, name: prof?.name || '', role: prof?.role || 'student' },
    });
  });

  r.post('/refresh', validate({ body: S.refresh }), async (req, res) => {
    const { data, error } = await db.anon().auth.refreshSession({ refresh_token: req.valid.body.refresh_token });
    if (error || !data.session) throw unauthorized('Session expired. Sign in again.');
    res.json({ session: sessionOut(data.session) });
  });

  r.get('/me', requireUser(db), (req, res) => res.json(req.user));

  r.patch('/me', requireUser(db), validate({ body: S.updateMe }), async (req, res) => {
    must(await req.sb.from('profiles').update({ name: req.valid.body.name }).eq('id', req.user.id));
    res.json({ ...req.user, name: req.valid.body.name });
  });

  return r;
}
