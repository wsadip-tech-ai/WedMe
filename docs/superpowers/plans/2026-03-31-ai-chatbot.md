# AI Chatbot with RAG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI chatbot to vendor profiles that answers customer questions instantly using vendor data + documents, with conversation persistence and vendor/admin review.

**Architecture:** Supabase Edge Function receives questions, builds context from vendor data/documents, calls Claude Haiku API, persists conversations. React chat modal on vendor profile. Vendor and admin can review all chat sessions.

**Tech Stack:** React 18, Supabase (Edge Functions + PostgreSQL + RLS), Anthropic Claude Haiku API, Deno (edge function runtime)

**Spec:** `docs/superpowers/specs/2026-03-31-ai-chatbot-design.md`

---

## File Structure

### New Files
- `supabase/functions/chat/index.ts` — Edge function (Deno)
- `frontend/src/pages/consumer/AIChatModal.jsx` — Chat modal component
- `frontend/src/pages/vendor/VendorChats.jsx` — Vendor chat session list
- `frontend/src/pages/vendor/VendorChatDetail.jsx` — Vendor chat conversation view
- `supabase/migrations/20260331000003_ai_chatbot.sql` — Migration

### Modified Files
- `frontend/src/pages/consumer/VendorProfile.jsx` — Replace "Ask a Question" with "Ask AI"
- `frontend/src/pages/vendor/VendorDashboard.jsx` — Add "Chats" quick link
- `frontend/src/pages/admin/AdminVendorDetail.jsx` — Add "Chats" tab
- `frontend/src/main.jsx` — Add vendor chat routes

---

### Task 1: Database migration for chat tables

**Files:**
- Create: `supabase/migrations/20260331000003_ai_chatbot.sql`

- [ ] **Step 1: Create migration file**

```sql
-- ============================================================
-- WedMe — AI Chatbot Migration
-- Chat sessions and messages tables for AI vendor chatbot
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

-- ── Chat sessions ────────────────────────────────────────────

create table public.chat_sessions (
  id          uuid        primary key default gen_random_uuid(),
  vendor_id   uuid        not null references public.vendor_listings(id) on delete cascade,
  customer_id uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions: customer read own"
  on public.chat_sessions for select
  using (customer_id = auth.uid());

create policy "chat_sessions: customer insert"
  on public.chat_sessions for insert
  with check (customer_id = auth.uid());

create policy "chat_sessions: vendor read"
  on public.chat_sessions for select
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

create policy "admin: full access chat_sessions"
  on public.chat_sessions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── Chat messages ────────────────────────────────────────────

create table public.chat_messages (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references public.chat_sessions(id) on delete cascade,
  role       text        not null check (role in ('customer', 'assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_messages: customer read own"
  on public.chat_messages for select
  using (session_id in (
    select id from public.chat_sessions where customer_id = auth.uid()
  ));

create policy "chat_messages: customer insert"
  on public.chat_messages for insert
  with check (session_id in (
    select id from public.chat_sessions where customer_id = auth.uid()
  ));

create policy "chat_messages: vendor read"
  on public.chat_messages for select
  using (session_id in (
    select cs.id from public.chat_sessions cs
    join public.vendor_listings vl on cs.vendor_id = vl.id
    where vl.owner_id = auth.uid()
  ));

create policy "admin: full access chat_messages"
  on public.chat_messages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── Indexes ──────────────────────────────────────────────────

create index chat_sessions_vendor_idx on public.chat_sessions(vendor_id);
create index chat_sessions_customer_idx on public.chat_sessions(customer_id);
create index chat_messages_session_idx on public.chat_messages(session_id);
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260331000003_ai_chatbot.sql
git commit -m "feat: chat sessions and messages tables for AI chatbot"
```

---

### Task 2: Supabase Edge Function — chat

**Files:**
- Create: `supabase/functions/chat/index.ts`

