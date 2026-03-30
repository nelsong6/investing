# investing

Portfolio analysis app at investing.romaine.life. Uses LLMs to analyze investment data from an Ameriprise account.

## Architecture

- **Frontend**: Static HTML/CSS/JS on Azure Static Web App (Free tier)
- **Backend**: Routes package (`@nelsong6/investing-routes`) mounted at `/investing` in the shared API
- **Database**: Cosmos DB `InvestingDB` with `portfolios` container (partition key: `/userId`)
- **Auth**: MSAL.js Microsoft login, JWT via shared API

## Data Ingestion

Portfolio data comes from Ameriprise. Two paths:
- **CSV import** (admin panel): manual export from Ameriprise portal, paste into admin UI
- **Plaid** (future): live connection via Plaid Investments API for auto-refresh

## Public vs Admin Mode

- **Public**: allocation percentages, sector breakdown, symbols, relative performance
- **Admin**: dollar amounts, share counts, cost basis, gain/loss, transaction history, CSV import

## Routes Package (`packages/routes/`)

Published as `@nelsong6/investing-routes` to GitHub Packages. Receives `requireAuth`, `container`, and `jwtSecret` via dependency injection from the shared API.

## Change Log

### 2026-03-29

- Initial scaffold: tofu infrastructure, frontend skeleton, routes package with portfolio CRUD and CSV import
