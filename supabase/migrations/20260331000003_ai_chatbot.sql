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
