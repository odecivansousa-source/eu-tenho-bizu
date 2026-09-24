-- EU TENHO BIZÚ - banco inicial
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'student' check (role in ('student','admin')),
  access_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('concurso','detran')),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  statement text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_e text not null,
  correct_option text not null check (correct_option in ('A','B','C','D','E')),
  explanation text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  score integer not null default 0,
  total integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option text check (selected_option in ('A','B','C','D','E')),
  is_correct boolean not null default false
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subjects enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update using (public.is_admin());

drop policy if exists "categories read active" on public.categories;
create policy "categories read active" on public.categories for select using (active = true or public.is_admin());

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subjects read" on public.subjects;
create policy "subjects read" on public.subjects for select using (true);

drop policy if exists "subjects admin write" on public.subjects;
create policy "subjects admin write" on public.subjects for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "questions read active" on public.questions;
create policy "questions read active" on public.questions for select using (active = true or public.is_admin());

drop policy if exists "questions admin write" on public.questions;
create policy "questions admin write" on public.questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "attempts own" on public.attempts;
create policy "attempts own" on public.attempts for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "answers own" on public.attempt_answers;
create policy "answers own" on public.attempt_answers for all using (
  exists(select 1 from public.attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin()))
) with check (
  exists(select 1 from public.attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin()))
);

insert into public.categories (name,type,description)
select 'Polícia Penal', 'concurso', 'Preparação por matérias para concursos da área penal.'
where not exists (select 1 from public.categories where name='Polícia Penal');

insert into public.categories (name,type,description)
select 'DETRAN - Primeira Habilitação', 'detran', 'Legislação, sinalização, direção defensiva e conteúdos da primeira habilitação.'
where not exists (select 1 from public.categories where name='DETRAN - Primeira Habilitação');