# Larson Box Spread Financing Platform

Internal Vercel-ready scaffold for Larson Financial's deterministic box-spread financing platform.

## What Is Included

- Next.js app with an advisor-facing calculation workspace.
- Deterministic TypeScript financial engine outside React components.
- Market-data provider interface plus a mock provider for local development.
- Quote validation statuses and reason codes.
- Workbook-derived formula implementation and regression tests.
- GitHub and Vercel setup instructions.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm run verify
```

This runs type checking, unit tests, and a production build.

## Key Paths

- `src/domain/` - deterministic financial engine, domain types, config, validation, and market-data interface.
- `src/app/` - Next.js dashboard and calculation API.
- `tests/domain/` - unit and regression tests.
- `docs/calculation-methodology.md` - implemented formulas and limitations.
- `docs/workbook-field-map.md` - workbook-to-application field mapping.
- `docs/github-vercel-setup.md` - step-by-step repository and deployment setup.

## Production Boundary

The current app uses mock market data and is not production-ready. Production use requires approved market-data integration, authentication, authorization, audit persistence, approved calculation methodology, approved risk policies, and explicit human deployment authorization.
