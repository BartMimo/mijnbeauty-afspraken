-- Supabase setup (compat): tables, RLS, and trigger without IF NOT EXISTS
-- Includes pgcrypto for gen_random_uuid()

create extension if not exists pgcrypto;

-- 1) Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('consumer','salon','staff','admin')) default 'consumer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Non-unique index on email to support lookups without causing sign-up conflicts
create index if not exists profiles_email_idx on public.profiles (email);

-- Policies: drop before create to avoid duplicates
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Trigger to auto-create profile from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(
      (new.raw_user_meta_data->>'role')::user_role,
      'consumer'::user_role
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Salons table
create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  city text,
  address text,
  created_at timestamptz default now()
);

alter table public.salons enable row level security;

drop policy if exists "salons read all" on public.salons;
create policy "salons read all"
  on public.salons for select
  to anon, authenticated
  using (true);

drop policy if exists "salons insert by owner" on public.salons;
create policy "salons insert by owner"
  on public.salons for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "salons update by owner" on public.salons;
create policy "salons update by owner"
  on public.salons for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 4) Staff table
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text check (role in ('stylist','therapist','admin')) default 'stylist',
  created_at timestamptz default now()
);

alter table public.staff enable row level security;

drop policy if exists "staff read all" on public.staff;
create policy "staff read all"
  on public.staff for select
  to anon, authenticated
  using (true);

drop policy if exists "staff manage by owner" on public.staff;
create policy "staff manage by owner"
  on public.staff for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "staff update by owner" on public.staff;
create policy "staff update by owner"
  on public.staff for update
  to authenticated
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

-- 5) Services table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  duration_minutes int,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

drop policy if exists "services read all" on public.services;
create policy "services read all"
  on public.services for select
  to anon, authenticated
  using (true);

drop policy if exists "services manage by owner" on public.services;
create policy "services manage by owner"
  on public.services for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "services update by owner" on public.services;
create policy "services update by owner"
  on public.services for update
  to authenticated
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

-- 6) Appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  date date,
  time text,
  status text check (status in ('confirmed','completed','pending','cancelled')) default 'pending',
  price numeric
);

alter table public.appointments enable row level security;

drop policy if exists "appointments read all" on public.appointments;
create policy "appointments read all"
  on public.appointments for select
  to anon, authenticated
  using (true);

drop policy if exists "appointments insert by user" on public.appointments;
create policy "appointments insert by user"
  on public.appointments for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "appointments update by user" on public.appointments;
create policy "appointments update by user"
  on public.appointments for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 7) Deals table
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  service_name text,
  original_price numeric,
  discount_price numeric,
  date text,
  time text,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.deals enable row level security;

drop policy if exists "deals read all" on public.deals;
create policy "deals read all"
  on public.deals for select
  to anon, authenticated
  using (true);

drop policy if exists "deals manage by owner" on public.deals;
create policy "deals manage by owner"
  on public.deals for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "deals update by owner" on public.deals;
create policy "deals update by owner"
  on public.deals for update
  to authenticated
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );
