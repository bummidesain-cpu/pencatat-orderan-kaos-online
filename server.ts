import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory backend persistence state store initialized from server boot
let serverState = {
  settings: null,
  customers: null,
  orders: null,
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Full state sync API
  app.get('/api/state', (_req, res) => {
    res.json(serverState);
  });

  app.post('/api/settings', (req, res) => {
    serverState.settings = req.body;
    res.json({ success: true });
  });

  app.post('/api/customers', (req, res) => {
    serverState.customers = req.body;
    res.json({ success: true });
  });

  app.post('/api/orders', (req, res) => {
    serverState.orders = req.body;
    res.json({ success: true });
  });

  // Public Approval details API endpoint for token lookup
  app.get('/api/approval/:token', (req, res) => {
    const { token } = req.params;
    if (!serverState.orders || !Array.isArray(serverState.orders)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = (serverState.orders as Array<{ designApproval?: { token?: string } }>).find(
      (o) => o.designApproval?.token === token
    );

    if (!order) {
      return res.status(404).json({ error: 'Order approval link is invalid or expired' });
    }

    res.json(order);
  });

  // Vite middleware for dev or static files for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BUMMI SABLON server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
