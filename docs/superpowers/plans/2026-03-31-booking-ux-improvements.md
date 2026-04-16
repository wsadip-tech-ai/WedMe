# Booking UX + Vendor Onboarding Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hourly time slots to availability/booking, modern date picker with "date not fixed" option, category-specific budget dropdowns, and structured price range on vendor onboarding.

**Architecture:** Frontend-only changes plus one Supabase migration. Budget ranges defined as a shared JS constant used by booking modal, vendor onboarding, and profile edit. Availability table migrated from date-only rows to hourly slot rows. Bookings table extended with time and budget columns.

**Tech Stack:** React 18, Supabase (PostgreSQL + RLS), Zustand, Vite

**Spec:** `docs/superpowers/specs/2026-03-31-booking-ux-improvements-design.md`

---

## File Structure

### New Files
- `frontend/src/lib/budgetRanges.js` — shared constant mapping category → NPR price brackets

### Modified Files
- `supabase/migrations/20260331000001_booking_ux_improvements.sql` — new migration
- `frontend/src/pages/vendor/AvailabilityManager.jsx` — hourly slot panel
- `frontend/src/pages/vendor/BookingRequests.jsx` — time/budget display, tentative section
- `frontend/src/pages/vendor/VendorDashboard.jsx` — time info in recent bookings
- `frontend/src/pages/vendor/VendorOnboarding.jsx` — price range dropdown
- `frontend/src/pages/vendor/EditProfile.jsx` — price range dropdown
- `frontend/src/pages/consumer/VendorProfile.jsx` — new BookingModal fields, calendar indicators, "Book Now" button
- `frontend/src/pages/consumer/MyBookings.jsx` — time/budget display

---

### Task 1: Create budget ranges constant

**Files:**
- Create: `frontend/src/lib/budgetRanges.js`

This shared constant is used by Tasks 3, 5, and 6. Build it first.

- [ ] **Step 1: Create the file**

```javascript
// frontend/src/lib/budgetRanges.js
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

- [ ] **Step 2: Verify import works**

Run: `cd frontend && node -e "const { BUDGET_RANGES } = require('./src/lib/budgetRanges.js'); console.log(Object.keys(BUDGET_RANGES).length, 'categories')"`

Note: If this fails due to ESM, just verify via the dev server in a later step.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/budgetRanges.js
git commit -m "feat: add category-specific budget ranges constant"
```

---

### Task 2: Database migration — availability + bookings

**Files:**
- Create: `supabase/migrations/20260331000001_booking_ux_improvements.sql`

This migration alters the `availability` table to support hourly slots and extends the `bookings` table with time/budget columns. Run this in the Supabase SQL Editor.

- [ ] **Step 1: Write the migration file**

```sql
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
-- First, save existing rows, then delete and re-insert as hourly slots
do $$
declare
  r record;
  h int;
begin
  for r in
    select id, vendor_id, date, status from public.availability
    where start_hour = 8 and end_hour = 9  -- only rows with default values (old data)
  loop
    -- Delete the original row
    delete from public.availability where id = r.id;
    -- Insert 14 hourly slots for this vendor/date
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
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Navigate to https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new and paste the migration SQL. Run it.

- [ ] **Step 3: Verify migration**

Run this query in the SQL Editor to confirm:
```sql
-- Check availability has hourly rows
select vendor_id, date, count(*) as slots
from public.availability
group by vendor_id, date
order by date
limit 5;
-- Should show 14 slots per vendor/date

-- Check bookings columns exist
select column_name, is_nullable
from information_schema.columns
where table_name = 'bookings' and column_name in ('start_hour', 'end_hour', 'budget_range', 'booking_date');
-- booking_date should now be nullable, new columns should exist
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260331000001_booking_ux_improvements.sql
git commit -m "feat: migration for hourly availability slots and booking time/budget columns"
```

---

### Task 3: Vendor onboarding — price range dropdown

**Files:**
- Modify: `frontend/src/pages/vendor/VendorOnboarding.jsx`

Replace the free-text price_range input with a category-specific dropdown. The dropdown options update when the vendor changes their category.

- [ ] **Step 1: Add import**

At top of `VendorOnboarding.jsx`, add:
```javascript
import { BUDGET_RANGES } from '../../lib/budgetRanges'
```

- [ ] **Step 2: Replace the price range input**

In `VendorOnboarding.jsx`, find (line 44-45):
```jsx
<label htmlFor="vo-price" style={f.label}>Price range</label>
<input id="vo-price" type="text" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.input} placeholder="e.g. ₹50K – ₹1.5L" />
```

Replace with:
```jsx
<label htmlFor="vo-price" style={f.label}>Price range</label>
<select id="vo-price" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.select}>
  <option value="">— Select price range —</option>
  {(BUDGET_RANGES[form.category] || []).map(r => <option key={r} value={r}>{r}</option>)}
