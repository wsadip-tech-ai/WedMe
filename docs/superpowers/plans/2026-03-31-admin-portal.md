# Admin Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin portal at `/admin/*` with vendor/customer CRUD, approval flow (unverified/verified/suspended), and document upload for chatbot RAG prep.

**Architecture:** Admin is identified by hardcoded email (`wsadip@gmail.com`). Separate route tree with own nav/layout. RLS policies grant admin full access to all tables. New `status` column on `vendor_listings`, new `vendor_documents` table. Frontend-only + one Supabase migration.

**Tech Stack:** React 18, Supabase (PostgreSQL + RLS + Storage), Zustand, Vite, React Router v6

**Spec:** `docs/superpowers/specs/2026-03-31-admin-portal-design.md`

---

## File Structure

### New Files
- `frontend/src/lib/constants.js` — `ADMIN_EMAIL` constant
- `frontend/src/components/AdminGuard.jsx` — route guard checking admin email
- `frontend/src/components/AdminNav.jsx` — admin navigation bar
- `frontend/src/pages/admin/AdminDashboard.jsx` — stats overview
- `frontend/src/pages/admin/AdminVendorList.jsx` — searchable vendor table
- `frontend/src/pages/admin/AdminVendorDetail.jsx` — tabbed vendor detail (profile, bookings, enquiries, packages, documents)
- `frontend/src/pages/admin/AdminCustomerList.jsx` — searchable customer table
- `frontend/src/pages/admin/AdminCustomerDetail.jsx` — tabbed customer detail (profile, bookings, shortlists, enquiries)
- `supabase/migrations/20260331000002_admin_portal.sql` — migration

### Modified Files
- `frontend/src/main.jsx` — add admin routes
- `frontend/src/components/Nav.jsx` — show "Admin" link for admin email
- `frontend/src/pages/consumer/VendorDiscovery.jsx` — filter out suspended, show badge
- `frontend/src/components/VendorCard.jsx` — show verification badge
- `frontend/src/pages/consumer/VendorProfile.jsx` — show verification badge in hero

---

### Task 1: Constants and AdminGuard

**Files:**
- Create: `frontend/src/lib/constants.js`
- Create: `frontend/src/components/AdminGuard.jsx`

- [ ] **Step 1: Create constants file**

```javascript
// frontend/src/lib/constants.js
export const ADMIN_EMAIL = 'wsadip@gmail.com'
```

- [ ] **Step 2: Create AdminGuard component**

```jsx
// frontend/src/components/AdminGuard.jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useToastStore } from '../store/useToastStore'
import { ADMIN_EMAIL } from '../lib/constants'

export function AdminGuard({ children }) {
  const { user, loading } = useAuthStore()
  const show = useToastStore(s => s.show)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.email !== ADMIN_EMAIL) {
    show('Access denied', 'error')
    return <Navigate to="/" replace />
  }

  return children
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/constants.js frontend/src/components/AdminGuard.jsx
git commit -m "feat: add ADMIN_EMAIL constant and AdminGuard component"
```

---

### Task 2: Database migration

**Files:**
- Create: `supabase/migrations/20260331000002_admin_portal.sql`

- [ ] **Step 1: Create migration file**

```sql
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

-- profiles
create policy "admin: full access profiles"
  on public.profiles for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- vendor_listings
create policy "admin: full access vendor_listings"
  on public.vendor_listings for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- bookings
create policy "admin: full access bookings"
  on public.bookings for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- enquiries
create policy "admin: full access enquiries"
  on public.enquiries for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- packages
create policy "admin: full access packages"
  on public.packages for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- availability
create policy "admin: full access availability"
  on public.availability for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- portfolio_photos
create policy "admin: full access portfolio_photos"
  on public.portfolio_photos for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- shortlists
create policy "admin: full access shortlists"
  on public.shortlists for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');

-- vendor_documents
create policy "admin: full access vendor_documents"
  on public.vendor_documents for all
  using (auth.jwt() ->> 'email' = 'wsadip@gmail.com')
  with check (auth.jwt() ->> 'email' = 'wsadip@gmail.com');
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Navigate to https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new and run the migration.

- [ ] **Step 3: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → Create Bucket:
- Name: `vendor-documents`
- Public: OFF

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260331000002_admin_portal.sql
git commit -m "feat: admin portal migration — vendor status, documents table, admin RLS"
```

