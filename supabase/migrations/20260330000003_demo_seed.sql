-- ============================================================
-- WedMe — Demo Seed (Sub-projects 1–4 content)
-- Run AFTER 20260330000002_booking_platform.sql
-- Adds portfolio photos, packages, and availability for
-- two demo vendors so the app shows real content immediately.
-- URL: https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

-- ── Helper: get vendor ids by name ───────────────────────────
-- We'll reference them inline via subquery.

-- ─────────────────────────────────────────────────────────────
-- VENDOR A: Photo Choice Nepal  (Photography)
-- ─────────────────────────────────────────────────────────────

-- Packages
insert into public.packages (vendor_id, name, description, price_label, duration, is_featured, display_order)
values
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'Silver Coverage',
    'Full ceremony and reception coverage. Edited gallery of 300+ images delivered within 3 weeks. Includes one printed album.',
    'NPR 45,000',
    '6 hours',
    false,
    0
  ),
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'Gold Coverage',
    'All-day coverage from mehndi to reception. 500+ edited images, drone shots, same-day highlights reel, two printed albums.',
    'NPR 75,000',
    'Full Day',
    true,
    1
  ),
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'Platinum Weekend',
    'Full two-day coverage across all events. 700+ images, cinematic video highlights, premium flush-mount album, online gallery.',
    'NPR 1,20,000',
    '2 Days',
    false,
    2
  );

-- Portfolio photos — Wedding Day album
insert into public.portfolio_photos (vendor_id, url, caption, album_name, event_tag, display_order)
values
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
    'First look at Pashupatinath',
    'Wedding Day',
    'Ceremony',
    0
  ),
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80',
    'Vow exchange at golden hour',
    'Wedding Day',
    'Ceremony',
    1
  ),
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
    'Bridal portrait series',
    'Wedding Day',
    'Portrait',
    2
  ),
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    'Reception candids',
    'Wedding Day',
    'Reception',
    3
  );

-- Portfolio photos — Pre-Wedding album
insert into public.portfolio_photos (vendor_id, url, caption, album_name, event_tag, display_order)
values
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'https://images.unsplash.com/photo-1481214110143-ed630356e1bb?w=800&q=80',
    'Sunset session, Nagarkot',
    'Pre-Wedding',
    'Outdoor Shoot',
    0
  ),
  (
    (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
    'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&q=80',
    'Garden shoot, Godavari',
    'Pre-Wedding',
    'Outdoor Shoot',
    1
  );

-- Availability: April & May 2026
-- Mark most weekdays as available, weekends blocked, a few mid-week blocked
insert into public.availability (vendor_id, date, status)
select
  (select id from public.vendor_listings where name = 'Photo Choice Nepal' limit 1),
  d::date,
  case
    when extract(dow from d) in (0, 6) then 'blocked'   -- weekends blocked
    when d::date in (
      '2026-04-10', '2026-04-17', '2026-04-23',
      '2026-05-01', '2026-05-08', '2026-05-14', '2026-05-22'
    ) then 'blocked'   -- specific booked/busy days
    else 'available'
  end
from generate_series('2026-04-01'::date, '2026-05-31'::date, '1 day'::interval) d
on conflict (vendor_id, date) do update set status = excluded.status;


-- ─────────────────────────────────────────────────────────────
-- VENDOR B: 11:11 Decoration  (Decor)
-- ─────────────────────────────────────────────────────────────

-- Packages
insert into public.packages (vendor_id, name, description, price_label, duration, is_featured, display_order)
values
  (
    (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
    'Bloom Essentials',
    'Stage backdrop, entrance arch, table centrepieces (up to 10 tables), floral garlands. Setup and teardown included.',
    'NPR 35,000',
    'Same Day',
    false,
    0
  ),
  (
    (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
    'Grand Celebration',
    'Full venue transformation: stage, entrance, aisle, table setups (up to 20 tables), floral walls, hanging installations, LED lighting.',
    'NPR 80,000',
    'Full Day Setup',
    true,
    1
  ),
  (
    (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
    'Premium Mandap Package',
    'Traditional mandap with premium flowers, draping, marigold garlands, entrance gate, stage decor. Priest coordination included.',
    'NPR 55,000',
    'Full Day',
    false,
    2
  );

-- Portfolio photos — Receptions album
insert into public.portfolio_photos (vendor_id, url, caption, album_name, event_tag, display_order)
values
  (
    (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80',
    'Fairy-light ceiling installation',
    'Receptions',
    'Reception',
    0
  ),
  (
    (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
    'Mandap with marigold arch',
    'Receptions',
    'Ceremony',
    1
  ),
  (
    (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    'Floral centrepiece design',
    'Receptions',
    'Table Decor',
    2
  );

-- Availability: April & May 2026
insert into public.availability (vendor_id, date, status)
select
  (select id from public.vendor_listings where name = '11:11 Decoration Nepal' limit 1),
  d::date,
  case
    when extract(dow from d) in (1) then 'blocked'   -- Mondays blocked (setup recovery)
    when d::date in (
      '2026-04-05', '2026-04-12', '2026-04-19', '2026-04-26',
      '2026-05-03', '2026-05-10', '2026-05-17', '2026-05-24'
    ) then 'blocked'   -- already booked Sundays
    else 'available'
  end
from generate_series('2026-04-01'::date, '2026-05-31'::date, '1 day'::interval) d
on conflict (vendor_id, date) do update set status = excluded.status;


-- ─────────────────────────────────────────────────────────────
-- VENDOR C: Hotel Shanker  (Venue)
-- ─────────────────────────────────────────────────────────────

-- Packages
insert into public.packages (vendor_id, name, description, price_label, duration, is_featured, display_order)
values
  (
    (select id from public.vendor_listings where name = 'Hotel Shanker' limit 1),
    'Garden Hall — Day',
    'Garden lawn for up to 150 guests. Basic AV setup, in-house catering menu, dedicated event manager, valet parking.',
    'NPR 1,50,000',
    'Half Day (4hrs)',
    false,
    0
  ),
  (
    (select id from public.vendor_listings where name = 'Hotel Shanker' limit 1),
    'Palace Ballroom',
    'Grand ballroom for 300–500 guests. Full AV and stage, customisable decor package, premium catering, honeymoon suite overnight.',
    'NPR 4,50,000',
    'Full Day',
    true,
    1
  ),
  (
    (select id from public.vendor_listings where name = 'Hotel Shanker' limit 1),
    'Intimate Terrace',
    'Rooftop terrace for up to 60 guests. Panoramic Kathmandu views, cocktail setup, curated menu, private butler service.',
    'NPR 90,000',
    '3 hours',
    false,
    2
  );

-- Availability: April & May 2026
insert into public.availability (vendor_id, date, status)
select
  (select id from public.vendor_listings where name = 'Hotel Shanker' limit 1),
  d::date,
  case
    when d::date in (
      '2026-04-04', '2026-04-05',
      '2026-04-11', '2026-04-12',
      '2026-04-18', '2026-04-19',
      '2026-04-25', '2026-04-26',
      '2026-05-02', '2026-05-03',
      '2026-05-09', '2026-05-10',
      '2026-05-16', '2026-05-17',
      '2026-05-23', '2026-05-24',
      '2026-05-30', '2026-05-31'
    ) then 'blocked'   -- weekends booked up
    else 'available'
  end
from generate_series('2026-04-01'::date, '2026-05-31'::date, '1 day'::interval) d
on conflict (vendor_id, date) do update set status = excluded.status;
