# Runtime Configuration Audit

Audited against the environment-variable reads in the server, worker, browser, and job-source connector implementations. This records code contracts, not secret values.

## Variables and consumers

| Exact name read by code | Consumer | Correct use | Required? | Other requirements / mismatch |
|---|---|---|---|---|
| `SUPABASE_URL` | API server and standalone worker | Backend project URL passed to `createClient`. | Required for persistent backend features and the worker. | Pair with `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`. |
| `SUPABASE_SECRET_KEY` | API server and standalone worker | Server-side elevated Supabase credential. | Required for server admin operations and worker database access. | Never use in a `VITE_*` variable or browser bundle. Code also accepts `SUPABASE_SERVICE_ROLE_KEY`. |
| `SUPABASE_SERVICE_ROLE_KEY` | API server and standalone worker (fallback) | Equivalent service-role credential when the preferred secret name is absent. | Alternative to `SUPABASE_SECRET_KEY`. | This is an alias, not an additional required key. |
| `VITE_SUPABASE_URL` | Browser client | Public project URL for Supabase Auth and Storage. | Required for browser auth/uploads. | Pair with `VITE_SUPABASE_ANON_KEY`; separate from backend `SUPABASE_URL`. |
| `VITE_SUPABASE_ANON_KEY` | Browser client | Public anon/publishable key. | Required for browser auth/uploads. | Do not put an elevated service-role secret here. |
| `GEMINI_API_KEY` | Resume extraction and scan match scoring | Shared backend Gemini fallback. | Optional. | Used only when `ALLOW_SHARED_GEMINI_KEY=true`; a user-specific key can be used without the shared key. |
| `ALLOW_SHARED_GEMINI_KEY` | Resume extraction and scan matching | Must equal the literal string `true` to permit use of `GEMINI_API_KEY`. | Optional; defaults off. | No mismatch with `.env.example`; do not enable unintentionally because requests consume shared quota. |
| `GEMINI_CREDENTIALS_ENCRYPTION_KEY` | API server credential vault | Stable secret of at least 32 characters used to derive the AES-256-GCM key for personal Gemini credentials. | Required to save/read encrypted personal Gemini keys. | Keep unchanged across deploys; rotating it without migration makes old records undecryptable. |
| `CRON_SECRET` | API cron routes and auth middleware | Exact secret sent as `Authorization: Bearer ...` or `X-Cron-Secret`. | Required for production cron endpoint access. | Request-body secrets are not accepted. |
| `VAPID_PUBLIC_KEY` | API Web Push service | Public Web Push key. | Required if production push is used. | Must match `VAPID_PRIVATE_KEY`; the key is returned to the browser through the API. |
| `VAPID_PRIVATE_KEY` | API Web Push service | Private signing key. | Required if production push is used. | Must match the public key and remain secret. |
| `VAPID_SUBJECT` | API Web Push service | VAPID contact identifier, typically `mailto:...`. | Optional; code defaults to `mailto:support@agenticjobs.dev`. | Set an operator-controlled contact for production. |
| `APIFY_API_TOKEN` | Apify job-source connector | Apify API token sent as `Authorization: Bearer <token>`. | Optional unless the source is enabled. | `APIFY_KEY` is accepted as an alias. Also needs a valid actor ID and explicit provider opt-in. |
| `APIFY_KEY` | Apify job-source connector (alias) | Same Apify token contract as `APIFY_API_TOKEN`; sent in the Bearer header. | Optional unless the source is enabled. | This alias was added to match the supplied Render variable name. |
| `APIFY_ACTOR_ID` | Apify job-source connector | Actor ID or `username/actor-name`; defaults to `valig/linkedin-jobs-scraper`. | Optional if default actor is acceptable. | Confirm actor access, pricing, and permitted use. |
| `RAPIDAPI_KEY` | RapidAPI job-source connector | RapidAPI key sent in the `x-rapidapi-key` header. | Optional unless the source is enabled. | `RAPID_API` is accepted as an alias. Must match the subscribed product host. |
| `RAPID_API` | RapidAPI job-source connector (alias) | Same key contract as `RAPIDAPI_KEY`; sent in the `x-rapidapi-key` header. | Optional unless the source is enabled. | This alias was added to match the supplied Render variable name. |
| `RAPIDAPI_HOST` | RapidAPI job-source connector | Product hostname used both for the request URL and `x-rapidapi-host`. | Optional in code; defaults to `linkedin-data-api.p.rapidapi.com`. | Must be the exact host for the subscribed RapidAPI product. |
| `RAPIDAPI_SEARCH_PATH` | RapidAPI job-source connector | Product search path; defaults to `/search-jobs`. | Optional in code. | Must match the product's actual documented endpoint. |
| `ENABLE_APPROVED_THIRD_PARTY_JOB_CONNECTORS` | Source manager | Must equal literal `true` to call RapidAPI/Apify. | Optional; defaults off. | This is an additional setting not in the supplied Render variable list. Keys alone do not enable these sources. |
| `RUN_SCHEDULER_WORKER` | API server process | Set to `false` when a separate worker service is running. | Optional. | A separate Render Background Worker must be configured with `npm run worker`; this repository has no Render service declaration. |
| `PORT` | API server | Listening port; defaults to `3000`. | Optional. | Normally supplied by hosting. |

## Findings

- The Supabase server client accepts `SUPABASE_SECRET_KEY` directly and falls back to `SUPABASE_SERVICE_ROLE_KEY`. The browser client uses only the `VITE_SUPABASE_*` values. Keep the elevated key backend-only.
- Apify authentication is correctly sent as a Bearer token. The code now accepts both `APIFY_API_TOKEN` and the supplied Render name `APIFY_KEY`.
- RapidAPI authentication is correctly sent through `x-rapidapi-key`, with `x-rapidapi-host` set from `RAPIDAPI_HOST`. The code now accepts both `RAPIDAPI_KEY` and the supplied Render name `RAPID_API`.
- Neither connector can be considered live merely because its key exists. Provider opt-in, actor/product access, correct RapidAPI host/path, account quota, and valid live responses still need verification.
- Shared Gemini use is off unless `ALLOW_SHARED_GEMINI_KEY=true`. Personal Gemini credentials are encrypted with AES-256-GCM and require a stable `GEMINI_CREDENTIALS_ENCRYPTION_KEY` of at least 32 characters.
- Production cron calls require `CRON_SECRET` in one of the supported headers.
- Web Push requires a matching VAPID public/private pair. Code validates that the public key is derived from the configured private key at service initialization.
- The repository documents how to run a standalone worker, but does not declare or prove a Render worker exists. Inspect the Render dashboard to verify the service and its start command.

## Verification limits

This audit can verify code references and local automated tests. It cannot inspect Render's private environment, determine whether the variable values in Render are valid, apply Supabase migrations, check live account subscriptions/quota, or prove that a Render worker is running. No production writes or paid provider runs were performed for this audit.
