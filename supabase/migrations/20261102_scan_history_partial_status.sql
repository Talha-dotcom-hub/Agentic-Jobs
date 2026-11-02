-- Distinguish a successful full scan from a scan that returned partial discovery or scoring.
-- Existing rows keep their current status; the migration only widens the accepted values.
ALTER TABLE public.scan_history
  DROP CONSTRAINT IF EXISTS scan_history_status_check;

ALTER TABLE public.scan_history
  ADD CONSTRAINT scan_history_status_check
  CHECK (status IN ('completed', 'partial', 'failed', 'rate_limited'));
