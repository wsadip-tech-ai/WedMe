# WedMe — Running Locally

## Quick Start (2 commands)

```bash
cd frontend
npm run dev
```

App opens at **http://localhost:5174** (or next available port). **Requires internet** — all data is in Supabase Cloud.

## Stop the Server

Press **Ctrl+C** in the terminal where the server is running.

Or from any terminal:
```bash
# Windows
taskkill /F /IM "node.exe"

# Mac/Linux
pkill -f vite
```

## Start Again

```bash
cd frontend
npm run dev
```

---

## First-Time Setup

Only needed once on a new machine:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=https://hhvdcoccxjmeyzryawfv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodmRjb2NjeGptZXl6cnlhd2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODczMDksImV4cCI6MjA4OTc2MzMwOX0.0Ycu023dgJGnOPLPIveAmnrezvQeoxNgd3-2xdS4J5c
```

---

## Demo Walkthrough

### Setup: Two Browser Sessions

1. **Session A** — Register as a **vendor** (use one browser or normal window)
2. **Session B** — Register as a **customer** (use incognito/another browser)

### Vendor Flow (Session A)

1. Go to `http://localhost:5174/register` → Select "I'm a Vendor"
2. Complete onboarding: business name, category, city, tier, price range (dropdown), bio
3. **Add packages** → Dashboard → Packages → Create (name, price, duration, description)
4. **Upload portfolio** → Dashboard → Portfolio → Upload photos with album names
5. **Set availability** → Dashboard → Availability → Click dates → Click hourly slots (8am–10pm)
6. Wait for a booking from the customer...

### Customer Flow (Session B)

1. Go to `http://localhost:5174/register` → Select "I'm a Couple / Guest"
2. **Browse vendors** → Discover → Find the vendor you just created
3. **View profile** → See portfolio, packages, availability
4. **Book a date** → Click an available date → Select hours visually → Pick package + budget → Request Booking
5. **Or book without date** → Click "Book Now" → Toggle "date not fixed" → Submit
6. **Ask AI** → Click "🤖 Ask AI" → Ask about the vendor's services (needs OpenAI credits)
7. **Track bookings** → My Bookings

### Back to Vendor (Session A)

7. **See booking** → Dashboard → Booking Requests → See pending/tentative requests
8. **Confirm or decline** → Add a note → Click Confirm (blocks those hours) or Decline
9. **View AI chats** → Dashboard → AI Chats → See customer conversations

### Admin Flow

1. Sign in as `wsadip@gmail.com` (admin account)
2. Click **Admin** in the nav → Admin Dashboard
3. **Manage vendors** → Vendors → View/Edit/Verify/Suspend/Delete
4. **Manage customers** → Customers → View/Edit/Delete
5. **Upload documents** → Vendor Detail → Documents tab → Upload PDF or add notes
6. **Review AI chats** → Vendor Detail → Chats tab

---

## Key URLs

| URL | Role | Description |
|-----|------|-------------|
| `/` | Anyone | Landing page |
| `/vendors` | Anyone | Browse & filter vendors |
| `/vendors/:id` | Anyone | Vendor profile (book, ask AI) |
| `/my-bookings` | Customer | Track booking status |
| `/shortlist` | Customer | Saved vendors |
| `/vendor/dashboard` | Vendor | Hub with quick links |
| `/vendor/availability` | Vendor | Hourly availability management |
| `/vendor/bookings` | Vendor | Booking requests (pending/tentative/resolved) |
| `/vendor/chats` | Vendor | AI chat conversations review |
| `/admin` | Admin | Platform dashboard |
| `/admin/vendors` | Admin | Vendor CRUD + status management |
| `/admin/customers` | Admin | Customer CRUD |

---

## Accounts

| Email | Role | Password |
|-------|------|----------|
| `wsadip@gmail.com` | Admin + Customer | sadip001 |
| (register new) | Vendor | (your choice) |
| (register new) | Customer | (your choice) |

---

## What Needs Internet

Everything — the backend is Supabase Cloud. No offline mode.

## What Needs API Credits

Only the **AI Chatbot** (🤖 Ask AI) — requires OpenAI API credits. Everything else works without it.
