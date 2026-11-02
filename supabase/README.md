# Agentic Jobs — Supabase Setup

This directory contains the PostgreSQL migrations, Row Level Security (RLS) policies, and storage configuration used by the backend.

## Environment configuration

The browser receives only the public project URL and anon/publishable key:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

The API and standalone scheduler worker use backend-only credentials:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-server-only-secret
```

The server also accepts `SUPABASE_SERVICE_ROLE_KEY` as a compatibility alias. Never put an elevated key in a `VITE_*` variable, browser bundle, issue, screenshot, or source repository.

## Migration order

For a **new, empty Supabase project**, review and apply these files in order:

1. `001_initial_schema.sql`
2. `002_scheduler_and_push.sql`
3. `003_structured_resume_memory.sql`
4. `004_account_deletion_and_policies.sql`
5. `005_harden_account_deletion_rpc.sql`
6. `006_scan_runs_saved_jobs_and_scheduling.sql`
7. `20261026_user_gemini_credentials_and_discovered_jobs.sql`
8. `20261029_scan_history_deduplication.sql`
9. `20261030_durable_scan_queue.sql`
10. `20261030_resume_storage_upload_limits.sql`
11. `20261102_scan_history_partial_status.sql`

For an existing project, inspect its migration history and apply only migrations that are not already present, preserving the dependency order above. Do not blindly rerun SQL against production, delete migration history, or truncate user data. Back up production data before applying schema changes.

The repository does not know which migrations have been applied to a connected Supabase project. A file existing in Git is not evidence that it has been executed in the database.

## What the migrations provide

The migration set covers user profiles, jobs, saved jobs, applications, resume metadata and private storage, scan schedules, push subscriptions and notification history, encrypted per-user Gemini credentials, discovered-job snapshots, durable scan runs with leases/retries, scan-history retention, and the `partial` scan status.

The later migrations assume the earlier base tables exist. In particular, the durable queue migration alters the `scan_runs` table created by migration 006, and the partial-status migration widens the existing scan-history status constraint.

## Storage and user isolation

- The `resumes` bucket must remain private.
- Resume object paths are scoped to the authenticated user's ID.
- Keep RLS enabled and validate table and storage policies with two separate test accounts.
- Service-role access belongs only in the backend. Server routes must authorize requests using the verified Supabase user, not a client-supplied user ID.
- Use temporary signed URLs only when required; do not publish resume URLs or content in logs.

## Verification

From the repository root, run:

```bash
npm ci
npm run lint
npm test
npm run build
```

These checks validate the local source and test suite. They do not prove that production migrations, auth redirects, RLS policies, storage permissions, or provider credentials are correct. Verify those separately in the target Supabase project using test accounts before uploading real resumes.
