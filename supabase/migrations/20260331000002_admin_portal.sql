-- ============================================================
-- WedMe — Admin Portal Migration
-- Adds vendor status column, vendor_documents table, admin RLS
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

-- ── 1. Vendor status column ──────────────────────────────────

alter table public.vendor_listings
  add column status text not null default 'unverified'
  check (status in ('unverified', 'verified', 'suspended'));

-- Set all existing vendors to verified
update public.vendor_listings set status = 'verified' where status = 'unverified';

-- ── 2. Vendor documents table ────────────────────────────────

create table public.vendor_documents (
  id           uuid        primary key default gen_random_uuid(),
  vendor_id    uuid        not null references public.vendor_listings(id) on delete cascade,
  type         text        not null check (type in ('pdf', 'note')),
  url          text,
  filename     text,
  text_content text,
  created_at   timestamptz not null default now()
);

alter table public.vendor_documents enable row level security;

-- Vendors can read their own documents
create policy "vendor_documents: vendor read own"
  on public.vendor_documents for select
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- ── 3. Admin RLS policies (full access for admin email) ──────

create policy "admin: full access profiles"
  on public.profiles for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access vendor_listings"
  on public.vendor_listings for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access bookings"
  on public.bookings for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access enquiries"
  on public.enquiries for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access packages"
  on public.packages for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access availability"
  on public.availability for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access portfolio_photos"
  on public.portfolio_photos for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access shortlists"
  on public.shortlists for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

create policy "admin: full access vendor_documents"
  on public.vendor_documents for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');
