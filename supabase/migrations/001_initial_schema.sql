-- =========================================================
-- AGENTIC JOBS - SUPABASE DATABASE SCHEMA MIGRATION 001
-- Normalized schema with Row Level Security (RLS) & Triggers
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'Software Engineer',
  preferences JSONB DEFAULT '{
    "pushNotifications": false,
    "highMatchAlerts": true,
    "emailSummaries": true,
    "autoSaveHighMatches": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBS CATALOG TABLE (Shared normalized job opportunities)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT DEFAULT 'Remote',
  source TEXT DEFAULT 'Public Feed',
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  salary TEXT,
  type TEXT DEFAULT 'Full-time',
  experience_level TEXT DEFAULT 'Mid-Senior',
  workplace_type TEXT DEFAULT 'Remote',
  original_url TEXT NOT NULL,
  description TEXT NOT NULL,
  skills_required TEXT[] DEFAULT '{}',
  is_stale BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching jobs by title and company
CREATE INDEX IF NOT EXISTS idx_jobs_search ON public.jobs (title, company, workplace_type);

-- 3. USER_JOBS TABLE (Per-user saved jobs & AI match cache)
CREATE TABLE IF NOT EXISTS public.user_jobs (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  is_saved BOOLEAN DEFAULT FALSE,
  match_score INT DEFAULT 0,
  match_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

-- 4. APPLICATIONS TRACKER TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  original_url TEXT,
  status TEXT DEFAULT 'Applied' CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected')),
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  last_updated_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  salary TEXT,
  contact_person TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications (user_id, status);

-- 5. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  content_text TEXT NOT NULL,
  extracted_skills TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SCAN SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.scan_schedules (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  frequency_type TEXT DEFAULT 'hourly' CHECK (frequency_type IN ('hourly', 'daily')),
  frequency_value INT DEFAULT 4,
  last_scan_time TIMESTAMPTZ DEFAULT NOW(),
  next_scan_time TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours'),
  last_successful_jobs_count INT DEFAULT 0,
  source_failures_count INT DEFAULT 0,
  status TEXT DEFAULT 'idle',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'system' CHECK (type IN ('match', 'scan', 'followup', 'system')),
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USER API KEYS TABLE (Server-side proxy credentials)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  apify_token TEXT,
  rapidapi_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles read for authenticated user" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "User update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Jobs Catalog Policies (Public read for authenticated users, insert permitted)
CREATE POLICY "Authenticated users can read jobs catalog" ON public.jobs
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can insert new jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. User Jobs Policies (RLS enforced per user_id)
CREATE POLICY "Users read own user_jobs" ON public.user_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert/update own user_jobs" ON public.user_jobs
  FOR ALL USING (auth.uid() = user_id);

-- 4. Applications Policies (RLS enforced per user_id)
CREATE POLICY "Users manage own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id);

-- 5. Resumes Policies (RLS enforced per user_id)
CREATE POLICY "Users manage own resume" ON public.resumes
  FOR ALL USING (auth.uid() = user_id);

-- 6. Scan Schedules Policies
CREATE POLICY "Users manage own scan schedule" ON public.scan_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 7. Notifications Policies
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 8. User API Keys Policies
CREATE POLICY "Users manage own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- =========================================================
-- TRIGGERS & AUTOMATIC USER PROVISIONING
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Provision user profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );

  -- Provision default scan schedule
  INSERT INTO public.scan_schedules (user_id)
  VALUES (NEW.id);

  -- Provision initial welcome notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to Agentic Jobs',
    'Your account is ready. Upload your resume to begin Gemini AI job matching.',
    'system'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- PRIVATE STORAGE BUCKET CONFIGURATION & POLICIES
-- =========================================================

-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for authenticated users
CREATE POLICY "Private user resume storage access"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