---

### Task 3: Admin Navigation

**Files:**
- Create: `frontend/src/components/AdminNav.jsx`

- [ ] **Step 1: Create AdminNav component**

```jsx
// frontend/src/components/AdminNav.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const links = [
  { to: '/admin',           label: 'Dashboard' },
  { to: '/admin/vendors',   label: 'Vendors' },
  { to: '/admin/customers', label: 'Customers' },
]

export function AdminNav() {
  const { signOut } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav
      role="navigation"
      aria-label="Admin navigation"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem',
        background: 'rgba(11,9,6,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(200,150,60,0.15)',
      }}
    >
      <Link
        to="/admin"
        style={{
          fontFamily: 'var(--font-display)', fontSize: '1.35rem',
          color: 'var(--gold)', textDecoration: 'none', fontWeight: 400,
          letterSpacing: '0.04em',
        }}
      >
        WedMe <span style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: '0.3rem' }}>Admin</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              color: location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to))
                ? 'var(--cream)' : 'var(--cream-muted)',
              textDecoration: 'none', fontSize: '0.875rem',
              letterSpacing: '0.04em', transition: 'color 160ms',
            }}
          >
            {label}
          </Link>
        ))}
        <span style={{ color: 'rgba(200,150,60,0.2)' }}>|</span>
        <Link to="/" style={{ color: 'var(--cream-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>
          Back to site
        </Link>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none', border: '1px solid rgba(200,150,60,0.35)',
            borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-body)',
            fontSize: '0.82rem', padding: '0.3rem 0.75rem', cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminNav.jsx
git commit -m "feat: admin navigation component"
```

---

### Task 4: Admin Dashboard

**Files:**
- Create: `frontend/src/pages/admin/AdminDashboard.jsx`

- [ ] **Step 1: Create AdminDashboard**

