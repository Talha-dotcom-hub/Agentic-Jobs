-- Harden account deletion: an authenticated user can delete only their own account;
-- the trusted service_role may perform an explicitly authorized server-side deletion.
CREATE OR REPLACE FUNCTION public.delete_user_account_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, auth
AS $$
DECLARE
  deleted_auth_user_id UUID;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
      RAISE EXCEPTION 'Unauthorized: cannot delete another user account.' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Remove private resume objects first; failure aborts deletion rather than claiming success.
  DELETE FROM storage.objects
  WHERE bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = target_user_id::text;

  -- Delete the Auth identity as the canonical root. FK cascades remove profiles,
  -- resume/profile memory, schedules, notifications, history, API credentials,
  -- discovered jobs, subscriptions, queued scans, and saved-job snapshots.
  DELETE FROM auth.users
  WHERE id = target_user_id
  RETURNING id INTO deleted_auth_user_id;

  IF deleted_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Account not found; no account data was deleted.' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', deleted_auth_user_id,
    'message', 'Account and cascading user-owned records were deleted.'
  );
END;
$$;

-- SECURITY DEFINER functions must not retain PostgreSQL's default PUBLIC execute grant.
REVOKE ALL PRIVILEGES ON FUNCTION public.delete_user_account_data(UUID) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.delete_user_account_data(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO service_role;
