import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase.js';
import { useLab } from './labStore.jsx';
import { progress } from './calc.js';
import { LABS } from '../data/content.js';

const Ctx = createContext(null);

export function CommunityProvider({ children }) {
  const { st, replace } = useLab();
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [posts, setPosts] = useState([]);
  const [results, setResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classProgress, setClassProgress] = useState([]);
  const [online, setOnline] = useState(0);
  const uid = session?.user?.id || null;
  const teacher = me?.role === 'teacher';

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    if (!supabase || !uid) return;
    const [pr, po, re, as] = await Promise.all([
      supabase.from('profiles').select('id,name,role'),
      supabase.from('posts').select('id,author,prac,body,parent,created_at').order('created_at', { ascending: false }).limit(300),
      supabase.from('results').select('user_id,prac,vals,updated_at'),
      supabase.from('assignments').select('id,prac,due,note,created_by,created_at').order('created_at', { ascending: false }).limit(50),
    ]);
    if (pr.data) {
      const m = {}; pr.data.forEach((p) => { m[p.id] = p; });
      if (!m[uid]) { // account created before the profile trigger existed
        const nm = (session?.user?.user_metadata?.name || '').slice(0, 60);
        const ins = await supabase.from('profiles').insert({ id: uid, name: nm }).select('id,name,role').single();
        if (ins.data) m[uid] = ins.data;
      }
      setProfiles(m); setMe(m[uid] || null);
    }
    if (po.data) setPosts(po.data);
    if (re.data) setResults(re.data);
    if (as.data) setAssignments(as.data);
    const cp = await supabase.from('progress').select('user_id,prog,updated_at');
    if (cp.data) setClassProgress(cp.data);
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // initial load, realtime refresh, presence
  useEffect(() => {
    if (!supabase || !uid) return undefined;
    loadAll();
    let t = null; const soon = () => { clearTimeout(t); t = setTimeout(loadAll, 300); };
    const ch = supabase.channel('class-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, soon)
      .subscribe();
    const pres = supabase.channel('lab-presence', { config: { presence: { key: uid } } });
    pres.on('presence', { event: 'sync' }, () => setOnline(Object.keys(pres.presenceState()).length))
      .subscribe((s) => { if (s === 'SUBSCRIBED') pres.track({ at: Date.now() }); });
    return () => { clearTimeout(t); supabase.removeChannel(ch); supabase.removeChannel(pres); };
  }, [uid, loadAll]);

  // restore lab work from the account on sign-in, if it is newer than this device's copy
  const restored = useRef(null);
  useEffect(() => {
    if (!supabase || !uid || restored.current === uid) return;
    restored.current = uid;
    supabase.from('lab_state').select('state,updated_at').eq('user_id', uid).maybeSingle().then(({ data }) => {
      if (data && data.state && data.state.labs && (data.state.ts || 0) > (st.ts || 0)) replace({ ...data.state, view: st.view });
    });
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // save lab work + progress (debounced, only when lab data changed)
  const lastTs = useRef(null);
  useEffect(() => {
    if (!supabase || !uid || !st.ts || st.ts === lastTs.current) return undefined;
    const t = setTimeout(async () => {
      lastTs.current = st.ts;
      const prog = {}; Object.keys(LABS).forEach((id) => { prog[id] = Math.round(progress(st, +id) * 100); });
      await supabase.from('lab_state').upsert({ user_id: uid, state: st, updated_at: new Date().toISOString() });
      await supabase.from('progress').upsert({ user_id: uid, prog, updated_at: new Date().toISOString() });
    }, 2500);
    return () => clearTimeout(t);
  }, [st, uid]);

  const api = useMemo(() => ({
    enabled: !!supabase, ready, session, uid, me, teacher, profiles, posts, results, assignments, classProgress, online,
    async signIn(email, name) {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, data: { name } } });
      return error;
    },
    async signOut() { await supabase.auth.signOut(); setMe(null); },
    async rename(name) { const { error } = await supabase.from('profiles').update({ name }).eq('id', uid); if (!error) loadAll(); return error; },
    async addPost(body, prac, parent) {
      const { error } = await supabase.from('posts').insert({ body: body.trim().slice(0, 2000), prac: prac || 0, parent: parent || null });
      if (!error) loadAll(); return error;
    },
    async delPost(id) { const { error } = await supabase.from('posts').delete().eq('id', id); if (!error) loadAll(); return error; },
    async shareResult(prac, vals) {
      const { error } = await supabase.from('results').upsert({ user_id: uid, prac, vals, updated_at: new Date().toISOString() });
      if (!error) loadAll(); return error;
    },
    async addAssignment(prac, due, note) {
      const { error } = await supabase.from('assignments').insert({ prac, due: due || null, note: note.trim().slice(0, 400) });
      if (!error) loadAll(); return error;
    },
    async delAssignment(id) { const { error } = await supabase.from('assignments').delete().eq('id', id); if (!error) loadAll(); return error; },
  }), [ready, session, uid, me, teacher, profiles, posts, results, assignments, classProgress, online, loadAll]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const useCommunity = () => useContext(Ctx);
