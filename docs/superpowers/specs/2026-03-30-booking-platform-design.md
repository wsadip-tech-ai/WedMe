# WedMe Booking Platform — Design Spec

**Goal:** Enable customers to discover vendors, view their portfolio and packages, check availability, and book directly — replacing the enquiry-only flow.

**Architecture:** React 18 SPA + Supabase (Postgres + Auth + Storage). Four new database tables extend the existing schema. All vendor-facing management is behind AuthGuard (vendor role); customer booking is behind AuthGuard (consumer role).

**Stack:** React 18 · Vite 5 · React Router v6 · Zustand · Supabase · Vitest

---

## Sub-project 1 — Vendor Profile & Portfolio

**Layout:** Editorial full-width (Layout A).
- Full-bleed hero: first portfolio photo or vendor cover photo, vendor name/tier/city overlaid at bottom with gradient.
- About section: bio + price range in a card below the hero.
- Portfolio Albums: photos grouped by `album_name`, displayed in a responsive grid. Click any photo to open a lightbox with caption and event tag.
- Sections flow naturally downward; no sidebar.

**Data model:**
```sql
portfolio_photos(id, vendor_id, url, caption, album_name, event_tag, display_order, created_at)
```

**Vendor dashboard:** `/vendor/portfolio` — PortfolioManager. Upload photos to Supabase Storage (`vendor-photos/{uid}/`), assign album name + caption + event tag. Delete by removing from storage and DB.

---

## Sub-project 2 — Service Packages

**Customer view:** Package cards on vendor profile below portfolio. Each card shows name, price, duration, description. Featured packages get a "POPULAR" badge.

**Data model:**
```sql
packages(id, vendor_id, name, description, price_label, duration, is_featured, display_order, created_at)
```

**Vendor dashboard:** `/vendor/packages` — PackageManager. Full CRUD. Toggle featured flag. Drag-order not implemented (display_order set at insert time).

---

## Sub-project 3 — Availability Calendar

**Customer view:** Month calendar on vendor profile. Gold = available (clickable to book), red = blocked, grey = not set, gold ring = today. Arrow keys navigate dates. Clicking an available date opens the booking modal.

**Vendor dashboard:** `/vendor/availability` — AvailabilityManager. Click to cycle status (unset → available → blocked → unset). Spinner shows while async save completes. Quick-action buttons: mark all weekdays available, block all weekends, clear entire month.

**Data model:**
```sql
availability(id, vendor_id, date, status CHECK(available|blocked), UNIQUE(vendor_id,date))
```

---

## Sub-project 4 — Direct Booking

**Customer flow:**
1. Click available date on vendor profile → BookingModal opens.
2. Select package (optional), add note → "Request Booking".
3. Booking inserted as `status=pending`. Toast confirmation shown.
4. Customer views all bookings at `/my-bookings` (status badges: pending / confirmed / declined).

**Vendor flow:**
1. `/vendor/bookings` — BookingRequests page. Pending requests shown first.
2. Vendor adds an optional note back to the customer, then Confirm or Decline.
3. Status updates in real-time in customer's My Bookings.

**Data model:**
```sql
bookings(
  id, vendor_id, customer_id, package_id,
  booking_date DATE, status CHECK(pending|confirmed|declined),
  customer_note, vendor_note, created_at
)
```

**RLS:** Customer can insert/read own bookings. Vendor can read and update bookings for their listing.

---

## Independent Quick Fix — Location

- Removed "all in Kathmandu" from landing page hero copy.
- Removed "Kathmandu's Best" eyebrow → "Featured Vendors".
- VendorDiscovery already has a city text filter (`ilike '%city%'`).

---

## Mobile Responsiveness

- **Nav:** Hamburger menu (≤ 768px) → slide-in drawer with large Cormorant links, body scroll lock, closes on route change / Escape.
- **AvailabilityManager:** Right panel collapses below calendar at ≤ 640px.
- **VendorDashboard:** Quick-links and stat cards use 2-col grid at ≤ 480px.
- **VendorProfile hero:** `clamp(260px, 48vw, 480px)` — scales proportionally.
- **Portfolio grid:** 2-col on phones.
- All interactive elements: `minHeight: 44px` touch targets, `cursor: pointer`, focus rings, `prefers-reduced-motion` respected.

---

## Design System

| Token | Value |
|-------|-------|
| `--void` | `#0b0906` |
| `--gold` | `#c8963c` |
| `--cream` | `#f5efe6` |
| `--font-display` | Cormorant Garamond |
| `--font-body` | DM Sans |

Style: dark luxury editorial. No emojis as UI icons (SVG chevrons used in calendars). 140–280ms transitions throughout.

---

## Demo Seed

`20260330000003_demo_seed.sql` seeds three vendors with full content:
- **Photo Choice Nepal** — 3 packages, 6 portfolio photos across 2 albums, April–May availability
- **11:11 Decoration** — 3 packages, 3 portfolio photos, April–May availability
- **Hotel Shanker** — 3 packages, April–May availability

Run this migration last to get a demo-ready state without manual data entry.
