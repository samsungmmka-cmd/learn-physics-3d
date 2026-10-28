-- Learn Physics: users, roles, assignments, enrollments, comments, community posts.
-- Roles: 'student' (default) or 'teacher'. A teacher account needs the school's teacher code at sign-up;
-- the database checks it in a trigger, so the role can't be forged by calling Supabase directly.

create extension if not exists pgcrypto;

-- private settings (not exposed through the API)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.settings (key text primary key, value text not null);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 60),
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  prac int check (prac between 1 and 42),
  description text not null default '' check (char_length(description) <= 2000),
  due date,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists assignments_created_idx on public.assignments (created_at desc);
create index if not exists assignments_created_by_idx on public.assignments (created_by);

create table if not exists public.enrollments (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled', 'completed')),
  note text not null default '' check (char_length(note) <= 1000),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (assignment_id, student_id)
);
create index if not exists enrollments_student_idx on public.enrollments (student_id);

create table if not exists public.assignment_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists assignment_comments_assignment_idx on public.assignment_comments (assignment_id, created_at);
create index if not exists assignment_comments_author_idx on public.assignment_comments (author);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  prac int not null default 0 check (prac between 0 and 42),
  body text not null check (char_length(body) between 1 and 2000),
  parent uuid references public.posts (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_parent_idx on public.posts (parent);
create index if not exists posts_author_idx on public.posts (author);

create table if not exists public.results (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  prac int not null check (prac between 1 and 42),
  vals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, prac)
);

create table if not exists public.progress (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  prog jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- functions ----------
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;
revoke execute on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;

-- lets the sign-up form say "wrong teacher code" before creating the account
create or replace function public.check_teacher_code(code text)
returns boolean language sql stable security definer set search_path = public, private as $$
  select coalesce(code, '') <> '' and code = (select value from private.settings where key = 'teacher_code');
$$;
revoke execute on function public.check_teacher_code(text) from public;
grant execute on function public.check_teacher_code(text) to anon, authenticated;

-- BEFORE insert on auth.users: decide the role from the code, and never store the code itself
create or replace function public.decide_role()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb); r text := 'student';
begin
  if meta ->> 'role' = 'teacher' and (meta ->> 'teacher_code') = (select value from private.settings where key = 'teacher_code') then r := 'teacher'; end if;
  new.raw_user_meta_data := (meta - 'teacher_code') || jsonb_build_object('role', r);
  return new;
end;
$$;
-- AFTER insert: create the profile with that role
create or replace function public.create_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 60), coalesce(new.raw_user_meta_data ->> 'role', 'student'))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.decide_role() from public, anon, authenticated;
revoke execute on function public.create_profile() from public, anon, authenticated;
drop trigger if exists decide_role_before_signup on auth.users;
create trigger decide_role_before_signup before insert on auth.users for each row execute function public.decide_role();
drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users for each row execute function public.create_profile();

-- ---------- row-level security ----------
alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignment_comments enable row level security;
alter table public.posts enable row level security;
alter table public.results enable row level security;
alter table public.progress enable row level security;

create policy "profiles: signed-in read" on public.profiles for select to authenticated using (true);
create policy "profiles: edit own name" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "assignments: signed-in read" on public.assignments for select to authenticated using (true);
create policy "assignments: teachers publish" on public.assignments for insert to authenticated with check ((select public.is_teacher()) and created_by = (select auth.uid()));
create policy "assignments: author edits" on public.assignments for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "assignments: author deletes" on public.assignments for delete to authenticated using (created_by = (select auth.uid()));

create policy "enrollments: own or teacher read" on public.enrollments for select to authenticated using (student_id = (select auth.uid()) or (select public.is_teacher()));
create policy "enrollments: students enroll" on public.enrollments for insert to authenticated with check (student_id = (select auth.uid()) and status = 'enrolled' and not (select public.is_teacher()));
create policy "enrollments: student updates own" on public.enrollments for update to authenticated using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy "enrollments: student leaves" on public.enrollments for delete to authenticated using (student_id = (select auth.uid()));

create policy "comments: signed-in read" on public.assignment_comments for select to authenticated using (true);
create policy "comments: write own" on public.assignment_comments for insert to authenticated with check (author = (select auth.uid()));
create policy "comments: delete own or teacher" on public.assignment_comments for delete to authenticated using (author = (select auth.uid()) or (select public.is_teacher()));

create policy "posts: signed-in read" on public.posts for select to authenticated using (true);
create policy "posts: write own" on public.posts for insert to authenticated with check (author = (select auth.uid()));
create policy "posts: delete own or teacher" on public.posts for delete to authenticated using (author = (select auth.uid()) or (select public.is_teacher()));

create policy "results: signed-in read" on public.results for select to authenticated using (true);
create policy "results: write own" on public.results for insert to authenticated with check (user_id = (select auth.uid()));
create policy "results: update own" on public.results for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "progress: own or teacher read" on public.progress for select to authenticated using (user_id = (select auth.uid()) or (select public.is_teacher()));
create policy "progress: write own" on public.progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "progress: update own" on public.progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- table privileges (exactly what the policies need) ----------
grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.assignments, public.enrollments, public.assignment_comments, public.posts, public.results, public.progress from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;
grant select, insert, delete on public.assignments to authenticated;
grant update (title, prac, description, due) on public.assignments to authenticated;
grant select, insert, delete on public.enrollments to authenticated;
grant update (status, note, completed_at) on public.enrollments to authenticated;
grant select, insert, delete on public.assignment_comments, public.posts to authenticated;
grant select, insert, update on public.results, public.progress to authenticated;
