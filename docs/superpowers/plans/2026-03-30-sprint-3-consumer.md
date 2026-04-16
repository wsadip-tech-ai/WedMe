# Sprint 3 — Consumer Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all consumer-facing pages: onboarding wizard, dashboard, vendor discovery grid, vendor profile with enquiry, and shortlist.

**Architecture:** Pages fetch data from Supabase using the JS SDK directly (no abstraction layer yet). VendorCard is a shared component used in both VendorDiscovery and Shortlist. Onboarding saves to localStorage. Enquiry modal lives in VendorProfile.

**Tech Stack:** React 18, Supabase JS SDK v2 (`supabase.from().select()`), React Router `useParams`/`useNavigate`, inline styles using CSS vars.

**Design vars (always use these):**
- Background: `var(--void)` / `var(--void-2)` / `var(--void-3)`
- Accent: `var(--gold)` / `var(--gold-light)` / `var(--gold-muted)`
- Text: `var(--cream)` / `var(--cream-muted)`
- Fonts: `var(--font-display)` (headings) / `var(--font-body)` (body)
- Radius: `var(--radius-sm/md/lg)`

---

## Task 1: Toast store + component

**Files:**
- Create: `frontend/src/store/useToastStore.js`
- Create: `frontend/src/components/Toast.jsx`
- Modify: `frontend/src/main.jsx` (add Toast to AppRoot)

- [ ] **Step 1: Create useToastStore.js**

```js
// frontend/src/store/useToastStore.js
import { create } from 'zustand'

let nextId = 0

export const useToastStore = create((set) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
}))
```

- [ ] **Step 2: Create Toast.jsx**

```jsx
// frontend/src/components/Toast.jsx
import { useToastStore } from '../store/useToastStore'

export function Toast() {
  const toasts = useToastStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          background: t.type === 'error' ? '#c62828' : '#2e7d52',
          color: '#fff',
          border: `1px solid ${t.type === 'error' ? '#ef5350' : '#4caf7d'}`,
          maxWidth: '320px',
        }}>{t.message}</div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add Toast to main.jsx AppRoot**

Read `frontend/src/main.jsx`. Add:
1. `import { Toast } from './components/Toast'` after Nav import
2. In AppRoot return, add `<Toast />` before `<Nav />`:
```jsx
return (
  <>
    <Toast />
    <Nav />
    <div style={{ paddingTop: '60px' }}>
      <Outlet />
    </div>
  </>
)
```

- [ ] **Step 4: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/store/useToastStore.js frontend/src/components/Toast.jsx frontend/src/main.jsx && git commit -m "feat(sprint-3): add Toast notification system"
```

---

## Task 2: Consumer Onboarding

**File:** `frontend/src/pages/consumer/Onboarding.jsx`

- [ ] **Step 1: Write Onboarding.jsx**

