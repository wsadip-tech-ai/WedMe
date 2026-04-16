-- WedMe Platform v2 — Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: one row per auth user, created by trigger on signup
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('consumer','vendor')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- vendor_listings: one listing per vendor account
create table if not exists public.vendor_listings (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  category    text not null check (category in ('photography','makeup','catering','decor','music','mehendi','pandit','venue')),
  tier        text not null check (tier in ('economy','mid','premium')),
  city        text not null,
  bio         text,
  price_range text,
  photo_urls  text[] default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- shortlists: many-to-many: consumer ↔ vendor
create table if not exists public.shortlists (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  vendor_id   uuid not null references public.vendor_listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, vendor_id)
);

-- enquiries: consumer sends enquiry to vendor
create table if not exists public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  vendor_id     uuid not null references public.vendor_listings(id) on delete cascade,
  message       text not null,
  status        text not null default 'pending' check (status in ('pending','read','replied')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists vendor_listings_owner_idx   on public.vendor_listings(owner_id);
create index if not exists vendor_listings_category_idx on public.vendor_listings(category);
create index if not exists vendor_listings_city_idx     on public.vendor_listings(city);
create index if not exists shortlists_user_idx          on public.shortlists(user_id);
create index if not exists enquiries_vendor_idx         on public.enquiries(vendor_id);
create index if not exists enquiries_from_user_idx      on public.enquiries(from_user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger vendor_listings_updated_at
  before update on public.vendor_listings
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'consumer'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.vendor_listings enable row level security;
alter table public.shortlists      enable row level security;
alter table public.enquiries       enable row level security;

-- PROFILES
-- Users can read any profile; only update their own
create policy "profiles: public read"
  on public.profiles for select using (true);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- VENDOR LISTINGS
-- Anyone authenticated can read; owners can insert/update/delete
create policy "vendor_listings: public read"
  on public.vendor_listings for select using (true);

create policy "vendor_listings: owner insert"
  on public.vendor_listings for insert
  with check (auth.uid() = owner_id);

create policy "vendor_listings: owner update"
  on public.vendor_listings for update
  using (auth.uid() = owner_id);

create policy "vendor_listings: owner delete"
  on public.vendor_listings for delete
  using (auth.uid() = owner_id);

-- SHORTLISTS
-- Users can only access their own shortlist rows
create policy "shortlists: own read"
  on public.shortlists for select
  using (auth.uid() = user_id);

create policy "shortlists: own insert"
  on public.shortlists for insert
  with check (auth.uid() = user_id);

create policy "shortlists: own delete"
  on public.shortlists for delete
  using (auth.uid() = user_id);

-- ENQUIRIES
-- Consumers can insert; vendors can read/update enquiries for their listing
create policy "enquiries: consumer insert"
  on public.enquiries for insert
  with check (auth.uid() = from_user_id);

create policy "enquiries: vendor read"
  on public.enquiries for select
  using (
    auth.uid() = from_user_id
    or auth.uid() in (
      select owner_id from public.vendor_listings where id = vendor_id
    )
  );

create policy "enquiries: vendor update status"
  on public.enquiries for update
  using (
    auth.uid() in (
      select owner_id from public.vendor_listings where id = vendor_id
    )
  );

-- ============================================================
-- STORAGE BUCKET FOR VENDOR PHOTOS
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vendor-photos', 'vendor-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "vendor photos: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read of all vendor photos
create policy "vendor photos: public read"
  on storage.objects for select
  using (bucket_id = 'vendor-photos');

-- Allow owners to delete their own photos
create policy "vendor photos: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'vendor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- SEED: Sample vendor data (for development/testing)
-- ============================================================
-- Uncomment to seed test data:
/*
insert into public.profiles (id, role, full_name)
  values ('00000000-0000-0000-0000-000000000001', 'vendor', 'Demo Vendor')
  on conflict (id) do nothing;

insert into public.vendor_listings (owner_id, name, category, tier, city, bio, price_range)
values
  ('00000000-0000-0000-0000-000000000001', 'Lens & Light Photography', 'photography', 'premium', 'Mumbai',
   'Award-winning wedding photographers specializing in candid Hindu ceremonies.', '₹1.5L – ₹3L'),
  ('00000000-0000-0000-0000-000000000001', 'Shringar Bridal Makeup', 'makeup', 'mid', 'Delhi',
   'Traditional and fusion bridal makeup for the modern Indian bride.', '₹25K – ₹60K');
*/
