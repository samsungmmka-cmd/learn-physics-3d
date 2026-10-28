import { must, unauthorized, forbidden } from '../lib/errors.js';

// Reads "Authorization: Bearer <access token>", verifies it with Supabase Auth and loads the profile.
// Sets req.sb (a client acting as this user) and req.user = { id, email, name, role }.
export const requireUser = (db) => async (req, _res, next) => {
  try {
    const h = req.get('authorization') || '';
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    if (!token) throw unauthorized();
    const sb = db.asUser(token);
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) throw unauthorized('Session expired. Sign in again.');
    const prof = must(await sb.from('profiles').select('name,role').eq('id', data.user.id).maybeSingle());
    req.sb = sb;
    req.user = { id: data.user.id, email: data.user.email, name: prof?.name || '', role: prof?.role || 'student' };
    next();
  } catch (e) { next(e); }
};

export const requireRole = (role) => (req, _res, next) => (
  req.user?.role === role ? next() : next(forbidden(role === 'teacher' ? 'Teachers only' : 'Students only'))
);