```jsx
// frontend/src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ vendors: 0, unverified: 0, customers: 0, bookings: 0, pendingBookings: 0, enquiries: 0, pendingEnquiries: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentEnquiries, setRecentEnquiries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: vendorCount },
        { count: unverifiedCount },
        { count: customerCount },
        { count: bookingCount },
        { count: pendingBookingCount },
        { count: enquiryCount },
        { count: pendingEnquiryCount },
        { data: rb },
        { data: re },
      ] = await Promise.all([
        supabase.from('vendor_listings').select('*', { count: 'exact', head: true }),
        supabase.from('vendor_listings').select('*', { count: 'exact', head: true }).eq('status', 'unverified'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'consumer'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('enquiries').select('*', { count: 'exact', head: true }),
        supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*, profiles(full_name), vendor_listings(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('enquiries').select('*, profiles(full_name), vendor_listings(name)').order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        vendors: vendorCount || 0, unverified: unverifiedCount || 0,
        customers: customerCount || 0, bookings: bookingCount || 0,
        pendingBookings: pendingBookingCount || 0, enquiries: enquiryCount || 0,
        pendingEnquiries: pendingEnquiryCount || 0,
      })
      setRecentBookings(rb || [])
      setRecentEnquiries(re || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <main style={page}><p style={{ color: 'var(--cream-muted)' }}>Loading…</p></main>

  return (
    <main style={page}>
      <h1 style={heading}>Admin Dashboard</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Platform overview</p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { value: stats.vendors, label: 'Total Vendors', sub: `${stats.unverified} unverified`, link: '/admin/vendors' },
          { value: stats.customers, label: 'Customers', link: '/admin/customers' },
          { value: stats.bookings, label: 'Bookings', sub: `${stats.pendingBookings} pending` },
          { value: stats.enquiries, label: 'Enquiries', sub: `${stats.pendingEnquiries} pending` },
        ].map(({ value, label, sub, link }) => (
          <div key={label} style={statCard}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>{value}</div>
            <div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>{label}</div>
            {sub && <div style={{ color: 'var(--cream-muted)', fontSize: '0.72rem', marginTop: '0.2rem', opacity: 0.7 }}>{sub}</div>}
            {link && <Link to={link} style={{ color: 'var(--gold)', fontSize: '0.72rem', textDecoration: 'none', marginTop: '0.4rem', display: 'inline-block' }}>View all →</Link>}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Bookings */}
        <div style={card}>
          <h2 style={sectionTitle}>Recent Bookings</h2>
          {recentBookings.length === 0 ? <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>No bookings yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(200,150,60,0.06)' }}>
                  <div>
                    <p style={{ color: 'var(--cream)', fontSize: '0.85rem' }}>{b.profiles?.full_name || 'Customer'}</p>
                    <p style={{ color: 'var(--cream-muted)', fontSize: '0.75rem' }}>{b.vendor_listings?.name || 'Vendor'} · {b.booking_date || 'Date TBD'}</p>
                  </div>
                  <span style={{ background: b.status === 'pending' ? 'rgba(251,188,5,0.15)' : b.status === 'confirmed' ? 'rgba(76,175,125,0.15)' : 'rgba(220,80,80,0.12)', color: b.status === 'pending' ? '#fbbc05' : b.status === 'confirmed' ? '#4caf7d' : 'rgba(220,80,80,0.9)', fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enquiries */}
        <div style={card}>
          <h2 style={sectionTitle}>Recent Enquiries</h2>
          {recentEnquiries.length === 0 ? <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>No enquiries yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentEnquiries.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(200,150,60,0.06)' }}>
                  <div>
                    <p style={{ color: 'var(--cream)', fontSize: '0.85rem' }}>{e.profiles?.full_name || 'Customer'}</p>
                    <p style={{ color: 'var(--cream-muted)', fontSize: '0.75rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '250px' }}>{e.message}</p>
                  </div>
                  <span style={{ background: e.status === 'pending' ? 'rgba(251,188,5,0.15)' : 'rgba(76,175,125,0.15)', color: e.status === 'pending' ? '#fbbc05' : '#4caf7d', fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const page = { maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }
const heading = { fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }
const card = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(200,150,60,0.12)' }
const statCard = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(200,150,60,0.12)' }
const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--cream)', marginBottom: '0.75rem' }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminDashboard.jsx
git commit -m "feat: admin dashboard with platform stats and recent activity"
```

---

### Task 5: Admin Vendor List

**Files:**
- Create: `frontend/src/pages/admin/AdminVendorList.jsx`

- [ ] **Step 1: Create AdminVendorList**

