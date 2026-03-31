-- ============================================================
-- WedMe — Catering Per-Plate Pricing
-- Adds price_per_plate field to packages for catering vendors
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hhvdcoccxjmeyzryawfv/sql/new
-- ============================================================

alter table public.packages
  add column price_per_plate text;
  -- e.g. "NPR 800/plate", "NPR 1,200/plate"
  -- null for non-catering vendors
