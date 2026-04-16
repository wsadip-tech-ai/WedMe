-- ============================================================
-- WedMe — Booking Platform (Sub-projects 1–4)
-- Run in Supabase SQL Editor after reset + schema + seed
-- URL: https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

-- ── Sub-project 1: Portfolio Photos ──────────────────────────
create table public.portfolio_photos (
  id            uuid        primary key default gen_random_uuid(),
  vendor_id     uuid        not null references public.vendor_listings(id) on delete cascade,
  url           text        not null,
  caption       text,
  album_name    text        not null default 'Portfolio',
  event_tag     text,
  display_order int         not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.portfolio_photos enable row level security;

create policy "portfolio: public read"
  on public.portfolio_photos for select using (true);

create policy "portfolio: vendor manage"
  on public.portfolio_photos for all
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ))
  with check (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- ── Sub-project 2: Service Packages ──────────────────────────
create table public.packages (
  id            uuid        primary key default gen_random_uuid(),
  vendor_id     uuid        not null references public.vendor_listings(id) on delete cascade,
  name          text        not null,
  description   text,
  price_label   text,        -- e.g. "NPR 45,000"
  duration      text,        -- e.g. "6 hours" / "Full day"
  is_featured   boolean     not null default false,
  display_order int         not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "packages: public read"
  on public.packages for select using (true);

create policy "packages: vendor manage"
  on public.packages for all
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ))
  with check (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- ── Sub-project 3: Availability ───────────────────────────────
create table public.availability (
  id        uuid    primary key default gen_random_uuid(),
  vendor_id uuid    not null references public.vendor_listings(id) on delete cascade,
  date      date    not null,
  status    text    not null check (status in ('available', 'blocked')) default 'available',
  unique(vendor_id, date)
);

alter table public.availability enable row level security;

create policy "availability: public read"
  on public.availability for select using (true);

create policy "availability: vendor manage"
  on public.availability for all
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ))
  with check (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- ── Sub-project 4: Bookings ───────────────────────────────────
create table public.bookings (
  id            uuid        primary key default gen_random_uuid(),
  vendor_id     uuid        not null references public.vendor_listings(id) on delete cascade,
  customer_id   uuid        not null references public.profiles(id) on delete cascade,
  package_id    uuid        references public.packages(id) on delete set null,
  booking_date  date        not null,
  status        text        not null check (status in ('pending','confirmed','declined')) default 'pending',
  customer_note text,
  vendor_note   text,
  created_at    timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Customer sees their own bookings
create policy "bookings: customer read"
  on public.bookings for select
  using (customer_id = auth.uid());

-- Vendor sees bookings for their listing
create policy "bookings: vendor read"
  on public.bookings for select
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- Customer creates bookings
create policy "bookings: customer insert"
  on public.bookings for insert
  with check (customer_id = auth.uid());

-- Vendor updates (confirm/decline) their bookings
create policy "bookings: vendor update"
  on public.bookings for update
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));