```jsx
// frontend/src/pages/consumer/Onboarding.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BUDGETS = ['Under ₹5L', '₹5L – ₹15L', '₹15L – ₹50L', '₹50L+']
const EVENTS = ['Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception']

const s = {
  page: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card: { width: '100%', maxWidth: '500px', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '16px', padding: '2.5rem 2rem' },
  progress: { display: 'flex', gap: '0.4rem', marginBottom: '2rem' },
  dot: (active, done) => ({ flex: 1, height: '3px', borderRadius: '2px', background: done || active ? 'var(--gold)' : 'rgba(200,150,60,0.2)', transition: 'background 300ms' }),
  heading: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.4rem' },
  sub: { color: 'var(--cream-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' },
  label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.5rem' },
  card2: (active) => ({ padding: '0.9rem', border: active ? '2px solid var(--gold)' : '1px solid rgba(200,150,60,0.2)', borderRadius: '10px', background: active ? 'var(--gold-muted)' : 'var(--void-3)', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem', color: active ? 'var(--gold-light)' : 'var(--cream-muted)', fontFamily: 'var(--font-body)', transition: 'all 200ms' }),
  checkRow: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' },
  chip: (active) => ({ padding: '0.45rem 1rem', border: active ? '1.5px solid var(--gold)' : '1px solid rgba(200,150,60,0.25)', borderRadius: '999px', background: active ? 'var(--gold-muted)' : 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: active ? 'var(--gold-light)' : 'var(--cream-muted)', fontFamily: 'var(--font-body)', transition: 'all 200ms' }),
  row: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  btn: { padding: '0.7rem 1.5rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' },
  backBtn: { padding: '0.7rem 1.25rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.35)', borderRadius: '8px', color: 'var(--cream-muted)', fontFamily: 'var(--font-body)', cursor: 'pointer' },
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [events, setEvents] = useState([])
  const navigate = useNavigate()

  function toggleEvent(e) {
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])
  }

  function finish() {
    if (!events.length) return
    localStorage.setItem('wedme_onboarding', JSON.stringify({ date, city, budget, events }))
    navigate('/dashboard')
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.progress}>
          {[0,1,2].map((i) => <div key={i} style={s.dot(step === i, step > i)} />)}
        </div>

        {step === 0 && (
          <>
            <h1 style={s.heading}>Tell us about your wedding</h1>
            <p style={s.sub}>Step 1 of 3 — Basic details</p>
            <label htmlFor="weddingDate" style={s.label}>Wedding date</label>
            <input id="weddingDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={s.input} />
            <label htmlFor="city" style={s.label}>Your city</label>
            <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} style={s.input} placeholder="e.g. Mumbai" />
            <div style={s.row}><button style={s.btn} onClick={() => setStep(1)}>Next →</button></div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={s.heading}>What's your budget?</h1>
            <p style={s.sub}>Step 2 of 3 — Budget range</p>
            <div style={s.grid}>
              {BUDGETS.map((b) => (
                <button key={b} type="button" style={s.card2(budget === b)} onClick={() => setBudget(b)}>{b}</button>
              ))}
            </div>
            <div style={s.row}>
              <button style={s.backBtn} onClick={() => setStep(0)}>← Back</button>
              <button style={s.btn} onClick={() => setStep(2)} disabled={!budget}>Next →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={s.heading}>Which events?</h1>
            <p style={s.sub}>Step 3 of 3 — Select all that apply</p>
            <div style={s.checkRow}>
              {EVENTS.map((e) => (
                <button key={e} type="button" style={s.chip(events.includes(e))} onClick={() => toggleEvent(e)}>{e}</button>
              ))}
            </div>
            <div style={s.row}>
              <button style={s.backBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={s.btn} onClick={finish} disabled={!events.length}>Find Vendors →</button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/consumer/Onboarding.jsx && git commit -m "feat(sprint-3): Consumer onboarding 3-step wizard"
```

---

## Task 3: VendorCard component

**File:** `frontend/src/components/VendorCard.jsx`

- [ ] **Step 1: Write VendorCard.jsx**

```jsx
// frontend/src/components/VendorCard.jsx
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { useToastStore } from '../store/useToastStore'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231c1710" width="400" height="300"/%3E%3Ctext fill="%23c8963c" font-size="48" text-anchor="middle" x="200" y="165"%3E🎪%3C/text%3E%3C/svg%3E'

const CATEGORY_LABELS = {
  photography: '📷 Photography', makeup: '💄 Makeup', catering: '🍽 Catering',
  decor: '🌸 Decor', music: '🎵 Music', mehendi: '🪷 Mehendi',
  pandit: '🙏 Pandit', venue: '🏛 Venue',
}

export function VendorCard({ vendor, shortlisted = false, onShortlistChange }) {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)

  async function toggleShortlist(e) {
    e.preventDefault()
    if (!user) { show('Sign in to save vendors to your shortlist', 'error'); return }
    if (shortlisted) {
      await supabase.from('shortlists').delete().match({ user_id: user.id, vendor_id: vendor.id })
      show('Removed from shortlist')
    } else {
      await supabase.from('shortlists').insert({ user_id: user.id, vendor_id: vendor.id })
      show('Added to shortlist ♡')
    }
    onShortlistChange?.()
  }

  const photo = vendor.photo_urls?.[0] || PLACEHOLDER

  return (
    <div style={{
      background: 'var(--void-2)',
      border: '1px solid rgba(200,150,60,0.15)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'transform 200ms, border-color 200ms',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img
          src={photo} alt={`${vendor.name} photo`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        <button
          onClick={toggleShortlist}
          aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          style={{
            position: 'absolute', top: '0.6rem', right: '0.6rem',
            background: 'rgba(11,9,6,0.75)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(200,150,60,0.3)', borderRadius: '50%',
            width: '34px', height: '34px', cursor: 'pointer',
            color: shortlisted ? 'var(--gold)' : 'var(--cream-muted)',
            fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >{shortlisted ? '♥' : '♡'}</button>
      </div>

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.2, flex: 1, marginRight: '0.5rem' }}>{vendor.name}</h3>
          <span style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '99px', whiteSpace: 'nowrap', border: '1px solid rgba(200,150,60,0.3)' }}>
            {CATEGORY_LABELS[vendor.category] || vendor.category}
          </span>
        </div>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>📍 {vendor.city}</p>
        {vendor.price_range && (
          <p style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 500 }}>{vendor.price_range}</p>
        )}
        <Link
          to={`/vendors/${vendor.id}`}
          style={{
            marginTop: 'auto', paddingTop: '0.75rem', display: 'block', textAlign: 'center',
            padding: '0.55rem', background: 'var(--gold-muted)', border: '1px solid rgba(200,150,60,0.3)',
            borderRadius: '7px', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600,
            textDecoration: 'none', transition: 'background 200ms',
          }}
        >View Profile →</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/components/VendorCard.jsx && git commit -m "feat(sprint-3): VendorCard with shortlist toggle"
```

---

## Task 4: Consumer Dashboard

**File:** `frontend/src/pages/consumer/Dashboard.jsx`

- [ ] **Step 1: Write Dashboard.jsx**

```jsx
// frontend/src/pages/consumer/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [shortlistCount, setShortlistCount] = useState(0)
  const [enquiryCount, setEnquiryCount] = useState(0)
  const onboarding = JSON.parse(localStorage.getItem('wedme_onboarding') || '{}')
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  useEffect(() => {
    if (!user) return
    supabase.from('shortlists').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setShortlistCount(count || 0))
    supabase.from('enquiries').select('*', { count: 'exact', head: true })
      .eq('from_user_id', user.id)
      .then(({ count }) => setEnquiryCount(count || 0))
  }, [user])

  const card = { background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.15)', borderRadius: '12px', padding: '1.5rem' }
  const statNum = { fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--gold)', lineHeight: 1 }
  const statLabel = { color: 'var(--cream-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
        Welcome back, {name} ✨
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>Your wedding planning dashboard</p>

      {onboarding.date && (
        <div style={{ ...card, marginBottom: '1.5rem', borderColor: 'rgba(200,150,60,0.3)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Your Wedding Details</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--cream-muted)' }}>
            {onboarding.date && <span>📅 {new Date(onboarding.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            {onboarding.city && <span>📍 {onboarding.city}</span>}
            {onboarding.budget && <span>💰 {onboarding.budget}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={card}>
          <div style={statNum}>{shortlistCount}</div>
          <div style={statLabel}>Vendors shortlisted</div>
        </div>
        <div style={card}>
          <div style={statNum}>{enquiryCount}</div>
          <div style={statLabel}>Enquiries sent</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/vendors" style={{ padding: '0.8rem 1.75rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
          🔍 Discover Vendors
        </Link>
        <Link to="/shortlist" style={{ padding: '0.8rem 1.75rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.95rem' }}>
          ♡ My Shortlist ({shortlistCount})
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/consumer/Dashboard.jsx && git commit -m "feat(sprint-3): Consumer dashboard with stats"
```

---

## Task 5: Vendor Discovery

**File:** `frontend/src/pages/consumer/VendorDiscovery.jsx`

