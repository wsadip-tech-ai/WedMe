# Landing Page Redesign — Design Spec
**Date:** 2026-03-30
**Status:** Approved
**Scope:** LandingPage.jsx visual upgrade + real Kathmandu vendor seed data

---

## 1. Goal

Elevate the landing page to convey luxury, prestige, and ceremony while connecting emotionally with couples planning weddings and events in Kathmandu. Show real vendors immediately so first-time visitors understand what the platform offers.

---

## 2. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Hero background | Full-bleed wedding photography + dark gradient overlay | Immediate emotional connection, shows what couples are planning for |
| Vendor section layout | Category filter tabs + photo cards | Interactive exploration, users browse by what they need |
| Vendor data source | Supabase (`vendor_listings` table) | Real data, scales as real vendors join |
| Seeding approach | SQL seed script (run in Supabase SQL Editor) | No code change needed, service-role bypass handles FK constraints |
| Religion targeting | None — platform is for all traditions | User decision: "common to all religions" |

---

## 3. Hero Section

- **Background:** Full-bleed Unsplash wedding photo, `object-fit: cover`, `object-position: center`
- **Overlay:** `linear-gradient(to bottom, rgba(11,9,6,0.35) 0%, rgba(11,9,6,0.75) 55%, var(--void) 100%)` — fades to page background, no hard edge
- **Content (centred, above overlay):**
  - Kicker: `YOUR WEDDING & EVENT PLANNING PLATFORM` (gold, spaced caps)
  - H1: `Your Perfect Wedding Begins Here` (Cormorant Garamond, ~5.5rem, cream)
  - Subtext: `Discover and connect with the finest photographers, venues, makeup artists, and more — all in Kathmandu.`
  - CTAs: `Find Vendors` (gold filled) + `List Your Business` (gold outline)
- **Spinning mandala:** Keep at opacity 0.04 — adds depth without competing with photo

---

## 4. Featured Vendors Section

### Layout
- Section heading: `Find Your Perfect Vendors in Kathmandu`
- Category filter pills (horizontal scroll on mobile): All · Photography · Venue · Makeup · Catering · Decor · Music · Mehendi · Pandit
- Active pill: gold background, dark text
- Inactive pill: gold border, muted text
- Below pills: 3-column grid of `VendorCard` components (existing component, no changes)
- Loading state: 3 skeleton cards (grey rectangles, same size as cards)
- Footer of section: `View all [category] vendors →` link

### Data
- `useEffect` re-fetches from Supabase on tab change
- Query: `select * from vendor_listings where category = $cat order by created_at desc limit 3`
- "All" tab: no category filter, `limit 6`
- No auth required — `vendor_listings` has `public read` RLS policy

### Seed data
- 20 real Kathmandu vendors across 8 categories (see `supabase/migrations/20260330000001_seed_kathmandu_vendors.sql`)
- Photos sourced from Unsplash (free, no attribution required for display)

---

## 5. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/LandingPage.jsx` | Full rewrite — photo hero + vendor section |
| `supabase/migrations/20260330000001_seed_kathmandu_vendors.sql` | New seed script |

`VendorCard.jsx` is used as-is — no changes needed.

---

## 6. What the User Needs to Do in Supabase

1. Go to `https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new`
2. Run `supabase/migrations/20260329000001_wedme_schema.sql` (creates tables, RLS, triggers)
3. Run `supabase/migrations/20260330000001_seed_kathmandu_vendors.sql` (inserts 20 vendors)
4. Dev server at `http://localhost:5174` will show live data immediately
