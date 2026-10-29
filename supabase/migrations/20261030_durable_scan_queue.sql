-- Add durable leases and bounded retry scheduling for manual scan runs.
ALTER TABLE public.scan_runs
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

ALTER TABLE public.scan_runs
  DROP CONSTRAINT IF EXISTS scan_runs_attempt_count_check;
ALTER TABLE public.scan_runs
  ADD CONSTRAINT scan_runs_attempt_count_check CHECK (attempt_count >= 0);

CREATE INDEX IF NOT EXISTS scan_runs_available_queue_idx
  ON public.scan_runs (status, available_at, created_at);

CREATE OR REPLACE FUNCTION public.enqueue_scan_run(p_user_id UUID)
RETURNS TABLE(run_id UUID, run_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  existing_run public.scan_runs%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 0));

  SELECT * INTO existing_run
  FROM public.scan_runs
  WHERE user_id = p_user_id
    AND status IN ('queued', 'running')
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT existing_run.id, existing_run.status;
    RETURN;
  END IF;

  RETURN QUERY
  INSERT INTO public.scan_runs (user_id, status)
  VALUES (p_user_id, 'queued')
  RETURNING id, status;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_scan_run(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_scan_run(UUID) TO service_role;
