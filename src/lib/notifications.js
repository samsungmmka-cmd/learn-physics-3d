import { useEffect, useMemo, useState } from 'react';
import { useCommunity } from './community.jsx';

const SEEN_KEY = 'lp-notif-seen';
const readSeen = () => { try { return localStorage.getItem(SEEN_KEY) || ''; } catch { return ''; } };
const DAY = 86400000;

// Notifications worked out from data the app already has (no extra requests).
export function useNotifications() {
  const comm = useCommunity(); const [seen, setSeen] = useState(readSeen);
  const list = useMemo(() => {
    if (!comm.uid) return [];
    const out = []; const now = Date.now();
    const mine = new Set(comm.posts.filter((p) => p.author === comm.uid).map((p) => p.id));
    comm.posts.forEach((p) => {
      if (p.parent && mine.has(p.parent) && p.author !== comm.uid) {
        const parent = comm.posts.find((x) => x.id === p.parent);
        out.push({ id: `r-${p.id}`, kind: 'reply', at: p.created_at, who: p.author_name, text: p.body, about: parent ? parent.body : '', postId: p.parent });
      }
    });
    comm.assignments.forEach((a) => {
      if (comm.teacher) {
        if (a.created_by === comm.uid && a.completed_count) out.push({ id: `c-${a.id}-${a.completed_count}`, kind: 'completions', at: a.created_at, n: a.completed_count, m: a.enrolled_count, title: a.title, aid: a.id });
        return;
      }
      const due = a.due ? new Date(`${a.due}T23:59:59`).getTime() : null;
      if (a.my_status !== 'completed' && due && due - now < 3 * DAY && due > now - DAY) out.push({ id: `d-${a.id}`, kind: 'due', at: new Date(due - 3 * DAY).toISOString(), title: a.title, due: a.due, aid: a.id });
      if (!a.my_status && now - new Date(a.created_at).getTime() < 14 * DAY) out.push({ id: `n-${a.id}`, kind: 'new', at: a.created_at, title: a.title, who: a.teacher_name, aid: a.id });
    });
    return out.sort((x, y) => y.at.localeCompare(x.at)).slice(0, 30);
  }, [comm.uid, comm.teacher, comm.posts, comm.assignments]);
  const unread = list.filter((n) => !seen || n.at > seen).length;
  // keep every view (avatar badge, profile page) in step when notifications are marked read
  useEffect(() => { const on = () => setSeen(readSeen()); window.addEventListener('lp-notif-seen', on); return () => window.removeEventListener('lp-notif-seen', on); }, []);
  const markRead = () => { const t = new Date().toISOString(); try { localStorage.setItem(SEEN_KEY, t); } catch { /* private mode */ } setSeen(t); window.dispatchEvent(new Event('lp-notif-seen')); };
  return { list, unread, seen, markRead };
}

