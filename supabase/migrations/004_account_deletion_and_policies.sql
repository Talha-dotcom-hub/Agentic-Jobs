-- =========================================================
-- AGENTIC JOBS - SUPABASE DATABASE MIGRATION 004
-- Complete Account Deletion, Cascade Cleanup & Policy Hardening
-- =========================================================

-- 1. Explicit DELETE Policy on Profiles
-- In 001, only SELECT and UPDATE were specified for public.profiles.
-- This policy allows authenticated users to delete their own profile record.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile" ON public.profiles
      FOR DELETE USING (auth.uid() = id);
  END IF;
END $$;

-- 2. Storage Deletion Policy for Resumes Bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete own resume storage files'
  ) THEN
    CREATE POLICY "Users can delete own resume storage files"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'resumes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- 3. Dedicated Stored Function for Full User Account Purge
CREATE OR REPLACE FUNCTION public.delete_user_account_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  deleted_resumes_count INT := 0;
  deleted_jobs_count INT := 0;
  deleted_apps_count INT := 0;
BEGIN
  -- Verify caller is either the owner or has service role / admin privileges
  IF auth.uid() IS NOT NULL AND auth.uid() != target_user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete another user account.';
  END IF;

  -- 1. Delete associated storage objects from resumes bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = target_user_id::text;

  -- 2. Delete user's profile record (which cascades to all child tables)
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'message', 'User account and all associated data permanently deleted.'
  );
END;
$$;
