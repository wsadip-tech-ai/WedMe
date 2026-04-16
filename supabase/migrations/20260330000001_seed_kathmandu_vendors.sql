-- WedMe — Seed: Real Kathmandu Vendors
-- Run this in Supabase SQL Editor AFTER running the schema migration.
-- URL: https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
--
-- This creates a system-owned "WedMe Demo" profile and inserts
-- real Kathmandu wedding & event vendors under it.
-- The SQL editor runs as postgres superuser, bypassing RLS.

-- ── 1. Insert a system user into auth.users ──────────────────────────────────
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role
) values (
  '00000000-0000-0000-0000-000000000001',
  'seed@wedme.np',
  '',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"vendor","full_name":"WedMe Demo"}',
  false,
  'authenticated'
) on conflict (id) do nothing;

-- ── 2. Create matching profile ────────────────────────────────────────────────
insert into public.profiles (id, role, full_name)
values ('00000000-0000-0000-0000-000000000001', 'vendor', 'WedMe Demo')
on conflict (id) do nothing;

-- ── 3. Seed vendor listings ───────────────────────────────────────────────────
insert into public.vendor_listings
  (owner_id, name, category, tier, city, bio, price_range, photo_urls)
values

-- PHOTOGRAPHY
(
  '00000000-0000-0000-0000-000000000001',
  'Photo Choice Nepal',
  'photography', 'mid',
  'Koteshwor, Kathmandu',
  'One of Nepal''s most reviewed wedding photography studios with over a decade of experience. Full-day coverage, cinematic films, and premium albums.',
  'NPR 25,000 – 80,000',
  ARRAY['https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Photo Life Nepal',
  'photography', 'premium',
  'Thamel, Kathmandu',
  'Led by Sushil Gyawali with 15+ years of international experience. Specialises in modern cinematic wedding films and editorial stills.',
  'NPR 40,000 – 1,00,000',
  ARRAY['https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Blaze Byte Media',
  'photography', 'mid',
  'Kathmandu Valley',
  'Full-service production studio offering cinematic videography, drone aerial shots, and photography bundles for weddings and events.',
  'NPR 35,000 – 60,000',
  ARRAY['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80']
),

-- MAKEUP
(
  '00000000-0000-0000-0000-000000000001',
  'Zoom Beauty Academy & Studio',
  'makeup', 'mid',
  'Kupondole, Lalitpur',
  'Nepal''s No. 1 ISO-certified beauty academy with 23+ years of experience and 12 branches across the valley. Bridal packages available.',
  'NPR 10,000 – 20,000',
  ARRAY['https://images.unsplash.com/photo-1487530811015-780780a3cd44?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Ananeke Salon',
  'makeup', 'premium',
  'Baneshwor, Kathmandu',
  'Boutique salon specialising in royal, romantic, and contemporary bridal looks. Custom wedding day packages with hair and skin prep.',
  'NPR 12,000 – 22,000',
  ARRAY['https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80']
),

-- CATERING
(
  '00000000-0000-0000-0000-000000000001',
  'Mother''s Kitchen Nepal',
  'catering', 'economy',
  'Sifal, Kathmandu',
  'Home-style catering operating for 10+ years. Caters weddings, Pasni, and Bratabandha for 25–500 guests with authentic Nepali menus.',
  'NPR 1,200 – 1,800 per plate',
  ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Bhoj Bhater Catering',
  'catering', 'mid',
  'Lalitpur',
  'Specialises in traditional Nepali feast-style catering for weddings and cultural ceremonies. Authentic menus, full setup included.',
  'NPR 1,500 – 2,000 per plate',
  ARRAY['https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Smart Durbar Banquet & Catering',
  'catering', 'premium',
  'Chandol, Kathmandu',
  'Upscale catering frequently chosen for wedding receptions of 250–300 guests. Multi-cuisine menus, professional service staff.',
  'NPR 2,100 per plate',
  ARRAY['https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800&q=80']
),

-- DECOR
(
  '00000000-0000-0000-0000-000000000001',
  '11:11 Decoration Nepal',
  'decor', 'premium',
  'Jawalakhel, Lalitpur',
  'Specialises in wedding stage design, mandap setups, floral decor, and themed event styling. Known for elegant and modern installations.',
  'NPR 28,000 – 70,000',
  ARRAY['https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Nepal Flowers & Decoration',
  'decor', 'premium',
  'Kathmandu',
  'Established floral decoration company offering premium wedding packages including lighting, entrance arch, stage, and car decoration.',
  'NPR 40,000 – 1,00,000+',
  ARRAY['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Wedding Decoration Nepal',
  'decor', 'mid',
  'Lazimpat, Kathmandu',
  'Full-service decorator offering flower decor, car decoration, mandap design, and stage setup. Packages for all budgets.',
  'NPR 15,000 – 80,000',
  ARRAY['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80']
),

-- MUSIC
(
  '00000000-0000-0000-0000-000000000001',
  'Yubak Brass Band',
  'music', 'premium',
  'Chabahil, Kathmandu',
  'Operating since 1965. Nepal''s most established wedding brass band offering panche baja, naumati baja, orchestra, and bagpiper.',
  'NPR 55,000 – 80,000',
  ARRAY['https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Band Baja Nepal',
  'music', 'mid',
  'Stupa area, Kathmandu',
  'Popular wedding entertainment provider offering Band Baja, DJ sound systems, live bands, and chariot procession services.',
  'NPR 45,000 – 70,000',
  ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'KTM DJ Services',
  'music', 'economy',
  'Soalteemode, Kathmandu',
  'DJ-focused entertainment for wedding receptions, private parties, and cultural events. Professional sound and lighting setups.',
  'NPR 10,000 – 30,000',
  ARRAY['https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80']
),

-- MEHENDI
(
  '00000000-0000-0000-0000-000000000001',
  'Sabina''s Mehendi',
  'mehendi', 'premium',
  'Dhobighat, Lalitpur',
  'Internationally certified celebrity bridal henna artist active since 2006. One of Nepal''s most recognised mehendi professionals. Home service available.',
  'NPR 5,000 – 15,000',
  ARRAY['https://images.unsplash.com/photo-1595944024440-14e842a8c7b8?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Bhawani Mehendi Designs',
  'mehendi', 'economy',
  'Imadol, Lalitpur',
  'Bridal mehendi studio offering customised traditional and contemporary designs for weddings and ceremonies. Walk-ins and bookings welcome.',
  'NPR 2,000 – 3,500',
  ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80']
),

-- VENUE
(
  '00000000-0000-0000-0000-000000000001',
  'Silver Oak Banquet',
  'venue', 'mid',
  'Gairidhara, Kathmandu',
  'Centrally located upscale banquet with capacity for 350–700 guests. Buffet includes 7 starters, 10 mains, and 3 desserts. Parking available.',
  'NPR 2,500 per plate',
  ARRAY['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Hotel Shanker',
  'venue', 'premium',
  'Lazimpat, Kathmandu',
  'Historic heritage palace hotel with lush gardens. Can host up to 1,200 guests across multiple event spaces. Iconic Rana-era architecture.',
  'NPR 3,500 – 5,500 per plate',
  ARRAY['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Hyatt Regency Kathmandu',
  'venue', 'premium',
  'Thamel, Kathmandu',
  'Five-star luxury venue with the Regency Ballroom accommodating up to 800 guests. Top choice for premium weddings and corporate events.',
  'NPR 5,000 – 8,000 per plate',
  ARRAY['https://images.unsplash.com/photo-1561501878-aabd62634533?w=800&q=80']
),

-- PANDIT / CEREMONY OFFICIANTS
(
  '00000000-0000-0000-0000-000000000001',
  'Yagyashala Nepal',
  'pandit', 'mid',
  'Kausaltar, Bhaktapur',
  'Qualified Vedic pandit booking service serving the entire Kathmandu Valley. Handles Vivah Sanskar ceremonies, materials coordination, and scheduling.',
  'NPR 5,000 – 15,000',
  ARRAY['https://images.unsplash.com/photo-1567591370143-a5cf4b9e30f0?w=800&q=80']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Pashupatinath Ceremony Services',
  'pandit', 'premium',
  'Gaushala, Kathmandu',
  'Ceremonies conducted by assigned priests at Nepal''s most sacred site by the holy Bagmati River. Packages coordinated through licensed operators.',
  'NPR 3,000 – 10,000',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80']
);
