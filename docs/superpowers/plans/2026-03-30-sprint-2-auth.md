# Sprint 2 — Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/login` and `/register` pages with email/password + Google OAuth, role-based post-auth redirect, and a shared Nav component.

**Architecture:** Login and Register are standalone pages importing `supabase` directly. A new `Nav` component reads `useAuthStore` for conditional rendering. Both pages use inline style objects referencing the CSS custom properties already defined in `src/styles/variables.css`.

**Tech Stack:** React 18, React Router v6 `useNavigate`, Supabase JS SDK v2 (`signInWithPassword`, `signUp`, `signInWithOAuth`), Zustand `useAuthStore`.

---

## File Map

| Action | Path |
|---|---|
| Replace | `frontend/src/pages/auth/Login.jsx` |
| Replace | `frontend/src/pages/auth/Register.jsx` |
| Create  | `frontend/src/components/Nav.jsx` |
| Modify  | `frontend/src/main.jsx` |

---

## Task 1: Login page

**File:** `frontend/src/pages/auth/Login.jsx`

- [ ] **Step 1: Write Login.jsx**

```jsx
// frontend/src/pages/auth/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

const s = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--void-2)',
    border: '1px solid rgba(200,150,60,0.2)',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 400,
    color: 'var(--cream)',
    marginBottom: '0.4rem',
  },
  sub: {
    color: 'var(--cream-muted)',
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--cream-muted)',
    marginBottom: '0.35rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    background: 'var(--void-3)',
    border: '1px solid rgba(200,150,60,0.2)',
    borderRadius: '8px',
    color: 'var(--cream)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    marginBottom: '1.25rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '0.8rem',
    background: 'var(--gold)',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--void)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem',
    background: 'transparent',
    border: '1px solid rgba(200,150,60,0.4)',
    borderRadius: '8px',
    color: 'var(--cream)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1rem 0',
    color: 'var(--cream-muted)',
    fontSize: '0.8rem',
  },
  line: {
    flex: 1,
    height: '1px',
    background: 'rgba(200,150,60,0.15)',
  },
  error: {
    color: 'var(--error)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    padding: '0.6rem 0.8rem',
    background: 'rgba(229,115,115,0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(229,115,115,0.3)',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--cream-muted)',
  },
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setUser(data.user)
    const role = data.user?.user_metadata?.role
    navigate(role === 'vendor' ? '/vendor/dashboard' : '/dashboard')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Welcome Back</h1>
        <p style={s.sub}>Sign in to continue your journey</p>

        {error && <div style={s.error} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email" style={s.label}>Email address</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={s.input} placeholder="you@example.com"
          />
          <label htmlFor="password" style={s.label}>Password</label>
          <input
            id="password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={s.input} placeholder="••••••••"
          />
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.line} /> or <span style={s.line} />
        </div>

        <button style={s.googleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <p style={s.footer}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--gold)' }}>Create an account</Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/auth/Login.jsx && git commit -m "feat(sprint-2): Login page with email/password + Google OAuth"
```

---

## Task 2: Register page

**File:** `frontend/src/pages/auth/Register.jsx`

- [ ] **Step 1: Write Register.jsx**

```jsx
// frontend/src/pages/auth/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

const s = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    background: 'var(--void-2)',
    border: '1px solid rgba(200,150,60,0.2)',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 400,
    color: 'var(--cream)',
    marginBottom: '0.4rem',
  },
  sub: {
    color: 'var(--cream-muted)',
    fontSize: '0.9rem',
    marginBottom: '1.75rem',
  },
  roleRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  roleCard: (active) => ({
    padding: '1rem',
    border: active ? '2px solid var(--gold)' : '1px solid rgba(200,150,60,0.2)',
    borderRadius: '10px',
    background: active ? 'var(--gold-muted)' : 'var(--void-3)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 200ms ease',
  }),
  roleIcon: { fontSize: '1.5rem', display: 'block', marginBottom: '0.35rem' },
  roleLabel: (active) => ({
    fontSize: '0.82rem',
    fontWeight: 600,
    color: active ? 'var(--gold-light)' : 'var(--cream-muted)',
    letterSpacing: '0.04em',
  }),
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--cream-muted)',
    marginBottom: '0.35rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    background: 'var(--void-3)',
    border: '1px solid rgba(200,150,60,0.2)',
    borderRadius: '8px',
    color: 'var(--cream)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    marginBottom: '1.1rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '0.8rem',
    background: 'var(--gold)',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--void)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem',
    background: 'transparent',
    border: '1px solid rgba(200,150,60,0.4)',
    borderRadius: '8px',
    color: 'var(--cream)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1rem 0',
    color: 'var(--cream-muted)',
    fontSize: '0.8rem',
  },
  line: { flex: 1, height: '1px', background: 'rgba(200,150,60,0.15)' },
  error: {
    color: 'var(--error)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    padding: '0.6rem 0.8rem',
    background: 'rgba(229,115,115,0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(229,115,115,0.3)',
  },
  success: {
    color: 'var(--success)',
    fontSize: '0.9rem',
    padding: '0.75rem 0.8rem',
    background: 'rgba(76,175,125,0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(76,175,125,0.3)',
    marginBottom: '1rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--cream-muted)',
  },
}

export default function Register() {
  const [role, setRole] = useState('consumer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { role, full_name: fullName } },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    if (data.user && !data.session) {
      setSuccess('Check your email to confirm your account, then sign in.')
      return
    }
    if (data.user) {
      setUser(data.user)
      navigate(role === 'vendor' ? '/vendor/onboarding' : '/onboarding')
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { role },
      },
    })
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Begin Your Journey</h1>
        <p style={s.sub}>Create your WedMe account</p>

        {error && <div style={s.error} role="alert">{error}</div>}
        {success && <div style={s.success} role="status">{success}</div>}

        <div style={s.roleRow} role="group" aria-label="Account type">
          <button
            type="button"
            style={s.roleCard(role === 'consumer')}
            onClick={() => setRole('consumer')}
            aria-pressed={role === 'consumer'}
          >
            <span style={s.roleIcon}>💑</span>
            <span style={s.roleLabel(role === 'consumer')}>Planning a Wedding</span>
          </button>
          <button
            type="button"
            style={s.roleCard(role === 'vendor')}
            onClick={() => setRole('vendor')}
            aria-pressed={role === 'vendor'}
          >
            <span style={s.roleIcon}>🎪</span>
            <span style={s.roleLabel(role === 'vendor')}>I'm a Vendor</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="fullName" style={s.label}>Full name</label>
          <input
            id="fullName" type="text" required autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            style={s.input} placeholder="Priya Sharma"
          />
          <label htmlFor="email" style={s.label}>Email address</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={s.input} placeholder="you@example.com"
          />
          <label htmlFor="password" style={s.label}>Password</label>
          <input
            id="password" type="password" required autoComplete="new-password" minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={s.input} placeholder="Min. 6 characters"
          />
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.line} /> or <span style={s.line} />
        </div>

        <button style={s.googleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/auth/Register.jsx && git commit -m "feat(sprint-2): Register page with role picker + email + Google OAuth"
```

