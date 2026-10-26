-- Durable manual scan queue, scan lock timestamps, and saved snapshots for external job IDs.
-- The backend service-role client is the only direct caller for these tables; API routes
-- authenticate users and always filter by the verified req.user.id.
ALTER TABLE public.scan_schedules
  ADD COLUMN IF NOT EXISTS scan_started_at TIMESTAMPTZ;

-- Enabling autonomous scans should require an explicit user choice rather than a signup default.
ALTER TABLE public.scan_schedules
  ALTER COLUMN enabled SET DEFAULT FALSE;

UPDATE public.scan_schedules
SET enabled = FALSE, updated_at = NOW()
WHERE enabled = TRUE
  AND COALESCE(status, 'idle') = 'idle'
  AND COALESCE(last_successful_jobs_count, 0) = 0
  AND COALESCE(source_failures_count, 0) = 0;

CREATE TABLE IF NOT EXISTS public.scan_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS scan_runs_queue_idx
  ON public.scan_runs (status, created_at ASC);
CREATE INDEX IF NOT EXISTS scan_runs_user_idx
  ON public.scan_runs (user_id, created_at DESC);
ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.scan_runs FROM anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.scan_runs TO service_role;

CREATE TABLE IF NOT EXISTS public.user_saved_jobs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_key TEXT NOT NULL,
  job_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_key)
);
CREATE INDEX IF NOT EXISTS user_saved_jobs_user_created_idx
  ON public.user_saved_jobs (user_id, created_at DESC);
ALTER TABLE public.user_saved_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.user_saved_jobs FROM anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_saved_jobs TO service_role;
