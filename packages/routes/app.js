import { Router } from 'express';

/**
 * @param {{
 *   requireAuth: Function,
 *   container: import('@azure/cosmos').Container,
 *   jwtSecret: string,
 * }} opts
 */
export function createInvestingRoutes({ requireAuth, container, jwtSecret }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // GET /api/portfolio — public-safe fields (allocation %, sector, symbol)
  router.get('/api/portfolio', requireAuth, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.type = @type AND c.userId = @userId',
        parameters: [
          { name: '@type', value: 'portfolio' },
          { name: '@userId', value: userId },
        ],
      }).fetchAll();

      if (resources.length === 0) {
        return res.json({ holdings: [], updatedAt: null });
      }

      const portfolio = resources[0];
      const isAdmin = req.user.role === 'admin';

      const holdings = (portfolio.holdings || []).map(h => {
        const public_ = {
          symbol: h.symbol,
          name: h.name,
          allocationPct: h.allocationPct,
          sector: h.sector,
        };

        if (isAdmin) {
          public_.shares = h.shares;
          public_.costBasis = h.costBasis;
          public_.marketValue = h.marketValue;
          public_.gainLoss = h.gainLoss;
        }

        return public_;
      });

      res.json({ holdings, updatedAt: portfolio.updatedAt });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
  });

  // POST /api/portfolio/import — admin only, CSV import
  router.post('/api/portfolio/import', requireAuth, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const userId = req.user.sub;
      const { csv } = req.body;

      if (!csv || typeof csv !== 'string') {
        return res.status(400).json({ error: 'csv string required' });
      }

      const holdings = parseCsv(csv);

      const portfolioDoc = {
        id: `portfolio_${userId}`,
        userId,
        type: 'portfolio',
        holdings,
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await container.items.upsert(portfolioDoc);
      res.json({ holdings: resource.holdings, updatedAt: resource.updatedAt });
    } catch (error) {
      console.error('Error importing portfolio:', error);
      res.status(500).json({ error: 'Failed to import portfolio' });
    }
  });

  return router;
}

function parseCsv(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });

    return {
      symbol: row.symbol || '',
      name: row.name || row.description || '',
      shares: parseFloat(row.shares || row.quantity || '0'),
      costBasis: parseFloat(row['cost basis'] || row.costbasis || '0'),
      marketValue: parseFloat(row['market value'] || row.marketvalue || '0'),
      gainLoss: parseFloat(row['gain/loss'] || row.gainloss || '0'),
      allocationPct: parseFloat(row['allocation %'] || row.allocation || '0'),
      sector: row.sector || '',
    };
  }).filter(h => h.symbol);
}
