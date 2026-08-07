# GitHub and Vercel Setup

These instructions create the repository, connect it to Vercel, and deploy the current internal scaffold. Do not use production client data or production market-data credentials during this setup.

## 1. Create the GitHub Repository

1. Sign in to GitHub.
2. Create a new private repository named `larson-box-spread-platform`.
3. Do not initialize it with a README, license, or `.gitignore`; this workspace already includes those files.
4. On your local machine or cloud workspace, run:

```bash
git init
git add .
git commit -m "Initial Larson box spread platform scaffold"
git branch -M main
git remote add origin git@github.com:YOUR_ORG_OR_USER/larson-box-spread-platform.git
git push -u origin main
```

If you use HTTPS instead of SSH, replace the remote URL with the HTTPS URL GitHub gives you.

## 2. Confirm Local Verification

Run:

```bash
npm install
npm run verify
```

`npm run verify` performs type checking, unit tests, and a production Next.js build.

## 3. Create the Vercel Project

1. Sign in to Vercel.
2. Select `Add New...` then `Project`.
3. Import the GitHub repository.
4. Use these settings:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Output Directory | `.next` |
| Node.js Version | 22.x or current Vercel default compatible with Next 15 |

5. Add environment variables:

| Variable | Development | Preview | Production |
|---|---|---|---|
| `LARSON_APP_ENV` | `development` | `preview` | `production` |

Do not add market-data credentials until Larson approves the provider and access model.

## 4. Deploy Preview

1. Click `Deploy`.
2. Wait for the build to complete.
3. Open the preview URL and run a calculation with test values.
4. Confirm the dashboard shows candidate structures, selected candidate economics, and the four-leg package.

## 5. Protect Production

Before production activation:

1. In GitHub, require pull requests for `main`.
2. Require status checks for type check, tests, and build.
3. Require at least one reviewer for financially material calculation changes.
4. In Vercel, keep production deployment tied to protected `main`.
5. Do not connect live market data or client data until authentication, authorization, audit persistence, and provider licensing are complete.

## 6. Recommended GitHub Actions Workflow

Create `.github/workflows/ci.yml` after the repository is initialized:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run verify
```

## 7. Production Readiness Checklist

- Approved market-data provider selected and licensed.
- Server-side provider adapter implemented.
- Authentication and advisor authorization implemented.
- Audit database selected and connected.
- Calculation methodology approved and versioned.
- Workbook-derived golden tests expanded.
- Risk, eligibility, and disclosure policies approved and configuration-driven.
- Human approval received for production deployment.
