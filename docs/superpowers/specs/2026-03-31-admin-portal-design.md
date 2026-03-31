# Sub-project B: Admin Portal

**Date:** 2026-03-31
**Status:** Approved
**Goal:** Build an admin portal for platform management — vendor/customer CRUD, approval flow, document uploads for chatbot RAG prep.

---

## 1. Authentication & Authorization

### Admin Identity
- **Hardcoded admin email:** `wsadip@gmail.com`
- Stored as a constant: `ADMIN_EMAIL` in `frontend/src/lib/constants.js`
- No new role in `profiles` table — admin check is purely email-based

### Admin Guard
- New `AdminGuard` component wraps all `/admin/*` routes
- Checks `user.email === ADMIN_EMAIL` from Supabase auth
- Redirects non-admin users to `/` with a toast: "Access denied"
- Works alongside existing `AuthGuard` (admin must also be authenticated)

### Navigation
- When admin email is detected, the main `Nav` component shows an "Admin" link to `/admin`
- Admin pages use their own `AdminNav` component with links to: Dashboard, Vendors, Customers
- Admin nav includes a "Back to site" link to return to the regular app

---

## 2. Routes & Pages

All admin routes live under `/admin/*`:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | `AdminDashboard` | Stats overview + quick links |
| `/admin/vendors` | `AdminVendorList` | Searchable/filterable vendor table |
| `/admin/vendors/:id` | `AdminVendorDetail` | Tabbed detail: Profile, Bookings, Enquiries, Packages, Documents |
| `/admin/customers` | `AdminCustomerList` | Searchable customer table |
| `/admin/customers/:id` | `AdminCustomerDetail` | Tabbed detail: Profile, Bookings, Shortlists, Enquiries |

---

## 3. Admin Dashboard (`/admin`)

Overview stats fetched via Supabase count queries:
- Total vendors (with unverified count highlighted)
- Total customers
- Total bookings (with pending count)
- Total enquiries (with pending count)

Quick-link cards to: Vendors, Customers, plus recent activity (last 5 bookings and enquiries across the platform).

---

## 4. Vendor Management

### Vendor List (`/admin/vendors`)

**Table columns:** Name, Category, City, Tier, Status, Bookings count, Actions

**Filters:**
- Text search (name, case-insensitive `ilike`)
- Category dropdown (photography, makeup, catering, decor, music, mehendi, pandit, venue)
- Status dropdown (all, unverified, verified, suspended)
- City text filter

**Actions per row:**
- "View" → navigates to `/admin/vendors/:id`
- Quick status toggle: "Verify" (for unverified), "Suspend" (for verified/unverified), "Restore" (for suspended)

### Vendor Detail (`/admin/vendors/:id`)

**Header:** Vendor name, category, city, tier, current status. Action buttons: Verify / Suspend / Restore / Delete.

**Tabs:**

1. **Profile** — Editable form with all vendor_listings fields: name, category, city, tier, bio, price_range. Save button updates the record.

2. **Bookings** — Read-only table of all bookings for this vendor. Columns: Customer name, date, time, status, package, budget. Links to customer detail.

3. **Enquiries** — Read-only table of all enquiries. Columns: Customer name, message preview, status, date.

4. **Packages** — Read-only list of vendor's packages (name, price, duration, featured).

5. **Documents** — Upload PDFs and manage text notes for chatbot RAG (see Section 6).

### Delete Vendor
- Confirmation dialog: "This will permanently delete {vendor name} and all their data (packages, photos, availability, bookings). This cannot be undone."
- Cascading delete handled by DB foreign keys (`on delete cascade`)

---

## 5. Customer Management

### Customer List (`/admin/customers`)

**Table columns:** Name, Email, Bookings count, Joined date, Actions

**Filters:**
- Text search (name or email, case-insensitive `ilike`)

**Actions per row:**
- "View" → navigates to `/admin/customers/:id`

### Customer Detail (`/admin/customers/:id`)

**Header:** Customer name, email, joined date. Action buttons: Edit, Delete.

**Tabs:**

1. **Profile** — Editable form: full_name. (Email is from Supabase auth, read-only display.)

2. **Bookings** — Read-only table of all customer's bookings. Columns: Vendor name, date, time, status, package. Links to vendor detail.

3. **Shortlists** — List of shortlisted vendors with links.

4. **Enquiries** — Read-only table of enquiries sent by this customer.

### Edit Customer
- Can update `full_name` in the `profiles` table
- Email is read-only (managed by Supabase auth)

### Delete Customer
- Confirmation dialog: "This will permanently delete {customer name} and all their bookings, shortlists, and enquiries. This cannot be undone."
- Cascading delete via `profiles` FK relationships

---

## 6. Document Management (per vendor)

Accessible from the "Documents" tab on Vendor Detail. Prepares content for Sub-project C (AI Chatbot with RAG).

