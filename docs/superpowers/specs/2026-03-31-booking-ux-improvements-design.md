# Sub-project A: Booking UX + Vendor Onboarding Improvements

**Date:** 2026-03-31
**Status:** Approved
**Goal:** Improve booking conversion by adding time slot granularity, modern date selection, budget matching, and structured vendor pricing.

---

## 1. Hourly Availability System

### Current State
- `availability` table stores one row per vendor per date: `(vendor_id, date, status)` where status is `available` or `blocked`.
- Vendor marks entire days as available/blocked via calendar UI.
- Customer clicks an available date to open booking modal — no time selection.

### New Behavior

**Vendor side (`AvailabilityManager.jsx`):**
- Calendar month view remains as the primary navigation.
- Clicking a date expands an **hourly slot panel** below the calendar showing 14 slots: 8am, 9am, 10am, 11am, 12pm, 1pm, 2pm, 3pm, 4pm, 5pm, 6pm, 7pm, 8pm, 9pm.
- Each hour slot is toggleable: available (gold) / blocked (red) / unset (grey).
- Quick actions adapt: "Mark all hours available", "Block all hours", "Clear day".
- Existing quick actions (mark weekdays, block weekends) should set all 14 hours for each day in the range.

**Customer side (`VendorProfile.jsx` calendar):**
- Calendar shows dates with a visual indicator of partial/full availability (e.g., gold = some hours available, bright gold = fully available, red = fully blocked).
- Clicking an available date shows the hourly breakdown in the booking modal, where the customer picks a time range.

### Database Change — `availability` table

**Drop and recreate** the `availability` table (or migrate with new columns):

```sql
-- New schema
create table public.availability (
  id        uuid    primary key default gen_random_uuid(),
  vendor_id uuid    not null references public.vendor_listings(id) on delete cascade,
  date      date    not null,
  start_hour int    not null check (start_hour >= 8 and start_hour <= 21),
  end_hour   int    not null check (end_hour >= 9 and end_hour <= 22),
  status    text    not null check (status in ('available', 'blocked')) default 'available',
  check (end_hour > start_hour),
  unique(vendor_id, date, start_hour)
);
```

Each row represents a contiguous time block on a given date. A fully available day could be a single row `(8, 22)` or individual hour rows `(8,9), (9,10), ...`.

**Decision: Individual hour rows.** Each row = one hour slot (start_hour, start_hour+1). Simpler to query, toggle, and block individual hours. 14 rows max per vendor per day.

**RLS policies:** Same as current — public read, vendor manage for own listings.

### Migration Strategy
- The existing `availability` data is demo/seed data only (April–May 2026 for 3 vendors).
- Migration: drop existing rows, recreate table with new schema, re-seed with hourly data.
- The demo seed will create individual hour slots for the same dates that were previously marked available.

---

## 2. Enhanced Booking Modal

### Current State
- Modal opens when customer clicks an available date on the calendar.
- Fields: package selector (optional), note to vendor (optional).
- Date is pre-filled from calendar click, not editable.

### How the Modal Opens

- **From calendar click** (existing): Customer clicks an available date → modal opens with date pre-filled, toggle OFF.
- **From "Book Now" button** (new): A new button in the vendor profile hero area (next to "Ask a Question") → modal opens with toggle ON (date not fixed), customer can turn it OFF and pick a date manually.

### New Booking Modal Fields

**In order of appearance:**

1. **"Date not fixed yet" toggle**
   - Default: OFF
   - When ON: hides date picker and time range fields. Booking is saved with `booking_date = null`, `start_hour = null`, `end_hour = null`.
   - Vendor sees these as tentative/interest bookings in a separate section.

2. **Date Picker** (shown when toggle is OFF)
   - Three dropdown selectors: Day / Month / Year
   - Pre-filled if customer clicked a date from the calendar
   - Customer can also change the date manually
   - Day dropdown: 1–31 (filtered by month)
   - Month dropdown: January–December
   - Year dropdown: current year and next year

3. **Time Range** (shown when toggle is OFF and date is selected)
   - Two dropdowns: Start Time / End Time
   - Options: 8:00 AM through 10:00 PM (hourly)
   - Only shows hours that are available for the selected date (fetched from `availability` table)
   - End time options filtered to be after start time
   - If no availability data for selected date, show all hours with a note: "Availability not published for this date"

4. **Budget Range** (always shown)
   - Dropdown with category-specific ranges (see Section 4)
   - Includes "Not decided yet" option
   - Category determined from the vendor's listing

5. **Select Package** (always shown, existing behavior)
   - Dropdown of vendor's packages
   - "No specific package" default option

6. **Note to vendor** (always shown, existing behavior)
   - Textarea, optional

### Database Change — `bookings` table

```sql
alter table public.bookings
  alter column booking_date drop not null,
  add column start_hour int check (start_hour is null or (start_hour >= 8 and start_hour <= 21)),
  add column end_hour   int check (end_hour is null or (end_hour >= 9 and end_hour <= 22)),
  add column budget_range text;
```

