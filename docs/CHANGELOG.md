# Changelog

This file records repository and product changes. It is not a deployment-status report; production state must be checked in the hosting providers.

## 2026-11-02 — Repository maintenance

- Added CI coverage for Node.js 24 and 26.
- Added dependency update automation, pull-request guidance, issue templates, contribution guidance, and a security policy.
- Corrected package metadata and lockfile identity.
- Hardened URL validation for reserved IPv4 and non-global IPv6 literals.
- Bounded the in-memory rate-limit bucket map and documented its single-process limitation.
- Avoided duplicating persisted Web Push subscription records in process memory.
- Corrected README threshold, test, migration, and deployment documentation.
- Clarified that the public contact form prepares an email draft; it does not send email through the application.
- Aligned public project credits with the named project team.

## 2026-11-02 — Application reliability update

- Restored authenticated sessions to the dashboard and preserved valid app-view deep links.
- Cancelled stale account-data hydration when the authenticated identity changes.
- Restored Discover search state from the URL.
- Added public-feed request coalescing/caching and source attribution.
- Distinguished configured, disabled, and untested source connectors.
- Validated personal Gemini credentials before persisting them.
- Distinguished fully completed scans from partial discovery/scoring outcomes.
- Added persistence support for the partial scan-history status.
- Improved desktop navigation transitions while respecting reduced-motion preferences.

For operational details, see the [deployment runbook](DEPLOYMENT.md), [Supabase guide](../supabase/README.md), and [configuration audit](CONFIGURATION_AUDIT.md).
