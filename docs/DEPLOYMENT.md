# Agentic Jobs — Deployment Runbook

Use this guide to install and deploy the repository. Production credentials, migrations, and service settings must be verified in the target accounts before release.

## 1. Runtime and local validation

Use Node.js 24.x or 26.x LTS.

```bash
npm ci
npm run lint
npm test
npm run build
```

Run local development with `npm run dev`. Do not reuse a `node_modules` directory built for another operating system.

## 2. Netlify frontend

Set only browser-safe values in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (public anon/publishable key only)

The current `netlify.toml` proxies `/api/*` to `https://agentic-jobs-api.onrender.com/api/:splat`. Verify that this is the actual backend hostname in the hosting account before deployment.

Never put service-role credentials, Gemini keys, provider tokens, cron secrets, VAPID private keys, or the Gemini encryption key in Netlify `VITE_*` variables.

## 3. Render backend

Configure backend secrets as needed:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (or supported `SUPABASE_SERVICE_ROLE_KEY` alias)
- `GEMINI_CREDENTIALS_ENCRYPTION_KEY` (stable, random, at least 32 characters)
- `CRON_SECRET`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` when Web Push is enabled

Set third-party source credentials only after verifying provider terms, authorization, subscription, endpoint, and usage limits. Apify and RapidAPI remain disabled unless `ENABLE_APPROVED_THIRD_PARTY_JOB_CONNECTORS=true`.

For a separate Render Background Worker, set `RUN_SCHEDULER_WORKER=false` on the web service and use `npm run worker` as the worker start command. The API and worker must use the same Supabase project and stable encryption secret. This repository does not contain a Render service declaration, so confirm service configuration in the Render dashboard.

## 4. Supabase migrations

For a new project, apply migrations in this order: numbered base migrations `001` through `006`, followed by `20261026`, `20261029`, both `20261030` migrations (durable queue before resume storage limits), and `20261102_scan_history_partial_status.sql`.

For an existing project, inspect migration history and apply only missing migrations. Back up production data first. Never blindly rerun migrations or delete migration history/user data. See [the Supabase guide](../supabase/README.md).

## 5. Post-deployment smoke checks

Use a dedicated test account and test resume:
1. Verify `/api/health` responds.
2. Sign in, sign out, and reset a test password.
3. Save and reload a test resume and saved job.
4. Validate a user-owned Gemini key without exposing it in logs or responses.
5. Run a manual scan and inspect source failures and scan-history status.
6. Verify push subscription persistence and a test notification if push is enabled.
7. Confirm the worker/cron runs after an API restart.
8. Check Netlify proxy behavior, Render logs, and Supabase RLS/storage policies.

A green CI build does not establish that production secrets, migrations, provider integrations, worker uptime, or push delivery are configured correctly. Do not announce production readiness until the relevant live checks pass.