</select>
```

- [ ] **Step 3: Reset price_range when category changes**

In `VendorOnboarding.jsx`, find the `set` function (line 15):
```javascript
function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }
```

Replace with:
```javascript
function set(key, val) {
  setForm((p) => {
    const next = { ...p, [key]: val }
    if (key === 'category') next.price_range = ''
    return next
  })
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:5174/vendor/onboarding (sign up as a new vendor if needed). Confirm:
- Price range shows a dropdown instead of text input
- Changing category updates the dropdown options
- Selected value clears when category changes

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/vendor/VendorOnboarding.jsx
git commit -m "feat: replace free-text price range with category-specific dropdown on onboarding"
```

---

### Task 4: Edit profile — price range dropdown

**Files:**
- Modify: `frontend/src/pages/vendor/EditProfile.jsx`

Same change as onboarding but for the edit profile page.

- [ ] **Step 1: Add import**

At top of `EditProfile.jsx`, add:
```javascript
import { BUDGET_RANGES } from '../../lib/budgetRanges'
```

- [ ] **Step 2: Replace the price range input**

In `EditProfile.jsx`, find (line 58):
```jsx
<label htmlFor="ep-price" style={f.label}>Price range</label><input id="ep-price" type="text" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.input} placeholder="e.g. ₹50K – ₹1.5L" />
```

Replace with:
```jsx
<label htmlFor="ep-price" style={f.label}>Price range</label>
<select id="ep-price" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.select}>
  <option value="">— Select price range —</option>
  {(BUDGET_RANGES[form.category] || []).map(r => <option key={r} value={r}>{r}</option>)}
