# Agentic Jobs — Background Scheduler & Web Push Setup Guide

This guide documents the server-side background job scheduler architecture and Web Push notification setup for **Agentic Jobs**.

---

## 1. Web Push VAPID Keys Setup

Web Push notifications are delivered using the standard W3C Push API and VAPID keys.

To generate VAPID keys locally:

```bash
npx web-push generate-vapid-keys
```

Set the generated keys in your environment variables (`.env` or AI Studio Secrets):

```bash
VAPID_PUBLIC_KEY="YOUR_GENERATED_PUBLIC_KEY"
VAPID_PRIVATE_KEY="YOUR_GENERATED_PRIVATE_KEY"
VAPID_SUBJECT="mailto:support@agenticjobs.dev"
```

### Free-Tier & Provider Limits
- **Native Browser Push API (FCM / Mozilla Push Service)**: Free with no quota limits for standard transactional alerts.
- **Payload Limits**: Max 4KB encrypted payload size. Sensitive resume details are never included in notification text.

---

## 2. Background Scheduler Architecture

Server-side job discovery is managed by `scanEngine` (`server/scheduler/scanEngine.ts`) and the Supabase-backed worker (`server/scheduler/schedulerWorker.ts`).

### Key Features
1. **User-Configurable Intervals**:
   - **Hourly**: 1 through 24 hours
   - **Daily**: 1 through 5 days
2. **Durable queue and leases**: Manual scans are atomically enqueued per user in Supabase; the worker claims jobs, records leases, retries failures up to a bounded attempt count, and recovers expired leases after restarts.
3. **Shared Source Request Pooling**: Reuses normalized multi-source search query results to prevent duplicate external API requests.
4. **Gemini AI Match Scoring**: Evaluates candidate fit and applies persisted per-user alert, auto-save, and push preferences.

The API process runs the worker loop by default to preserve the existing deployment shape. For a separate persistent Render Background Worker:

- Web service: build with `npm install && npm run build`, start with `npm start`, and set `RUN_SCHEDULER_WORKER=false`.
- Background Worker service: use the same build command and start with `npm run worker`.
- Worker secrets: `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`). Add Gemini and Web Push variables only when those features are enabled.
- The source connectors read `APIFY_API_TOKEN` (also accepts `APIFY_KEY`) and `RAPIDAPI_KEY` (also accepts `RAPID_API`). RapidAPI also needs the correct product `RAPIDAPI_HOST` and `RAPIDAPI_SEARCH_PATH`.
- Third-party source calls remain disabled unless `ENABLE_APPROVED_THIRD_PARTY_JOB_CONNECTORS=true`; enable only after confirming the provider terms, account subscription, and usage limits.

No Render service declaration is checked into this repository; deployment must be verified in the Render dashboard. If using the HTTP cron endpoint instead of a continuously running worker, send `Authorization: Bearer <CRON_SECRET>` or `X-Cron-Secret: <CRON_SECRET>`; the secret in a request body is not accepted.

---

## 4. Notification Categories & Preferences

Users can save preferences in **Settings**:
- **High-match alerts**: Controls in-app alerts for qualifying scores (>85%).
- **Automatically save high matches**: Persists qualifying jobs in the user's saved-jobs list.
- **Push notifications**: Controls browser push dispatch after a subscription has been registered.
- **Email summaries**: Not available; no email-delivery provider is configured.
