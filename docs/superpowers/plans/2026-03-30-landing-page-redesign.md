# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current plain LandingPage.jsx with a full-bleed photography hero and an interactive category-tab vendor section that fetches live data from Supabase.

**Architecture:** LandingPage.jsx is a single self-contained page component — no sub-components created. It fetches vendors from Supabase on mount and on each category tab click, using the existing `supabase` client singleton and the existing `VendorCard` component. The hero uses a CSS full-bleed photo background with a gradient overlay that fades into `var(--void)` so there is no hard edge between hero and the rest of the page.

**Tech Stack:** React 18, Vite 5, React Router v6, @supabase/supabase-js 2, Vitest 1 + @testing-library/react 14. CSS via inline styles using existing design tokens (`--void`, `--gold`, `--cream`, `--font-display`, `--font-body`).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `frontend/src/pages/LandingPage.jsx` | Full rewrite — photo hero + category tabs + vendor grid |
| Create | `frontend/src/test/LandingPage.test.jsx` | Unit tests for category filtering and vendor rendering |

`VendorCard.jsx`, `supabase.js`, and all other files are unchanged.

---

## Task 1: Write tests for the new LandingPage

**Files:**
- Create: `frontend/src/test/LandingPage.test.jsx`

- [ ] **Step 1: Create the test file with Supabase mock**

Write `frontend/src/test/LandingPage.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
  },
}))

// ── Auth store mock (no user) ─────────────────────────────────────────────────
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: null }),
}))

// ── Toast store mock ──────────────────────────────────────────────────────────
vi.mock('../store/useToastStore', () => ({
  useToastStore: () => ({ show: vi.fn() }),
}))

const FAKE_VENDORS = [
  {
    id: 'v1',
    name: 'Lens & Light Studio',
    category: 'photography',
    city: 'Thamel, Kathmandu',
    price_range: 'NPR 40,000+',
    tier: 'mid',
    photo_urls: [],
  },
  {
    id: 'v2',
    name: 'Frame Stories Nepal',
    category: 'photography',
    city: 'Lazimpat, Kathmandu',
    price_range: 'NPR 60,000+',
    tier: 'premium',
    photo_urls: [],
  },
]

function setup() {
  // Chain: .select().eq().order().limit() → { data, error }
  mockLimit.mockResolvedValue({ data: FAKE_VENDORS, error: null })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockEq.mockReturnValue({ order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
  // For "All" tab: select().order().limit() — no .eq()
  mockOrder.mockReturnValue({ limit: mockLimit })

  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

// Dynamic import so mock is applied before module loads
const { default: LandingPage } = await import('../pages/LandingPage.jsx')

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hero headline', async () => {
    setup()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders category filter pills', async () => {
    setup()
    expect(screen.getByRole('button', { name: /photography/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /venue/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /makeup/i })).toBeInTheDocument()
  })

  it('shows vendor cards after data loads', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('Lens & Light Studio')).toBeInTheDocument()
    })
    expect(screen.getByText('Frame Stories Nepal')).toBeInTheDocument()
  })

  it('re-fetches when a category tab is clicked', async () => {
    setup()
    await waitFor(() => screen.getByText('Lens & Light Studio'))
    const venueBtn = screen.getByRole('button', { name: /venue/i })
    fireEvent.click(venueBtn)
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalledTimes(2)
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail (LandingPage not yet rewritten)**

```bash
cd "C:/Users/wsadi/Documents/MyProjects/root_WedMe/frontend"
npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: tests fail because the current LandingPage doesn't fetch from Supabase or render category buttons.

---

## Task 2: Rewrite LandingPage.jsx

**Files:**
- Modify: `frontend/src/pages/LandingPage.jsx`

- [ ] **Step 1: Replace the entire file with the new implementation**