- [ ] **Step 1: Write VendorDiscovery.jsx**

```jsx
// frontend/src/pages/consumer/VendorDiscovery.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { VendorCard } from '../../components/VendorCard'

const CATEGORIES = ['All','photography','makeup','catering','decor','music','mehendi','pandit','venue']

export default function VendorDiscovery() {
  const { user } = useAuthStore()
  const [vendors, setVendors] = useState([])
  const [shortlisted, setShortlisted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [cityFilter, setCityFilter] = useState('')

  async function fetchData() {
    setLoading(true)
    let q = supabase.from('vendor_listings').select('*')
    if (category !== 'All') q = q.eq('category', category)
    if (cityFilter.trim()) q = q.ilike('city', `%${cityFilter.trim()}%`)
    const { data } = await q.order('created_at', { ascending: false })
    setVendors(data || [])

    if (user) {
      const { data: sl } = await supabase.from('shortlists').select('vendor_id').eq('user_id', user.id)
      setShortlisted(new Set((sl || []).map((r) => r.vendor_id)))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [category, cityFilter, user])

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Find Vendors</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Discover the best wedding professionals</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          style={{ padding: '0.6rem 1rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <label htmlFor="citySearch" className="sr-only">Filter by city</label>
        <input
          id="citySearch" type="text" placeholder="Filter by city…" value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          style={{ padding: '0.6rem 1rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', width: '180px' }}
        />
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3].map((i) => (
            <div key={i} style={{ background: 'var(--void-2)', borderRadius: '12px', aspectRatio: '3/4', animation: 'pulse 1.5s ease infinite', opacity: 0.5 }} />
          ))}
        </div>
      )}

      {!loading && !vendors.length && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--cream-muted)' }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</p>
          <p>No vendors found for these filters. Try adjusting your search.</p>
        </div>
      )}

      {!loading && vendors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {vendors.map((v) => (
            <VendorCard key={v.id} vendor={v} shortlisted={shortlisted.has(v.id)} onShortlistChange={fetchData} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/consumer/VendorDiscovery.jsx && git commit -m "feat(sprint-3): Vendor discovery grid with category + city filters"
```

---

## Task 6: Vendor Profile + Enquiry modal

**File:** `frontend/src/pages/consumer/VendorProfile.jsx`

- [ ] **Step 1: Write VendorProfile.jsx**

