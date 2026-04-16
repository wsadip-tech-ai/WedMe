# WEDA Platform v2 — Design Spec
**Date:** 2026-03-29
**Status:** Approved
**Author:** CEO (human) + Claude Code brainstorming session

---

## 1. Overview

Expand WEDA from a static landing page into a full two-sided marketplace platform serving both wedding couples (consumers) and vendors. A single React SPA with Supabase as the backend, delivered in 5 sequential sprints.

---

## 2. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | React 18 + Vite | Real routing, component reuse, auth state management |
| Backend | Supabase | Managed auth + Postgres + Storage, no server to maintain |
| Architecture | Single SPA, sequential delivery | Auth + shared components built once, less coordination overhead |
| State management | Zustand | Lightweight, handles auth user + shortlist globally |
| Auth method | Email/password + Google OAuth | Supabase handles both natively |

---

## 3. Platform Map

### Consumer (Couple) Journey
| # | Page | Route | Status |
|---|---|---|---|
| 1 | Landing Page | `/` | Exists (redesigned) |
| 2 | Register | `/register` | New |
| 3 | Login | `/login` | New |
| 4 | Consumer Onboarding | `/onboarding` | Upgrade |
| 5 | Consumer Dashboard | `/dashboard` | New |
| 6 | Vendor Discovery | `/vendors` | Upgrade |
| 7 | Vendor Profile Page | `/vendors/:id` | New |
| 8 | My Shortlist | `/shortlist` | New |

### Vendor Journey
| # | Page | Route | Status |
|---|---|---|---|
| 1 | Vendor Landing | `/` (section) | New |
| 2 | Vendor Register | `/register` | Shared auth |
| 3 | Vendor Onboarding | `/vendor/onboarding` | New |
| 4 | Vendor Dashboard | `/vendor/dashboard` | New |
| 5 | Edit Profile | `/vendor/profile/edit` | New |
| 6 | Enquiry Inbox | `/vendor/enquiries` | New |

---

## 4. Architecture

### Tech Stack
- **React 18 + Vite** — SPA with HMR dev server
- **React Router v6** — client-side routing, protected route guards
- **Zustand** — global store for `authUser` + `shortlist`
- **Supabase JS SDK** — auth, DB queries, file uploads
- **ESLint + Prettier** — code consistency

### Folder Structure
```
frontend/src/
├── components/       # Shared UI (Button, VendorCard, Nav, AuthGuard)
├── pages/
│   ├── auth/         # Login.jsx, Register.jsx
│   ├── consumer/     # Dashboard, Onboarding, VendorDiscovery, VendorProfile, Shortlist
│   └── vendor/       # VendorOnboarding, VendorDashboard, EditProfile, EnquiryInbox
├── lib/
│   └── supabase.js   # createClient(url, anonKey)
├── store/
│   └── useAuthStore.js
├── styles/           # globals.css, variables.css (existing WEDA theme ported)
└── main.jsx          # RouterProvider + Zustand init
```

---

## 5. Auth Flow

1. `/register` — user picks role: **consumer** or **vendor**
2. Supabase creates user; role stored in `user_metadata.role`
3. JWT returned → Zustand `useAuthStore` populated
4. Role check → consumer routed to `/onboarding`, vendor to `/vendor/onboarding`
5. `/login` — same page for both roles; post-login redirect based on role
6. Protected routes use `<AuthGuard role="consumer">` / `<AuthGuard role="vendor">` wrapper

---

## 6. Data Model (Supabase)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| role | text | consumer \| vendor |
| full_name | text | |
| avatar_url | text | optional |

### `vendor_listings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| owner_id | uuid | FK → profiles |
| name | text | |
| category | text | photography \| makeup \| catering \| decor |
| tier | text | economy \| mid \| premium |
| city | text | |
| bio | text | |
| price_range | text | display string |
| photo_urls | text[] | Supabase Storage paths |

### `shortlists`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | FK → profiles (PK composite) |
| vendor_id | uuid | FK → vendor_listings (PK composite) |
| created_at | timestamptz | |

### `enquiries`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| from_user_id | uuid | FK → profiles (consumer) |
| vendor_id | uuid | FK → vendor_listings |
| message | text | |
| status | text | pending \| read \| replied |
| created_at | timestamptz | |

### RLS Rules
- `vendor_listings`: owners can INSERT/UPDATE/DELETE their own row; all authenticated users can SELECT
- `shortlists`: users can only SELECT/INSERT/DELETE their own rows
- `enquiries`: consumers can INSERT; vendors can SELECT/UPDATE enquiries where vendor_id matches their listing

---

## 7. Delivery Plan — 5 Sprints

### Sprint 1 — Foundation
- Scaffold React + Vite app in `frontend/`
- Install: react-router-dom, @supabase/supabase-js, zustand
- Set up `.env.local` with Supabase credentials
- Port existing CSS design system (globals, variables)
- Basic router skeleton with placeholder pages
- `lib/supabase.js` client init
- `useAuthStore.js` with login/logout/session actions

### Sprint 2 — Auth
- `/register` — role picker + email/password form + Google OAuth button
- `/login` — email/password + Google OAuth, role-based redirect
- `<AuthGuard>` component — redirects unauthenticated users
- Supabase `onAuthStateChange` listener in root
- Profile row auto-created on first sign-up (Supabase trigger)

### Sprint 3 — Consumer Pages
- `/onboarding` — date, city, budget, events wizard (upgrade existing)
- `/dashboard` — wedding summary card, shortlist count, discovery CTA
- `/vendors` — filter grid (upgrade existing, now fetches from Supabase)
- `/vendors/:id` — full vendor profile with portfolio photos, bio, pricing, enquiry CTA
- `/shortlist` — saved vendors grouped by category, remove action

### Sprint 4 — Vendor Pages
- `/vendor/onboarding` — business name, category, cities, tier, bio, price range
- `/vendor/dashboard` — profile views count, shortlist count, enquiry count
- `/vendor/profile/edit` — edit all listing fields, upload/remove portfolio photos
- Photo upload to Supabase Storage, URL saved to `vendor_listings.photo_urls`

### Sprint 5 — Enquiries
- `/vendor/enquiries` — inbox list with status badges (pending/read/replied)
- Consumer: "Send Enquiry" button on `/vendors/:id` → modal with message field
- Vendor: mark as read, reply by email (v1 = no in-app reply, just status update)
- Enquiry count badge on vendor dashboard

---

## 8. Paperclip Agent Assignments

| Agent | Responsibility |
|---|---|
| **CEO** | Creates sprint tickets, unblocks agents, approves milestones |
| **Frontend Engineer** | Implements all React pages and components |
| **CTO** | Reviews each PR for code quality, security, a11y |
| **QA** | Validates each page against acceptance criteria before closing tickets |
| **UI/UX Designer** | Reviews pages against existing WEDA design system |

---

## 9. Out of Scope (v2)
- In-app messaging / chat (v1 enquiries are one-way)
- Payment / booking flow
- Vendor verification / moderation
- Push notifications
- Mobile app
