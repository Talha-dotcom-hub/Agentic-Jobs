# Agentic Jobs — Repair Changelog

Date: 2026-11-02

This document describes changes applied to the supplied project archive. It does not imply that the deployed Netlify/Render application was changed.

## Application changes

- **Resume-match threshold:** centralized qualifying semantics are inclusive (`score >= 85`) in the shared helper, backend filtering and recommendation UI. Exactly 85% qualifies; 84% does not.
- **Authentication restoration:** while Supabase restores the initial session, the app shows an accessible loading state rather than briefly rendering the public logged-out homepage. Valid protected `?view=` deep links are restored after authentication.
- **Account-switch safety:** asynchronous account-data hydration is cancelled when the signed-in identity changes or the component unmounts, preventing old-user results from being written into the new session's UI state.
- **Search restoration:** Discover initializes its search query from `?q=`, updates the URL while the user searches and retains filters/sort state through the existing URL state logic.
- **Public feed request discipline and attribution:** Remotive catalogue fetches are coalesced and cached for six hours per running backend process to reduce request volume in line with its published guidance; actual job cards identify Remotive as the source and keep the source listing URL. This in-process cache is not a cross-instance shared cache.
- **Connector status accuracy:** source configuration is separated from the approval flag and from live health. A configured-but-disabled source reports `Disabled`; configured sources that have not run a provider request report `Not tested` rather than `Healthy` or `Available`. Greenhouse/Lever configuration no longer asks users for commercial API keys; their board/site slugs are documented separately.
- **Gemini BYOK validation:** a supplied Gemini key is checked against Google's Models API using the application's supported model list before encryption and persistence. Authentication, model access, quota and provider/network failures do not silently save an unverified key. Existing AES-256-GCM vault design is retained.
- **Scan completeness:** a final 85% no-match message now requires both complete scoring and zero configured-source failures. Partial discovery/scoring is communicated as partial, provider errors are surfaced, and scan history records `partial` through a safe additive migration.
- **Scan notifications:** completion messages distinguish qualifying matches, fully completed no-match scans, missing personal Gemini configuration and partial runs. Existing per-scan deduplication and user push preferences remain in place.
- **Desktop navigation:** removes unnecessary desktop sidebar decoration and adds a spring-based active route pill using the already installed Motion package. Reduced-motion preference and real active-route state are respected; mobile navigation remains unchanged.
- **Developer workflow:** adds `npm test`, and includes the new regression tests in the supplied test folder.

## Files changed

The application changes are in `server.ts`, `server/ai/geminiFallback.ts`, `server/scheduler/scanEngine.ts`, `shared/matchThreshold.ts`, `src/App.tsx`, `src/context/AppContext.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/pages/app/DiscoverJobs.tsx`, `src/pages/app/SearchSchedule.tsx`, `src/pages/app/Dashboard.tsx`, `src/pages/app/RecommendedJobs.tsx`, `src/pages/public/Features.tsx`, `src/pages/public/Home.tsx`, `src/services/api.ts`, and `src/types/index.ts`.

Regression tests are in `tests/app_state_repairs.test.ts`, `tests/gemini_api_key_validation.test.ts`, and `tests/match_threshold.test.ts`. Deployment and configuration notes are in `docs/CONFIGURATION_AUDIT.md`, `docs/SCHEDULER_AND_PUSH_SETUP.md`, `.env.example`, and `docs/REPAIR-SETUP.md`. The scan-history status extension is in `supabase/migrations/20261102_scan_history_partial_status.sql`.

## Verification summary

- `npm run lint`: passed in this workspace after installing/type-checking against the archive's dependencies.
- Automated tests: 73 passed, 0 failed, 20 suites, run with four Node test workers and a temporary TypeScript ESM loader because the archive's bundled `node_modules` contains Windows-native executables and this execution environment is Linux.
- `git diff --check`: passed with CRLF-aware whitespace checking (`git -c core.whitespace=cr-at-eol diff --check`).
- Production build: **not verified**. The supplied `node_modules` was bundled for Windows; Vite's native Rolldown Linux binding is absent. Reinstall dependencies on the deployment OS, then run `npm run build`.
- Live RapidAPI/Apify/Remotive/Greenhouse/Lever calls: **not verified**. This environment cannot resolve outbound API hosts and no private deployment environment was accessed.
- Visual browser QA at the requested eight viewports: **not verified**. No browser automation session was available.
- Production Render, Netlify, Supabase, push and real-user data: **not accessed or changed**.

No deployment or GitHub push was performed.
