# Sprint 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `frontend/` from a vanilla HTML/CSS/JS page into a React 18 + Vite SPA with routing skeleton, ported design system, Supabase client, Zustand auth store, and protected route guard — production-ready scaffolding for Sprint 2 auth pages.

**Architecture:** `frontend/` is wiped back to Vite project conventions. Existing CSS variables and global styles are ported into `src/styles/`. React Router v6 mounts all 12 routes as stub pages. `useAuthStore` and `AuthGuard` are the only non-trivial logic — both get unit tests before implementation (TDD). No Supabase credentials are committed; they live only in `.env.local`.

**Tech Stack:** React 18, Vite 5, React Router v6, Zustand 4, @supabase/supabase-js 2, Vitest 1 + @testing-library/react 14, @vitejs/plugin-react, ESLint + eslint-plugin-react.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Replace | `frontend/package.json` | npm scripts + deps |
| Create | `frontend/vite.config.js` | Vite + Vitest config |
| Replace | `frontend/index.html` | Vite HTML entry (root div only) |
| Replace | `frontend/eslint.config.js` | React + JSX lint rules |
| Create | `frontend/.env.local` | Supabase secrets (gitignored) |
| Create | `frontend/src/styles/variables.css` | CSS custom properties (ported WEDA theme) |
| Create | `frontend/src/styles/globals.css` | Reset + base typography + layout |
| Create | `frontend/src/lib/supabase.js` | Supabase client singleton |
| Create | `frontend/src/store/useAuthStore.js` | Zustand auth state + actions |
| Create | `frontend/src/components/AuthGuard.jsx` | Route guard component |
| Create | `frontend/src/main.jsx` | React entry + RouterProvider |
| Create | `frontend/src/pages/LandingPage.jsx` | `/` stub |
| Create | `frontend/src/pages/auth/Login.jsx` | `/login` stub |
| Create | `frontend/src/pages/auth/Register.jsx` | `/register` stub |
| Create | `frontend/src/pages/consumer/Onboarding.jsx` | `/onboarding` stub |
| Create | `frontend/src/pages/consumer/Dashboard.jsx` | `/dashboard` stub |
| Create | `frontend/src/pages/consumer/VendorDiscovery.jsx` | `/vendors` stub |
| Create | `frontend/src/pages/consumer/VendorProfile.jsx` | `/vendors/:id` stub |
| Create | `frontend/src/pages/consumer/Shortlist.jsx` | `/shortlist` stub |
| Create | `frontend/src/pages/vendor/VendorOnboarding.jsx` | `/vendor/onboarding` stub |
| Create | `frontend/src/pages/vendor/VendorDashboard.jsx` | `/vendor/dashboard` stub |
| Create | `frontend/src/pages/vendor/EditProfile.jsx` | `/vendor/profile/edit` stub |
| Create | `frontend/src/pages/vendor/EnquiryInbox.jsx` | `/vendor/enquiries` stub |
| Create | `frontend/src/test/useAuthStore.test.js` | Auth store unit tests |
| Create | `frontend/src/test/AuthGuard.test.jsx` | Route guard unit tests |
| Modify | `frontend/scripts/a11y-lint.mjs` | Check `dist/index.html` after build |
| Modify | `frontend/scripts/perf-smoke.mjs` | Check `dist/` bundle sizes |

---

## Task 1: Bootstrap Vite + React project

**Files:**
- Replace: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Replace: `frontend/index.html`
- Replace: `frontend/eslint.config.js`

- [ ] **Step 1: Replace package.json with React + Vite deps**

