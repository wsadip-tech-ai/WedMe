# Sub-project C: AI Chatbot with RAG

**Date:** 2026-03-31
**Status:** Approved
**Goal:** Add an AI-powered chatbot to vendor profile pages that answers customer questions instantly using vendor-specific context (profile data, packages, uploaded documents).

---

## 1. Architecture

### Stack
- **LLM:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via Anthropic API
- **Backend:** Supabase Edge Function (`chat`)
- **RAG approach:** Simple context stuffing — vendor data + documents injected into system prompt
- **Frontend:** Chat modal component on vendor profile page
- **Storage:** Chat sessions and messages persisted in PostgreSQL

### Data Flow
```
Customer types question in chat modal
  → Frontend POSTs to Supabase Edge Function /functions/v1/chat
  → Edge function:
    1. Authenticates customer via Supabase auth token
    2. Creates chat session (if new) or loads existing
    3. Fetches vendor profile (name, bio, category, city, tier, price_range)
    4. Fetches vendor packages (name, description, price_label, duration)
    5. Fetches vendor_documents (text notes + PDF content)
    6. Builds system prompt with all vendor context
    7. Loads last 20 messages from this session for conversation history
    8. Sends system prompt + history + new question to Claude Haiku
    9. Saves customer message + AI response to chat_messages
    10. Returns { session_id, response }
  → Frontend displays AI response in chat bubble
```

---

## 2. Database Changes

### Migration: `20260331000003_ai_chatbot.sql`

**chat_sessions table:**
```sql
create table public.chat_sessions (
  id          uuid        primary key default gen_random_uuid(),
  vendor_id   uuid        not null references public.vendor_listings(id) on delete cascade,
  customer_id uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

-- Customer sees own sessions
create policy "chat_sessions: customer read own"
  on public.chat_sessions for select
  using (customer_id = auth.uid());

-- Customer creates sessions
create policy "chat_sessions: customer insert"
  on public.chat_sessions for insert
  with check (customer_id = auth.uid());

-- Vendor sees sessions for their listing
create policy "chat_sessions: vendor read"
  on public.chat_sessions for select
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- Admin full access
create policy "admin: full access chat_sessions"
  on public.chat_sessions for all
  using (public.is_admin())
  with check (public.is_admin());
```

**chat_messages table:**
```sql
create table public.chat_messages (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references public.chat_sessions(id) on delete cascade,
  role       text        not null check (role in ('customer', 'assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

-- Customer sees messages in their sessions
create policy "chat_messages: customer read own"
  on public.chat_messages for select
  using (session_id in (
    select id from public.chat_sessions where customer_id = auth.uid()
  ));

-- Customer inserts messages (edge function also inserts via service role)
create policy "chat_messages: customer insert"
  on public.chat_messages for insert
  with check (session_id in (
    select id from public.chat_sessions where customer_id = auth.uid()
  ));

-- Vendor sees messages for their listing's sessions
create policy "chat_messages: vendor read"
  on public.chat_messages for select
  using (session_id in (
    select cs.id from public.chat_sessions cs
    join public.vendor_listings vl on cs.vendor_id = vl.id
    where vl.owner_id = auth.uid()
  ));

-- Admin full access
create policy "admin: full access chat_messages"
  on public.chat_messages for all
  using (public.is_admin())
  with check (public.is_admin());
```

---

## 3. Supabase Edge Function

### Path: `supabase/functions/chat/index.ts`

**Request:**
```json
{
  "vendor_id": "uuid",
  "session_id": "uuid | null",
  "message": "string"
}
```
Authorization header: `Bearer <supabase_access_token>`

**Response:**
```json
{
  "session_id": "uuid",
  "response": "string"
}
```

**Error response:**
```json
{
  "error": "string"
}
```

### Logic:
1. Validate auth token → get customer user ID
2. If `session_id` is null, create new `chat_sessions` row, return new ID
3. Fetch vendor data: `vendor_listings` (name, bio, category, city, tier, price_range)
4. Fetch packages: `packages` where vendor_id matches
5. Fetch documents: `vendor_documents` where vendor_id matches (both PDF text and notes)
6. Build system prompt (see Section 4)
7. Fetch last 20 messages from session for conversation context
8. Insert customer message into `chat_messages` (role='customer')
9. Call Anthropic API with system prompt + messages
10. Insert AI response into `chat_messages` (role='assistant')
11. Return response

### Secrets Required:
- `ANTHROPIC_API_KEY` — set via `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

### CORS:
- Allow origin: `http://localhost:5174` (dev) and production domain
- Allow headers: `authorization, content-type, x-client-info, apikey`

---

## 4. System Prompt

```
You are a helpful AI assistant for "{vendor.name}", a {vendor.category} vendor based in {vendor.city}.

Your job is to answer customer questions about this vendor's services, pricing, packages, and availability using ONLY the information provided below. Be friendly, concise, and helpful.

RULES:
- Only use the information provided. Do not make up details.
- If you don't have enough information to answer, say "I don't have that specific information. You can send a direct enquiry to {vendor.name} for details."
- Keep responses under 150 words unless the question requires more detail.
- Be warm and professional — you represent this vendor.
- Do not discuss other vendors or competitors.

## Vendor Profile
- Name: {vendor.name}
- Category: {vendor.category}
- City: {vendor.city}
- Tier: {vendor.tier}
- Price Range: {vendor.price_range}
- About: {vendor.bio}

## Service Packages
{for each package:}
- {pkg.name}: {pkg.description} | Price: {pkg.price_label} | Duration: {pkg.duration}

## Additional Information (from vendor documents)
{text notes from vendor_documents where type='note'}
{text content from vendor_documents where type='pdf' — for now, PDF content stored as text_content}
```

