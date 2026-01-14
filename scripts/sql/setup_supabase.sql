-- Supabase setup: tables, RLS, and trigger to avoid sign-up DB errors

-- 1) Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('consumer','salon','staff','admin')) default 'consumer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy if not exists "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy if not exists "profiles upsert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy if not exists "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 2) After-insert trigger to auto-create profile from auth.users (optional but recommended)
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
    coalesce(new.raw_user_meta_data->>'role','consumer')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$;

-- Attach trigger to auth.users
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

-- Read for all (optional)
create policy if not exists "salons read all"
  on public.salons for select
  to anon, authenticated
  using (true);

-- Insert allowed only by owner
create policy if not exists "salons insert by owner"
  on public.salons for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Update allowed only by owner
create policy if not exists "salons update by owner"
  on public.salons for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 4) Staff table (for employees linked to salons)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text check (role in ('stylist','therapist','admin')) default 'stylist',
  created_at timestamptz default now()
);

alter table public.staff enable row level security;

-- Read staff for all (optional)
create policy if not exists "staff read all"
  on public.staff for select
  to anon, authenticated
  using (true);

-- Manage staff by salon owners
create policy if not exists "staff manage by owner"
  on public.staff for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

create policy if not exists "staff update by owner"
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

create policy if not exists "services read all"
  on public.services for select
  to anon, authenticated
  using (true);

create policy if not exists "services manage by owner"
  on public.services for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

create policy if not exists "services update by owner"
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

create policy if not exists "appointments read all"
  on public.appointments for select
  to anon, authenticated
  using (true);

create policy if not exists "appointments insert by user"
  on public.appointments for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "appointments update by user"
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

create policy if not exists "deals read all"
  on public.deals for select
  to anon, authenticated
  using (true);

create policy if not exists "deals manage by owner"
  on public.deals for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.owner_id = auth.uid()
    )
  );

create policy if not exists "deals update by owner"
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
