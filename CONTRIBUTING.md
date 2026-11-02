# Contributing

Thanks for helping improve Agentic Jobs. Focused bug fixes, regression tests, documentation corrections, and carefully scoped features are welcome.

## Development setup

Requirements: Node.js 24.x or 26.x LTS and npm.

```bash
git clone https://github.com/Talha-dotcom-hub/Agentic-Jobs.git
cd Agentic-Jobs
npm ci
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Add only the configuration needed for the feature you are working on.

## Before opening a pull request

```bash
npm run lint
npm test
npm run build
```

Include tests for behavior changes. Keep unrelated formatting or generated files out of the diff.

## Security and data handling

- Never commit `.env`, API credentials, VAPID private keys, real resumes, user exports, or production data.
- Keep elevated Supabase credentials and provider keys on the backend only.
- Do not bypass job-provider authentication, access controls, rate limits, or published terms.
- Database migrations must be additive where practical, ordered, and safe for existing user data.
- Never claim that external integrations or production behavior were tested unless they were actually verified.
