# Agentic Jobs — UI and persistence update

## Changes in this update
- Authenticated sessions now reopen the app dashboard by default; app tabs are encoded as `?view=...` so refresh preserves the selected tab.
- Successful sign-in/sign-up routes to Dashboard rather than forcing the Resume screen.
- Added a fixed, safe-area-aware iOS-style glass bottom navigation dock on mobile for Home, Discover, Saved, Resume, Schedule, and Alerts.
- Added accessible scroll-reveal motion and reduced-motion support.
- Existing tilt card component retained; added responsive/mobile interaction styling.
- Existing granted browser push permission is reused after sign-in to restore a missing subscription. First-time notification permission still requires a user gesture.
- Removed the generated `server/data/vapid.json` private key from the source package. It must be generated/stored as a deployment secret/runtime file, not committed.
- Excluded `.git`, `node_modules`, generated build folders, AI Studio artifacts, and backup files from this release ZIP.

## Important production notes
- Web Push notifications cannot be guaranteed by frontend code alone. The production server must have valid VAPID configuration, a persistent runtime for subscription storage, and the scheduler/cron worker configured and running. Browser/OS notification settings must allow notifications.
- Scheduled discovery requires the Render backend/worker and Supabase schema/secrets to be correctly configured. Demo mode intentionally does not run background scans or persist sample data.
- Resume persistence depends on the authenticated backend/Supabase configuration. Verify the resume save API and storage policies in the deployed environment before announcing this as production-ready.

## Safe merge into the existing GitHub repository
1. Download and extract this ZIP locally.
2. Make a backup branch or clone your existing repo first.
3. Copy the extracted project files over the existing repository files. Do **not** copy `node_modules`, `dist`, `server-dist`, `.git`, or any `.env` file.
4. Preserve your local `.env` and keep secrets only in Netlify/Render environment settings. Do not upload `server/data/vapid.json`.
5. Review `git status` and confirm no `.env`, private VAPID key, resume data, or service-role key is staged.
6. Run `npm ci`, then `npm run lint`, `npm run build`, and your test command locally.
7. Commit and push to your existing branch. Confirm Netlify and Render deploy the expected commit and inspect their build/runtime logs.
8. Test login, tab refresh, resume save/reload, job list after refresh, scheduled scan, and a push notification on a real installed PWA/browser.

This ZIP is a source update, not proof that external Supabase/Netlify/Render configuration is correct. Validate the deployment before describing background push or scheduled scanning as fully operational.
