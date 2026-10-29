import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';
import { HttpError, forbidden, must, notFound } from '../lib/errors.js';
import { namesFor, withAuthor } from '../lib/names.js';
import * as S from '../schemas.js';

const COLS = 'id,title,prac,description,due,created_by,created_at';
const byId = validate({ params: S.uuidParam });

export default function assignmentRoutes() {
  const r = Router();

  // List assignments, newest first, with my enrollment status (students) or counts (teachers).
  r.get('/', async (req, res) => {
    const { sb, user } = req;
    let q = sb.from('assignments').select(COLS).order('created_at', { ascending: false }).limit(200);
    // Students with a chosen teacher see that teacher's assignments only.
    if (user.role === 'student' && user.teacher_id) q = q.eq('created_by', user.teacher_id);
    const rows = must(await q);
    // RLS returns only my own enrollments for students, and all enrollments for teachers.
    const enr = rows.length ? must(await sb.from('enrollments').select('assignment_id,student_id,status').in('assignment_id', rows.map((a) => a.id))) : [];
    const names = await namesFor(sb, rows.map((a) => a.created_by));
    const teacher = user.role === 'teacher';
    res.json({
      assignments: rows.map((a) => {
        const es = enr.filter((e) => e.assignment_id === a.id);
        const mine = es.find((e) => e.student_id === user.id);
        return {
          ...a,
          teacher_name: names[a.created_by]?.name || '',
          my_status: mine ? mine.status : null,
          ...(teacher ? { enrolled_count: es.length, completed_count: es.filter((e) => e.status === 'completed').length } : {}),
        };
      }),
    });
  });

  r.post('/', requireRole('teacher'), validate({ body: S.createAssignment }), async (req, res) => {
    const row = must(await req.sb.from('assignments').insert({ ...req.valid.body, created_by: req.user.id }).select(COLS).single());
    res.status(201).json(row);
  });

  r.get('/:id', byId, async (req, res) => {
    const { sb, user } = req; const { id } = req.valid.params;
    const a = must(await sb.from('assignments').select(COLS).eq('id', id).maybeSingle());
    if (!a) throw notFound('Assignment not found');
    const [comments, enr] = await Promise.all([
      sb.from('assignment_comments').select('id,author,body,created_at').eq('assignment_id', id).order('created_at').then(must),
      sb.from('enrollments').select('student_id,status,note,enrolled_at,completed_at').eq('assignment_id', id).then(must),
    ]);
    const names = await namesFor(sb, [a.created_by, ...comments.map((c) => c.author), ...enr.map((e) => e.student_id)]);
    res.json({
      ...a,
      teacher_name: names[a.created_by]?.name || '',
      my_enrollment: enr.find((e) => e.student_id === user.id) || null,
      comments: withAuthor(comments, names),
      ...(user.role === 'teacher' ? { enrollments: enr.map((e) => ({ ...e, student_name: names[e.student_id]?.name || '' })) } : {}),
    });
  });

  r.patch('/:id', requireRole('teacher'), byId, validate({ body: S.updateAssignment }), async (req, res) => {
    const rows = must(await req.sb.from('assignments').update(req.valid.body).eq('id', req.valid.params.id).select(COLS));
    if (!rows.length) throw forbidden('Only the teacher who published it can edit this assignment');
    res.json(rows[0]);
  });

  r.delete('/:id', requireRole('teacher'), byId, async (req, res) => {
    const rows = must(await req.sb.from('assignments').delete().eq('id', req.valid.params.id).select('id'));
    if (!rows.length) throw forbidden('Only the teacher who published it can delete this assignment');
    res.status(204).end();
  });

  // Students: enroll / leave / complete
  r.post('/:id/enroll', requireRole('student'), byId, async (req, res) => {
    const { sb, user } = req; const { id } = req.valid.params;
    const exists = must(await sb.from('assignments').select('id').eq('id', id).maybeSingle());
    if (!exists) throw notFound('Assignment not found');
    must(await sb.from('enrollments').upsert({ assignment_id: id, student_id: user.id }, { onConflict: 'assignment_id,student_id', ignoreDuplicates: true }));
    const row = must(await sb.from('enrollments').select('*').eq('assignment_id', id).eq('student_id', user.id).single());
    res.json(row);
  });

  r.delete('/:id/enroll', requireRole('student'), byId, async (req, res) => {
    must(await req.sb.from('enrollments').delete().eq('assignment_id', req.valid.params.id).eq('student_id', req.user.id));
    res.status(204).end();
  });

  r.post('/:id/complete', requireRole('student'), byId, validate({ body: S.complete }), async (req, res) => {
    const { note, done } = req.valid.body;
    const rows = must(await req.sb.from('enrollments')
      .update({ status: done ? 'completed' : 'enrolled', note, completed_at: done ? new Date().toISOString() : null })
      .eq('assignment_id', req.valid.params.id).eq('student_id', req.user.id).select());
    if (!rows.length) throw new HttpError(409, 'not_enrolled', 'Enroll in this assignment first');
    res.json(rows[0]);
  });

  // Comments (anyone signed in)
  r.post('/:id/comments', byId, validate({ body: S.comment }), async (req, res) => {
    const row = must(await req.sb.from('assignment_comments')
      .insert({ assignment_id: req.valid.params.id, author: req.user.id, body: req.valid.body.body })
      .select('id,assignment_id,author,body,created_at').single());
    res.status(201).json({ ...row, author_name: req.user.name, author_role: req.user.role });
  });

  return r;
}
