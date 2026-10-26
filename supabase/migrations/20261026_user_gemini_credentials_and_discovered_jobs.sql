-- Agentic Jobs: encrypted per-user Gemini keys and durable scheduled-discovery results.
-- Run this migration in Supabase SQL Editor before deploying the backend changes.
create table if not exists public.user_ai_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_key text not null,
  iv text not null,
  auth_tag text not null,
  key_hint text not null,
  updated_at timestamptz not null default now()
);
alter table public.user_ai_credentials enable row level security;
revoke all on table public.user_ai_credentials from anon, authenticated;
grant all on table public.user_ai_credentials to service_role;

create table if not exists public.user_discovered_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null,
  source text not null,
  title text not null,
  company text not null,
  company_logo text,
  location text,
  workplace_type text,
  employment_type text,
  experience_level text,
  salary text,
  original_url text,
  description text not null default '',
  skills_required jsonb not null default '[]'::jsonb,
  posted_date text,
  verified boolean not null default false,
  is_stale boolean not null default false,
  match_score integer check (match_score is null or (match_score >= 0 and match_score <= 100)),
  matching_evidence jsonb not null default '[]'::jsonb,
  potential_skill_gaps jsonb not null default '[]'::jsonb,
  eligibility_warnings jsonb not null default '[]'::jsonb,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_key)
);
create index if not exists user_discovered_jobs_user_seen_idx
  on public.user_discovered_jobs (user_id, last_seen_at desc);
alter table public.user_discovered_jobs enable row level security;
revoke all on table public.user_discovered_jobs from anon, authenticated;
grant all on table public.user_discovered_jobs to service_role;