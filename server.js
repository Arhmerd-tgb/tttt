import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'store.json');
const port = Number(process.env.PORT) || 3001;

const demoUser = {
  id: 'demo-user',
  name: 'Ava Morgan',
  email: 'ava@ashmie.io',
  password: 'demo123',
  plan: 'Growth',
  role: 'Product Lead',
};

const dashboardData = {
  summary: [
    { label: 'Revenue', value: '$82.4k', change: '+21.4%' },
    { label: 'Conversion', value: '6.8%', change: '+1.3%' },
    { label: 'Activation', value: '74%', change: '+8.2%' },
  ],
  pipeline: [
    { name: 'Product design', progress: 84, owner: 'Ava' },
    { name: 'Marketing launch', progress: 67, owner: 'Leo' },
    { name: 'Customer onboarding', progress: 91, owner: 'Mina' },
  ],
  tasks: ['Finalize launch plan', 'Review conversion funnel', 'Ship weekly product update'],
};

const pricingData = {
  plans: [
    {
      name: 'Starter',
      price: '$29',
      description: 'For early teams validating the product direction.',
      features: ['Up to 3 active projects', 'Basic analytics', 'Email support'],
      highlight: false,
    },
    {
      name: 'Growth',
      price: '$79',
      description: 'For teams scaling fast with product and marketing momentum.',
      features: ['Unlimited projects', 'Advanced reporting', 'Priority support'],
      highlight: true,
    },
    {
      name: 'Scale',
      price: '$149',
      description: 'For mature operations that need deeper insights and automation.',
      features: ['Custom workflows', 'Team permissions', 'Executive reporting'],
      highlight: false,
    },
  ],
};

const seedStore = {
  users: [demoUser],
  projects: [
    { id: 'proj-1', name: 'Northstar launch', description: 'Launch positioning refresh', owner: 'demo-user', status: 'In review', progress: 82, due: 'Today' },
    { id: 'proj-2', name: 'Growth experiments', description: 'Acquire and iterate', owner: 'demo-user', status: 'Planning', progress: 64, due: 'Thu' },
    { id: 'proj-3', name: 'Customer onboarding', description: 'Better activation flow', owner: 'demo-user', status: 'On track', progress: 91, due: 'Fri' },
  ],
};

function normalizeStore(store = {}) {
  return {
    users: Array.isArray(store.users) ? store.users : [],
    projects: Array.isArray(store.projects) ? store.projects : [],
  };
}

function ensureDataStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seedStore, null, 2));
  }
}

function readDataStore() {
  ensureDataStore();

  try {
    const raw = fs.readFileSync(dataFile, 'utf8').trim();
    if (!raw) {
      throw new Error('Store file is empty.');
    }

    const parsed = JSON.parse(raw);
    const normalized = normalizeStore(parsed);

    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.projects)) {
      writeDataStore(normalized);
    }

    return normalized;
  } catch (error) {
    console.warn('Data store is invalid or unreadable. Resetting to the default seed data.', error.message);
    writeDataStore(seedStore);
    return JSON.parse(JSON.stringify(seedStore));
  }
}

function writeDataStore(store) {
  ensureDataStore();
  const normalizedStore = normalizeStore(store);
  fs.writeFileSync(dataFile, JSON.stringify(normalizedStore, null, 2));
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || 'Starter',
    role: user.role || 'Team member',
  };
}

function createToken(user) {
  return `token_${user.id}_${Date.now()}`;
}

function resolveUserFromToken(token) {
  if (!token || !token.startsWith('token_')) return null;
  const id = token.split('_')[1];
  const store = readDataStore();
  return store.users.find((user) => user.id === id) || null;
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'Ashmie',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/features', (_req, res) => {
    res.json({
      features: [
        {
          title: 'Strategy-first product design',
          description: 'Turn ideas into high-conversion experiences.',
        },
        {
          title: 'Fast build system',
          description: 'Ship updates quickly with Vite and a clean architecture.',
        },
        {
          title: 'API-ready foundation',
          description: 'Connect your frontend to real services when you are ready.',
        },
      ],
    });
  });

  app.get('/api/session', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = resolveUserFromToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    return res.json({ token, user: toPublicUser(user) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !String(password).trim()) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const store = readDataStore();
    const user = store.users.find(
      (entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === String(password)
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.json({ token: createToken(user), user: toPublicUser(user) });
  });

  app.post('/api/auth/signup', (req, res) => {
    const { name = '', email = '', password = '' } = req.body || {};
    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password).trim();

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const store = readDataStore();
    const existingUser = store.users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const user = {
      id: `user-${Date.now()}`,
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      plan: 'Starter',
      role: 'Team member',
    };

    store.users.push(user);
    writeDataStore(store);

    return res.json({ token: createToken(user), user: toPublicUser(user) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true, message: 'Signed out successfully.' });
  });

  app.get('/api/dashboard', (_req, res) => {
    res.json(dashboardData);
  });

  app.get('/api/pricing', (_req, res) => {
    res.json(pricingData);
  });

  app.get('/api/workspace', (_req, res) => {
    const { projects = [] } = readDataStore();
    res.json({
      stats: [
        { label: 'Active projects', value: String(projects.length), change: '+2 this week' },
        { label: 'Team velocity', value: '92%', change: '+8.2%' },
        { label: 'Launch health', value: 'A', change: 'Stable' },
      ],
      projects: projects.slice(0, 3).map((project) => ({
        name: project.name,
        status: project.status || 'Ready',
        owner: project.owner || 'Team',
        progress: project.progress || 50,
        due: project.due || 'This week',
      })),
      activity: [
        { title: 'Design system approved', meta: 'Marketing team · 18 min ago' },
        { title: 'New onboarding flow published', meta: 'Product team · 1 hour ago' },
        { title: 'Launch checklist sent to stakeholders', meta: 'Ops team · 2 hours ago' },
      ],
    });
  });

  app.get('/api/projects', (_req, res) => {
    const { projects = [] } = readDataStore();
    res.json({ projects });
  });

  app.post('/api/projects', (req, res) => {
    const { name = '', description = '' } = req.body || {};
    if (!String(name).trim()) {
      return res.status(400).json({ message: 'Project name is required.' });
    }

    const store = readDataStore();
    const project = {
      id: `project-${Date.now()}`,
      name: String(name).trim(),
      description: String(description).trim(),
      owner: 'demo-user',
      status: 'New',
      progress: 25,
      due: 'This week',
    };

    store.projects.unshift(project);
    writeDataStore(store);

    return res.json({ project });
  });

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('*', (_req, res) => {
      res.send(`
        <html>
          <head><title>Ashmie</title></head>
          <body>
            <h1>Ashmie API is running</h1>
            <p>Build the frontend with npm run build to serve the app.</p>
          </body>
        </html>
      `);
    });
  }

  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  app.use((error, _req, res, _next) => {
    console.error('Unhandled application error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  });

  return app;
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  const app = createApp();
  app.listen(port, () => {
    console.log(`Ashmie API listening on http://localhost:${port}`);
  });
}