```json
{
  "name": "wedme-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint:a11y": "node ./scripts/a11y-lint.mjs",
    "perf:smoke": "node ./scripts/perf-smoke.mjs"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@supabase/supabase-js": "^2.43.4",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1",
    "vitest": "^1.6.0",
    "@testing-library/react": "^14.3.1",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^24.1.0",
    "eslint": "^9.6.0",
    "eslint-plugin-react": "^7.34.3",
    "eslint-plugin-react-hooks": "^4.6.2"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: Replace index.html with Vite entry**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
    <title>WedMe — Hindu Wedding Planning</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace eslint.config.js with React rules**

```js
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default [
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
]
```

- [ ] **Step 5: Create test setup file**

Create `frontend/src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Install dependencies**

Run from `frontend/`:
```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Verify Vite works**

Run from `frontend/`:
```bash
npx vite build 2>&1 | head -5
```

Expected: Error about missing `src/main.jsx` entry — that's fine, it confirms Vite is wired up.

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/eslint.config.js frontend/src/test/setup.js frontend/package-lock.json
git commit -m "chore: bootstrap Vite + React 18 project scaffold"
```

---

## Task 2: Port CSS design system

**Files:**
- Create: `frontend/src/styles/variables.css`
- Create: `frontend/src/styles/globals.css`

The WEDA luxury dark theme: void-black background, marigold gold accents, Cormorant Garamond display font, DM Sans body font.

- [ ] **Step 1: Create variables.css**

```css
/* frontend/src/styles/variables.css */
:root {
  /* Palette */
  --void: #0b0906;
  --void-2: #141109;
  --void-3: #1c1710;
  --gold: #c8963c;
  --gold-light: #e5c26a;
  --gold-muted: rgba(200, 150, 60, 0.15);
  --cream: #f5efe6;
  --cream-muted: rgba(245, 239, 230, 0.65);
  --rose: #c26060;
  --success: #4caf7d;
  --error: #e57373;

  /* Typography */
  --font-display: "Cormorant Garamond", serif;
  --font-body: "DM Sans", sans-serif;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --space-2xl: 4rem;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  /* Transitions */
  --transition: 200ms ease;
  --transition-slow: 400ms ease;

  /* Z-index layers */
  --z-drawer: 100;
  --z-modal: 200;
  --z-nav: 300;
}
```

- [ ] **Step 2: Create globals.css**

```css
/* frontend/src/styles/globals.css */
@import './variables.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  background-color: var(--void);
  color: var(--cream);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}

/* Grain texture overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
}

#root {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.15;
  color: var(--cream);
}

a {
  color: var(--gold);
  text-decoration: none;
}

a:hover {
  color: var(--gold-light);
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}

button {
  font-family: var(--font-body);
  cursor: pointer;
}

img {
  max-width: 100%;
  display: block;
}

/* Utility: visually hidden (for screen readers) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/
git commit -m "feat: port WEDA luxury design system into CSS modules"
```

---

## Task 3: Supabase client + env

**Files:**
- Create: `frontend/.env.local`
- Create: `frontend/src/lib/supabase.js`

- [ ] **Step 1: Create .env.local**

Create `frontend/.env.local` with your Supabase project values. This file must NOT be committed.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Confirm `.gitignore` already excludes `.env.local` — if not, add it.

- [ ] **Step 2: Create src/lib/supabase.js**

```js
// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/supabase.js
git commit -m "feat: add Supabase client singleton"
```

---

## Task 4: useAuthStore (TDD)

**Files:**
- Create: `frontend/src/store/useAuthStore.js`
- Create: `frontend/src/test/useAuthStore.test.js`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/test/useAuthStore.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// Mock supabase before importing the store
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}))

