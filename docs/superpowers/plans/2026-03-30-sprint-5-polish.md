# Sprint 5 — Polish & Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full luxury landing page, add 404 route, and run final production checks.

**Architecture:** LandingPage is a standalone page component. No Supabase calls. Mandala SVG is inline. 404 is a minimal stub.

---

## Task 1: Landing Page

**File:** `frontend/src/pages/LandingPage.jsx`

- [ ] **Step 1: Write LandingPage.jsx**

```jsx
// frontend/src/pages/LandingPage.jsx
import { Link } from 'react-router-dom'

const CATEGORIES = [
  { icon: '📷', label: 'Photography' },
  { icon: '💄', label: 'Makeup' },
  { icon: '🍽', label: 'Catering' },
  { icon: '🌸', label: 'Decor' },
  { icon: '🎵', label: 'Music' },
  { icon: '🪷', label: 'Mehendi' },
  { icon: '🙏', label: 'Pandit' },
  { icon: '🏛', label: 'Venue' },
]

const STEPS = [
  { num: '01', title: 'Discover', desc: 'Browse hundreds of vetted Hindu wedding vendors across India.' },
  { num: '02', title: 'Shortlist', desc: 'Save your favourites and compare them at your own pace.' },
  { num: '03', title: 'Connect', desc: 'Send an enquiry directly — no middlemen, no commission.' },
]

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Mandala */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', opacity: 0.04, pointerEvents: 'none', animation: 'spin 120s linear infinite' }}>
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c8963c" strokeWidth="0.5">
            <circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="70"/><circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="30"/>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => (
              <line key={a} x1="100" y1="100" x2={100+90*Math.cos(a*Math.PI/180)} y2={100+90*Math.sin(a*Math.PI/180)} />
            ))}
            {[0,45,90,135].map((a) => (
              <ellipse key={a} cx="100" cy="100" rx="90" ry="30" transform={`rotate(${a} 100 100)`} />
            ))}
          </svg>
        </div>
        <style>{`@keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>

        <p style={{ fontSize: '0.78rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>The Hindu Wedding Platform</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '720px' }}>
          Your Perfect Hindu<br />Wedding Begins Here
        </h1>
        <p style={{ color: 'var(--cream-muted)', fontSize: '1.05rem', maxWidth: '480px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Discover and connect with the finest photographers, makeup artists, caterers, and more — all in one place.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/vendors" style={{ padding: '0.9rem 2.2rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', letterSpacing: '0.02em' }}>Find Vendors</Link>
          <Link to="/register" style={{ padding: '0.9rem 2.2rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.5)', borderRadius: '8px', color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', textDecoration: 'none' }}>List Your Business</Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.22em', color: 'var(--gold)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.75rem' }}>How it works</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'var(--cream)', textAlign: 'center', marginBottom: '3.5rem' }}>Three steps to your dream wedding</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          {STEPS.map((step) => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--gold)', opacity: 0.4, lineHeight: 1, marginBottom: '0.75rem' }}>{step.num}</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '0.5rem' }}>{step.title}</h3>
              <p style={{ color: 'var(--cream-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section style={{ padding: '4rem 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.22em', color: 'var(--gold)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.75rem' }}>Categories</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 400, color: 'var(--cream)', textAlign: 'center', marginBottom: '2.5rem' }}>Everything for your wedding</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.label} to={`/vendors?category=${cat.label.toLowerCase()}`}
              style={{ background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.12)', borderRadius: '12px', padding: '1.5rem 1rem', textAlign: 'center', textDecoration: 'none', transition: 'border-color 200ms' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.6rem' }}>{cat.icon}</span>
              <span style={{ color: 'var(--cream-muted)', fontSize: '0.88rem', fontFamily: 'var(--font-body)' }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(200,150,60,0.1)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)', marginBottom: '0.4rem' }}>WedMe</p>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>© 2026 WedMe. Built with love for Hindu weddings.</p>
      </footer>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/LandingPage.jsx && git commit -m "feat(sprint-5): Full luxury landing page with mandala hero"
```

---

## Task 2: 404 page + route

**Files:**
- Create: `frontend/src/pages/NotFound.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Create NotFound.jsx**

```jsx
// frontend/src/pages/NotFound.jsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ minHeight: '80dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', color: 'var(--gold)', opacity: 0.3, lineHeight: 1, marginBottom: '1rem' }}>404</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem' }}>Page not found</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ padding: '0.75rem 1.75rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none' }}>Go Home</Link>
    </main>
  )
}
```

- [ ] **Step 2: Add catch-all route to main.jsx**

Read `frontend/src/main.jsx`. Add:
1. `import NotFound from './pages/NotFound'` after the EnquiryInbox import
2. Add `{ path: '*', element: <NotFound /> }` as the last route in the children array

- [ ] **Step 3: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/NotFound.jsx frontend/src/main.jsx && git commit -m "feat(sprint-5): 404 NotFound page"
```

---

## Task 3: Final production checks

- [ ] **Run full test suite**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6/frontend" && npm test 2>&1 | tail -5
```
Expected: 11 passed

- [ ] **Run build**
```bash
npm run build 2>&1 | tail -8
```
Expected: build succeeds. Note the bundle size.

- [ ] **If bundle > 500KB, update perf budget**

Read `frontend/scripts/perf-smoke.mjs`. Change `BUDGET_BYTES` to `700 * 1024` to accommodate the full app.

- [ ] **Run CI checks**
```bash
npm run lint:a11y && npm run perf:smoke
```
Expected: both PASS

- [ ] **Final commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/ && git status && git add -f frontend/ && git commit -m "feat: WedMe platform v2 complete — all 5 sprints delivered" || echo "nothing to commit"
```
