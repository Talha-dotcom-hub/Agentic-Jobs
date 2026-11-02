# Agentic Jobs — Setup After Repair

These steps are for installing and deploying the updated source. No production settings were changed as part of the repair.

## 1. Install on a supported runtime

Use Node.js 20.19+ or 22.12+ (the bundled Vite 8 runtime declares these minimum supported versions). On a clean checkout or extracted ZIP:

```bash
npm ci
npm run lint
npm test
npm run build
```

For local development, run `npm run dev`. The supplied archive's `node_modules` was built for Windows; do not reuse that folder on Linux/Render. `npm ci` on the target platform installs the matching platform-specific optional packages.

## 2. Configure Netlify (frontend)

Set only these browser-safe public values in Netlify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the Supabase anon/publishable key only)

`netlify.toml` currently proxies `/api/*` to `https://agentic-jobs-api.onrender.com/api/:splat`. Confirm that this is the actual Render web-service hostname in your account before deploying. If your backend hostname differs, update only that proxy target.

Never place `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Gemini keys, Apify tokens, RapidAPI keys, `CRON_SECRET`, VAPID private key or the Gemini credential-encryption key in Netlify's `VITE_*` variables.

## 3. Configure Render (backend)

At minimum, configure:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (or the supported `SUPABASE_SERVICE_ROLE_KEY` alias)
- `GEMINI_CREDENTIALS_ENCRYPTION_KEY` — a persistent random secret with at least 32 characters. Keep the same value across restarts/deploys. Changing it without decrypting/re-encrypting stored credentials makes existing encrypted BYOK records unreadable.
- `CRON_SECRET` for protected scheduler endpoints.

Configure Web Push only when used: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. Keep the VAPID pair stable and matched. Do not copy `server/data/vapid.json` from a local machine.

For third-party sources, configure credentials on Render only:

- Apify: `APIFY_API_TOKEN` (or `APIFY_KEY`) and, if needed, `APIFY_ACTOR_ID`.
- RapidAPI: `RAPIDAPI_KEY` (or `RAPID_API`), plus the exact product `RAPIDAPI_HOST` and `RAPIDAPI_SEARCH_PATH` from the RapidAPI product documentation for the subscribed API.
- Enable these commercial connectors only after confirming provider authorization, subscription and usage limits with `ENABLE_APPROVED_THIRD_PARTY_JOB_CONNECTORS=true`.
- Greenhouse boards: `ATS_GREENHOUSE_BOARDS`, a comma-separated list of public board tokens.
- Lever boards: `ATS_LEVER_COMPANIES`, a comma-separated list of site slugs.

Greenhouse's public GET endpoints do not require authentication; the board token is the URL identifier. Lever's public postings endpoint is addressed by site slug. Do not request a commercial API key for these read-only public listing endpoints. Confirm every slug and provider's terms before adding it.

## 4. Apply Supabase migrations

Review the entire `supabase/migrations/` directory in timestamp order against the target database. Apply all migrations not already applied using your normal Supabase CLI/dashboard process. In particular, apply `20261102_scan_history_partial_status.sql` before deploying the backend that writes the new `partial` scan-history status. Do not manually delete or truncate existing user tables.

## 5. Configure the worker

The API process runs the scheduler worker by default. If you run a separate Render Background Worker, set `RUN_SCHEDULER_WORKER=false` on the API service and set the worker start command to `npm run worker`. Use the same backend Supabase and credential-encryption secrets on both services. Verify the worker service exists in the Render dashboard; this repository does not contain a Render service declaration.

## 6. Public feed terms

The current public feed connector calls Remotive's public API, labels results as `Remotive Public Jobs Feed`, retains the Remotive listing URL and caches the catalogue for six hours per backend process. Its published terms require attribution/link-back and impose display/use conditions and request-rate guidance. The application should not be deployed with a login-gated listing flow or used to republish those jobs to another job board unless Remotive confirms that specific use is permitted. Request Remotive's private/paid API or choose another feed with terms that allow the intended use where necessary. Review its current terms before enabling production use.

## 7. Deploy only after review

1. Back up the Supabase database and confirm pending migrations.
2. Confirm Render environment variables and the actual RapidAPI product endpoint.
3. Confirm the Netlify proxy points to the correct Render host.
4. Run `npm ci`, `npm run lint`, `npm test`, and `npm run build` on the target platform.
5. Deploy manually through your normal Netlify/Render workflow.
6. Sign in with a test account, upload a test resume, validate a personal Gemini key, perform a test search, confirm saved jobs/settings survive reload, then inspect scan history and source errors.

Do not publish the provided archive's local runtime data or any `.env` file. `.env.example` contains placeholders only.
