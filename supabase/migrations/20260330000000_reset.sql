-- WedMe — Clean Reset
-- Run this FIRST in Supabase SQL Editor to wipe existing tables,
-- then run the schema migration, then run the seed.
-- URL: https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new

-- Drop triggers first
drop trigger if exists vendor_listings_updated_at on public.vendor_listings;
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;

-- Drop tables (cascade handles FK dependencies)
drop table if exists public.enquiries cascade;
drop table if exists public.shortlists cascade;
drop table if exists public.vendor_listings cascade;
drop table if exists public.profiles cascade;

-- Drop storage policies
drop policy if exists "vendor photos: owner upload" on storage.objects;
drop policy if exists "vendor photos: public read" on storage.objects;
drop policy if exists "vendor photos: owner delete" on storage.objects;

-- Remove seed auth user if it exists
delete from auth.users where id = '00000000-0000-0000-0000-000000000001';
