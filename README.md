# Cubiphy

*Measure · Observe · Record · Share*: physics practicals in 3D.

Interactive 3D practicals for G.C.E. (A/L) Physics, following the NIE *Practical Handbook*, in **Sinhala, English and Tamil**, with a class community for students and teachers.

- **3D practicals (01–04):** vernier caliper, micrometer screw gauge, spherometer, travelling microscope. Each follows the handbook sections: apparatus → theory → procedure → readings and calculations → results.
- **Realistic instruments:** Three.js with PBR materials, studio lighting, soft shadows and transmissive glass, plus a magnified scale for reading.
- **Community (Supabase):** discussion, shared class results (dot charts), class progress for teachers, and assignments.

## Stack
React 18 + Vite 5, Three.js r147, Supabase (auth, Postgres with RLS, realtime). Deployed on Vercel.

## Run locally
```bash
npm install
cp .env.example .env   # add your Supabase URL and anon (publishable) key
npm run dev
```
Without the env vars the practicals still work. Progress is saved in the browser, and Community shows a "not configured" note.

## Supabase setup
1. Run `supabase/migrations/0001_init.sql` in the SQL editor (or apply it as a migration).
2. **Authentication → URL Configuration:** set the Site URL to your Vercel domain and add it to Redirect URLs (magic-link sign-in).
3. Make a teacher: `update public.profiles set role = 'teacher' where id = (select id from auth.users where email = 'teacher@school.lk');`

Students sign in with an email link. They can post, share results and save their lab work to their account. Teachers can also set assignments, see class progress and moderate posts. Row-level security enforces this on the server.

## Project layout
```
src/practicals/  one module per practical: handbook content (si/en), Tamil, start state
src/instruments/ one module per 3D instrument: rig, magnified scale, profile (see its README)
src/engine/      the shared Three.js stage (lighting, camera, labels)
src/data/        UI strings and the list of all 42 handbook practicals
src/lib/         state, calculations, i18n, API client
src/components/  app shell, Home, Lab + handbook sections, Community
scripts/         scaffold, check and smoke-test practicals
```

## Adding a practical
Ask Claude to "add practical N". It follows `.claude/skills/add-practical/SKILL.md`: reads practical N in
the handbook, reuses or builds the 3D instrument, fills every page in three languages, then runs
`npm run check` and `npm run smoke` before pushing. By hand: `npm run new:practical -- N --inst <type>`.

## Frontend and API

- `/` — the React frontend (Vite), deployed on Vercel.
- `/backend` — the Node.js API (Express and Supabase). See `backend/README.md` for setup, deployment and the endpoint list. The frontend calls the API at `VITE_API_URL`.
