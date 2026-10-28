import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as API from './api.js';
import { useLab } from './labStore.jsx';
import { progress } from './calc.js';
import { LABS } from '../data/content.js';

const Ctx = createContext(null);
const POLL_MS = 30000;

export function CommunityProvider({ children }) {
  const { st } = useLab();
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState(API.getSession());
  const [posts, setPosts] = useState([]);
  const [results, setResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classProgress, setClassProgress] = useState([]);
  const [authMode, setAuthMode] = useState('in');
  const [focus, setFocus] = useState(null); // assignment id opened in the Community view
  const me = session?.user || null;
  const uid = me?.id || null;
  const teacher = me?.role === 'teacher';

  useEffect(() => API.onSession(setSessionState), []);
  useEffect(() => {
    API.health().then((h) => setEnabled(!!h?.configured)).catch(() => setEnabled(false)).finally(() => setReady(true));
  }, []);

  // names/roles of everyone we have seen, taken from what the API returns
  const profiles = useMemo(() => {
    const m = {};
    posts.forEach((p) => { m[p.author] = { name: p.author_name, role: p.author_role }; });
    classProgress.forEach((r) => { m[r.user_id] = { name: r.name, role: r.role }; });
    if (me) m[me.id] = { name: me.name, role: me.role };
    return m;
  }, [posts, classProgress, me]);

  const loadAll = useCallback(async () => {
    if (!uid) return;
    const [po, re, as, pr] = await Promise.allSettled([API.api('GET', '/posts'), API.api('GET', '/results'), API.api('GET', '/assignments'), API.api('GET', '/progress')]);
    if (po.status === 'fulfilled') setPosts(po.value.posts);
    if (re.status === 'fulfilled') setResults(re.value.results);
    if (as.status === 'fulfilled') setAssignments(as.value.assignments);
    if (pr.status === 'fulfilled') setClassProgress(pr.value.scope === 'class' ? pr.value.progress : []);
  }, [uid]);

  useEffect(() => {
    if (!uid || !enabled) { setPosts([]); setResults([]); setAssignments([]); setClassProgress([]); return undefined; }
    loadAll();
    API.api('GET', '/auth/me').then((u) => API.saveUser(u)).catch(() => {});
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadAll(); }, POLL_MS);
    return () => clearInterval(t);
  }, [uid, enabled, loadAll]);

  // save practical progress to the account (debounced, only when lab data changed)
  const lastTs = useRef(null);
  useEffect(() => {
    if (!uid || !enabled || !st.ts || st.ts === lastTs.current) return undefined;
    const t = setTimeout(() => {
      lastTs.current = st.ts;
      const prog = {}; Object.keys(LABS).forEach((id) => { prog[id] = Math.round(progress(st, +id) * 100); });
      API.api('PUT', '/progress', { prog }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [st, uid, enabled]);

  const wrap = (fn) => async (...a) => { try { await fn(...a); loadAll(); return null; } catch (e) { return e; } };

  const value = useMemo(() => ({
    enabled, ready, session, uid, me, teacher, profiles, posts, results, assignments, classProgress, online: 0, reload: loadAll, focus, setFocus, authMode, setAuthMode,
    signUp: async (form) => { try { const d = await API.signUp(form); return { ok: true, needsConfirmation: !!d.needsConfirmation }; } catch (e) { return { error: e }; } },
    signIn: async (email, password) => { try { await API.signIn(email, password); return null; } catch (e) { return e; } },
    signOut: () => { setAuthMode('in'); setFocus(null); API.signOut(); },
    rename: wrap(async (name) => { const u = await API.api('PATCH', '/auth/me', { name }); API.saveUser(u); }),
    addPost: wrap((body, prac, parent) => API.api('POST', '/posts', { body, prac: prac || 0, parent: parent || null })),
    delPost: wrap((id) => API.api('DELETE', `/posts/${id}`)),
    shareResult: wrap((prac, vals) => API.api('PUT', '/results', { prac, vals })),
    addAssignment: wrap((a) => API.api('POST', '/assignments', a)),
    delAssignment: wrap((id) => API.api('DELETE', `/assignments/${id}`)),
    enroll: wrap((id) => API.api('POST', `/assignments/${id}/enroll`)),
    leave: wrap((id) => API.api('DELETE', `/assignments/${id}/enroll`)),
    complete: wrap((id, note, done = true) => API.api('POST', `/assignments/${id}/complete`, { note, done })),
    getAssignment: (id) => API.api('GET', `/assignments/${id}`),
    addComment: (id, body) => API.api('POST', `/assignments/${id}/comments`, { body }),
    delComment: (id) => API.api('DELETE', `/comments/${id}`),
  }), [enabled, ready, session, uid, me, teacher, profiles, posts, results, assignments, classProgress, focus, authMode, loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCommunity = () => useContext(Ctx);