---

## 5. Chat Modal UI

### Component: `frontend/src/pages/consumer/AIChatModal.jsx`

**Props:** `{ vendor, onClose }`

**Behavior:**
- On open: creates a new chat session (POST to edge function with `session_id: null` and an initial hidden system handshake, or simply create session on first real message)
- Shows welcome message with vendor name and 3 suggested quick questions
- Suggested questions derived from vendor data:
  - If has packages: "What packages do you offer?"
  - If has price_range: "What are your prices?"
  - Always: "Are you available for my date?"
- Customer types question → sends to edge function → shows loading state → displays AI response
- Conversation history maintained in component state (and persisted via edge function)
- "Need a human? Send enquiry to vendor →" link at bottom → opens existing EnquiryModal

**Styling:**
- Overlay + centered modal (same pattern as BookingModal/EnquiryModal)
- Header: "Ask AI" label, vendor name, close button
- Messages area: scrollable, auto-scrolls to bottom on new messages
- Customer bubbles: right-aligned, gold background
- AI bubbles: left-aligned, void-2 background with "AI" label
- Input: text input + gold Send button
- Loading state: typing indicator dots in AI bubble

### Integration with VendorProfile.jsx:
- Replace current "Ask a Question" button with "Ask AI" button
- Keep the EnquiryModal — it's accessible from the chat modal as escalation
- Add state: `showAIChat` (boolean)

---

## 6. Vendor Chat Review

### Chat List: `/vendor/chats` — `VendorChats.jsx`
- Fetches all `chat_sessions` for the vendor's listing, joined with `profiles(full_name)` and a message count
- Table/list: Customer name, date, message count, first message preview
- Click → navigates to `/vendor/chats/:sessionId`

### Chat Detail: `/vendor/chats/:sessionId` — `VendorChatDetail.jsx`
- Fetches all `chat_messages` for the session, ordered by `created_at`
- Read-only conversation view (same bubble styling as customer chat)
- Header: customer name, date
- Back link to `/vendor/chats`

### Dashboard Integration:
- Add "Chats" to vendor dashboard quick links
- Add chat count to dashboard stats (optional — keep simple)

### Nav Integration:
- Add route to `main.jsx`
- Optionally add "Chats" link to vendor nav links in `Nav.jsx`

---

## 7. Admin Chat Review

### Admin Vendor Detail — new "Chats" tab
- Same as vendor chat list but for admin viewing a specific vendor's chats
- Fetches `chat_sessions` where `vendor_id` matches, joined with `profiles(full_name)`
- Click session → inline expand showing all messages (or link to a read-only view)

---

## 8. Test Documents

Create sample vendor documents (via admin portal or direct insert) for testing:

**Auricle Events (Catering):**
- Text note: "Specializes in Newari and North Indian cuisine. Minimum 200 guests. Jain and vegan options available on request. Setup includes tables, chairs, and serving staff. Outdoor catering available within Kathmandu Valley. Free tasting session for bookings above 3 Lakhs."

**Photo Choice Nepal (Photography):**
- Text note: "Specializes in candid and cinematic wedding photography. Uses Sony A7IV and A7SIII cameras. Drone shots available for outdoor venues. Same-day highlight reel editing. Albums printed on premium flush-mount with lay-flat pages. Second shooter available for Gold and Platinum packages."

**Hotel Shanker (Venue):**
- Text note: "Heritage property built in 1964. Capacity: 500 guests (banquet), 200 guests (garden). In-house catering available. Valet parking for 100 cars. Bridal suite complimentary for bookings. Mehendi and sangeet areas available separately. AC halls with backup generator."

---

## 9. Files Summary

### New Files
- `supabase/functions/chat/index.ts` — Edge function
- `frontend/src/pages/consumer/AIChatModal.jsx` — Chat modal
- `frontend/src/pages/vendor/VendorChats.jsx` — Vendor chat list
- `frontend/src/pages/vendor/VendorChatDetail.jsx` — Vendor chat conversation view
- `supabase/migrations/20260331000003_ai_chatbot.sql` — Migration

### Modified Files
- `frontend/src/pages/consumer/VendorProfile.jsx` — Replace "Ask a Question" with "Ask AI", add AIChatModal
- `frontend/src/pages/vendor/VendorDashboard.jsx` — Add "Chats" quick link
- `frontend/src/pages/admin/AdminVendorDetail.jsx` — Add "Chats" tab
- `frontend/src/main.jsx` — Add vendor chat routes

---

## 10. Out of Scope

- PDF text extraction (for now, admin manually enters text content for PDFs — actual PDF parsing is a future enhancement)
- Streaming responses (full response returned at once)
- Chat ratings/feedback
- Multi-turn context beyond 20 messages
- Proactive chat suggestions based on browsing behavior
- Chat notifications for vendors