```jsx
// frontend/src/pages/consumer/VendorProfile.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const TIER_LABELS = { economy: '🌿 Economy', mid: '⭐ Mid-Range', premium: '💎 Premium' }

export default function VendorProfile() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shortlisted, setShortlisted] = useState(false)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    supabase.from('vendor_listings').select('*').eq('id', id).single()
      .then(({ data }) => { setVendor(data); setLoading(false) })
    if (user) {
      supabase.from('shortlists').select('vendor_id').match({ user_id: user.id, vendor_id: id }).single()
        .then(({ data }) => setShortlisted(!!data))
    }
  }, [id, user])

  async function toggleShortlist() {
    if (!user) { show('Sign in to shortlist vendors', 'error'); return }
    if (shortlisted) {
      await supabase.from('shortlists').delete().match({ user_id: user.id, vendor_id: id })
      setShortlisted(false); show('Removed from shortlist')
    } else {
      await supabase.from('shortlists').insert({ user_id: user.id, vendor_id: id })
      setShortlisted(true); show('Added to shortlist ♡')
    }
  }

  async function sendEnquiry(e) {
    e.preventDefault()
    if (!user) { show('Sign in to send enquiries', 'error'); return }
    setSending(true)
    const { error } = await supabase.from('enquiries').insert({ from_user_id: user.id, vendor_id: id, message })
    setSending(false)
    if (error) { show('Failed to send enquiry', 'error'); return }
    show('Enquiry sent! The vendor will be in touch.'); setEnquiryOpen(false); setMessage('')
  }

  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  if (!vendor) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Vendor not found. <button onClick={() => navigate('/vendors')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>Browse vendors</button></main>

  const photos = vendor.photo_urls?.length ? vendor.photo_urls : ['']

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Photo gallery */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: '14px', overflow: 'hidden', background: 'var(--void-3)', marginBottom: '0.75rem' }}>
          {photos[photoIdx] ? (
            <img src={photos[photoIdx]} alt={`${vendor.name} photo ${photoIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🎪</div>
          )}
        </div>
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {photos.map((p, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)} aria-label={`Photo ${i+1}`}
                style={{ width: '72px', height: '52px', borderRadius: '6px', overflow: 'hidden', border: i === photoIdx ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.5rem' }}>{vendor.name}</h1>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '99px', border: '1px solid rgba(200,150,60,0.3)' }}>{vendor.category}</span>
            <span style={{ background: 'rgba(200,150,60,0.08)', color: 'var(--cream-muted)', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '99px' }}>{TIER_LABELS[vendor.tier] || vendor.tier}</span>
            <span style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>📍 {vendor.city}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={toggleShortlist} style={{ padding: '0.65rem 1.2rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: shortlisted ? 'var(--gold)' : 'var(--cream-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
            {shortlisted ? '♥ Shortlisted' : '♡ Shortlist'}
          </button>
          <button onClick={() => setEnquiryOpen(true)} style={{ padding: '0.65rem 1.4rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            Send Enquiry
          </button>
        </div>
      </div>

      {/* Details */}
      {vendor.price_range && <p style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 500, marginBottom: '1.25rem' }}>{vendor.price_range}</p>}
      {vendor.bio && (
        <div style={{ background: 'var(--void-2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(200,150,60,0.12)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>About</h2>
          <p style={{ color: 'var(--cream-muted)', lineHeight: 1.7 }}>{vendor.bio}</p>
        </div>
      )}

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setEnquiryOpen(false)}>
          <div style={{ background: 'var(--void-2)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px', border: '1px solid rgba(200,150,60,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '0.3rem' }}>Send Enquiry</h2>
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>to {vendor.name}</p>
            <form onSubmit={sendEnquiry}>
              <label htmlFor="message" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your message</label>
              <textarea
                id="message" required rows={5}
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi, I'm interested in your ${vendor.category} services for my wedding on…`}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEnquiryOpen(false)} style={{ padding: '0.65rem 1.2rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '8px', color: 'var(--cream-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
                <button type="submit" disabled={sending} style={{ padding: '0.65rem 1.5rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' }}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/consumer/VendorProfile.jsx && git commit -m "feat(sprint-3): Vendor profile page with photo gallery + enquiry modal"
```

---

## Task 7: Shortlist page

**File:** `frontend/src/pages/consumer/Shortlist.jsx`

- [ ] **Step 1: Write Shortlist.jsx**

```jsx
// frontend/src/pages/consumer/Shortlist.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { VendorCard } from '../../components/VendorCard'

export default function Shortlist() {
  const { user } = useAuthStore()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchShortlist() {
    if (!user) return
    const { data } = await supabase
      .from('shortlists')
      .select('vendor_id, vendor_listings(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setVendors((data || []).map((r) => r.vendor_listings).filter(Boolean))
    setLoading(false)
  }

  useEffect(() => { fetchShortlist() }, [user])

  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>My Shortlist</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} saved</p>

      {!vendors.length ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>♡</p>
          <p style={{ color: 'var(--cream-muted)', marginBottom: '1.5rem' }}>You haven't saved any vendors yet.</p>
          <Link to="/vendors" style={{ padding: '0.75rem 1.75rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none' }}>Browse Vendors</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {vendors.map((v) => (
            <VendorCard key={v.id} vendor={v} shortlisted={true} onShortlistChange={fetchShortlist} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Build + checks**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6/frontend" && npm run build 2>&1 | tail -5 && npm run lint:a11y && npm run perf:smoke
```

- [ ] **Step 3: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/consumer/Shortlist.jsx && git commit -m "feat(sprint-3): Shortlist page"
```