- `booking_date` becomes nullable (for "date not fixed" bookings).
- `start_hour` and `end_hour` are nullable (null when date not fixed, or when customer didn't specify time).
- `budget_range` stores the label string (e.g., "NPR 50,000 – 1,00,000") or null.

### Booking Confirmation (Vendor Side)

When a vendor confirms a booking that has `start_hour` and `end_hour`:
- Block those specific hours in the `availability` table (insert blocked rows or update existing available rows to blocked).
- Current behavior blocks the entire date — new behavior blocks only the booked hours.

For "date not fixed" bookings:
- Vendor can confirm/decline as usual.
- No availability auto-blocking (no date to block).
- These appear in a separate "Tentative" section on `BookingRequests.jsx`.

---

## 3. Vendor Onboarding — Structured Price Range

### Current State
- `price_range` is a TEXT field on `vendor_listings`.
- Free-text input during onboarding and profile edit.
- Examples: "NPR 25,000 – 80,000", "₹50K – ₹1.5L" — inconsistent formats.

### New Behavior
- Replace free-text input with a **dropdown** on both `VendorOnboarding.jsx` and `EditProfile.jsx`.
- Dropdown options are category-specific (same ranges as customer budget dropdown).
- The selected label string is stored in the existing `price_range` TEXT column — no schema change needed.
- The dropdown appears after the vendor selects their category (so ranges can adapt).

---

## 4. Category-Specific Budget/Price Ranges

Defined as a shared frontend constant used by:
- Customer booking modal (budget dropdown)
- Vendor onboarding (price range dropdown)
- Vendor profile edit (price range dropdown)

**File:** `frontend/src/lib/budgetRanges.js`

```javascript
export const BUDGET_RANGES = {
  photography: [
    'Under NPR 25,000',
    'NPR 25,000 – 50,000',
    'NPR 50,000 – 1,00,000',
    'NPR 1,00,000 – 2,50,000',
    'NPR 2,50,000+',
  ],
  makeup: [
    'Under NPR 15,000',
    'NPR 15,000 – 30,000',
    'NPR 30,000 – 60,000',
    'NPR 60,000 – 1,00,000',
    'NPR 1,00,000+',
  ],
  catering: [
    'Under NPR 50,000',
    'NPR 50,000 – 1,00,000',
    'NPR 1,00,000 – 2,50,000',
    'NPR 2,50,000 – 5,00,000',
    'NPR 5,00,000+',
  ],
  decor: [
    'Under NPR 30,000',
    'NPR 30,000 – 75,000',
    'NPR 75,000 – 1,50,000',
    'NPR 1,50,000 – 3,00,000',
    'NPR 3,00,000+',
  ],
  music: [
    'Under NPR 15,000',
    'NPR 15,000 – 30,000',
    'NPR 30,000 – 60,000',
    'NPR 60,000 – 1,00,000',
    'NPR 1,00,000+',
  ],
  mehendi: [
    'Under NPR 10,000',
    'NPR 10,000 – 20,000',
    'NPR 20,000 – 40,000',
    'NPR 40,000 – 75,000',
    'NPR 75,000+',
  ],
  pandit: [
    'Under NPR 10,000',
    'NPR 10,000 – 25,000',
    'NPR 25,000 – 50,000',
    'NPR 50,000 – 1,00,000',
    'NPR 1,00,000+',
  ],
  venue: [
    'Under NPR 1,00,000',
    'NPR 1,00,000 – 3,00,000',
    'NPR 3,00,000 – 5,00,000',
    'NPR 5,00,000 – 10,00,000',
    'NPR 10,00,000+',
  ],
}
```

All dropdowns include a "Not decided yet" option prepended at render time.

---

## 5. Files to Modify

### New Files
- `frontend/src/lib/budgetRanges.js` — shared constant

### Modified Files

**Database:**
- New migration: `supabase/migrations/2026033100001_booking_ux_improvements.sql`
  - Alter `availability` table (add `start_hour`, `end_hour`, change unique constraint)
  - Alter `bookings` table (make `booking_date` nullable, add `start_hour`, `end_hour`, `budget_range`)
  - Update demo seed data for hourly availability

**Vendor side:**
- `frontend/src/pages/vendor/AvailabilityManager.jsx` — Add hourly slot panel below calendar, update toggle logic for hour-level granularity
- `frontend/src/pages/vendor/BookingRequests.jsx` — Display time range and budget on booking cards, add "Tentative" section for dateless bookings
- `frontend/src/pages/vendor/VendorOnboarding.jsx` — Replace price_range text input with category-specific dropdown
- `frontend/src/pages/vendor/EditProfile.jsx` — Replace price_range text input with category-specific dropdown
- `frontend/src/pages/vendor/VendorDashboard.jsx` — Update recent bookings preview to show time info

**Customer side:**
- `frontend/src/pages/consumer/VendorProfile.jsx` — Update `AvailCalendar` to show partial availability indicators, update `BookingModal` with all new fields (date picker, time range, budget, date-not-fixed toggle)
- `frontend/src/pages/consumer/MyBookings.jsx` — Display time range and budget on booking cards

---

## 6. UX Details

### Date-Not-Fixed Bookings
- Shown to vendor in a separate "Tentative Requests" section (between Pending and Past).
- Badge: "tentative" with a distinct color (blue/grey).
- Vendor can still confirm (without date blocking) or decline.
- Customer can later update the booking with a specific date (future enhancement, not in this sub-project).

### Availability Calendar Visual Indicators (Customer Side)
- Date cell colors adapt:
  - **Bright gold**: All hours available (8am–10pm)
  - **Muted gold**: Some hours available
  - **Red**: All hours blocked
  - **Grey**: No availability data

### Time Range Validation
- End time must be after start time.
- Selected range must not overlap with blocked hours.
- If a gap exists in availability (e.g., 8am-12pm available, 1pm blocked, 2pm-6pm available), customer can only select within one contiguous block per booking.

---

## 7. Out of Scope

- Real-time availability updates (websocket/subscription)
- Customer updating date on an existing "tentative" booking
- Budget-based vendor filtering on discovery page (future: Sub-project B or later)
- Multi-day bookings
- Recurring bookings
