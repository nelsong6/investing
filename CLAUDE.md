# investing

Portfolio analysis app at investing.romaine.life. Uses LLMs to analyze investment data from an Ameriprise account.

## Architecture

- **Frontend**: Static HTML/CSS/JS served by the backend container
- **Backend**: Express server on AKS, routes mounted at `/api/*` in `backend/routes.js`
- **Database**: Cosmos DB `InvestingDB` with `portfolios` container (partition key: `/userId`)
- **Auth**: MSAL.js Microsoft login, JWT minted by this app's own `microsoft-routes.js`

## Data Ingestion

Portfolio data comes from Ameriprise. Two paths:
- **CSV import** (admin panel): manual export from Ameriprise portal, paste into admin UI
- **Plaid** (future): live connection via Plaid Investments API for auto-refresh

## Public vs Admin Mode

- **Public**: allocation percentages, sector breakdown, symbols, relative performance
- **Admin**: dollar amounts, share counts, cost basis, gain/loss, transaction history, CSV import

## Routes (`backend/routes.js`)

`createInvestingRoutes({ requireAuth, container, jwtSecret })` returns an Express Router wired under `/api/*`. Kept as a factory (rather than a top-level module) so the DB container, auth middleware, and JWT secret remain injectable and testable.

## Change Log

### 2026-03-29

- Initial scaffold: tofu infrastructure, frontend skeleton, routes package with portfolio CRUD and CSV import