Write `frontend/src/pages/LandingPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { VendorCard } from '../components/VendorCard'

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80'

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'photography', label: '📷 Photography' },
  { key: 'venue',       label: '🏛 Venue' },
  { key: 'makeup',      label: '💄 Makeup' },
  { key: 'catering',    label: '🍽 Catering' },
  { key: 'decor',       label: '🌸 Decor' },
  { key: 'music',       label: '🎵 Music' },
  { key: 'mehendi',     label: '🪷 Mehendi' },
  { key: 'pandit',      label: '🙏 Pandit' },
]

const STEPS = [
  { num: '01', title: 'Discover', desc: 'Browse hundreds of vetted wedding & event vendors across Nepal.' },
  { num: '02', title: 'Shortlist', desc: 'Save your favourites and compare them at your own pace.' },
  { num: '03', title: 'Connect',  desc: 'Send an enquiry directly — no middlemen, no commission.' },
]

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [vendors, setVendors]               = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchVendors() {
      setLoading(true)
      let q = supabase.from('vendor_listings').select('*')
      if (activeCategory !== 'all') q = q.eq('category', activeCategory)
      q = q.order('created_at', { ascending: false }).limit(activeCategory === 'all' ? 6 : 3)
      const { data } = await q
      if (!cancelled) {
        setVendors(data || [])
        setLoading(false)
      }
    }
    fetchVendors()
    return () => { cancelled = true }
  }, [activeCategory])

  const activeCat = CATEGORIES.find(c => c.key === activeCategory)

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("${HERO_PHOTO}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />

        {/* Gradient overlay — fades to --void at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,9,6,0.35) 0%, rgba(11,9,6,0.72) 55%, var(--void) 100%)',
        }} />

        {/* Spinning mandala (depth layer) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '680px', height: '680px',
          opacity: 0.05, pointerEvents: 'none',
          animation: 'spin 120s linear infinite',
        }}>
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c8963c" strokeWidth="0.4">
            <circle cx="100" cy="100" r="90"/>
            <circle cx="100" cy="100" r="70"/>
            <circle cx="100" cy="100" r="50"/>
            <circle cx="100" cy="100" r="30"/>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
              <line key={a} x1="100" y1="100"
                x2={100 + 90 * Math.cos(a * Math.PI / 180)}
                y2={100 + 90 * Math.sin(a * Math.PI / 180)} />
            ))}
            {[0,45,90,135].map(a => (
              <ellipse key={a} cx="100" cy="100" rx="90" ry="30"
                transform={`rotate(${a} 100 100)`} />
            ))}
          </svg>
        </div>
        <style>{`@keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center', padding: '6rem 1.5rem 4rem',
          maxWidth: '720px',
        }}>
          <p style={{
            fontSize: '0.75rem', letterSpacing: '0.28em', color: 'var(--gold)',
            textTransform: 'uppercase', marginBottom: '1.25rem',
          }}>
            Your Wedding &amp; Event Planning Platform
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: 400, color: 'var(--cream)',
            lineHeight: 1.08, marginBottom: '1.4rem',
          }}>
            Your Perfect Wedding<br />Begins Here
          </h1>
          <p style={{
            color: 'var(--cream-muted)', fontSize: '1.05rem',
            maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.75,
          }}>
            Discover and connect with the finest photographers, venues, makeup artists,
            and more — all in Kathmandu.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/vendors" style={{
              padding: '0.9rem 2.2rem', background: 'var(--gold)',
              borderRadius: '6px', color: 'var(--void)',
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.04em',
            }}>
              Find Vendors
            </Link>
            <Link to="/register" style={{
              padding: '0.9rem 2.2rem', background: 'transparent',
              border: '1px solid rgba(200,150,60,0.55)', borderRadius: '6px',
              color: 'var(--gold)', fontFamily: 'var(--font-body)',
              fontSize: '0.9rem', textDecoration: 'none',
            }}>
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Vendors ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <p style={{
          fontSize: '0.72rem', letterSpacing: '0.24em', color: 'var(--gold)',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.6rem',
        }}>
          Kathmandu&apos;s Best
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400, color: 'var(--cream)',
          textAlign: 'center', marginBottom: '2.5rem',
        }}>
          Find Your Perfect Vendors
        </h2>

        {/* Category pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          justifyContent: 'center', marginBottom: '2.5rem',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              aria-pressed={activeCategory === cat.key}
              style={{
                padding: '0.45rem 1.1rem',
                background: activeCategory === cat.key ? 'var(--gold)' : 'transparent',
                border: `1px solid ${activeCategory === cat.key ? 'var(--gold)' : 'rgba(200,150,60,0.35)'}`,
                borderRadius: '999px',
                color: activeCategory === cat.key ? 'var(--void)' : 'var(--cream-muted)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem',
                fontWeight: activeCategory === cat.key ? 700 : 400,
                cursor: 'pointer', transition: 'all 180ms',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Vendor grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'var(--void-2)', borderRadius: '12px',
                aspectRatio: '3/4', opacity: 0.4,
              }} />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--cream-muted)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</p>
            <p>No vendors found in this category yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {vendors.map(v => (
              <VendorCard key={v.id} vendor={v} shortlisted={false} />
            ))}
          </div>
        )}

        {/* View all link */}
        {!loading && vendors.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              to={activeCategory === 'all' ? '/vendors' : `/vendors?category=${activeCategory}`}
              style={{
                color: 'var(--gold)', fontFamily: 'var(--font-body)',
                fontSize: '0.88rem', letterSpacing: '0.06em',
                textDecoration: 'none', borderBottom: '1px solid rgba(200,150,60,0.4)',
                paddingBottom: '0.15rem',
              }}
            >
              View all {activeCat?.key === 'all' ? '' : activeCat?.label.replace(/^\S+\s/, '')}{' '}
              vendors →
            </Link>
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem',
        maxWidth: '900px', margin: '0 auto',
        borderTop: '1px solid rgba(200,150,60,0.08)',
      }}>
        <p style={{
          fontSize: '0.72rem', letterSpacing: '0.24em', color: 'var(--gold)',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.6rem',
        }}>
          How it works
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400, color: 'var(--cream)',
          textAlign: 'center', marginBottom: '3.5rem',
        }}>
          Three steps to your dream wedding
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem',
        }}>
          {STEPS.map(step => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '3rem',
                color: 'var(--gold)', opacity: 0.35, lineHeight: 1, marginBottom: '0.75rem',
              }}>
                {step.num}
              </p>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem',
                color: 'var(--cream)', marginBottom: '0.5rem',
              }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--cream-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(200,150,60,0.1)',
        padding: '2rem 1.5rem', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          color: 'var(--gold)', marginBottom: '0.4rem',
        }}>
          WedMe
        </p>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>
          © 2026 WedMe. Crafted for every celebration.
        </p>
      </footer>
    </main>
  )
}
```

- [ ] **Step 2: Run tests — they should now pass**

```bash
cd "C:/Users/wsadi/Documents/MyProjects/root_WedMe/frontend"
npm test -- --reporter=verbose 2>&1 | tail -25
```

Expected output:
```
✓ LandingPage > renders hero headline
✓ LandingPage > renders category filter pills
✓ LandingPage > shows vendor cards after data loads
✓ LandingPage > re-fetches when a category tab is clicked
```

If tests fail with "Cannot find module '../store/useToastStore'", check that `VendorCard` imports it and the mock path matches.

- [ ] **Step 3: Verify dev server looks correct at http://localhost:5174**

Start dev server if not running:
```bash
npm --prefix "C:/Users/wsadi/Documents/MyProjects/root_WedMe/frontend" run dev
```

Check:
- Hero shows full-bleed wedding photo with dark overlay ✓
- Headline "Your Perfect Wedding Begins Here" is visible ✓
- Category pills row is visible below hero ✓
- 3 skeleton cards appear briefly, then vendor cards load ✓
- Clicking a category pill re-fetches and shows different vendors ✓

**Note:** Vendor cards will show "No vendors found" until you run the Supabase seed SQL (see Task 3).

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/wsadi/Documents/MyProjects/root_WedMe"
git add frontend/src/pages/LandingPage.jsx frontend/src/test/LandingPage.test.jsx
git commit -m "feat: luxury photo hero + category tab vendor section on landing page"
```

