-- EZEE VISION CHAMPUA: initial authentication/profile foundation
-- Run this file in Supabase Dashboard -> SQL Editor.
-- Public sign-ups are ALWAYS parents. Teacher role is assigned manually by the owner.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'parent' check (role in ('teacher', 'parent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read only their own profile. There is no client-side role update policy.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;

-- Create a parent profile for every public auth sign-up.
-- Role is intentionally hard-coded to 'parent'; a client cannot self-assign teacher access.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'parent'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- OWNER-ONLY TEACHER PROMOTION:
-- 1) First create the teacher user in Supabase Dashboard -> Authentication -> Users -> Add user.
-- 2) Replace the email below with the exact owner/teacher email and run this statement separately.
-- The profile trigger initially creates role='parent'; this SQL promotes that specific account.
-- Do NOT expose this SQL/admin action inside the mobile application.
--
-- update public.profiles
-- set role = 'teacher', updated_at = now()
-- where id = (
--   select id from auth.users where lower(email) = lower('YOUR_TEACHER_EMAIL@example.com')
-- );