```jsx
// frontend/src/pages/admin/AdminVendorList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'

const CATEGORIES = ['All','photography','makeup','catering','decor','music','mehendi','pandit','venue']
const STATUSES = ['All','unverified','verified','suspended']
const STATUS_STYLE = {
  unverified: { bg: 'rgba(251,188,5,0.15)', color: '#fbbc05' },
  verified:   { bg: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  suspended:  { bg: 'rgba(220,80,80,0.12)',  color: 'rgba(220,80,80,0.9)' },
}

export default function AdminVendorList() {
  const show = useToastStore(s => s.show)
  const [vendors, setVendors]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [status, setStatus]       = useState('All')

  async function fetchVendors() {
    setLoading(true)
    let q = supabase.from('vendor_listings').select('*, bookings(count)')
    if (category !== 'All') q = q.eq('category', category)
    if (status !== 'All') q = q.eq('status', status)
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`)
    const { data } = await q.order('created_at', { ascending: false })
    setVendors(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchVendors() }, [category, status, search])

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('vendor_listings').update({ status: newStatus }).eq('id', id)
    if (error) { show('Failed to update status', 'error'); return }
    show(`Vendor ${newStatus}`)
    fetchVendors()
  }

  return (
    <main style={page}>
      <h1 style={heading}>Vendors</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '1.5rem' }}>{vendors.length} vendors found</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
          style={inputStyle} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <p style={{ color: 'var(--cream-muted)' }}>Loading…</p> : vendors.length === 0 ? (
        <p style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '3rem 0' }}>No vendors found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(200,150,60,0.15)' }}>
                {['Name','Category','City','Tier','Status','Bookings','Actions'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left', padding: '0.6rem 0.5rem', color: 'var(--cream-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => {
                const st = STATUS_STYLE[v.status] || STATUS_STYLE.unverified
                const bookingCount = v.bookings?.[0]?.count ?? 0
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(200,150,60,0.06)', opacity: v.status === 'suspended' ? 0.5 : 1 }}>
                    <td style={td}><span style={{ color: 'var(--cream)', fontWeight: 500 }}>{v.name}</span></td>
                    <td style={td}>{v.category}</td>
                    <td style={td}>{v.city}</td>
                    <td style={td}>{v.tier}</td>
                    <td style={td}><span style={{ background: st.bg, color: st.color, fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>{v.status}</span></td>
                    <td style={td}>{bookingCount}</td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link to={`/admin/vendors/${v.id}`} style={actionLink}>View</Link>
                      {v.status === 'unverified' && <button onClick={() => updateStatus(v.id, 'verified')} style={{ ...actionBtn, color: '#4caf7d' }}>Verify</button>}
                      {v.status !== 'suspended' && <button onClick={() => updateStatus(v.id, 'suspended')} style={{ ...actionBtn, color: 'rgba(220,80,80,0.8)' }}>Suspend</button>}
                      {v.status === 'suspended' && <button onClick={() => updateStatus(v.id, 'verified')} style={{ ...actionBtn, color: '#4caf7d' }}>Restore</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

const page = { maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }
const heading = { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }
const inputStyle = { padding: '0.55rem 0.9rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', width: '200px' }
const selectStyle = { padding: '0.55rem 0.9rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }
const td = { padding: '0.65rem 0.5rem', color: 'var(--cream-muted)', fontSize: '0.85rem' }
const actionLink = { color: 'var(--gold)', textDecoration: 'none', fontSize: '0.82rem', marginRight: '0.75rem' }
const actionBtn = { background: 'none', border: 'none', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', marginLeft: '0.5rem' }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminVendorList.jsx
git commit -m "feat: admin vendor list with search, filters, and status actions"
```

---

### Task 6: Admin Vendor Detail

**Files:**
- Create: `frontend/src/pages/admin/AdminVendorDetail.jsx`

This is the largest page — tabbed view with profile editing, bookings, enquiries, packages, and document management. Due to plan size constraints, the implementer should create this file following these specifications:

- [ ] **Step 1: Create AdminVendorDetail with all tabs**

The component should:

1. **Fetch vendor by ID** from URL params using `supabase.from('vendor_listings').select('*').eq('id', id).single()`
2. **State:** `vendor`, `activeTab` (default 'profile'), `loading`
3. **Header:** Vendor name, category/city/tier, status badge, action buttons (Verify/Suspend/Restore/Delete)
4. **Tab bar:** Profile, Bookings, Enquiries, Packages, Documents
5. **Profile tab:** Editable form for `name`, `category`, `city`, `tier`, `bio`, `price_range` (dropdown using `BUDGET_RANGES`). Save button calls `supabase.from('vendor_listings').update(...)`.
6. **Bookings tab:** Fetch `supabase.from('bookings').select('*, profiles(full_name), packages(name, price_label)').eq('vendor_id', id)`. Display as a table with columns: Customer, Date, Time, Status, Package, Budget. Link customer name to `/admin/customers/:customer_id`.
7. **Enquiries tab:** Fetch `supabase.from('enquiries').select('*, profiles(full_name)').eq('vendor_id', id)`. Display as a list with customer name, message, status, date.
8. **Packages tab:** Fetch `supabase.from('packages').select('*').eq('vendor_id', id)`. Read-only list showing name, price_label, duration, featured badge.
9. **Documents tab:**
   - Fetch `supabase.from('vendor_documents').select('*').eq('vendor_id', id)`
   - **PDF section:** List uploaded PDFs (filename + Remove button). Upload button: file input (accept='.pdf'), uploads to Supabase Storage `vendor-documents/{vendor_id}/{filename}`, inserts row with `type='pdf'`, `url`, `filename`.
   - **Text notes section:** Single textarea. Load existing note (type='note'), save on button click via upsert.
   - Remove PDF: delete from Storage + delete row from `vendor_documents`.
10. **Delete vendor:** Confirmation dialog, then `supabase.from('vendor_listings').delete().eq('id', id)`, navigate to `/admin/vendors`.

Follow the existing WedMe dark theme (void background, gold accents, Cormorant Garamond for headings, DM Sans for body). Import `BUDGET_RANGES` from `../../lib/budgetRanges` for the price_range dropdown.

Style constants should follow the same pattern as other pages: `page`, `card`, `heading`, `td`, etc.

- [ ] **Step 2: Verify all tabs work in browser**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/AdminVendorDetail.jsx
git commit -m "feat: admin vendor detail with profile editing, activity tabs, and document management"
```

---

### Task 7: Admin Customer List

**Files:**
- Create: `frontend/src/pages/admin/AdminCustomerList.jsx`

- [ ] **Step 1: Create AdminCustomerList**

Same pattern as AdminVendorList but for customers. Fetch from `profiles` where `role = 'consumer'`, join with bookings count. Table columns: Name, Email (from auth — note: `profiles` doesn't have email, use `full_name` only and show `id` or joined date instead), Bookings count, Joined date, Actions (View).

Since `profiles` doesn't store email directly (it's in Supabase auth), the table should show: Name, Role, Joined date, Bookings count, Actions.

Search filters by `full_name` using `ilike`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminCustomerList.jsx
git commit -m "feat: admin customer list with search"
```

---

### Task 8: Admin Customer Detail

**Files:**
- Create: `frontend/src/pages/admin/AdminCustomerDetail.jsx`

- [ ] **Step 1: Create AdminCustomerDetail**

Tabbed view similar to vendor detail:

1. **Fetch profile** by ID: `supabase.from('profiles').select('*').eq('id', id).single()`
2. **Header:** Customer name, role, joined date. Edit and Delete buttons.
3. **Tabs:** Profile, Bookings, Shortlists, Enquiries
4. **Profile tab:** Editable `full_name` field. Save button.
5. **Bookings tab:** Fetch bookings where `customer_id = id`, join with `vendor_listings(name)` and `packages(name, price_label)`. Table: Vendor, Date, Time, Status, Package.
6. **Shortlists tab:** Fetch `shortlists` where `user_id = id`, join with `vendor_listings(name, category, city)`. List with links to vendor detail.
7. **Enquiries tab:** Fetch `enquiries` where `from_user_id = id`, join with `vendor_listings(name)`. List with vendor name, message, status, date.
8. **Delete customer:** Confirmation dialog, `supabase.from('profiles').delete().eq('id', id)`, navigate to `/admin/customers`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminCustomerDetail.jsx
git commit -m "feat: admin customer detail with profile editing and activity tabs"
```

---

### Task 9: Wire up admin routes in main.jsx

**Files:**
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Add imports**

Add after existing imports:
```javascript
import { AdminGuard } from './components/AdminGuard'
import { AdminNav } from './components/AdminNav'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVendorList from './pages/admin/AdminVendorList'
import AdminVendorDetail from './pages/admin/AdminVendorDetail'
import AdminCustomerList from './pages/admin/AdminCustomerList'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail'
```

- [ ] **Step 2: Create AdminRoot layout**

Add after the `AppRoot` function:
```jsx
function AdminRoot() {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setUser(session?.user ?? null) }
    )
    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <>
      <Toast />
      <AdminNav />
      <div style={{ paddingTop: '60px' }}>
        <Outlet />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Add admin routes**

In the `createBrowserRouter` array, add a new top-level route object BEFORE the existing `AppRoot` route:

```javascript
{
  element: <AdminRoot />,
  children: [
    { path: '/admin', element: <AdminGuard><AdminDashboard /></AdminGuard> },
    { path: '/admin/vendors', element: <AdminGuard><AdminVendorList /></AdminGuard> },
    { path: '/admin/vendors/:id', element: <AdminGuard><AdminVendorDetail /></AdminGuard> },
    { path: '/admin/customers', element: <AdminGuard><AdminCustomerList /></AdminGuard> },
    { path: '/admin/customers/:id', element: <AdminGuard><AdminCustomerDetail /></AdminGuard> },
  ],
},
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.jsx
git commit -m "feat: wire up admin routes with AdminRoot layout"
```

---

### Task 10: Show "Admin" link in main Nav

**Files:**
- Modify: `frontend/src/components/Nav.jsx`

- [ ] **Step 1: Import ADMIN_EMAIL**

At top of Nav.jsx:
```javascript
import { ADMIN_EMAIL } from '../lib/constants'
```

- [ ] **Step 2: Add Admin link to nav**

In the `links` builder (around line 56), update the vendor links section to also check for admin:

After the existing links array is built (after line 69), add:
```javascript
const isAdmin = user?.email === ADMIN_EMAIL
```

Then in the desktop links `<ul>`, after the links map and before the CTA `<li>`, add:
```jsx
{isAdmin && (
  <li>
    <Link to="/admin" className="nav-link-item"
      style={{ color: location.pathname.startsWith('/admin') ? 'var(--cream)' : 'var(--gold)', textDecoration: 'none', fontSize: '0.875rem', letterSpacing: '0.04em', fontWeight: 600 }}>
      Admin
    </Link>
  </li>
)}
```

Also add the admin link to the mobile drawer links list (inside the `<nav aria-label="Mobile navigation">` `<ul>`):
```jsx
{isAdmin && (
  <li>
    <Link to="/admin" className="drawer-link"
      style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, color: 'var(--gold)', textDecoration: 'none', padding: '0.6rem 0', borderBottom: '1px solid rgba(200,150,60,0.07)' }}>
      Admin
    </Link>
  </li>
)}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Nav.jsx
git commit -m "feat: show Admin link in nav for admin email"
```

---

### Task 11: Verification badges on discovery and vendor profile

**Files:**
- Modify: `frontend/src/pages/consumer/VendorDiscovery.jsx`
- Modify: `frontend/src/components/VendorCard.jsx`
- Modify: `frontend/src/pages/consumer/VendorProfile.jsx`

- [ ] **Step 1: Filter out suspended vendors in VendorDiscovery**

In `VendorDiscovery.jsx`, in the `fetchData` function, add after the existing filters:
```javascript
q = q.neq('status', 'suspended')
```

- [ ] **Step 2: Show verification badge on VendorCard**

In `VendorCard.jsx`, after the city line (line 29), add:
```jsx
{vendor.status === 'unverified' && (
  <span style={{ fontSize: '0.68rem', color: '#fbbc05', background: 'rgba(251,188,5,0.12)', padding: '0.12rem 0.45rem', borderRadius: '99px' }}>Unverified</span>
)}
{vendor.status === 'verified' && (
  <span style={{ fontSize: '0.68rem', color: '#4caf7d', background: 'rgba(76,175,125,0.12)', padding: '0.12rem 0.45rem', borderRadius: '99px' }}>✓ Verified</span>
)}
```

- [ ] **Step 3: Show verification badge on VendorProfile hero**

In `VendorProfile.jsx`, in the hero pills area (where category, tier, and city pills are), add after the city pill:
```jsx
{vendor.status === 'verified' && <span style={{ ...pill, background: 'rgba(76,175,125,0.15)', color: '#4caf7d', borderColor: 'rgba(76,175,125,0.3)' }}>✓ Verified</span>}
{vendor.status === 'unverified' && <span style={{ ...pill, background: 'rgba(251,188,5,0.12)', color: '#fbbc05', borderColor: 'rgba(251,188,5,0.25)' }}>Unverified</span>}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/consumer/VendorDiscovery.jsx frontend/src/components/VendorCard.jsx frontend/src/pages/consumer/VendorProfile.jsx
git commit -m "feat: verification badges on discovery and vendor profile, filter suspended"
```
