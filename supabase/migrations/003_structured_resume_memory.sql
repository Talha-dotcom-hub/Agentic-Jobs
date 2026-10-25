-- =========================================================
-- AGENTIC JOBS - SUPABASE DATABASE MIGRATION 003
-- Structured Resume Memory & Professional Profile Persistence
-- =========================================================

-- 1. EXTEND RESUMES TABLE WITH STRUCTURED PROFILE & EXTRACTION STATUS
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS structured_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'completed' CHECK (extraction_status IN ('idle', 'extracting', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS extraction_error TEXT;

-- 2. DEDICATED PROFESSIONAL PROFILES TABLE (Normalized Schema)
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  skills TEXT[] DEFAULT '{}',
  technical_tools TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  projects TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  domains TEXT[] DEFAULT '{}',
  years_of_experience NUMERIC DEFAULT 0,
  source_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  profile_version INT DEFAULT 1,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prof_profiles_user ON public.professional_profiles (user_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own professional profile" ON public.professional_profiles
  FOR ALL USING (auth.uid() = user_id);
