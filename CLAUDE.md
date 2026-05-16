# investing

Portfolio analysis app at investing.romaine.life. Uses LLMs to analyze investment data from an Ameriprise account.

## Container Build Verification

Agent pods are not expected to have Docker. Do not report missing local Docker
as a blocker. Run available repo checks first, then use PR CI as the normal
container build gate: `.github/workflows/docker-build-check.yml` performs a
throwaway Docker build with `push: false`. If image-packaging feedback is
needed before a PR is ready, manually dispatch that workflow with `git_ref`.
Release/deploy workflows are the only path that publishes images.

## Architecture

- **Frontend**: Static HTML/CSS/JS served by the backend container
- **Backend**: Express server on AKS, routes mounted at `/api/*` in `backend/routes.js`
- **Database**: Cosmos DB `InvestingDB` with `portfolios` container (partition key: `/userId`)
- **Auth**: sessions delegated to **auth.romaine.life**. The `.romaine.life` session cookie auto-attaches on every request; backend forwards it to `auth.romaine.life/api/auth/get-session` and gates on the role claim (cached 60s). No per-app JWT minting, no localStorage tokens.

## Data Ingestion

Portfolio data comes from Ameriprise. Two paths:
- **CSV import** (admin panel): manual export from Ameriprise portal, paste into admin UI
- **Plaid** (future): live connection via Plaid Investments API for auto-refresh

## Public vs Admin Mode

- **Public**: allocation percentages, sector breakdown, symbols, relative performance
- **Admin**: dollar amounts, share counts, cost basis, gain/loss, transaction history, CSV import

## Routes (`backend/routes.js`)

`createInvestingRoutes({ requireAuth, container })` returns an Express Router wired under `/api/*`. Kept as a factory (rather than a top-level module) so the DB container and auth middleware remain injectable and testable.

## Change Log

### 2026-03-29

- Initial scaffold: tofu infrastructure, frontend skeleton, routes package with portfolio CRUD and CSV import