</select>
```

- [ ] **Step 3: Reset price_range when category changes**

In `EditProfile.jsx`, find (line 21):
```javascript
function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }
```

Replace with:
```javascript
function set(key, val) {
  setForm((p) => {
    const next = { ...p, [key]: val }
    if (key === 'category') next.price_range = ''
    return next
  })
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:5174/vendor/profile/edit as a vendor. Confirm:
- Existing price_range loads in dropdown (or shows "Select" if value doesn't match any option)
- Changing category resets price range and shows new options

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/vendor/EditProfile.jsx
git commit -m "feat: replace free-text price range with category-specific dropdown on edit profile"
```

---

### Task 5: Availability manager — hourly slot panel

**Files:**
- Modify: `frontend/src/pages/vendor/AvailabilityManager.jsx`

Add an hourly slot panel that appears when vendor clicks a date. The availability state changes from `{ 'YYYY-MM-DD': status }` to `{ 'YYYY-MM-DD': { 8: status, 9: status, ... } }`.

- [ ] **Step 1: Update the data fetching to handle hourly rows**

In `AvailabilityManager.jsx`, replace the `useEffect` data fetch (lines 36-50):

```javascript
useEffect(() => {
  if (!user) return
  supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle()
    .then(({ data }) => {
      if (!data) { setLoading(false); return }
      setListing(data)
      supabase.from('availability').select('date,start_hour,status').eq('vendor_id', data.id)
        .then(({ data: avail }) => {
          // Group by date: { 'YYYY-MM-DD': { 8: 'available', 9: 'blocked', ... } }
          const map = {}
          ;(avail || []).forEach(r => {
            if (!map[r.date]) map[r.date] = {}
            map[r.date][r.start_hour] = r.status
          })
          setAvailability(map)
          setLoading(false)
        })
    })
}, [user])
```

- [ ] **Step 2: Add selected date state and hours constant**

After the existing state declarations (around line 29), add:

```javascript
const [selectedDate, setSelectedDate] = useState(null) // 'YYYY-MM-DD'
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }
```

- [ ] **Step 3: Update the `toggleDate` function to select a date instead of cycling status**

Replace the existing `toggleDate` function (lines 73-94) with:

```javascript
function selectDate(day) {
  if (isPast(day)) return
  const key = dateKey(day)
  setSelectedDate(prev => prev === key ? null : key)
}
```

- [ ] **Step 4: Add hourly slot toggle function**

Add this new function after `selectDate`:

```javascript
async function toggleHour(hour) {
  if (!listing || !selectedDate) return
  const dateSlots = availability[selectedDate] || {}
  const current = dateSlots[hour]
  const next = current === 'available' ? 'blocked' : current === 'blocked' ? null : 'available'

  const slotKey = `${selectedDate}-${hour}`
  setToggling(prev => new Set(prev).add(slotKey))

  if (next === null) {
    const { error } = await supabase.from('availability').delete()
      .match({ vendor_id: listing.id, date: selectedDate, start_hour: hour })
    if (!error) setAvailability(prev => {
      const next = { ...prev }
      if (next[selectedDate]) {
        const slots = { ...next[selectedDate] }
        delete slots[hour]
        if (Object.keys(slots).length === 0) delete next[selectedDate]
        else next[selectedDate] = slots
      }
      return next
    })
  } else {
    const { error } = await supabase.from('availability').upsert(
      { vendor_id: listing.id, date: selectedDate, start_hour: hour, end_hour: hour + 1, status: next },
      { onConflict: 'vendor_id,date,start_hour' }
    )
    if (!error) setAvailability(prev => ({
      ...prev,
      [selectedDate]: { ...(prev[selectedDate] || {}), [hour]: next }
    }))
    else show('Failed to update', 'error')
  }

  setToggling(prev => { const n = new Set(prev); n.delete(slotKey); return n })
}
```

- [ ] **Step 5: Update calendar day cell click handler and visual indicators**

In the day cell rendering (the `cells.map` block), update:
- Change `onClick={() => toggleDate(day)}` to `onClick={() => selectDate(day)}`
- Change `onKeyDown={e => handleKeyDown(e, day)}` — update the Enter/Space handler in `handleKeyDown` to call `selectDate(day)` instead of `toggleDate(day)`
- Update the `bg`, `textCol`, and `borderCol` computations to use the new data structure:

Replace the color computation block inside `cells.map` with:

```javascript
const key      = dateKey(day)
const dateSlots = availability[key] || {}
const hourStatuses = Object.values(dateSlots)
const hasAvailable = hourStatuses.includes('available')
const hasBlocked   = hourStatuses.includes('blocked')
const allAvailable = hourStatuses.length === 14 && hourStatuses.every(s => s === 'available')
const past     = isPast(day)
const todayDay = isToday(day)
const isSelected = selectedDate === key

const bg      = past          ? 'transparent'
              : isSelected    ? 'rgba(200,150,60,0.35)'
              : allAvailable  ? 'rgba(200,150,60,0.25)'
              : hasAvailable  ? 'rgba(200,150,60,0.12)'
              : hasBlocked    ? 'rgba(160,40,40,0.15)'
              : 'rgba(255,255,255,0.04)'

const textCol = past          ? 'rgba(245,239,230,0.2)'
              : isSelected    ? 'var(--gold)'
              : hasAvailable  ? 'var(--gold)'
              : hasBlocked    ? 'rgba(220,90,90,0.9)'
              : 'rgba(245,239,230,0.55)'

const borderCol = isSelected  ? 'var(--gold)'
                : todayDay    ? 'var(--gold)'
                : hasAvailable ? 'rgba(200,150,60,0.25)'
                : hasBlocked   ? 'rgba(200,80,80,0.2)'
                : 'transparent'
```

Also remove `aria-pressed` and update `title`:
```javascript
const hoverTitle = past ? '' : 'Click to manage hourly slots'
```

- [ ] **Step 6: Add the hourly slot panel below the calendar**

Inside the `calCard` div, after the day grid `</div>` and the `@keyframes spin` style tag, add the hourly slot panel:

```jsx
{/* Hourly slot panel */}
{selectedDate && !isPast(parseInt(selectedDate.split('-')[2])) && (
  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(200,150,60,0.12)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div>
        <p style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Hourly Slots</p>
        <p style={{ color: 'var(--cream)', fontSize: '0.95rem' }}>
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          onClick={async () => {
            for (const h of HOURS) {
              await supabase.from('availability').upsert(
                { vendor_id: listing.id, date: selectedDate, start_hour: h, end_hour: h + 1, status: 'available' },
                { onConflict: 'vendor_id,date,start_hour' }
              )
            }
            const allSlots = {}; HOURS.forEach(h => { allSlots[h] = 'available' })
            setAvailability(prev => ({ ...prev, [selectedDate]: allSlots }))
            show('All hours marked available')
          }}
          style={slotActionBtn}
        >All Available</button>
        <button
          onClick={async () => {
            await supabase.from('availability').delete()
              .eq('vendor_id', listing.id).eq('date', selectedDate)
            setAvailability(prev => { const n = { ...prev }; delete n[selectedDate]; return n })
            show('Day cleared')
          }}
          style={{ ...slotActionBtn, color: 'rgba(220,90,90,0.85)', borderColor: 'rgba(200,80,80,0.25)' }}
        >Clear Day</button>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
      {HOURS.map(h => {
        const dateSlots = availability[selectedDate] || {}
        const status = dateSlots[h]
        const slotKey = `${selectedDate}-${h}`
        const busy = toggling.has(slotKey)

        const slotBg = status === 'available' ? 'rgba(200,150,60,0.2)'
                     : status === 'blocked'   ? 'rgba(160,40,40,0.2)'
                     : 'rgba(255,255,255,0.04)'
        const slotColor = status === 'available' ? 'var(--gold)'
                        : status === 'blocked'   ? 'rgba(220,90,90,0.9)'
                        : 'rgba(245,239,230,0.55)'
        const slotBorder = status === 'available' ? 'rgba(200,150,60,0.35)'
                         : status === 'blocked'   ? 'rgba(200,80,80,0.3)'
                         : 'rgba(200,150,60,0.1)'

        return (
          <button
            key={h}
            onClick={() => toggleHour(h)}
            disabled={busy}
            title={status === 'available' ? `${hourLabel(h)}: Mark blocked` : status === 'blocked' ? `${hourLabel(h)}: Clear` : `${hourLabel(h)}: Mark available`}
            style={{
              padding: '0.5rem 0.25rem',
              background: slotBg,
              border: `1px solid ${slotBorder}`,
              borderRadius: '6px',
              color: slotColor,
              fontSize: '0.72rem',
              fontWeight: status ? 600 : 400,
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)',
              opacity: busy ? 0.5 : 1,
              transition: 'background 140ms, color 140ms',
              outline: 'none',
              textAlign: 'center',
            }}
          >
            {busy ? '…' : hourLabel(h)}
          </button>
        )
      })}
    </div>
  </div>
)}
```

- [ ] **Step 7: Add slotActionBtn style**

After the existing style constants at the bottom of the file, add:

```javascript
const slotActionBtn = {
  padding: '0.35rem 0.7rem', fontSize: '0.72rem',
  background: 'rgba(200,150,60,0.07)', border: '1px solid rgba(200,150,60,0.2)',
  borderRadius: '6px', color: 'var(--cream-muted)', cursor: 'pointer',
  fontFamily: 'var(--font-body)', outline: 'none',
}
```

- [ ] **Step 8: Update month stats to count hourly data**

Replace the month stats computation (lines 112-114) with:

```javascript
const monthPrefix = `${y}-${String(m+1).padStart(2,'0')}`
const monthDates = Object.keys(availability).filter(k => k.startsWith(monthPrefix))
let monthAvail = 0, monthBlocked = 0
monthDates.forEach(d => {
  const slots = availability[d] || {}
  Object.values(slots).forEach(s => { if (s === 'available') monthAvail++; else if (s === 'blocked') monthBlocked++ })
})
const totalSlots = daysInMo * 14
```

Update the StatRow for "not set" to use `totalSlots - monthAvail - monthBlocked`.

- [ ] **Step 9: Update bulk helpers for hourly data**

Replace the `bulkUpsert`, `bulkSetWeekdays`, `bulkSetWeekends`, and `bulkClearMonth` functions with versions that create hourly slot rows:

```javascript
async function bulkUpsertHourly(dates, status, listing, setAvailability, show) {
  if (!dates.length) return
  const rows = []
  for (const date of dates) {
    for (let h = 8; h <= 21; h++) {
      rows.push({ vendor_id: listing.id, date, start_hour: h, end_hour: h + 1, status })
    }
  }
  const { error } = await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
  if (!error) {
    setAvailability(prev => {
      const next = { ...prev }
      for (const date of dates) {
        const slots = {}
        for (let h = 8; h <= 21; h++) slots[h] = status
        next[date] = { ...(next[date] || {}), ...slots }
      }
      return next
    })
  }
  return !error
}

