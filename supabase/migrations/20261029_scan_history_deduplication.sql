-- Keep scan audit data short-lived while retaining durable user jobs.
ALTER TABLE public.user_discovered_jobs
  ADD COLUMN IF NOT EXISTS latest_scan_id UUID,
  ADD COLUMN IF NOT EXISTS seen_scan_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source_links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.user_discovered_jobs
  DROP CONSTRAINT IF EXISTS user_discovered_jobs_seen_scan_count_check;
ALTER TABLE public.user_discovered_jobs
  ADD CONSTRAINT user_discovered_jobs_seen_scan_count_check
  CHECK (seen_scan_count > 0);

CREATE INDEX IF NOT EXISTS user_discovered_jobs_latest_scan_idx
  ON public.user_discovered_jobs (user_id, latest_scan_id);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_key_idx
  ON public.notifications (user_id, dedupe_key);

CREATE INDEX IF NOT EXISTS scan_history_user_started_idx
  ON public.scan_history (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS scan_history_started_retention_idx
  ON public.scan_history (started_at);

ALTER TABLE public.scan_history
  ADD COLUMN IF NOT EXISTS sources_checked INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_jobs_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicates_suppressed_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_errors JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.delete_expired_scan_history()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.scan_history
  WHERE started_at < NOW() - INTERVAL '24 hours';
$$;

REVOKE ALL ON FUNCTION public.delete_expired_scan_history() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_scan_history() TO service_role;

CREATE OR REPLACE FUNCTION public.prune_scan_history_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.delete_expired_scan_history();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS scan_history_prune_expired ON public.scan_history;
CREATE TRIGGER scan_history_prune_expired
AFTER INSERT ON public.scan_history
FOR EACH STATEMENT
EXECUTE FUNCTION public.prune_scan_history_after_insert();

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT jobid INTO existing_job_id
    FROM cron.job
    WHERE jobname = 'agentic-jobs-prune-scan-history'
    LIMIT 1;

    IF existing_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(existing_job_id);
    END IF;

    PERFORM cron.schedule(
      'agentic-jobs-prune-scan-history',
      '*/15 * * * *',
      'SELECT public.delete_expired_scan_history();'
    );
  ELSE
    RAISE NOTICE 'pg_cron is not enabled; scan history is pruned on insert and by the backend scheduler worker.';
  END IF;
END;
$$;
