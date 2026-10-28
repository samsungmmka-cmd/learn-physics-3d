import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { forbidden, must } from '../lib/errors.js';
import { namesFor, withAuthor } from '../lib/names.js';
import * as S from '../schemas.js';

const byId = validate({ params: S.uuidParam });

export default function communityRoutes() {
  const r = Router();

  // ----- assignment comments (delete by id) -----
  r.delete('/comments/:id', byId, async (req, res) => {
    const rows = must(await req.sb.from('assignment_comments').delete().eq('id', req.valid.params.id).select('id'));
    if (!rows.length) throw forbidden('You can only delete your own comments');
    res.status(204).end();
  });

  // ----- community posts -----
  r.get('/posts', validate({ query: S.listPosts }), async (req, res) => {
    const { prac, limit } = req.valid.query;
    let q = req.sb.from('posts').select('id,author,prac,body,parent,created_at').order('created_at', { ascending: false }).limit(limit);
    if (prac !== undefined) q = q.eq('prac', prac);
    const rows = must(await q);
    res.json({ posts: withAuthor(rows, await namesFor(req.sb, rows.map((p) => p.author))) });
  });

  r.post('/posts', validate({ body: S.createPost }), async (req, res) => {
    const row = must(await req.sb.from('posts').insert({ ...req.valid.body, author: req.user.id })
      .select('id,author,prac,body,parent,created_at').single());
    res.status(201).json({ ...row, author_name: req.user.name, author_role: req.user.role });
  });

  r.delete('/posts/:id', byId, async (req, res) => {
    const rows = must(await req.sb.from('posts').delete().eq('id', req.valid.params.id).select('id'));
    if (!rows.length) throw forbidden('You can only delete your own posts');
    res.status(204).end();
  });

  // ----- shared practical results -----
  r.get('/results', validate({ query: S.listResults }), async (req, res) => {
    let q = req.sb.from('results').select('user_id,prac,vals,updated_at');
    if (req.valid.query.prac) q = q.eq('prac', req.valid.query.prac);
    res.json({ results: must(await q) });
  });

  r.put('/results', validate({ body: S.putResult }), async (req, res) => {
    const row = must(await req.sb.from('results')
      .upsert({ user_id: req.user.id, ...req.valid.body, updated_at: new Date().toISOString() }).select().single());
    res.json(row);
  });

  // ----- practical progress (students see their own, teachers see the class) -----
  r.get('/progress', async (req, res) => {
    const rows = must(await req.sb.from('progress').select('user_id,prog,updated_at').order('updated_at', { ascending: false }));
    const names = await namesFor(req.sb, rows.map((p) => p.user_id));
    res.json({
      scope: req.user.role === 'teacher' ? 'class' : 'self',
      progress: rows.map((p) => ({ ...p, name: names[p.user_id]?.name || '', role: names[p.user_id]?.role || 'student' })),
    });
  });

  r.put('/progress', validate({ body: S.putProgress }), async (req, res) => {
    const row = must(await req.sb.from('progress')
      .upsert({ user_id: req.user.id, prog: req.valid.body.prog, updated_at: new Date().toISOString() }).select().single());
    res.json(row);
  });

  return r;
}
