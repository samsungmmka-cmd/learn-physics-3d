-- Students choose their teacher (at sign-up or later in their profile).
-- profiles.teacher_id points at a teacher's profile; teachers themselves have none.

alter table public.profiles add column if not exists teacher_id uuid references public.profiles (id) on delete set null;
create index if not exists profiles_teacher_idx on public.profiles (teacher_id);

-- Only a real teacher can be chosen, and teachers don't have a teacher.
create or replace function public.check_teacher_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.teacher_id is not null then
    if new.role = 'teacher' or new.teacher_id = new.id then new.teacher_id := null;
    elsif not exists (select 1 from public.profiles where id = new.teacher_id and role = 'teacher') then
      raise exception 'Chosen teacher does not exist' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create or replace trigger profiles_check_teacher before insert or update of teacher_id, role on public.profiles
  for each row execute function public.check_teacher_link();

-- Public list of teachers (id and name only) for the sign-up form.
create or replace function public.list_teachers()
returns table (id uuid, name text) language sql stable security definer set search_path = public as $$
  select p.id, p.name from public.profiles p where p.role = 'teacher' and coalesce(p.name, '') <> '' order by p.name;
$$;

-- New accounts: keep the teacher chosen at sign-up (ignored if it isn't a teacher).
create or replace function public.create_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  begin t := nullif(new.raw_user_meta_data ->> 'teacher_id', '')::uuid; exception when others then t := null; end;
  if t is not null and not exists (select 1 from public.profiles where id = t and role = 'teacher') then t := null; end if;
  insert into public.profiles (id, name, role, teacher_id)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 60), coalesce(new.raw_user_meta_data ->> 'role', 'student'),
          case when coalesce(new.raw_user_meta_data ->> 'role', 'student') = 'teacher' then null else t end)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Privileges: students may change their own teacher (the existing "edit own" policy limits it to their row).
grant update (teacher_id) on public.profiles to authenticated;
grant execute on function public.list_teachers() to anon, authenticated;
revoke execute on function public.check_teacher_link() from public, anon, authenticated;
