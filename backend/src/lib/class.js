import { must } from './errors.js';

// "Class" scoping: a student belongs to the class of the teacher they chose.
// Returns the set of user ids whose rows this user should see, or null to see everyone.
export async function classMembers(sb, user) {
  if (user.role === 'teacher') {
    const rows = must(await sb.from('profiles').select('id').eq('teacher_id', user.id));
    return new Set([user.id, ...rows.map((r) => r.id)]);
  }
  if (!user.teacher_id) return null; // no teacher chosen: see everything, as before
  const rows = must(await sb.from('profiles').select('id').eq('teacher_id', user.teacher_id));
  return new Set([user.id, user.teacher_id, ...rows.map((r) => r.id)]);
}
