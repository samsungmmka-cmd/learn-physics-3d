import { z } from 'zod';

const text = (min, max) => z.string().trim().min(min).max(max);
const prac = (min = 1) => z.coerce.number().int().min(min).max(42);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const uuidParam = z.object({ id: z.uuid() });

export const signUp = z.object({
  email: z.email().max(200).transform((s) => s.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  name: text(1, 60),
  role: z.enum(['student', 'teacher']).default('student'),
  teacherCode: z.string().trim().max(100).optional(),
  teacherId: z.uuid().nullable().optional(),
}).refine((b) => b.role !== 'teacher' || !!b.teacherCode, { message: 'Teacher code is required', path: ['teacherCode'] });

export const signIn = z.object({
  email: z.email().max(200).transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const forgot = z.object({
  email: z.email().max(200).transform((s) => s.toLowerCase()),
});
export const resetPassword = z.object({
  access_token: z.string().min(20).max(4000),
  refresh_token: z.string().min(5).max(2000),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export const refresh = z.object({ refresh_token: z.string().min(10).max(2000) });
export const updateMe = z.object({ name: text(1, 60).optional(), teacherId: z.uuid().nullable().optional() })
  .refine((b) => b.name !== undefined || b.teacherId !== undefined, { message: 'Nothing to update' });

export const createAssignment = z.object({
  title: text(1, 120),
  description: z.string().trim().max(2000).default(''),
  prac: prac().nullable().default(null),
  due: isoDate.nullable().default(null),
});
export const updateAssignment = z.object({
  title: text(1, 120).optional(),
  description: z.string().trim().max(2000).optional(),
  prac: prac().nullable().optional(),
  due: isoDate.nullable().optional(),
}).refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' });

export const complete = z.object({
  note: z.string().trim().max(1000).default(''),
  done: z.boolean().default(true),
});
export const comment = z.object({ body: text(1, 1000) });

export const listPosts = z.object({
  prac: prac(0).optional(),
  limit: z.coerce.number().int().min(1).max(300).default(200),
});
export const createPost = z.object({
  body: text(1, 2000),
  prac: prac(0).default(0),
  parent: z.uuid().nullable().default(null),
});

export const listResults = z.object({ prac: prac().optional() });
export const putResult = z.object({
  prac: prac(),
  vals: z.record(z.string().max(40), z.number().finite()).refine((v) => Object.keys(v).length <= 20, 'Up to 20 values'),
});
export const putProgress = z.object({
  prog: z.record(z.string().regex(/^\d{1,2}$/), z.number().min(0).max(100)),
});
