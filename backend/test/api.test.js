import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createFakeDb } from './fakeDb.js';

const config = loadConfig({ NODE_ENV: 'test', CORS_ORIGINS: 'https://learn-physics-3d.vercel.app' });

describe('without a database', () => {
  const app = createApp(config, { db: null });
  it('health reports not configured', async () => {
    const r = await request(app).get('/api/health').expect(200);
    assert.deepEqual(r.body, { ok: true, service: 'learn-physics-api', configured: false });
  });
  it('other routes return 503', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x' }).expect(503);
    assert.equal(r.body.error, 'not_configured');
  });
});

describe('with a database', () => {
  const db = createFakeDb({ teacherCode: 'PHYS-1' });
  const app = createApp(config, { db });
  let teacher; let student; let assignmentId;
  const as = (s) => ({ Authorization: `Bearer ${s.session.access_token}` });

  before(async () => {
    teacher = (await request(app).post('/api/auth/signup').send({ email: 'T@school.lk', password: 'password123', name: 'Ms Perera', role: 'teacher', teacherCode: 'PHYS-1' }).expect(201)).body;
    student = (await request(app).post('/api/auth/signup').send({ email: 'kamal@school.lk', password: 'password123', name: 'Kamal' }).expect(201)).body;
  });

  it('signs up with roles and lowercases email', () => {
    assert.equal(teacher.user.role, 'teacher');
    assert.equal(teacher.user.email, 't@school.lk');
    assert.equal(student.user.role, 'student');
  });
  it('rejects a wrong teacher code', async () => {
    const r = await request(app).post('/api/auth/signup').send({ email: 'x@y.co', password: 'password123', name: 'X', role: 'teacher', teacherCode: 'nope' }).expect(400);
    assert.equal(r.body.error, 'wrong_teacher_code');
  });
  it('requires a teacher code for teachers', async () => {
    const r = await request(app).post('/api/auth/signup').send({ email: 'x@y.co', password: 'password123', name: 'X', role: 'teacher' }).expect(400);
    assert.match(r.body.message, /Teacher code/);
  });
  it('validates input', async () => {
    await request(app).post('/api/auth/signup').send({ email: 'bad', password: 'password123', name: 'X' }).expect(400);
    await request(app).post('/api/auth/signup').send({ email: 'a@b.co', password: 'short', name: 'X' }).expect(400);
    await request(app).post('/api/auth/signup').set('Content-Type', 'application/json').send('{bad').expect(400);
  });
  it('rejects a duplicate email', async () => {
    const r = await request(app).post('/api/auth/signup').send({ email: 'kamal@school.lk', password: 'password123', name: 'K2' }).expect(409);
    assert.equal(r.body.error, 'email_taken');
  });
  it('logs in and returns the profile', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'kamal@school.lk', password: 'password123' }).expect(200);
    assert.equal(r.body.user.name, 'Kamal');
    assert.ok(r.body.session.access_token);
    const bad = await request(app).post('/api/auth/login').send({ email: 'kamal@school.lk', password: 'wrongpass' }).expect(401);
    assert.equal(bad.body.error, 'invalid_login');
  });
  it('refreshes a session', async () => {
    const r = await request(app).post('/api/auth/refresh').send({ refresh_token: student.session.refresh_token }).expect(200);
    assert.ok(r.body.session.access_token);
  });
  it('needs a token for data routes', async () => {
    await request(app).get('/api/assignments').expect(401);
    await request(app).get('/api/posts').set('Authorization', 'Bearer nonsense-token').expect(401);
  });
  it('only teachers publish assignments', async () => {
    await request(app).post('/api/assignments').set(as(student)).send({ title: 'Nope' }).expect(403);
    const r = await request(app).post('/api/assignments').set(as(teacher)).send({ title: 'Vernier caliper lab', prac: 1, due: '2026-11-10', description: 'Measure the beaker.' }).expect(201);
    assignmentId = r.body.id;
    await request(app).post('/api/assignments').set(as(teacher)).send({ title: 'Bad', due: '10/11/2026' }).expect(400);
  });
  it('students enroll, complete and comment; teachers see enrollments', async () => {
    await request(app).post(`/api/assignments/${assignmentId}/complete`).set(as(student)).send({}).expect(409);
    await request(app).post(`/api/assignments/${assignmentId}/enroll`).set(as(teacher)).expect(403);
    const e = await request(app).post(`/api/assignments/${assignmentId}/enroll`).set(as(student)).expect(200);
    assert.equal(e.body.status, 'enrolled');
    await request(app).post(`/api/assignments/${assignmentId}/enroll`).set(as(student)).expect(200); // idempotent
    const c = await request(app).post(`/api/assignments/${assignmentId}/complete`).set(as(student)).send({ note: 'Done, mean 3.42 cm' }).expect(200);
    assert.equal(c.body.status, 'completed');
    await request(app).post(`/api/assignments/${assignmentId}/comments`).set(as(student)).send({ body: 'Is the zero error included?' }).expect(201);
    await request(app).post(`/api/assignments/${assignmentId}/comments`).set(as(teacher)).send({ body: 'Yes, correct for it.' }).expect(201);

    const list = await request(app).get('/api/assignments').set(as(student)).expect(200);
    assert.equal(list.body.assignments[0].my_status, 'completed');
    assert.equal(list.body.assignments[0].teacher_name, 'Ms Perera');
    assert.equal(list.body.assignments[0].enrolled_count, undefined);
    const tl = await request(app).get('/api/assignments').set(as(teacher)).expect(200);
    assert.equal(tl.body.assignments[0].completed_count, 1);

    const d = await request(app).get(`/api/assignments/${assignmentId}`).set(as(teacher)).expect(200);
    assert.equal(d.body.comments.length, 2);
    assert.equal(d.body.enrollments[0].student_name, 'Kamal');
    const ds = await request(app).get(`/api/assignments/${assignmentId}`).set(as(student)).expect(200);
    assert.equal(ds.body.enrollments, undefined);
    assert.equal(ds.body.my_enrollment.note, 'Done, mean 3.42 cm');
  });
  it('rejects malformed ids and unknown assignments', async () => {
    await request(app).get('/api/assignments/123').set(as(student)).expect(400);
    await request(app).get('/api/assignments/00000000-0000-4000-8000-000000000000').set(as(student)).expect(404);
  });
  it('posts, results and progress', async () => {
    const p = await request(app).post('/api/posts').set(as(student)).send({ body: 'Hello class', prac: 2 }).expect(201);
    assert.equal(p.body.author_name, 'Kamal');
    const l = await request(app).get('/api/posts?prac=2').set(as(teacher)).expect(200);
    assert.equal(l.body.posts.length, 1);
    await request(app).put('/api/results').set(as(student)).send({ prac: 1, vals: { d: 3.42 } }).expect(200);
    await request(app).put('/api/results').set(as(student)).send({ prac: 1, vals: { d: 'x' } }).expect(400);
    await request(app).put('/api/progress').set(as(student)).send({ prog: { 1: 50, 2: 0 } }).expect(200);
    const pr = await request(app).get('/api/progress').set(as(teacher)).expect(200);
    assert.equal(pr.body.scope, 'class');
  });
  it('forgot password always answers ok and sends the app link', async () => {
    const r = await request(app).post('/api/auth/forgot').send({ email: 'Kamal@school.lk' }).expect(200);
    assert.deepEqual(r.body, { ok: true });
    await request(app).post('/api/auth/forgot').send({ email: 'nobody@school.lk' }).expect(200);
    assert.equal(db.sent[0].email, 'kamal@school.lk');
    assert.equal(db.sent[0].redirectTo, 'https://learn-physics-3d.vercel.app/');
    await request(app).post('/api/auth/forgot').send({ email: 'not-an-email' }).expect(400);
  });
  it('resets the password with the recovery tokens', async () => {
    const { access_token, refresh_token } = student.session;
    await request(app).post('/api/auth/reset').send({ access_token: 'x'.repeat(30), refresh_token, password: 'newpassword1' }).expect(401);
    await request(app).post('/api/auth/reset').send({ access_token, refresh_token, password: 'short' }).expect(400);
    await request(app).post('/api/auth/reset').send({ access_token, refresh_token, password: 'password123' }).expect(400);
    const r = await request(app).post('/api/auth/reset').send({ access_token, refresh_token, password: 'newpassword1' }).expect(200);
    assert.equal(r.body.user.name, 'Kamal');
    await request(app).post('/api/auth/login').send({ email: 'kamal@school.lk', password: 'password123' }).expect(401);
    await request(app).post('/api/auth/login').send({ email: 'kamal@school.lk', password: 'newpassword1' }).expect(200);
  });
  it('lists teachers and links a student to a teacher', async () => {
    const r = await request(app).get('/api/auth/teachers').expect(200);
    assert.equal(r.body.teachers.length, 1); assert.equal(r.body.teachers[0].name, 'Ms Perera');
    const tid = r.body.teachers[0].id;
    const s2 = (await request(app).post('/api/auth/signup').send({ email: 'nimal@school.lk', password: 'password123', name: 'Nimal', teacherId: tid }).expect(201)).body;
    assert.equal(s2.user.teacher_id, tid); assert.equal(s2.user.teacher_name, 'Ms Perera');
    // a second teacher publishes; Nimal (Ms Perera's class) must not see it, Kamal (no teacher) still sees everything
    const t2 = (await request(app).post('/api/auth/signup').send({ email: 't2@school.lk', password: 'password123', name: 'Mr Fernando', role: 'teacher', teacherCode: 'PHYS-1' }).expect(201)).body;
    await request(app).post('/api/assignments').set(as(t2)).send({ title: 'Other class work' }).expect(201);
    const seen = (await request(app).get('/api/assignments').set(as(s2)).expect(200)).body.assignments.map((a) => a.title);
    assert.ok(!seen.includes('Other class work')); assert.ok(seen.includes('Vernier caliper lab'));
    const all = (await request(app).get('/api/assignments').set(as(student)).expect(200)).body.assignments.map((a) => a.title);
    assert.ok(all.includes('Other class work'));
    // change teacher from the profile
    const me = (await request(app).patch('/api/auth/me').set(as(s2)).send({ teacherId: t2.user.id }).expect(200)).body;
    assert.equal(me.teacher_name, 'Mr Fernando');
    const seen2 = (await request(app).get('/api/assignments').set(as(s2)).expect(200)).body.assignments.map((a) => a.title);
    assert.deepEqual(seen2, ['Other class work']);
    await request(app).patch('/api/auth/me').set(as(s2)).send({ teacherId: s2.user.id }).expect(400); // not a teacher
    await request(app).patch('/api/auth/me').set(as(t2)).send({ teacherId: tid }).expect(400); // teachers don't pick
    await request(app).patch('/api/auth/me').set(as(s2)).send({}).expect(400);
    // teacher class progress only lists their own students
    await request(app).put('/api/progress').set(as(s2)).send({ prog: { 1: 10 } }).expect(200);
    const pr = (await request(app).get('/api/progress').set(as(teacher)).expect(200)).body.progress.map((x) => x.name);
    assert.ok(!pr.includes('Nimal'));
    const pr2 = (await request(app).get('/api/progress').set(as(t2)).expect(200)).body.progress.map((x) => x.name);
    assert.ok(pr2.includes('Nimal'));
  });
  it('teachers delete their assignment', async () => {
    await request(app).delete(`/api/assignments/${assignmentId}`).set(as(student)).expect(403);
    await request(app).delete(`/api/assignments/${assignmentId}`).set(as(teacher)).expect(204);
  });
  it('unknown routes are 404 and CORS only allows listed origins', async () => {
    await request(app).get('/api/nope').expect(404);
    const ok = await request(app).get('/api/health').set('Origin', 'https://learn-physics-3d.vercel.app');
    assert.equal(ok.headers['access-control-allow-origin'], 'https://learn-physics-3d.vercel.app');
    const no = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    assert.equal(no.headers['access-control-allow-origin'], undefined);
  });
});
