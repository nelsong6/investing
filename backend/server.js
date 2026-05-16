// Per-app backend for investing.romaine.life. Serves the static frontend,
// the investing routes under /api/*, and the auth.romaine.life delegation
// exchange under /api/auth/* on the same origin.
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { createInvestingRoutes } from './routes.js';
import { createRequireAuth } from './auth.js';
import { createAuthRoutes } from './auth-routes.js';
import { fetchConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const app = express();
const PORT = process.env.PORT || 3000;
let serverReady = false;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Gate all non-health traffic until async startup completes
app.use((req, res, next) => {
  if (serverReady || req.path === '/health') return next();
  res.status(503).json({ error: 'Starting' });
});

app.get('/health', (req, res) => {
  if (!serverReady) return res.status(503).json({ status: 'starting' });
  res.json({ status: 'healthy' });
});

async function start() {
  const config = await fetchConfig();

  const credential = new DefaultAzureCredential();
  const cosmosClient = new CosmosClient({
    endpoint: config.cosmosDbEndpoint,
    aadCredentials: credential,
  });

  const portfoliosContainer = cosmosClient.database('InvestingDB').container('portfolios');

  const requireAuth = createRequireAuth({ jwtSecret: config.jwtSigningSecret });

  // Order matters: API + auth routes must win over static before the SPA
  // fallback swallows anything unmatched.
  app.use(createAuthRoutes({ jwtSecret: config.jwtSigningSecret, requireAuth }));
  app.use(createInvestingRoutes({
    requireAuth,
    container: portfoliosContainer,
    jwtSecret: config.jwtSigningSecret,
  }));
  app.use(express.static(FRONTEND_DIR));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });

  serverReady = true;
  console.log(`[investing] ready on port ${PORT}`);
}

app.listen(PORT, () => {
  start().catch((err) => {
    console.error('[investing] fatal startup error:', err);
    process.exit(1);
  });
});

export default app;
