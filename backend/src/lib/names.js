import { must } from './errors.js';

// Look up display names/roles for a set of user ids.
export async function namesFor(sb, ids) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  const rows = must(await sb.from('profiles').select('id,name,role').in('id', uniq));
  return Object.fromEntries(rows.map((p) => [p.id, { name: p.name, role: p.role }]));
}

export const withAuthor = (rows, names, key = 'author') => rows.map((r) => ({
  ...r,
  author_name: names[r[key]]?.name || '',
  author_role: names[r[key]]?.role || 'student',
}));