---

## Task 3: Run Supabase setup (manual — done in browser)

This task is performed by the user in the Supabase dashboard. No code changes.

**Files:** None

- [ ] **Step 1: Open the Supabase SQL Editor**

Go to: `https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new`

- [ ] **Step 2: Run the schema migration**

Open `supabase/migrations/20260329000001_wedme_schema.sql`, copy the entire contents, paste into the SQL editor, and click **Run**.

Expected: "Success. No rows returned" for each statement.

If you see errors like "relation already exists", the schema was already run — that's fine, skip to Step 3.

- [ ] **Step 3: Run the seed data**

Open `supabase/migrations/20260330000001_seed_kathmandu_vendors.sql`, copy the entire contents, paste into a **new** SQL editor tab, and click **Run**.

Expected: "Success. 20 rows affected" (approximately).

- [ ] **Step 4: Verify vendors appear on the landing page**

Reload `http://localhost:5174`.

Expected:
- Default "All" tab shows 6 vendor cards with photos, names, Kathmandu locations, and NPR prices
- Clicking "📷 Photography" shows Photo Choice Nepal, Photo Life Nepal, Blaze Byte Media
- Clicking "🏛 Venue" shows Silver Oak Banquet, Hotel Shanker, Hyatt Regency Kathmandu
- "View all Photography vendors →" link navigates to `/vendors?category=photography`
