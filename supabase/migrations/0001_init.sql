-- Learn Physics: class community schema.
-- Everyone signed in can read shared class data; each person writes only their own rows.
-- Teachers are marked by role = 'teacher' (set by an admin; users cannot change their own role).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 60),
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  prac int not null default 0 check (prac between 0 and 42),
  body text not null check (char_length(body) between 1 and 2000),
  parent uuid references public.posts (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);

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

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  prac int not null check (prac between 1 and 42),
  due date,
  note text not null default '' check (char_length(note) <= 400),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- helper: is the caller a teacher? (security definer so RLS on profiles doesn't recurse)
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

-- create a profile automatically for every new account (name from sign-up metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.results enable row level security;
alter table public.progress enable row level security;
alter table public.assignments enable row level security;
alter table public.lab_state enable row level security;

-- profiles: all signed-in users read; each updates only their own name (role is not user-writable)
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;
-- accounts created before this migration can add their own profile, but only as a student
drop policy if exists "profiles insert own student" on public.profiles;
create policy "profiles insert own student" on public.profiles for insert to authenticated with check (id = auth.uid() and role = 'student');

-- posts: read all; write own; delete own, or any if teacher (moderation)
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select to authenticated using (true);
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert to authenticated with check (author = auth.uid());
drop policy if exists "posts delete own or teacher" on public.posts;
create policy "posts delete own or teacher" on public.posts for delete to authenticated using (author = auth.uid() or public.is_teacher());

-- results: read all (class comparison); write own
drop policy if exists "results read" on public.results;
create policy "results read" on public.results for select to authenticated using (true);
drop policy if exists "results insert own" on public.results;
create policy "results insert own" on public.results for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "results update own" on public.results;
create policy "results update own" on public.results for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- progress: own row, or every row for teachers
drop policy if exists "progress read own or teacher" on public.progress;
create policy "progress read own or teacher" on public.progress for select to authenticated using (user_id = auth.uid() or public.is_teacher());
drop policy if exists "progress insert own" on public.progress;
create policy "progress insert own" on public.progress for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "progress update own" on public.progress;
create policy "progress update own" on public.progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- assignments: read all; teachers create/delete
drop policy if exists "assignments read" on public.assignments;
create policy "assignments read" on public.assignments for select to authenticated using (true);
drop policy if exists "assignments teacher insert" on public.assignments;
create policy "assignments teacher insert" on public.assignments for insert to authenticated with check (public.is_teacher() and created_by = auth.uid());
drop policy if exists "assignments teacher delete" on public.assignments;
create policy "assignments teacher delete" on public.assignments for delete to authenticated using (public.is_teacher());

-- lab_state: private to its owner
drop policy if exists "lab_state own" on public.lab_state;
create policy "lab_state own" on public.lab_state for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- live updates for the community views
do $$ begin
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.results; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.assignments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
end $$;
