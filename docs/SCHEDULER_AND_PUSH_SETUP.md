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

Server-side job discovery is managed by the `scanEngine` (`server/scheduler/scanEngine.ts`).

### Key Features
1. **User-Configurable Intervals**:
   - **Hourly**: 1 through 24 hours
   - **Daily**: 1 through 5 days
2. **Atomic Scan Lock (`activeLocks`)**: Prevents duplicate concurrent scans for the same user.
3. **Shared Source Request Pooling**: Reuses normalized multi-source search query results to prevent duplicate external API requests.
4. **Gemini AI Match Scoring**: Evaluates candidate fit and dispatches Web Push alerts for high-scoring matches (>85%).

---

## 3. Production Deployment with Supabase pg_cron

In production, apply `supabase/migrations/002_scheduler_and_push.sql` to enable `pg_cron` and `pg_net`:

```sql
SELECT cron.schedule(
  'agentic-jobs-background-scan',
  '0 * * * *', -- Runs hourly at minute 0
  $$
  SELECT net.http_post(
    url := 'https://your-applet-url/api/scan/run-due',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

---

## 4. Notification Categories & Preferences

Users can toggle notifications in **Settings**:
- **New High-Match Jobs**: Dispatches alerts when an opportunity scores >85%.
- **Application Follow-Up Reminders**: Triggers when an application stays in `Applied` status for >5 days.
- **Source Failures & System Alerts**: Notifies users if a source connector rate-limits or fails.
