# Learn Physics API

The REST API for Learn Physics Lab. It handles student/teacher accounts, assignments (publish, enroll, complete), assignment comments and community posts. It uses **Node.js 22 LTS**, **Express 5** and **Supabase** (Postgres and Auth).

## How it works

- **Sign-up and sign-in** use Supabase Auth with email and password. Choosing *Teacher* at sign-up needs the school's teacher code. The API checks the code, and a database trigger checks it again, so nobody can give themselves the teacher role by calling Supabase directly.
- **Every data request runs as the signed-in user.** The API forwards the user's access token to Supabase, and row-level security in the database decides what each user may read or change. The API only needs the public **anon** key. No service-role key is used.
- **Request checks:**
  - every request body, query and path parameter is validated with zod;
  - security headers are set with helmet;
  - only origins on the CORS allow-list may call the API;
  - requests are rate-limited, with a tighter limit on `/api/auth/*`;
  - request bodies are capped at 32 KB;
  - logs are structured (pino), with the `Authorization` header redacted.

## Classes

A student chooses a teacher at sign-up or later on their profile (`profiles.teacher_id`; the database only accepts real teachers). A student with a teacher sees only that teacher's assignments, and class results show their classmates only. Teachers see only their own students in class progress and class results. A student with no teacher sees everything.

## Setup

1. Create the tables. In your Supabase project, open **SQL Editor** and run `supabase/migrations/0001_schema.sql`, then `0002_teacher_link.sql`.
2. Set your teacher code:
   ```sql
   insert into private.settings (key, value) values ('teacher_code', 'YOUR-CODE')
   on conflict (key) do update set value = excluded.value;
   ```
3. In **Authentication → Sign In / Providers**, turn off **Confirm email** so users can sign in straight after signing up. If you keep it on, set the Site URL to the frontend's address.
4. In **Authentication → URL Configuration**, set **Site URL** to the frontend's address (for example `https://learn-physics-3d.vercel.app`) and add it under **Redirect URLs**. Password-reset emails link back there.
5. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (from **Project Settings → API**).

```bash
npm install
npm run dev      # http://localhost:4000/api/health
npm test         # route tests against an in-memory database
```

## Deploy

**Vercel:** create a new Vercel project from this repo with **Root Directory = `backend`**. Add these environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CORS_ORIGINS`: the frontend URL, for example `https://learn-physics-3d.vercel.app`

`api/index.js` is the Vercel entry point, and `vercel.json` sends every path to it.

**Docker or any Node host:** `docker build -t learn-physics-api . && docker run -p 4000:4000 --env-file .env learn-physics-api`

Once the API is deployed, set `VITE_API_URL` on the frontend's Vercel project to the API's address, for example `https://learn-physics-api.vercel.app/api`.

## Endpoints

All paths start with `/api`. Paths marked 🔒 need `Authorization: Bearer <access_token>`.

| Method | Path | Who | Body / query |
|---|---|---|---|
| GET | `/health` | anyone | |
| GET | `/auth/teachers` | anyone | registered teachers `{ teachers: [{ id, name }] }` (for the sign-up form) |
| POST | `/auth/signup` | anyone | `{ email, password, name, role: "student"\|"teacher", teacherCode?, teacherId? }` |
| POST | `/auth/login` | anyone | `{ email, password }` → `{ session, user }` |
| POST | `/auth/refresh` | anyone | `{ refresh_token }` → `{ session }` |
| POST | `/auth/forgot` | anyone | `{ email }` → always `{ ok: true }`; Supabase emails a reset link back to `APP_URL` |
| POST | `/auth/reset` | holder of a reset link | `{ access_token, refresh_token, password }` (tokens from the link) → `{ session, user }` |
| GET / PATCH | `/auth/me` 🔒 | signed in | returns `teacher_id`, `teacher_name`; PATCH `{ name?, teacherId? }` (students change their teacher) |
| GET | `/assignments` 🔒 | signed in | students get `my_status`; teachers also get `enrolled_count` and `completed_count` |
| POST | `/assignments` 🔒 | teacher | `{ title, description?, prac?, due? (YYYY-MM-DD) }` |
| GET | `/assignments/:id` 🔒 | signed in | includes comments; teachers also get the enrollment list |
| PATCH / DELETE | `/assignments/:id` 🔒 | the teacher who published it | |
| POST / DELETE | `/assignments/:id/enroll` 🔒 | student | |
| POST | `/assignments/:id/complete` 🔒 | enrolled student | `{ note?, done? }` |
| POST | `/assignments/:id/comments` 🔒 | signed in | `{ body }` |
| DELETE | `/comments/:id` 🔒 | the comment's author or a teacher | |
| GET / POST | `/posts` 🔒 | signed in | GET `?prac=&limit=`; POST `{ body, prac?, parent? }` |
| DELETE | `/posts/:id` 🔒 | the post's author or a teacher | |
| GET / PUT | `/results` 🔒 | signed in | PUT `{ prac, vals: { key: number } }` |
| GET / PUT | `/progress` 🔒 | students see their own, teachers see the class | PUT `{ prog: { "1": 0–100 } }` |

Errors are returned as `{ "error": "<code>", "message": "<readable text>" }`.