This is a Deno edge function. It receives a customer question, builds vendor context, calls Claude Haiku, and persists the conversation.

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/chat/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // User client (respects RLS) for auth check
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    // Service client (bypasses RLS) for inserts
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { vendor_id, session_id, message } = await req.json()

    if (!vendor_id || !message) {
      return new Response(JSON.stringify({ error: 'vendor_id and message are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create or validate session
    let currentSessionId = session_id
    if (!currentSessionId) {
      const { data: newSession, error: sessErr } = await supabaseAdmin
        .from('chat_sessions')
        .insert({ vendor_id, customer_id: user.id })
        .select('id')
        .single()
      if (sessErr) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      currentSessionId = newSession.id
    }

    // Fetch vendor context
    const [
      { data: vendor },
      { data: packages },
      { data: documents },
    ] = await Promise.all([
      supabaseAdmin.from('vendor_listings').select('name, category, city, tier, price_range, bio').eq('id', vendor_id).single(),
      supabaseAdmin.from('packages').select('name, description, price_label, duration').eq('vendor_id', vendor_id).order('display_order'),
      supabaseAdmin.from('vendor_documents').select('type, text_content, filename').eq('vendor_id', vendor_id),
    ])

    if (!vendor) {
      return new Response(JSON.stringify({ error: 'Vendor not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build system prompt
    let systemPrompt = `You are a helpful AI assistant for "${vendor.name}", a ${vendor.category} vendor based in ${vendor.city}.

Your job is to answer customer questions about this vendor's services, pricing, packages, and availability using ONLY the information provided below. Be friendly, concise, and helpful.

RULES:
- Only use the information provided. Do not make up details.
- If you don't have enough information to answer, say "I don't have that specific information. You can send a direct enquiry to ${vendor.name} for details."
- Keep responses under 150 words unless the question requires more detail.
- Be warm and professional — you represent this vendor.
- Do not discuss other vendors or competitors.

## Vendor Profile
- Name: ${vendor.name}
- Category: ${vendor.category}
- City: ${vendor.city}
- Tier: ${vendor.tier || 'Not specified'}
- Price Range: ${vendor.price_range || 'Not specified'}
- About: ${vendor.bio || 'No description available'}`

    // Add packages
    if (packages && packages.length > 0) {
      systemPrompt += '\n\n## Service Packages'
      for (const pkg of packages) {
        systemPrompt += `\n- ${pkg.name}: ${pkg.description || 'No description'} | Price: ${pkg.price_label || 'Contact for pricing'} | Duration: ${pkg.duration || 'Not specified'}`
      }
    }

    // Add documents
    const notes = (documents || []).filter(d => d.type === 'note' && d.text_content)
    const pdfs = (documents || []).filter(d => d.type === 'pdf' && d.text_content)
    if (notes.length > 0 || pdfs.length > 0) {
      systemPrompt += '\n\n## Additional Information'
      for (const note of notes) {
        systemPrompt += `\n${note.text_content}`
      }
      for (const pdf of pdfs) {
        systemPrompt += `\n[From ${pdf.filename}]: ${pdf.text_content}`
      }
    }

    // Fetch conversation history (last 20 messages)
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build messages array for Claude
    const messages = (history || []).map(m => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }))
    messages.push({ role: 'user', content: message })

    // Call Claude Haiku
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    })

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text()
      console.error('Anthropic API error:', errBody)
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiResult = await anthropicResponse.json()
    const aiResponse = aiResult.content?.[0]?.text || 'Sorry, I could not generate a response.'

    // Save both messages
    await supabaseAdmin.from('chat_messages').insert([
      { session_id: currentSessionId, role: 'customer', content: message },
      { session_id: currentSessionId, role: 'assistant', content: aiResponse },
    ])

    return new Response(JSON.stringify({ session_id: currentSessionId, response: aiResponse }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Deploy the edge function**

```bash
cd /c/Users/wsadi/Documents/MyProjects/root_WedMe
supabase functions deploy chat --project-ref hhvdcoccxjmeyzryawfv
```

- [ ] **Step 3: Set the Anthropic API key secret**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE --project-ref hhvdcoccxjmeyzryawfv
```

(User will provide actual key)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/chat/index.ts
git commit -m "feat: AI chat edge function with Claude Haiku and vendor context"
```

---

### Task 3: AI Chat Modal component

**Files:**
- Create: `frontend/src/pages/consumer/AIChatModal.jsx`

- [ ] **Step 1: Create AIChatModal**

The component should:

1. **Props:** `{ vendor, onClose, onEscalate }` — vendor object, close handler, handler to open EnquiryModal
2. **State:** `messages` (array of `{role, content}`), `input` (string), `sessionId` (null initially), `sending` (boolean)
3. **Supabase Edge Function URL:** `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`
4. **Auth:** Get session token via `supabase.auth.getSession()` and pass as `Authorization: Bearer <token>`

5. **Welcome state:** When `messages` is empty, show:
   - Robot emoji + "Hi! I can answer questions about {vendor.name}'s services, pricing, and availability."
   - 3 suggested question pills (clickable):
     - "What packages do you offer?"
     - "What are your prices?"
     - "Are you available for my date?"
   - Clicking a pill sends it as a message

6. **Send message flow:**
   - Add customer message to local `messages` state immediately (optimistic)
   - Set `sending = true`
   - POST to edge function: `{ vendor_id: vendor.id, session_id: sessionId, message: input }`
   - On success: add assistant message to `messages`, update `sessionId`
   - On error: show error toast, remove optimistic message
   - Set `sending = false`

7. **UI layout (modal):**
   - Overlay (same as BookingModal): `position: fixed, inset: 0, background: rgba(0,0,0,0.78)`
   - Modal: `max-width: 500px, max-height: 80vh, display: flex, flex-direction: column`
   - Header: "Ask AI" eyebrow, vendor.name heading, close button (×)
   - Messages area: `flex: 1, overflow-y: auto, padding` — auto-scrolls to bottom
   - Customer bubbles: right-aligned, `background: rgba(200,150,60,0.15)`, `border-radius: 12px 12px 2px 12px`
   - AI bubbles: left-aligned, `background: var(--void-3)`, `border-radius: 12px 12px 12px 2px`, small "AI" label above
   - Sending indicator: show "..." in an AI bubble while waiting
   - Input area: text input + Send button (gold), at bottom of modal
   - Escalation link: "Need a human? Send enquiry to vendor →" below input, calls `onEscalate`

8. **Styling:** WedMe dark theme. Import `supabase` from `../../lib/supabase`. Import `useAuthStore` and `useToastStore`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/consumer/AIChatModal.jsx
git commit -m "feat: AI chat modal component with Claude-powered responses"
```

---

### Task 4: Integrate chat modal into VendorProfile

**Files:**
- Modify: `frontend/src/pages/consumer/VendorProfile.jsx`

- [ ] **Step 1: Add import**

Add at top:
```javascript
import AIChatModal from './AIChatModal'
```

- [ ] **Step 2: Add state**

After existing `showEnquiry` state:
```javascript
const [showAIChat, setShowAIChat] = useState(false)
```

- [ ] **Step 3: Replace "Ask a Question" button with "Ask AI"**

Find (around line 680-685):
```jsx
<button
  onClick={() => { if (!user) { show('Sign in to send an enquiry', 'error'); return } setShowEnquiry(true) }}
  style={enquiryBtn}
>
  Ask a Question
</button>
```

Replace with:
```jsx
<button
  onClick={() => { if (!user) { show('Sign in to chat', 'error'); return } setShowAIChat(true) }}
  style={{ ...enquiryBtn, background: 'rgba(200,150,60,0.12)', borderColor: 'rgba(200,150,60,0.35)' }}
>
  🤖 Ask AI
</button>
```

- [ ] **Step 4: Add AIChatModal render**

After the existing EnquiryModal render block, add:
```jsx
{showAIChat && (
  <AIChatModal
    vendor={vendor}
    onClose={() => setShowAIChat(false)}
    onEscalate={() => { setShowAIChat(false); setShowEnquiry(true) }}
  />
)}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/consumer/VendorProfile.jsx
git commit -m "feat: integrate AI chat modal on vendor profile page"
```

---

### Task 5: Vendor Chat List page

**Files:**
- Create: `frontend/src/pages/vendor/VendorChats.jsx`

- [ ] **Step 1: Create VendorChats**

The component should:

1. Fetch the vendor's listing ID via `supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle()`
2. Fetch chat sessions: `supabase.from('chat_sessions').select('*, profiles(full_name)').eq('vendor_id', listingId).order('created_at', { ascending: false })`
3. For each session, fetch the first message and message count (or do a joined query)
4. Display as a list/table: Customer name, date, message preview, "View" link to `/vendor/chats/${session.id}`
5. Empty state: "No chat conversations yet."
6. Styling: Same as other vendor pages (page maxWidth 800px, heading, card-based list)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/vendor/VendorChats.jsx
git commit -m "feat: vendor chat sessions list page"
```

---

### Task 6: Vendor Chat Detail page

**Files:**
- Create: `frontend/src/pages/vendor/VendorChatDetail.jsx`

- [ ] **Step 1: Create VendorChatDetail**

The component should:

1. Get `sessionId` from URL params
2. Fetch session info: `supabase.from('chat_sessions').select('*, profiles(full_name), vendor_listings(name)').eq('id', sessionId).single()`
3. Fetch all messages: `supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true })`
4. Display as read-only conversation:
   - Header: customer name, date, back link to `/vendor/chats`
   - Customer messages: right-aligned gold bubbles
   - AI messages: left-aligned grey bubbles with "AI" label
5. Styling: Same bubble styling as AIChatModal but read-only (no input area)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/vendor/VendorChatDetail.jsx
git commit -m "feat: vendor chat detail view (read-only conversation)"
```

---

### Task 7: Wire up vendor chat routes + dashboard link

**Files:**
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/pages/vendor/VendorDashboard.jsx`

- [ ] **Step 1: Add imports and routes in main.jsx**

Add imports:
```javascript
import VendorChats from './pages/vendor/VendorChats'
import VendorChatDetail from './pages/vendor/VendorChatDetail'
```

Add routes inside the vendor section (after the bookings route):
```javascript
{
  path: '/vendor/chats',
  element: <AuthGuard role="vendor"><VendorChats /></AuthGuard>,
},
{
  path: '/vendor/chats/:sessionId',
  element: <AuthGuard role="vendor"><VendorChatDetail /></AuthGuard>,
},
```

- [ ] **Step 2: Add "Chats" quick link to VendorDashboard**

In VendorDashboard.jsx, find the quick links section (the `dash-quicklinks` div with Link elements). Add after the "Enquiries" link:
```jsx
<Link to="/vendor/chats" className="quick-link" style={quickLink(false)}>AI Chats</Link>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/main.jsx frontend/src/pages/vendor/VendorDashboard.jsx
git commit -m "feat: vendor chat routes and dashboard quick link"
```

---

### Task 8: Admin Vendor Detail — Chats tab

**Files:**
- Modify: `frontend/src/pages/admin/AdminVendorDetail.jsx`

- [ ] **Step 1: Add "chats" tab**

Add "chats" to the tab bar buttons (after "documents"). Add state for chat sessions and messages. Add a chats tab content section that:

1. Fetches `chat_sessions` where `vendor_id = id`, joined with `profiles(full_name)`
2. Displays as a list: customer name, date, message count
3. Click to expand inline showing all messages (accordion style) — simpler than navigating to a separate page
4. Messages display as customer/AI bubbles (read-only)

This follows the same lazy-loading pattern as other tabs (fetch on first switch to tab).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminVendorDetail.jsx
git commit -m "feat: chats tab on admin vendor detail"
```

---

### Task 9: Create test documents for vendors

**Files:**
- No files — direct Supabase inserts

- [ ] **Step 1: Insert test documents via SQL**

Run in Supabase SQL Editor:

```sql
-- Auricle Events (Catering) — vendor_id from vendor_listings
INSERT INTO public.vendor_documents (vendor_id, type, text_content)
SELECT id, 'note', 'Specializes in Newari and North Indian cuisine. Minimum 200 guests. Jain and vegan options available on request. Setup includes tables, chairs, and serving staff. Outdoor catering available within Kathmandu Valley. Free tasting session for bookings above 3 Lakhs. We also do live cooking stations for premium packages. Buffet and plated service both available.'
FROM public.vendor_listings WHERE name = 'Auricle Events' LIMIT 1;

-- Photo Choice Nepal (Photography)
INSERT INTO public.vendor_documents (vendor_id, type, text_content)
SELECT id, 'note', 'Specializes in candid and cinematic wedding photography. Uses Sony A7IV and A7SIII cameras. Drone shots available for outdoor venues. Same-day highlight reel editing. Albums printed on premium flush-mount with lay-flat pages. Second shooter available for Gold and Platinum packages. Pre-wedding shoots at Pashupatinath, Bhaktapur Durbar Square, and Nagarkot. Video packages also available.'
FROM public.vendor_listings WHERE name = 'Photo Choice Nepal' LIMIT 1;

-- Hotel Shanker (Venue)
INSERT INTO public.vendor_documents (vendor_id, type, text_content)
SELECT id, 'note', 'Heritage property built in 1964. Capacity: 500 guests (banquet hall), 200 guests (garden area). In-house catering available with multi-cuisine menu. Valet parking for 100 cars. Bridal suite complimentary for bookings. Mehendi and sangeet areas available separately. AC banquet halls with backup generator. Located in Lazimpat, 10 minutes from Thamel. Wedding coordination team included.'
FROM public.vendor_listings WHERE name = 'Hotel Shanker' LIMIT 1;
```

- [ ] **Step 2: Verify documents appear in admin**

Navigate to `/admin/vendors/{id}` → Documents tab for each vendor. Confirm text notes are visible.

- [ ] **Step 3: No git commit needed** (data-only change)

---

### Task 10: Deploy and test end-to-end

- [ ] **Step 1: Ensure edge function is deployed**

```bash
supabase functions deploy chat --project-ref hhvdcoccxjmeyzryawfv
```

- [ ] **Step 2: Ensure ANTHROPIC_API_KEY is set**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-XXXXX --project-ref hhvdcoccxjmeyzryawfv
```

- [ ] **Step 3: Test in browser**

1. Sign in as customer account
2. Navigate to a vendor with test documents (Auricle Events, Photo Choice Nepal, or Hotel Shanker)
3. Click "Ask AI" button
4. Verify: welcome message + suggested questions appear
5. Click a suggested question or type one
6. Verify: AI responds with vendor-specific information
7. Ask a follow-up question — verify conversation history works
8. Click "Need a human?" — verify it opens the EnquiryModal
9. Sign in as vendor — navigate to `/vendor/chats` — verify session appears
10. Click session — verify full conversation is visible
11. Sign in as admin — navigate to admin vendor detail → Chats tab — verify session visible
