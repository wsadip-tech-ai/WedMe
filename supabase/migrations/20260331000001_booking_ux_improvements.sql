-- ============================================================
-- WedMe — Booking UX Improvements Migration
-- Adds hourly time slots to availability, extends bookings
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

-- ── 1. Availability: add hourly slots ─────────────────────────

-- Drop the old unique constraint
alter table public.availability drop constraint if exists availability_vendor_id_date_key;

-- Add hour columns with defaults so existing rows survive
alter table public.availability
  add column start_hour int not null default 8  check (start_hour >= 8 and start_hour <= 21),
  add column end_hour   int not null default 9  check (end_hour   >= 9 and end_hour   <= 22);

-- Add check: end > start
alter table public.availability
  add constraint availability_hour_range check (end_hour > start_hour);

-- New unique constraint: one slot per vendor per date per start_hour
alter table public.availability
  add constraint availability_vendor_date_hour_key unique (vendor_id, date, start_hour);

-- Expand existing date-only rows into 14 hourly slots (8am–9pm)
do $$
declare
  r record;
  h int;
begin
  for r in
    select id, vendor_id, date, status from public.availability
    where start_hour = 8 and end_hour = 9
  loop
    delete from public.availability where id = r.id;
    for h in 8..21 loop
      insert into public.availability (vendor_id, date, start_hour, end_hour, status)
      values (r.vendor_id, r.date, h, h + 1, r.status)
      on conflict (vendor_id, date, start_hour) do nothing;
    end loop;
  end loop;
end $$;

-- Drop the defaults now that migration is done
alter table public.availability alter column start_hour drop default;
alter table public.availability alter column end_hour drop default;

-- ── 2. Bookings: add time and budget columns ─────────────────

alter table public.bookings
  alter column booking_date drop not null;

alter table public.bookings
  add column start_hour   int check (start_hour is null or (start_hour >= 8 and start_hour <= 21)),
  add column end_hour     int check (end_hour   is null or (end_hour   >= 9 and end_hour   <= 22)),
  add column budget_range text;