async function bulkSetWeekdays(status, y, m, listing, setAvailability, show) {
  if (!listing) return
  const today = new Date(); today.setHours(0,0,0,0)
  const daysInMo = new Date(y, m + 1, 0).getDate()
  const dates = []
  for (let d = 1; d <= daysInMo; d++) {
    const date = new Date(y, m, d)
    if (date < today) continue
    const dow = date.getDay()
    if (dow >= 1 && dow <= 5) dates.push(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }
  const ok = await bulkUpsertHourly(dates, status, listing, setAvailability, show)
  if (ok) show(`${dates.length} weekdays × 14 hours marked as ${status}`)
}

async function bulkSetWeekends(status, y, m, listing, setAvailability, show) {
  if (!listing) return
  const today = new Date(); today.setHours(0,0,0,0)
  const daysInMo = new Date(y, m + 1, 0).getDate()
  const dates = []
  for (let d = 1; d <= daysInMo; d++) {
    const date = new Date(y, m, d)
    if (date < today) continue
    const dow = date.getDay()
    if (dow === 0 || dow === 6) dates.push(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }
  const ok = await bulkUpsertHourly(dates, status, listing, setAvailability, show)
  if (ok) show(`${dates.length} weekend days ${status}`)
}

async function bulkClearMonth(y, m, listing, setAvailability, show) {
  if (!listing) return
  const prefix = `${y}-${String(m+1).padStart(2,'0')}`
  const { error } = await supabase.from('availability')
    .delete()
    .eq('vendor_id', listing.id)
    .gte('date', `${prefix}-01`)
    .lte('date', `${prefix}-31`)
  if (!error) {
    setAvailability(prev => {
      const next = { ...prev }
      Object.keys(next).filter(k => k.startsWith(prefix)).forEach(k => delete next[k])
      return next
    })
    show('Month cleared')
  }
}
```

- [ ] **Step 10: Verify in browser**

Open http://localhost:5174/vendor/availability. Confirm:
- Calendar loads with existing demo data showing day-level indicators
- Clicking a date opens the hourly slot panel (14 slots: 8 AM – 9 PM)
- Clicking an hour cycles it: unset → available → blocked → unset
- "All Available" and "Clear Day" quick actions work
- Month stats update correctly
- Bulk weekday/weekend actions create hourly rows

- [ ] **Step 11: Commit**

```bash
git add frontend/src/pages/vendor/AvailabilityManager.jsx
git commit -m "feat: hourly slot panel in availability manager"
```

---

### Task 6: Enhanced booking modal — customer side

**Files:**
- Modify: `frontend/src/pages/consumer/VendorProfile.jsx`

Rebuild the `BookingModal` with: date-not-fixed toggle, day/month/year date picker, time range dropdowns, budget dropdown. Add a "Book Now" button in the hero. Update `AvailCalendar` to show partial availability from hourly data.

- [ ] **Step 1: Add import**

At top of `VendorProfile.jsx`, add:
```javascript
import { BUDGET_RANGES } from '../../lib/budgetRanges'
```

- [ ] **Step 2: Update AvailCalendar to handle hourly availability data**

The `availability` prop changes from `{ 'YYYY-MM-DD': 'available' }` to `{ 'YYYY-MM-DD': { 8: 'available', ... } }`.

In the data loading inside `VendorProfile` (the `load` function), change the availability fetch and state building:

Replace:
```javascript
const map = {}
;(avail || []).forEach(r => { map[r.date] = r.status })
setAvailability(map)
```

With:
```javascript
const map = {}
;(avail || []).forEach(r => {
  if (!map[r.date]) map[r.date] = {}
  map[r.date][r.start_hour] = r.status
})
setAvailability(map)
```

And update the availability fetch query to include `start_hour`:
```javascript
supabase.from('availability').select('date,start_hour,status').eq('vendor_id', id),
```

- [ ] **Step 3: Update AvailCalendar component to use hourly data**

In `AvailCalendar`, update the `canBook` logic and visual indicators:

Replace:
```javascript
const status   = availability[key]
```

With:
```javascript
const dateSlots = availability[key] || {}
const hourStatuses = Object.values(dateSlots)
const hasAvailable = hourStatuses.includes('available')
const hasBlocked   = hourStatuses.includes('blocked')
const allAvailable = hourStatuses.length === 14 && hourStatuses.every(s => s === 'available')
const status = allAvailable ? 'full' : hasAvailable ? 'partial' : hasBlocked ? 'blocked' : null
```

Update `canBook`:
```javascript
const canBook = hasAvailable && !past
```

Update the `bg`, `textCol`, `borderCol` to use these new values:
```javascript
const bg = isSelected   ? 'var(--gold)'
         : canBook && allAvailable ? 'rgba(200,150,60,0.22)'
         : canBook      ? 'rgba(200,150,60,0.12)'
         : hasBlocked   ? 'rgba(140,30,30,0.15)'
         : 'transparent'

const textCol = isSelected ? 'var(--void)'
              : past       ? 'rgba(245,239,230,0.18)'
              : canBook    ? 'var(--gold)'
              : hasBlocked ? 'rgba(200,70,70,0.6)'
              : 'rgba(245,239,230,0.4)'
```

Update `availableDays` computation:
```javascript
const availableDays = cells.filter(d => {
  if (!d || isPast(d)) return false
  const slots = availability[keyOf(d)] || {}
  return Object.values(slots).includes('available')
}).length
```

- [ ] **Step 4: Rebuild BookingModal with new fields**

Replace the entire `BookingModal` function with the new version that includes:
- Date-not-fixed toggle
- Day/Month/Year dropdowns
- Time range start/end dropdowns (filtered by availability)
- Budget range dropdown
- Package selector (unchanged)
- Note textarea (unchanged)

```jsx
function BookingModal({ vendor, packages, availability, selectedDate, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)
  const [dateNotFixed, setDateNotFixed] = useState(!selectedDate)
  const [day, setDay]       = useState(selectedDate ? selectedDate.getDate() : '')
  const [month, setMonth]   = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth())
  const [year, setYear]     = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear())
  const [startHour, setStartHour] = useState('')
  const [endHour, setEndHour]     = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [packageId, setPackageId] = useState('')
  const [note, setNote]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21]
  function hourLabel(h) { return h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h-12}:00 PM` }

  // Build date string for availability lookup
  const dateStr = day && month !== '' && year
    ? `${year}-${String(Number(month) + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    : null

  // Get available hours for selected date
  const dateSlots = dateStr ? (availability[dateStr] || {}) : {}
  const availableHours = HOURS.filter(h => dateSlots[h] === 'available')

  // Days in selected month
  const daysInMonth = month !== '' && year ? new Date(year, Number(month) + 1, 0).getDate() : 31

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()

  async function submit(e) {
    e.preventDefault()
    if (!user) { show('Sign in to book', 'error'); return }
    if (!dateNotFixed && !dateStr) { show('Please select a date', 'error'); return }
    if (!dateNotFixed && startHour !== '' && endHour !== '' && Number(endHour) <= Number(startHour)) {
      show('End time must be after start time', 'error'); return
    }
    setSubmitting(true)

    const { error } = await supabase.from('bookings').insert({
      vendor_id:     vendor.id,
      customer_id:   user.id,
      package_id:    packageId || null,
      booking_date:  dateNotFixed ? null : dateStr,
      start_hour:    dateNotFixed || startHour === '' ? null : Number(startHour),
      end_hour:      dateNotFixed || endHour === '' ? null : Number(endHour),
      budget_range:  budgetRange || null,
      customer_note: note || null,
    })
    setSubmitting(false)
    if (error) { show('Booking failed. Please try again.', 'error'); return }
    show(dateNotFixed ? 'Interest registered! The vendor will reach out.' : 'Booking request sent! The vendor will confirm shortly.')
    onSuccess()
  }

  const budgetOptions = BUDGET_RANGES[vendor.category] || []

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {dateNotFixed ? 'Register Interest' : 'Book a Date'}
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.25rem' }}>{vendor.name}</h2>

        <form onSubmit={submit}>
          {/* Date not fixed toggle */}
          <div
            onClick={() => setDateNotFixed(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', padding: '0.6rem 0.8rem', background: dateNotFixed ? 'rgba(200,150,60,0.1)' : 'rgba(200,150,60,0.04)', borderRadius: '8px', border: `1px solid rgba(200,150,60,${dateNotFixed ? '0.3' : '0.12'})`, cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ width: '36px', height: '20px', background: dateNotFixed ? 'var(--gold)' : 'rgba(200,150,60,0.2)', borderRadius: '10px', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
              <div style={{ width: '16px', height: '16px', background: dateNotFixed ? 'var(--void)' : 'rgba(245,239,230,0.4)', borderRadius: '50%', position: 'absolute', top: '2px', left: dateNotFixed ? '18px' : '2px', transition: 'left 200ms' }} />
            </div>
            <span style={{ fontSize: '0.82rem', color: dateNotFixed ? 'var(--gold)' : 'var(--cream-muted)' }}>I don't have a fixed date yet</span>
          </div>

          {/* Date picker */}
          {!dateNotFixed && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Select Date</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={day} onChange={e => setDay(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">Day</option>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={month} onChange={e => { setMonth(e.target.value); setDay('') }} style={{ ...selectStyle, flex: 2 }}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} style={{ ...selectStyle, flex: 1.2 }}>
                  <option value={currentYear}>{currentYear}</option>
                  <option value={currentYear + 1}>{currentYear + 1}</option>
                </select>
              </div>
            </div>
          )}

          {/* Time range */}
          {!dateNotFixed && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Time Range</label>
              {dateStr && availableHours.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                  Availability not published for this date — all hours shown
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select value={startHour} onChange={e => { setStartHour(e.target.value); if (endHour && Number(e.target.value) >= Number(endHour)) setEndHour('') }} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">Start</option>
                  {(availableHours.length > 0 ? availableHours : HOURS).map(h => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>to</span>
                <select value={endHour} onChange={e => setEndHour(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">End</option>
                  {(availableHours.length > 0 ? availableHours : HOURS)
                    .filter(h => startHour === '' || h > Number(startHour))
                    .map(h => <option key={h} value={h + 1}>{hourLabel(h + 1 > 21 ? 22 : h + 1).replace('10:00 PM', '10:00 PM')}</option>)
                  }
                  {/* Add 10 PM as final end option */}
                  {startHour !== '' && Number(startHour) < 22 && (
                    <option value="22">10:00 PM</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Budget range */}
          {budgetOptions.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Your Budget</label>
              <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)} style={selectStyle}>
                <option value="">— Not decided yet —</option>
                {budgetOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {/* Package selector */}
          {packages.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Select Package</label>
              <select value={packageId} onChange={e => setPackageId(e.target.value)} style={selectStyle}>
                <option value="">— No specific package —</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.price_label ? ` — ${p.price_label}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={fieldLabel}>Note to vendor (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={dateNotFixed ? "I'm interested in your services, my event is tentatively planned for…" : "Hi, I'd like to book your services for my event…"}
              style={textareaStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={submitBtn}>
              {submitting ? 'Sending…' : dateNotFixed ? 'Register Interest' : 'Request Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Pass `availability` prop to BookingModal**

In the main `VendorProfile` component, update the BookingModal render:

Replace:
```jsx
<BookingModal
  vendor={vendor}
  packages={packages}
  selectedDate={bookingDate}
  onClose={() => setBookingDate(null)}
  onSuccess={() => setBookingDate(null)}
/>
```

With:
```jsx
<BookingModal
  vendor={vendor}
  packages={packages}
  availability={availability}
  selectedDate={bookingDate}
  onClose={() => setBookingDate(null)}
  onSuccess={() => setBookingDate(null)}
/>
```

- [ ] **Step 6: Add "Book Now" button in hero area**

In the hero actions area, add a "Book Now" button that opens the modal with date-not-fixed:

After the "Ask a Question" button in the hero, the booking modal can also be opened without a date. Add a new button before "Ask a Question":

Find:
```jsx
<button
  onClick={() => { if (!user) { show('Sign in to send an enquiry', 'error'); return } setShowEnquiry(true) }}
  style={enquiryBtn}
>
  Ask a Question
</button>
```

Add before it:
```jsx
<button
  onClick={() => { if (!user) { show('Sign in to book', 'error'); return } setBookingDate(null); setShowBookNow(true) }}
  style={enquiryBtn}
>
  Book Now
</button>
```

Add state for this:
```javascript
const [showBookNow, setShowBookNow] = useState(false)
```

And render the modal for it:
```jsx
{showBookNow && (
  <BookingModal
    vendor={vendor}
    packages={packages}
    availability={availability}
    selectedDate={null}
    onClose={() => setShowBookNow(false)}
    onSuccess={() => setShowBookNow(false)}
  />
)}
```

- [ ] **Step 7: Verify in browser**

Open http://localhost:5174/vendors/{vendor-id}. Confirm:
- Calendar shows partial/full availability indicators
- Clicking a date opens modal with date pre-filled and time range options
- "Date not fixed" toggle hides date/time fields
- Budget dropdown shows category-specific ranges
- "Book Now" button in hero opens modal with toggle ON
- Submitting with and without date works

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/consumer/VendorProfile.jsx
git commit -m "feat: enhanced booking modal with date picker, time range, budget, and date-not-fixed toggle"
```

---

### Task 7: Vendor booking requests — time/budget display and tentative section

**Files:**
- Modify: `frontend/src/pages/vendor/BookingRequests.jsx`

Show time range and budget on booking cards. Add a "Tentative" section for bookings with no date.

- [ ] **Step 1: Update BookingCard to show time and budget**

In the `BookingCard` function, after the date label line:
```javascript
const dateLabel = new Date(b.booking_date + 'T00:00:00').toLocaleDateString(...)
```

Replace with:
```javascript
function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }
const dateLabel = b.booking_date
  ? new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  : null
const timeLabel = b.start_hour != null && b.end_hour != null
  ? `${hourLabel(b.start_hour)} – ${hourLabel(b.end_hour)}`
  : null
```

In the meta display section, update:
```jsx
<div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
  {dateLabel ? <span style={meta}>📅 {dateLabel}</span> : <span style={{ ...meta, color: 'rgba(130,170,220,0.8)' }}>📅 Date not decided</span>}
  {timeLabel && <span style={meta}>🕐 {timeLabel}</span>}
  {b.packages && <span style={meta}>📦 {b.packages.name}{b.packages.price_label ? ` — ${b.packages.price_label}` : ''}</span>}
  {b.budget_range && <span style={meta}>💰 {b.budget_range}</span>}
</div>
```

- [ ] **Step 2: Add "Tentative" section in main component**

In the main `BookingRequests` component, update the filtering:

Replace:
```javascript
const pending   = bookings.filter(b => b.status === 'pending')
const resolved  = bookings.filter(b => b.status !== 'pending')
```

With:
```javascript
const pending    = bookings.filter(b => b.status === 'pending' && b.booking_date)
const tentative  = bookings.filter(b => b.status === 'pending' && !b.booking_date)
const resolved   = bookings.filter(b => b.status !== 'pending')
```

Add the `STATUS_STYLE` entry for tentative display — add to the `STATUS_STYLE` object:
```javascript
tentative: { background: 'rgba(130,170,220,0.12)', color: 'rgba(130,170,220,0.9)' },
```

Add a tentative section in the JSX between pending and resolved:

```jsx
{/* Tentative */}
{tentative.length > 0 && (
  <section style={{ marginBottom: '3rem' }}>
    <h2 style={sectionHeading}>
      Tentative <span style={{ background: 'rgba(130,170,220,0.15)', color: 'rgba(130,170,220,0.9)', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '99px', marginLeft: '0.5rem', fontFamily: 'var(--font-body)' }}>{tentative.length}</span>
    </h2>
    <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>Customers interested but haven't decided on a date yet.</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {tentative.map(b => <BookingCard key={b.id} b={b} vendorNote={vendorNote} setVendorNote={setVendorNote} respond={respond} updating={updating} />)}
    </div>
  </section>
)}
```

- [ ] **Step 3: Update booking confirmation to block specific hours**

In the `respond` function, update the availability blocking for confirmed bookings:

Replace:
```javascript
if (status === 'confirmed' && vendorListingId) {
  await supabase.from('availability').upsert(
    { vendor_id: vendorListingId, date: booking.booking_date, status: 'blocked' },
    { onConflict: 'vendor_id,date' }
  )
}
```

With:
```javascript
if (status === 'confirmed' && vendorListingId && booking.booking_date) {
  if (booking.start_hour != null && booking.end_hour != null) {
    // Block specific hours
    const rows = []
    for (let h = booking.start_hour; h < booking.end_hour; h++) {
      rows.push({ vendor_id: vendorListingId, date: booking.booking_date, start_hour: h, end_hour: h + 1, status: 'blocked' })
    }
    await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
  } else {
    // No time specified — block all hours for the day
    const rows = []
    for (let h = 8; h <= 21; h++) {
      rows.push({ vendor_id: vendorListingId, date: booking.booking_date, start_hour: h, end_hour: h + 1, status: 'blocked' })
    }
    await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
  }
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:5174/vendor/bookings. Confirm:
- Existing bookings show with date (and "Date not decided" for null dates)
- Time range and budget display on cards that have them
- Tentative section appears for dateless bookings
- Confirming a booking with time range blocks only those hours

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/vendor/BookingRequests.jsx
git commit -m "feat: time/budget display and tentative section in booking requests"
```

---

### Task 8: Customer MyBookings — time/budget display

**Files:**
- Modify: `frontend/src/pages/consumer/MyBookings.jsx`

Show time range and budget on customer's booking cards. Handle null dates.

- [ ] **Step 1: Update booking card rendering**

In `MyBookings.jsx`, update the `bookings.map` callback.

Replace the `dateLabel` line:
```javascript
const dateLabel = new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
```

With:
```javascript
function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }
const dateLabel = b.booking_date
  ? new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
  : null
const timeLabel = b.start_hour != null && b.end_hour != null
  ? `${hourLabel(b.start_hour)} – ${hourLabel(b.end_hour)}`
  : null
```

Update the meta display:
```jsx
<div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
  {dateLabel ? <span style={meta}>📅 {dateLabel}</span> : <span style={{ ...meta, fontStyle: 'italic' }}>📅 Date not decided yet</span>}
  {timeLabel && <span style={meta}>🕐 {timeLabel}</span>}
  {pkg && <span style={meta}>📦 {pkg.name}{pkg.price_label ? ` — ${pkg.price_label}` : ''}</span>}
  {b.budget_range && <span style={meta}>💰 {b.budget_range}</span>}
</div>
```

- [ ] **Step 2: Fix sort order for null dates**

Update the query sort to handle null booking_date (put dateless at top):

Replace:
```javascript
.order('booking_date', { ascending: true })
```

With:
```javascript
.order('created_at', { ascending: false })
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:5174/my-bookings as a customer. Confirm bookings show time, budget, and handle null dates.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/consumer/MyBookings.jsx
git commit -m "feat: display time range and budget in customer bookings"
```

---

### Task 9: Vendor dashboard — update bookings preview with time info

**Files:**
- Modify: `frontend/src/pages/vendor/VendorDashboard.jsx`

Update the recent bookings section to show time range when available.

- [ ] **Step 1: Update time display in recent bookings**

In `VendorDashboard.jsx`, find the recent bookings rendering block that has:
```jsx
<p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>📅 {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{b.packages ? ` · 📦 ${b.packages.name}` : ''}</p>
```

Replace with:
```jsx
<p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>
  {b.booking_date
    ? `📅 ${new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '📅 Date TBD'
  }
  {b.start_hour != null && b.end_hour != null && ` · 🕐 ${b.start_hour > 12 ? b.start_hour - 12 : b.start_hour}${b.start_hour >= 12 ? 'PM' : 'AM'}–${b.end_hour > 12 ? b.end_hour - 12 : b.end_hour}${b.end_hour >= 12 ? 'PM' : 'AM'}`}
  {b.packages ? ` · 📦 ${b.packages.name}` : ''}
</p>
```

- [ ] **Step 2: Update pending count to include tentative**

The `pendingBookings` count query already uses `.eq('status', 'pending')` which will include dateless bookings. This is correct — no change needed. But update the label to be clearer:

Find `Pending bookings` in the stats section and leave as-is (tentative bookings are still "pending" status).

- [ ] **Step 3: Verify in browser**

Open http://localhost:5174/vendor/dashboard. Confirm recent bookings show time info and handle null dates.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/vendor/VendorDashboard.jsx
git commit -m "feat: show time range in dashboard bookings preview"
```

---

### Task 10: Remove debug line from BookingRequests

**Files:**
- Modify: `frontend/src/pages/vendor/BookingRequests.jsx`

- [ ] **Step 1: Remove debug paragraph**

In `BookingRequests.jsx`, find and remove lines 116-119:
```jsx
{/* DEBUG — remove after fixing */}
<p style={{ fontSize: '0.72rem', color: 'rgba(200,150,60,0.5)', marginBottom: '2rem', fontFamily: 'monospace' }}>
  listing id: {vendorListingId || 'not loaded'} · bookings in state: {bookings.length}
</p>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/vendor/BookingRequests.jsx
git commit -m "chore: remove debug line from booking requests"
```