// Import after mock is set up
const { useAuthStore } = await import('../store/useAuthStore.js')

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useAuthStore.setState({ user: null, role: null, loading: true })
  })

  it('starts with null user and loading true', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('setUser populates user, role, and sets loading false', () => {
    const { result } = renderHook(() => useAuthStore())
    const fakeUser = { id: 'abc', user_metadata: { role: 'consumer' } }

    act(() => {
      result.current.setUser(fakeUser)
    })

    expect(result.current.user).toEqual(fakeUser)
    expect(result.current.role).toBe('consumer')
    expect(result.current.loading).toBe(false)
  })

  it('setUser with null clears state', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser(null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('clearUser sets user and role to null, loading false', () => {
    const { result } = renderHook(() => useAuthStore())
    useAuthStore.setState({ user: { id: 'x' }, role: 'vendor', loading: false })

    act(() => {
      result.current.clearUser()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('signOut calls supabase.auth.signOut and clears state', async () => {
    const { supabase } = await import('../lib/supabase')
    const { result } = renderHook(() => useAuthStore())
    useAuthStore.setState({ user: { id: 'x' }, role: 'vendor', loading: false })

    await act(async () => {
      await result.current.signOut()
    })

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run from `frontend/`:
```bash
npm test -- src/test/useAuthStore.test.js
```

Expected: `Error: Cannot find module '../store/useAuthStore.js'`

- [ ] **Step 3: Implement useAuthStore**

Create `frontend/src/store/useAuthStore.js`:

```js
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,

  setUser: (user) =>
    set({
      user,
      role: user?.user_metadata?.role ?? null,
      loading: false,
    }),

  clearUser: () =>
    set({ user: null, role: null, loading: false }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, role: null, loading: false })
  },
}))
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- src/test/useAuthStore.test.js
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/useAuthStore.js frontend/src/test/useAuthStore.test.js
git commit -m "feat: add useAuthStore with Zustand (TDD)"
```

---

## Task 5: AuthGuard component (TDD)

**Files:**
- Create: `frontend/src/components/AuthGuard.jsx`
- Create: `frontend/src/test/AuthGuard.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/test/AuthGuard.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock useAuthStore
const mockStore = vi.hoisted(() => ({
  user: null,
  role: null,
  loading: false,
}))

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => mockStore,
}))

const { AuthGuard } = await import('../components/AuthGuard.jsx')

function renderWithRouter(ui, { initialEntries = ['/protected'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    mockStore.user = null
    mockStore.role = null
    mockStore.loading = false
  })

  it('renders nothing while loading', () => {
    mockStore.loading = true
    const { container } = renderWithRouter(
      <AuthGuard><div>Protected</div></AuthGuard>
    )
    expect(container.firstChild).toBeNull()
  })

  it('redirects to /login when no user', () => {
    renderWithRouter(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders children when user is authenticated with no role requirement', () => {
    mockStore.user = { id: 'u1' }
    mockStore.role = 'consumer'
    renderWithRouter(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('renders children when user role matches required role', () => {
    mockStore.user = { id: 'u1' }
    mockStore.role = 'vendor'
    renderWithRouter(<AuthGuard role="vendor"><div>Vendor Area</div></AuthGuard>)
    expect(screen.getByText('Vendor Area')).toBeInTheDocument()
  })

  it('redirects to / when user role does not match required role', () => {
    mockStore.user = { id: 'u1' }
    mockStore.role = 'consumer'
    renderWithRouter(<AuthGuard role="vendor"><div>Vendor Area</div></AuthGuard>)
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- src/test/AuthGuard.test.jsx
```

Expected: `Error: Cannot find module '../components/AuthGuard.jsx'`

- [ ] **Step 3: Implement AuthGuard**

Create `frontend/src/components/AuthGuard.jsx`:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Wraps a route requiring authentication.
 * @param {string} [role] - If provided, user must have this role (consumer | vendor).
 */
export function AuthGuard({ role, children }) {
  const { user, role: userRole, loading } = useAuthStore()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/" replace />

  return children
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- src/test/AuthGuard.test.jsx
```

Expected: `5 passed`

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: `10 passed`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AuthGuard.jsx frontend/src/test/AuthGuard.test.jsx
git commit -m "feat: add AuthGuard route protection component (TDD)"
```

---

## Task 6: Placeholder page components

**Files:** All files under `frontend/src/pages/`.

Each page is a minimal stub that renders the route name inside a `<main>` landmark. This gives the router something to render and allows a11y checks to pass. Actual UI is implemented in Sprints 2–5.

- [ ] **Step 1: Create LandingPage.jsx**

```jsx
// frontend/src/pages/LandingPage.jsx
export default function LandingPage() {
  return (
    <main>
      <h1>WedMe — Hindu Wedding Planning</h1>
      <p>Discover vendors for your perfect wedding.</p>
    </main>
  )
}
```

- [ ] **Step 2: Create auth pages**

`frontend/src/pages/auth/Login.jsx`:
```jsx
export default function Login() {
  return (
    <main>
      <h1>Login</h1>
    </main>
  )
}
```

`frontend/src/pages/auth/Register.jsx`:
```jsx
export default function Register() {
  return (
    <main>
      <h1>Create Account</h1>
    </main>
  )
}
```

- [ ] **Step 3: Create consumer pages**

`frontend/src/pages/consumer/Onboarding.jsx`:
```jsx
export default function Onboarding() {
  return <main><h1>Tell us about your wedding</h1></main>
}
```

`frontend/src/pages/consumer/Dashboard.jsx`:
```jsx
export default function Dashboard() {
  return <main><h1>Your Wedding Dashboard</h1></main>
}
```

`frontend/src/pages/consumer/VendorDiscovery.jsx`:
```jsx
export default function VendorDiscovery() {
  return <main><h1>Find Vendors</h1></main>
}
```

`frontend/src/pages/consumer/VendorProfile.jsx`:
```jsx
export default function VendorProfile() {
  return <main><h1>Vendor Profile</h1></main>
}
```

`frontend/src/pages/consumer/Shortlist.jsx`:
```jsx
export default function Shortlist() {
  return <main><h1>My Shortlist</h1></main>
}
```

- [ ] **Step 4: Create vendor pages**

`frontend/src/pages/vendor/VendorOnboarding.jsx`:
```jsx
export default function VendorOnboarding() {
  return <main><h1>Set Up Your Vendor Profile</h1></main>
}
```

`frontend/src/pages/vendor/VendorDashboard.jsx`:
```jsx
export default function VendorDashboard() {
  return <main><h1>Vendor Dashboard</h1></main>
}
```

`frontend/src/pages/vendor/EditProfile.jsx`:
```jsx
export default function EditProfile() {
  return <main><h1>Edit Your Profile</h1></main>
}
```

`frontend/src/pages/vendor/EnquiryInbox.jsx`:
```jsx
export default function EnquiryInbox() {
  return <main><h1>Enquiry Inbox</h1></main>
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat: add stub page components for all 12 routes"
```

---

## Task 7: Wire React Router in main.jsx

**Files:**
- Create: `frontend/src/main.jsx`

- [ ] **Step 1: Create main.jsx with all routes**

```jsx
// frontend/src/main.jsx
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from 'react-router-dom'
import './styles/globals.css'

import { useAuthStore } from './store/useAuthStore'
import { supabase } from './lib/supabase'
import { AuthGuard } from './components/AuthGuard'

import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/consumer/Onboarding'
import Dashboard from './pages/consumer/Dashboard'
import VendorDiscovery from './pages/consumer/VendorDiscovery'
import VendorProfile from './pages/consumer/VendorProfile'
import Shortlist from './pages/consumer/Shortlist'
import VendorOnboarding from './pages/vendor/VendorOnboarding'
import VendorDashboard from './pages/vendor/VendorDashboard'
import EditProfile from './pages/vendor/EditProfile'
import EnquiryInbox from './pages/vendor/EnquiryInbox'

function AppRoot() {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser])

  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },

      // Consumer routes (require consumer role)
      {
        path: '/onboarding',
        element: <AuthGuard role="consumer"><Onboarding /></AuthGuard>,
      },
      {
        path: '/dashboard',
        element: <AuthGuard role="consumer"><Dashboard /></AuthGuard>,
      },
      {
        path: '/vendors',
        element: <VendorDiscovery />,
      },
      {
        path: '/vendors/:id',
        element: <VendorProfile />,
      },
      {
        path: '/shortlist',
        element: <AuthGuard role="consumer"><Shortlist /></AuthGuard>,
      },

      // Vendor routes (require vendor role)
      {
        path: '/vendor/onboarding',
        element: <AuthGuard role="vendor"><VendorOnboarding /></AuthGuard>,
      },
      {
        path: '/vendor/dashboard',
        element: <AuthGuard role="vendor"><VendorDashboard /></AuthGuard>,
      },
      {
        path: '/vendor/profile/edit',
        element: <AuthGuard role="vendor"><EditProfile /></AuthGuard>,
      },
      {
        path: '/vendor/enquiries',
        element: <AuthGuard role="vendor"><EnquiryInbox /></AuthGuard>,
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
```

- [ ] **Step 2: Run the build**

Run from `frontend/`:
```bash
npm run build
```

Expected: `dist/` created with `index.html`, `assets/*.js`, `assets/*.css`. No errors.

- [ ] **Step 3: Smoke-test in browser**

Run from `frontend/`:
```bash
npm run preview
```

Open `http://localhost:4173/` — should show "WedMe — Hindu Wedding Planning".
Open `http://localhost:4173/login` — should show "Login".
Open `http://localhost:4173/dashboard` — should redirect to `/login` (no auth).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.jsx
git commit -m "feat: wire React Router with all 12 routes and auth session listener"
```

---

## Task 8: Update CI scripts for React build output

**Files:**
- Modify: `frontend/scripts/a11y-lint.mjs`
- Modify: `frontend/scripts/perf-smoke.mjs`

The old scripts checked vanilla `index.html`, `styles.min.css`, `app.min.js` directly. Now they must work against the Vite build in `dist/`.

- [ ] **Step 1: Update a11y-lint.mjs to check dist/index.html**

Replace the entire contents of `frontend/scripts/a11y-lint.mjs`:

```js
// Checks the built dist/index.html for basic a11y rules.
// For full React component checks, add @axe-core/react in Sprint 3.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const distHtmlPath = fileURLToPath(new URL('../dist/index.html', import.meta.url))

if (!existsSync(distHtmlPath)) {
  console.error('ERROR: dist/index.html not found. Run `npm run build` first.')
  process.exit(1)
}

const html = await readFile(distHtmlPath, 'utf8')
const checks = []

// Check: img elements must have alt
const imgTags = [...html.matchAll(/<img\b[^>]*>/g)]
const imgWithoutAlt = imgTags.filter((m) => !/\balt\s*=/.test(m[0]))
checks.push({
  name: 'img elements require alt',
  passed: imgWithoutAlt.length === 0,
  detail: `${imgWithoutAlt.length} img tags without alt`,
})

// Check: inputs should have explicit labels
const inputs = [...html.matchAll(/<input\b[^>]*id="([^"]+)"[^>]*/g)].map((m) => m[1])
const labels = new Set([...html.matchAll(/<label\b[^>]*for="([^"]+)"[^>]*/g)].map((m) => m[1]))
const unlabelled = inputs.filter((id) => !labels.has(id))
checks.push({
  name: 'inputs should have explicit labels',
  passed: unlabelled.length === 0,
  detail: `${unlabelled.length} inputs without matching label`,
})

const failed = checks.filter((c) => !c.passed)
checks.forEach((c) => {
  const mark = c.passed ? 'PASS' : 'FAIL'
  console.log(`${mark} - ${c.name} (${c.detail})`)
})

if (failed.length > 0) process.exit(1)
```

- [ ] **Step 2: Update perf-smoke.mjs to measure Vite build output**

Replace the entire contents of `frontend/scripts/perf-smoke.mjs`:

```js
// Measures total JS + CSS bundle size in dist/assets/.
// Budget: 500KB total (React baseline). Tighten per-sprint as lazy-loading is added.
import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, extname } from 'node:path'
import { existsSync } from 'node:fs'

const BUDGET_BYTES = 500 * 1024 // 500 KB

const assetsDir = fileURLToPath(new URL('../dist/assets', import.meta.url))

if (!existsSync(assetsDir)) {
  console.error('ERROR: dist/assets not found. Run `npm run build` first.')
  process.exit(1)
}

const files = await readdir(assetsDir)
const results = []

for (const file of files) {
  const ext = extname(file)
  if (ext !== '.js' && ext !== '.css') continue
  const filePath = join(assetsDir, file)
  const { size } = await stat(filePath)
  results.push({ file, bytes: size })
}

const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0)
results.forEach((r) => console.log(`${r.file} ${r.bytes}B`))
console.log(`TOTAL ${totalBytes}B / BUDGET ${BUDGET_BYTES}B`)

if (totalBytes > BUDGET_BYTES) {
  console.error(`FAIL: bundle exceeds ${BUDGET_BYTES / 1024}KB budget`)
  process.exit(1)
}
console.log('PASS')
```

- [ ] **Step 3: Build and run both checks**

```bash
cd frontend && npm run build && npm run lint:a11y && npm run perf:smoke
```

Expected:
```
PASS - img elements require alt (0 img tags without alt)
PASS - inputs should have explicit labels (0 inputs without matching label)
index-[hash].js 150000B
index-[hash].css 3000B
TOTAL ~160000B / BUDGET 512000B
PASS
```

(Exact bytes will vary; the total should be well under 500KB.)

- [ ] **Step 4: Commit**

```bash
git add frontend/scripts/a11y-lint.mjs frontend/scripts/perf-smoke.mjs
git commit -m "chore: update CI scripts to check Vite dist/ output"
```

---

## Task 9: Final checks and close ticket

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npm test
```

Expected: `10 passed | 0 failed`

- [ ] **Step 2: Run build + CI checks end-to-end**

```bash
cd frontend && npm run build && npm run lint:a11y && npm run perf:smoke
```

Expected: all PASS, no exits with code 1.

- [ ] **Step 3: Verify dev server works**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173/`. Navigate to a few routes. Confirm auth-gated routes redirect to `/login`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # review — only frontend/src/** and scripts should be staged
git commit -m "feat(sprint-1): foundation — React+Vite SPA with routing, auth store, AuthGuard"
```

- [ ] **Step 5: Update WEDA-38 in Paperclip**

Post a comment on WEDA-38 in Paperclip marking it complete:
```
Sprint 1 Foundation complete.
- React 18 + Vite scaffold in frontend/
- CSS design system ported (src/styles/)
- Supabase client (src/lib/supabase.js)
- useAuthStore (Zustand, 5 tests pass)
- AuthGuard component (5 tests pass)
- All 12 routes stubbed and wired in main.jsx
- CI scripts updated for dist/ output
- Build passes, lint:a11y passes, perf:smoke passes

WEDA-39 (Auth) is unblocked. Implement /login and /register pages next.
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Plan task |
|---|---|
| Scaffold React + Vite in `frontend/` | Task 1 |
| Install react-router-dom, @supabase/supabase-js, zustand | Task 1 |
| Set up `.env.local` with Supabase credentials | Task 3 |
| Port existing CSS design system (globals, variables) | Task 2 |
| Basic router skeleton with placeholder pages | Tasks 6 + 7 |
| `lib/supabase.js` client init | Task 3 |
| `useAuthStore.js` with login/logout/session actions | Task 4 |
| `AuthGuard` component | Task 5 |
| `onAuthStateChange` listener in root | Task 7 (AppRoot) |

All spec requirements covered. No gaps found.
