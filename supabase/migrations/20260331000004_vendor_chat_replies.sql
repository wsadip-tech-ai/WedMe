-- ============================================================
-- WedMe — Vendor Chat Replies Migration
-- Allows vendors to reply in AI chat sessions
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

-- Allow 'vendor' role in chat messages
alter table public.chat_messages drop constraint chat_messages_role_check;
alter table public.chat_messages add constraint chat_messages_role_check
  check (role in ('customer', 'assistant', 'vendor'));

-- Add needs_vendor flag to sessions (true when customer escalates)
alter table public.chat_sessions
  add column needs_vendor boolean not null default false;

-- Vendor can insert messages in their listing's sessions
create policy "chat_messages: vendor insert"
  on public.chat_messages for insert
  with check (session_id in (
    select cs.id from public.chat_sessions cs
    join public.vendor_listings vl on cs.vendor_id = vl.id
    where vl.owner_id = auth.uid()
  ));

-- Vendor can update their sessions (to clear needs_vendor flag)
create policy "chat_sessions: vendor update"
  on public.chat_sessions for update
  using (vendor_id in (
    select id from public.vendor_listings where owner_id = auth.uid()
  ));

-- Customer can read needs_vendor status on their sessions (already has read policy)
