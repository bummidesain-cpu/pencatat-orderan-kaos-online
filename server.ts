import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory backend persistence state store initialized from server boot
let serverState: {
  settings: any;
  customers: any[];
  orders: any[];
  expenses: any[];
  priceList: any[];
} = {
  settings: {
    name: 'BUMMI SABLON & KONVEKSI',
    phone: '0812-3456-7890',
    email: 'bummidesain@gmail.com',
    bankName: 'BCA',
    bankAccount: '1234567890',
    bankHolder: 'BUMMI KONVEKSI',
    address: 'Jl. Percetakan Kaos No. 88, Bandung',
  },
  customers: [],
  orders: [],
  expenses: [],
  priceList: [],
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS for local development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: 'MySQL / Node In-Memory Mock', time: new Date().toISOString() });
  });

  // Settings endpoint (supports /api/settings and /api/settings.php)
  const handleSettingsGet = (_req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      database: 'db_order_management',
      settings: serverState.settings,
    });
  };
  const handleSettingsPost = (req: express.Request, res: express.Response) => {
    serverState.settings = { ...serverState.settings, ...req.body };
    res.json({ success: true, message: 'Settings saved', database: 'db_order_management' });
  };
  app.get('/api/settings', handleSettingsGet);
  app.get('/api/settings.php', handleSettingsGet);
  app.post('/api/settings', handleSettingsPost);
  app.post('/api/settings.php', handleSettingsPost);

  // Orders endpoint (supports /api/orders and /api/orders.php)
  const handleOrdersGet = (req: express.Request, res: express.Response) => {
    const { id } = req.query;
    if (id) {
      const order = serverState.orders.find((o) => o.id === id || o.orderNumber === id);
      if (order) {
        return res.json({ success: true, order, database: 'db_order_management' });
      }
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({
      success: true,
      database: 'db_order_management',
      orders: serverState.orders,
      total: serverState.orders.length,
    });
  };
  const handleOrdersPost = (req: express.Request, res: express.Response) => {
    const order = req.body;
    if (Array.isArray(order)) {
      serverState.orders = order;
    } else if (order && (order.id || order.orderNumber)) {
      const idx = serverState.orders.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        serverState.orders[idx] = order;
      } else {
        serverState.orders.unshift(order);
      }
    }
    res.json({
      success: true,
      message: 'Order berhasil disimpan ke database',
      database: 'db_order_management',
      order,
    });
  };
  const handleOrdersDelete = (req: express.Request, res: express.Response) => {
    const { id, action } = req.query;
    if (action === 'delete_all') {
      serverState.orders = [];
      serverState.expenses = [];
      return res.json({ success: true, message: 'Semua order berhasil dihapus' });
    }
    if (id) {
      serverState.orders = serverState.orders.filter((o) => o.id !== id);
      return res.json({ success: true, message: 'Order berhasil dihapus' });
    }
    res.status(400).json({ success: false, error: 'ID order wajib disertakan' });
  };
  app.get('/api/orders', handleOrdersGet);
  app.get('/api/orders.php', handleOrdersGet);
  app.post('/api/orders', handleOrdersPost);
  app.post('/api/orders.php', handleOrdersPost);
  app.delete('/api/orders', handleOrdersDelete);
  app.delete('/api/orders.php', handleOrdersDelete);

  // Customers endpoint
  const handleCustomersGet = (_req: express.Request, res: express.Response) => {
    res.json({ success: true, database: 'db_order_management', customers: serverState.customers });
  };
  const handleCustomersPost = (req: express.Request, res: express.Response) => {
    const cust = req.body;
    if (Array.isArray(cust)) {
      serverState.customers = cust;
    } else if (cust && cust.id) {
      const idx = serverState.customers.findIndex((c) => c.id === cust.id);
      if (idx >= 0) {
        serverState.customers[idx] = cust;
      } else {
        serverState.customers.unshift(cust);
      }
    }
    res.json({ success: true, message: 'Customer saved', database: 'db_order_management' });
  };
  const handleCustomersDelete = (req: express.Request, res: express.Response) => {
    const { id } = req.query;
    if (id) {
      serverState.customers = serverState.customers.filter((c) => c.id !== id);
      return res.json({ success: true, message: 'Customer deleted' });
    }
    res.status(400).json({ success: false, error: 'ID customer required' });
  };
  app.get('/api/customers', handleCustomersGet);
  app.get('/api/customers.php', handleCustomersGet);
  app.post('/api/customers', handleCustomersPost);
  app.post('/api/customers.php', handleCustomersPost);
  app.delete('/api/customers', handleCustomersDelete);
  app.delete('/api/customers.php', handleCustomersDelete);

  // Expenses endpoint
  const handleExpensesGet = (_req: express.Request, res: express.Response) => {
    res.json({ success: true, database: 'db_order_management', expenses: serverState.expenses });
  };
  const handleExpensesPost = (req: express.Request, res: express.Response) => {
    const exp = req.body;
    if (Array.isArray(exp)) {
      serverState.expenses = exp;
    } else if (exp && exp.id) {
      const idx = serverState.expenses.findIndex((e) => e.id === exp.id);
      if (idx >= 0) {
        serverState.expenses[idx] = exp;
      } else {
        serverState.expenses.unshift(exp);
      }
    }
    res.json({ success: true, message: 'Expense saved', database: 'db_order_management' });
  };
  const handleExpensesDelete = (req: express.Request, res: express.Response) => {
    const { id } = req.query;
    if (id) {
      serverState.expenses = serverState.expenses.filter((e) => e.id !== id);
      return res.json({ success: true, message: 'Expense deleted' });
    }
    res.status(400).json({ success: false, error: 'ID expense required' });
  };
  app.get('/api/expenses', handleExpensesGet);
  app.get('/api/expenses.php', handleExpensesGet);
  app.post('/api/expenses', handleExpensesPost);
  app.post('/api/expenses.php', handleExpensesPost);
  app.delete('/api/expenses', handleExpensesDelete);
  app.delete('/api/expenses.php', handleExpensesDelete);

  // Price List endpoint
  const handlePriceListGet = (_req: express.Request, res: express.Response) => {
    res.json({ success: true, database: 'db_order_management', priceList: serverState.priceList });
  };
  const handlePriceListPost = (req: express.Request, res: express.Response) => {
    const data = req.body;
    if (Array.isArray(data.items)) {
      serverState.priceList = data.items;
    } else if (Array.isArray(data)) {
      serverState.priceList = data;
    }
    res.json({ success: true, message: 'Price list saved' });
  };
  app.get('/api/pricelist', handlePriceListGet);
  app.get('/api/pricelist.php', handlePriceListGet);
  app.post('/api/pricelist', handlePriceListPost);
  app.post('/api/pricelist.php', handlePriceListPost);

  // Full state sync API
  const handleStateGet = (_req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      database: 'db_order_management',
      settings: serverState.settings,
      customers: serverState.customers,
      orders: serverState.orders,
      expenses: serverState.expenses,
      priceList: serverState.priceList,
    });
  };
  const handleStatePost = (req: express.Request, res: express.Response) => {
    const { settings, customers, orders, expenses, priceList } = req.body;
    if (settings) serverState.settings = settings;
    if (Array.isArray(customers)) serverState.customers = customers;
    if (Array.isArray(orders)) serverState.orders = orders;
    if (Array.isArray(expenses)) serverState.expenses = expenses;
    if (Array.isArray(priceList)) serverState.priceList = priceList;
    res.json({
      success: true,
      message: 'Semua data berhasil disinkronkan ke server!',
      savedOrdersCount: serverState.orders.length,
    });
  };
  app.get('/api/state', handleStateGet);
  app.get('/api/state.php', handleStateGet);
  app.post('/api/state', handleStatePost);
  app.post('/api/state.php', handleStatePost);

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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