---

## Task 3: Nav component

**File:** `frontend/src/components/Nav.jsx`

- [ ] **Step 1: Write Nav.jsx**

```jsx
// frontend/src/components/Nav.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const s = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 'var(--z-nav)',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    background: 'rgba(11,9,6,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(200,150,60,0.12)',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    color: 'var(--gold)',
    textDecoration: 'none',
    fontWeight: 400,
    letterSpacing: '0.04em',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  link: {
    color: 'var(--cream-muted)',
    textDecoration: 'none',
    fontSize: '0.88rem',
    letterSpacing: '0.04em',
    transition: 'color 200ms',
  },
  signOutBtn: {
    background: 'none',
    border: '1px solid rgba(200,150,60,0.35)',
    borderRadius: '6px',
    color: 'var(--gold)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    padding: '0.35rem 0.85rem',
    cursor: 'pointer',
  },
  joinBtn: {
    background: 'var(--gold)',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--void)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 600,
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    textDecoration: 'none',
  },
}

export function Nav() {
  const { user, role, signOut } = useAuthStore()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={s.nav} aria-label="Main navigation">
      <Link to="/" style={s.logo}>WedMe</Link>

      <ul style={s.links}>
        {!user && (
          <>
            <li><Link to="/vendors" style={s.link}>Discover</Link></li>
            <li><Link to="/login" style={s.link}>Sign In</Link></li>
            <li><Link to="/register" style={s.joinBtn}>Join Free</Link></li>
          </>
        )}

        {user && role === 'consumer' && (
          <>
            <li><Link to="/vendors" style={s.link}>Discover</Link></li>
            <li><Link to="/shortlist" style={s.link}>Shortlist</Link></li>
            <li><Link to="/dashboard" style={s.link}>Dashboard</Link></li>
            <li>
              <button style={s.signOutBtn} onClick={handleSignOut}>Sign Out</button>
            </li>
          </>
        )}

        {user && role === 'vendor' && (
          <>
            <li><Link to="/vendor/dashboard" style={s.link}>Dashboard</Link></li>
            <li><Link to="/vendor/enquiries" style={s.link}>Enquiries</Link></li>
            <li><Link to="/vendor/profile/edit" style={s.link}>My Profile</Link></li>
            <li>
              <button style={s.signOutBtn} onClick={handleSignOut}>Sign Out</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/components/Nav.jsx && git commit -m "feat(sprint-2): Nav component with role-conditional links"
```

---

## Task 4: Wire Nav into main.jsx

**File:** `frontend/src/main.jsx`

- [ ] **Step 1: Read the current main.jsx and add Nav import + render**

Read `frontend/src/main.jsx`, then:
1. Add `import { Nav } from './components/Nav'` after the AuthGuard import
2. In `AppRoot`, change `return <Outlet />` to:
```jsx
return (
  <>
    <Nav />
    <div style={{ paddingTop: '60px' }}>
      <Outlet />
    </div>
  </>
)
```

- [ ] **Step 2: Build to verify**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6/frontend" && npm run build 2>&1 | tail -5
```
Expected: build succeeds.

- [ ] **Step 3: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/main.jsx && git commit -m "feat(sprint-2): add Nav to AppRoot layout"
```

---

## Task 5: Final Sprint 2 checks

- [ ] **Run tests**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6/frontend" && npm test 2>&1 | tail -5
```
Expected: 11 passed (existing tests unaffected — Login/Register/Nav have no unit tests in this sprint).

- [ ] **Build + CI**
```bash
npm run build && npm run lint:a11y && npm run perf:smoke
```
Expected: all PASS.

- [ ] **Commit if clean**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/ && git status
```
