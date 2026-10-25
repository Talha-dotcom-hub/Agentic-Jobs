-- =========================================================
-- AGENTIC JOBS - SUPABASE DATABASE MIGRATION 002
-- Scheduler State, Scan History & Web Push Subscriptions
-- =========================================================

-- 1. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching user subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions (user_id);

-- 2. SCAN HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'rate_limited')),
  jobs_discovered INT DEFAULT 0,
  new_jobs_found INT DEFAULT 0,
  high_match_jobs_count INT DEFAULT 0,
  sources_summary TEXT,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user ON public.scan_history (user_id, started_at DESC);

-- 3. UPDATE SCAN SCHEDULES TABLE WITH TIMEZONE AND LOCK
ALTER TABLE public.scan_schedules
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS is_scanning BOOLEAN DEFAULT FALSE;

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Push Subscriptions Policies
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Scan History Policies
CREATE POLICY "Users read own scan history" ON public.scan_history
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================================
-- SUPABASE PG_CRON BACKGROUND JOB CONFIGURATION
-- =========================================================

-- Enable pg_cron and pg_net extensions if permitted
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule background cron task every hour to trigger due user scans
-- SELECT cron.schedule(
--   'agentic-jobs-background-scan',
--   '0 * * * *', -- At minute 0 past every hour
--   $$
--   SELECT net.http_post(
--     url := 'https://your-applet-url/api/scan/run-due',
--     headers := '{"Content-Type": "application/json"}'::jsonb,
--     body := '{"secret": "your-cron-secret"}'::jsonb
--   );
--   $$
-- );
