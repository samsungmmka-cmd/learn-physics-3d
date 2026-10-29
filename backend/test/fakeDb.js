// A small in-memory stand-in for the Supabase client, enough to exercise the routes in tests.
// It does not emulate row-level security; the route-level role checks are what these tests cover.
import { randomUUID } from 'node:crypto';

export function createFakeDb({ teacherCode = 'T-CODE' } = {}) {
  const t = { profiles: [], assignments: [], enrollments: [], assignment_comments: [], posts: [], results: [], progress: [] };
  const users = new Map(); // email -> { id, password }
  const tokens = new Map(); // token -> user id
  const pk = { enrollments: ['assignment_id', 'student_id'], results: ['user_id', 'prac'], progress: ['user_id'], profiles: ['id'] };

  function query(table) {
    let rows = null; let op = 'select'; let payload; let filters = []; let order; let limit; let returning = false; let upsertOpts;
    const apply = () => t[table].filter((r) => filters.every((f) => f(r)));
    const run = () => {
      if (op === 'insert' || op === 'upsert') {
        const items = (Array.isArray(payload) ? payload : [payload]).map((p) => ({ id: randomUUID(), created_at: new Date().toISOString(), ...defaults(table), ...p }));
        const out = [];
        for (const it of items) {
          const keys = pk[table];
          const ex = keys && t[table].find((r) => keys.every((k) => r[k] === it[k]));
          if (ex) { if (op === 'upsert' && !upsertOpts?.ignoreDuplicates) { Object.assign(ex, it); out.push(ex); } else if (op === 'insert') return { data: null, error: { code: '23505', message: 'dup' } }; }
          else { t[table].push(it); out.push(it); }
        }
        rows = out;
      } else if (op === 'update') { rows = apply(); rows.forEach((r) => Object.assign(r, payload)); }
      else if (op === 'delete') { rows = apply(); t[table] = t[table].filter((r) => !rows.includes(r)); }
      else { rows = apply(); if (order) rows = [...rows].sort((a, b) => (a[order.col] < b[order.col] ? -1 : 1) * (order.asc ? 1 : -1)); if (limit) rows = rows.slice(0, limit); }
      return { data: rows.map((r) => ({ ...r })), error: null };
    };
    const b = {
      select() { if (op !== 'select') returning = true; return b; },
      insert(p) { op = 'insert'; payload = p; return b; },
      upsert(p, o) { op = 'upsert'; payload = p; upsertOpts = o; return b; },
      update(p) { op = 'update'; payload = p; return b; },
      delete() { op = 'delete'; return b; },
      eq(c, v) { filters.push((r) => r[c] === v); return b; },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return b; },
      order(col, o = {}) { order = { col, asc: o.ascending !== false }; return b; },
      limit(n) { limit = n; return b; },
      async single() { const r = run(); return r.error ? r : r.data.length === 1 ? { data: r.data[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'no rows' } }; },
      async maybeSingle() { const r = run(); return r.error ? r : { data: r.data[0] || null, error: null }; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return b;
  }
  function defaults(table) {
    if (table === 'enrollments') return { status: 'enrolled', note: '', enrolled_at: new Date().toISOString(), completed_at: null };
    return {};
  }
  const sent = []; // reset emails "sent"
  let current = null; // user id for setSession/updateUser
  const authApi = {
    async resetPasswordForEmail(email, opts) { sent.push({ email, redirectTo: opts?.redirectTo }); return { data: {}, error: null }; },
    async setSession({ access_token, refresh_token }) {
      const id = tokens.get(access_token);
      if (!id || refresh_token !== `ref-${id}`) return { data: { session: null }, error: { message: 'Invalid' } };
      current = id; const email = [...users.entries()].find(([, u]) => u.id === id)[0];
      return { data: { session: { access_token, refresh_token, expires_at: 9999999999, user: { id, email } } }, error: null };
    },
    async updateUser({ password }) {
      if (!current) return { data: {}, error: { message: 'Auth session missing!' } };
      const entry = [...users.values()].find((u) => u.id === current);
      if (entry.password === password) return { data: {}, error: { message: 'New password should be different from the old password.' } };
      entry.password = password; return { data: { user: { id: current } }, error: null };
    },
    async signUp({ email, password, options }) {
      if (users.has(email)) return { data: null, error: { status: 422, message: 'User already registered' } };
      const id = randomUUID(); users.set(email, { id, password });
      const m = options?.data || {};
      const role = m.role === 'teacher' && m.teacher_code === teacherCode ? 'teacher' : 'student';
      t.profiles.push({ id, name: m.name || '', role, created_at: new Date().toISOString() });
      const token = `tok-${id}`; tokens.set(token, id);
      return { data: { user: { id, email, identities: [{}] }, session: { access_token: token, refresh_token: `ref-${id}`, expires_at: 9999999999 } }, error: null };
    },
    async signInWithPassword({ email, password }) {
      const u = users.get(email);
      if (!u || u.password !== password) return { data: {}, error: { status: 400, message: 'Invalid login credentials' } };
      const token = `tok-${u.id}`; tokens.set(token, u.id);
      return { data: { user: { id: u.id, email }, session: { access_token: token, refresh_token: `ref-${u.id}`, expires_at: 9999999999 } }, error: null };
    },
    async refreshSession({ refresh_token }) {
      const id = refresh_token.replace(/^ref-/, ''); if (![...tokens.values()].includes(id)) return { data: {}, error: { message: 'bad' } };
      return { data: { session: { access_token: `tok-${id}`, refresh_token, expires_at: 9999999999 } }, error: null };
    },
    async getUser(token) {
      const id = tokens.get(token); if (!id) return { data: { user: null }, error: { message: 'bad jwt' } };
      const email = [...users.entries()].find(([, u]) => u.id === id)[0];
      return { data: { user: { id, email } }, error: null };
    },
  };
  const client = {
    from: query,
    auth: authApi,
    async rpc(fn, args) { if (fn === 'check_teacher_code') return { data: args.code === teacherCode, error: null }; return { data: null, error: { message: 'no fn' } }; },
  };
  return { tables: t, sent, anon: () => client, asUser: () => client };
}