### PDF Upload
- Upload button opens file picker (accept: `.pdf`)
- Files stored in Supabase Storage bucket `vendor-documents` at path `{vendor_id}/{filename}`
- Row created in `vendor_documents` table with `type = 'pdf'`, `url` = public URL, `filename` = original filename
- Display: list of uploaded PDFs with filename and "Remove" button
- Remove: deletes from Storage and `vendor_documents` table

### Text Notes
- Single textarea per vendor for free-form notes
- Stored as a single row in `vendor_documents` with `type = 'note'`, `text_content` = the note text
- Auto-saved on blur or via explicit "Save Notes" button
- Examples: "Specializes in Newari cuisine", "Minimum 200 guests", "Jain/vegan options available"

---

## 7. Vendor Status Flow

### Status Values
- `unverified` — default on registration. Vendor visible on discovery with "Unverified" badge.
- `verified` — admin-approved. Badge shows "Verified" (green checkmark).
- `suspended` — admin-blocked. Vendor hidden from discovery entirely. Vendor can still log in and see their dashboard but with a notice.

### Status Transitions
```
unverified → verified    (admin clicks "Verify")
unverified → suspended   (admin clicks "Suspend")
verified   → suspended   (admin clicks "Suspend")
suspended  → verified    (admin clicks "Restore")
suspended  → unverified  (not needed — Restore goes to verified)
```

### Customer-Facing Badge
- Discovery page (`VendorDiscovery.jsx`): Show small badge on vendor cards — "Unverified" (yellow) or "Verified ✓" (green). No badge for suspended (they're hidden).
- Vendor profile page (`VendorProfile.jsx`): Badge in hero area next to vendor name.

---

## 8. Database Changes

### Migration: `20260331000002_admin_portal.sql`

**1. Add status column to vendor_listings:**
```sql
alter table public.vendor_listings
  add column status text not null default 'unverified'
  check (status in ('unverified', 'verified', 'suspended'));
```

Existing vendors (seeded) should be set to `verified`:
```sql
update public.vendor_listings set status = 'verified' where status = 'unverified';
```

**2. Create vendor_documents table:**
```sql
create table public.vendor_documents (
  id           uuid        primary key default gen_random_uuid(),
  vendor_id    uuid        not null references public.vendor_listings(id) on delete cascade,
  type         text        not null check (type in ('pdf', 'note')),
  url          text,        -- Storage URL for PDFs, null for notes
  filename     text,        -- Original filename for PDFs, null for notes
  text_content text,        -- Note content for type='note', null for PDFs
  created_at   timestamptz not null default now()
);

alter table public.vendor_documents enable row level security;
```

**3. Admin RLS policies:**

Add to every table that admin needs access to (`profiles`, `vendor_listings`, `bookings`, `enquiries`, `packages`, `availability`, `portfolio_photos`, `shortlists`, `vendor_documents`):

```sql
create policy "admin: full access"
  on public.<table_name> for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');
```

**4. Vendor documents RLS for vendors (own docs):**
```sql
create policy "vendor_documents: vendor read own"
  on public.vendor_documents for select
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));
```

**5. Create Supabase Storage bucket:**
- Bucket name: `vendor-documents`
- Public: false (admin-only access via signed URLs or RLS)

---

## 9. Files to Create

### New Files
- `frontend/src/lib/constants.js` — `ADMIN_EMAIL` constant
- `frontend/src/components/AdminGuard.jsx` — route guard
- `frontend/src/components/AdminNav.jsx` — admin navigation
- `frontend/src/pages/admin/AdminDashboard.jsx`
- `frontend/src/pages/admin/AdminVendorList.jsx`
- `frontend/src/pages/admin/AdminVendorDetail.jsx`
- `frontend/src/pages/admin/AdminCustomerList.jsx`
- `frontend/src/pages/admin/AdminCustomerDetail.jsx`
- `supabase/migrations/20260331000002_admin_portal.sql`

### Modified Files
- `frontend/src/main.jsx` — add `/admin/*` routes
- `frontend/src/components/Nav.jsx` — show "Admin" link for admin email
- `frontend/src/pages/consumer/VendorDiscovery.jsx` — filter out suspended vendors, show verification badge
- `frontend/src/pages/consumer/VendorProfile.jsx` — show verification badge in hero

---

## 10. UX Details

### Admin Nav Layout
- Horizontal nav bar at top (same position as main nav)
- Left: "WedMe Admin" (links to `/admin`)
- Center: Dashboard · Vendors · Customers
- Right: "Back to site" (links to `/`) · Sign Out

### Table Styling
- Follows existing dark theme (void background, gold accents)
- Rows have hover highlight
- Status badges use existing color system: gold (unverified), green (verified), red (suspended)

### Responsive
- Tables stack to card layout on mobile (≤ 640px)
- Admin nav collapses to hamburger on mobile

---

## 11. Out of Scope

- Bulk vendor operations (batch verify/suspend)
- Email notifications to vendors on status change
- Admin activity log / audit trail
- Admin analytics / charts
- Multiple admin accounts
- Vendor self-serve document upload (admin-only for now)
