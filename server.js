import express from 'express';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'store.json');
const port = Number(process.env.PORT) || 3001;
const sessions = new Map();
const defaultAdminSignupCodeHash = createHash('sha256').update('RAJI').digest('hex');
const defaultAdminCredentials = {
  email: 'admin@ashmie.io',
  password: 'admin12345',
  name: 'Ashmie Administrator',
};

function hashAdminSignupCode(code) {
  return createHash('sha256').update(String(code)).digest('hex');
}

function hashPassword(password) {
  return createHash('sha256').update(String(password)).digest('hex');
}

function isValidAdminSignupCode(code, storedHash) {
  const expected = Buffer.from(storedHash, 'hex');
  const provided = Buffer.from(hashAdminSignupCode(code), 'hex');
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;
  const value = String(storedPassword);
  if (value.length === 64 && /^[a-f0-9]+$/i.test(value)) {
    const expected = Buffer.from(value, 'hex');
    const provided = Buffer.from(hashPassword(password), 'hex');
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  }
  return value === String(password);
}

const defaultPaymentDetails = {
  bankName: 'Add your bank name in Admin settings',
  accountName: 'ASHMIE CAKES & MORE',
  accountNumber: 'Add account number in Admin settings',
  instructions: 'Use your order number as the transfer reference, then confirm your payment below.',
  deliveryFee: 2500,
};

const demoUser = {
  id: 'demo-user',
  name: 'Ava Morgan',
  email: 'ava@ashmie.io',
  password: hashPassword('demo123'),
  plan: 'Growth',
  role: 'Product Lead',
};

const bakerySite = {
  name: 'ASHMIE CAKES & MORE',
  tagline: 'Cakes, pastries & treats for every celebration.',
  description: 'Ashmie Cakes & More creates delightful cakes, pastries and snacks for birthdays, events and everyday treats across Nigeria.',
  phone: '+234 806 577 0291',
  email: 'ashmiecakesinfo@gmail.com',
  whatsapp: '+234 806 577 0291',
  address: 'Hotoro Behind Chula Fueling Station',
};

const bakeryCategories = [
  { id: 'cakes', name: 'Cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80' },
  { id: 'cupcakes', name: 'Cupcakes', image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80' },
  { id: 'pastries', name: 'Pastries', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80' },
  { id: 'small-chops', name: 'Small Chops', image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80' },
  { id: 'snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80' },
  { id: 'desserts', name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80' },
];

const bakeryProducts = [
  { id: 'strawberry-royale', name: 'Strawberry Royale Cake', category: 'cakes', price: 18000, featured: true, image: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=80', description: 'Soft vanilla sponge layered with fresh strawberry cream.' },
  { id: 'choco-crumb', name: 'Choco Crumb Delight', category: 'cakes', price: 22000, featured: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80', description: 'Rich chocolate layers finished with glossy ganache.' },
  { id: 'mini-cupcake-box', name: 'Mini Cupcake Box', category: 'cupcakes', price: 9500, featured: false, image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80', description: 'Assorted pastel cupcakes for parties and gifting.' },
  { id: 'beef-rolls', name: 'Beef Rolls', category: 'pastries', price: 7000, featured: false, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', description: 'Flaky pastry rolls filled with spiced beef.' },
  { id: 'small-chops-mix', name: 'Small Chops Mix', category: 'small-chops', price: 16000, featured: true, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80', description: 'Signature party platter with puff, samosa and chicken bites.' },
  { id: 'plantain-chips', name: 'Crunchy Plantain Chips', category: 'snacks', price: 4500, featured: false, image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80', description: 'Crispy, lightly seasoned and perfect for gifting.' },
  { id: 'fruit-salad-cup', name: 'Fruit Salad Cups', category: 'desserts', price: 6000, featured: false, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80', description: 'Fresh fruit dessert cups full of colour and taste.' },
  { id: 'birthday-bundle', name: 'Birthday Celebration Pack', category: 'cakes', price: 26000, featured: true, image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80', description: 'Festive celebration cake with custom finishing.' },
];

const bakeryTraining = [
  { id: 'cake-basic', title: 'Cake Making Fundamentals', duration: '2 Weeks', fee: 35000, seats: 18, date: '2026-10-12', location: 'Hotoro Behind Chula Fueling Station', status: 'Open', topics: ['Cake mixing', 'Batter science', 'Basic decoration'] },
  { id: 'decor-masterclass', title: 'Advanced Decoration Masterclass', duration: '3 Weeks', fee: 48000, seats: 12, date: '2026-10-20', location: 'Hotoro Behind Chula Fueling Station', status: 'Open', topics: ['Buttercream art', 'Fondant detailing', 'Event styling'] },
  { id: 'snack-production', title: 'Snacks & Pastry Production', duration: '4 Weeks', fee: 55000, seats: 10, date: '2026-11-02', location: 'Hotoro Behind Chula Fueling Station', status: 'Open', topics: ['Small chops production', 'Pastry folding', 'Packaging'] },
];

const galleryItems = [
  { title: 'Wedding Cakes', image: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=80' },
  { title: 'Custom Cupcakes', image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80' },
  { title: 'Pastry Box', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80' },
  { title: 'Party Snacks', image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80' },
];

const dashboardData = {
  summary: [
    { label: 'Today sales', value: '₦184,500', change: '+18.4%' },
    { label: 'Orders', value: '126', change: '+12.8%' },
    { label: 'Training seats', value: '42', change: '+9%' },
  ],
  pipeline: [
    { name: 'Wedding cake orders', progress: 88, owner: 'Kitchen team' },
    { name: 'Bread & pastry prep', progress: 71, owner: 'Bakery team' },
    { name: 'Training registration', progress: 64, owner: 'Growth team' },
  ],
  tasks: ['Confirm delivery schedule', 'Review weekend mixer stock', 'Approve training applicants'],
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
  products: bakeryProducts,
  trainings: bakeryTraining,
  trainingPortalOpen: true,
  trainingEnrollments: [],
  paymentDetails: defaultPaymentDetails,
  orders: [],
  reviews: [],
  chatMessages: [],
  adminSignupCodeHash: defaultAdminSignupCodeHash,
  projects: [
    { id: 'proj-1', name: 'Northstar launch', description: 'Launch positioning refresh', owner: 'demo-user', status: 'In review', progress: 82, due: 'Today' },
    { id: 'proj-2', name: 'Growth experiments', description: 'Acquire and iterate', owner: 'demo-user', status: 'Planning', progress: 64, due: 'Thu' },
    { id: 'proj-3', name: 'Customer onboarding', description: 'Better activation flow', owner: 'demo-user', status: 'On track', progress: 91, due: 'Fri' },
  ],
};

function normalizeStore(store = {}) {
  const normalizedUsers = Array.isArray(store.users) ? store.users : [];
  const defaultAdminUser = {
    id: 'admin-bootstrap',
    name: defaultAdminCredentials.name,
    email: defaultAdminCredentials.email,
    password: hashPassword(defaultAdminCredentials.password),
    role: 'admin',
  };

  const users = normalizedUsers.some((user) => user.email?.toLowerCase() === defaultAdminCredentials.email)
    ? normalizedUsers
    : [defaultAdminUser, ...normalizedUsers];

  return {
    users,
    projects: Array.isArray(store.projects) ? store.projects : [],
    products: Array.isArray(store.products) ? store.products : bakeryProducts,
    trainings: Array.isArray(store.trainings) ? store.trainings : bakeryTraining,
    trainingPortalOpen: typeof store.trainingPortalOpen === 'boolean' ? store.trainingPortalOpen : true,
    trainingEnrollments: Array.isArray(store.trainingEnrollments) ? store.trainingEnrollments : [],
    paymentDetails: { ...defaultPaymentDetails, ...(store.paymentDetails || {}) },
    orders: Array.isArray(store.orders) ? store.orders : [],
    reviews: Array.isArray(store.reviews) ? store.reviews : [],
    chatMessages: Array.isArray(store.chatMessages) ? store.chatMessages : [],
    adminSignupCodeHash: typeof store.adminSignupCodeHash === 'string' && store.adminSignupCodeHash.length === 64
      ? store.adminSignupCodeHash
      : defaultAdminSignupCodeHash,
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

    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.projects) || !Array.isArray(parsed.products) || !Array.isArray(parsed.trainings) || typeof parsed.trainingPortalOpen !== 'boolean' || !Array.isArray(parsed.trainingEnrollments)) {
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
    role: user.role || 'customer',
  };
}

function createToken(user) {
  const token = randomUUID();
  sessions.set(token, user.id);
  return token;
}

function resolveUserFromToken(token) {
  if (!token) return null;
  const id = sessions.get(token);
  if (!id) return null;
  const store = readDataStore();
  return store.users.find((user) => user.id === id) || null;
}

function requireUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = resolveUserFromToken(token);

  if (!user) return res.status(401).json({ message: 'Authentication required.' });
  req.user = user;
  req.token = token;
  return next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  return next();
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use('/api/paystack/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '8mb' }));

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
          title: 'Bespoke celebration cakes',
          description: 'Custom cakes for birthdays, weddings and corporate events.',
        },
        {
          title: 'Fresh pastry and snack packs',
          description: 'Perfect for gifting, events and daily family treats.',
        },
        {
          title: 'Hands-on baking training',
          description: 'Practical training for aspiring bakers and food entrepreneurs.',
        },
      ],
    });
  });

  app.get('/api/site', (_req, res) => {
    const store = readDataStore();
    res.json({
      site: bakerySite,
      categories: bakeryCategories,
      products: store.products,
      trainings: store.trainings,
      trainingPortalOpen: store.trainingPortalOpen,
      gallery: galleryItems,
    });
  });

  app.get('/api/categories', (_req, res) => {
    res.json({ categories: bakeryCategories });
  });

  app.get('/api/products', (_req, res) => {
    const { products } = readDataStore();
    res.json({ products });
  });

  app.post('/api/admin/products', requireUser, requireAdmin, (req, res) => {
    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || '').trim();
    const description = String(req.body?.description || '').trim();
    const price = Number(req.body?.price);
    const image = String(req.body?.image || '').trim();
    if (!name || !category || !description || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Enter a name, category, description, and positive price.' });
    }
    const product = {
      id: `product-${randomUUID()}`,
      name,
      category,
      description,
      price,
      image: image || bakeryProducts[0].image,
      featured: false,
    };
    const store = readDataStore();
    store.products.unshift(product);
    writeDataStore(store);
    return res.status(201).json({ product });
  });

  app.patch('/api/admin/products/:productId', requireUser, requireAdmin, (req, res) => {
    const store = readDataStore();
    const product = store.products.find((entry) => entry.id === req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const name = String(req.body?.name ?? product.name).trim();
    const category = String(req.body?.category ?? product.category).trim();
    const description = String(req.body?.description ?? product.description).trim();
    const price = Number(req.body?.price ?? product.price);
    const image = String(req.body?.image ?? product.image).trim();
    if (!name || !category || !description || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Enter a name, category, description, and positive price.' });
    }
    Object.assign(product, { name, category, description, price, image });
    writeDataStore(store);
    return res.json({ product });
  });

  app.delete('/api/admin/products/:productId', requireUser, requireAdmin, (req, res) => {
    const store = readDataStore();
    const productIndex = store.products.findIndex((entry) => entry.id === req.params.productId);
    if (productIndex === -1) return res.status(404).json({ message: 'Product not found.' });
    const [product] = store.products.splice(productIndex, 1);
    writeDataStore(store);
    return res.json({ productId: product.id, deleted: true });
  });

  app.get('/api/reviews', (req, res) => {
    const { reviews = [] } = readDataStore();
    const productId = String(req.query.productId || '').trim();
    const matchingReviews = reviews
      .filter((review) => !productId || review.productId === productId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    res.json({ reviews: matchingReviews.map((review) => {
      const publicReview = { ...review };
      delete publicReview.userId;
      return publicReview;
    }) });
  });

  app.get('/api/chat/messages', requireUser, (req, res) => {
    let conversationId = req.user.id;
    if (req.user.role === 'admin') {
      conversationId = String(req.query.conversationId || '').trim();
      const customer = readDataStore().users.find((user) => user.id === conversationId && user.role !== 'admin');
      if (!customer) return res.status(404).json({ message: 'Customer conversation not found.' });
    }

    const store = readDataStore();
    const messages = store.chatMessages.filter((message) => message.conversationId === conversationId);
    if (req.user.role === 'admin') {
      let changed = false;
      for (const message of messages) {
        if (message.senderRole !== 'admin' && !message.readByAdmin) {
          message.readByAdmin = true;
          changed = true;
        }
      }
      if (changed) writeDataStore(store);
    }
    return res.json({
      conversationId,
      messages,
    });
  });

  app.get('/api/admin/chat/conversations', requireUser, requireAdmin, (_req, res) => {
    const { chatMessages = [], users = [] } = readDataStore();
    const customers = new Map(users.filter((user) => user.role !== 'admin').map((user) => [user.id, user]));
    const latestByConversation = new Map();
    for (const message of chatMessages) {
      const previous = latestByConversation.get(message.conversationId);
      if (!previous || previous.createdAt < message.createdAt) latestByConversation.set(message.conversationId, message);
    }

    const conversations = [...latestByConversation.entries()]
      .map(([conversationId, latestMessage]) => {
        const customer = customers.get(conversationId);
        if (!customer) return null;
        return {
          conversationId,
          customerName: customer.name,
          customerEmail: customer.email,
          latestMessage: latestMessage.body,
          updatedAt: latestMessage.createdAt,
          unreadCount: chatMessages.filter((message) => message.conversationId === conversationId && message.senderRole !== 'admin' && !message.readByAdmin).length,
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return res.json({ conversations });
  });

  app.post('/api/chat/messages', requireUser, (req, res) => {
    const body = String(req.body?.body || '').trim();
    let attachment = null;
    if (req.body?.attachment !== undefined) {
      const submitted = req.body.attachment;
      const dataUrlMatch = typeof submitted?.dataUrl === 'string'
        ? /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(submitted.dataUrl)
        : null;
      if (!dataUrlMatch || submitted.mimeType !== dataUrlMatch[1]) {
        return res.status(400).json({ message: 'Attach a PNG, JPEG, WebP, or PDF receipt.' });
      }

      const bytes = Buffer.from(dataUrlMatch[2], 'base64');
      const signatureMatches = {
        'application/pdf': bytes.subarray(0, 5).toString('ascii') === '%PDF-',
        'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
        'image/png': bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        'image/webp': bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
      }[dataUrlMatch[1]];
      if (!bytes.length || bytes.length > 5 * 1024 * 1024 || bytes.toString('base64') !== dataUrlMatch[2] || !signatureMatches) {
        return res.status(400).json({ message: 'The receipt file is invalid or larger than 5 MB.' });
      }

      const name = [...String(submitted.name || 'receipt')]
        .map((character) => {
          const code = character.charCodeAt(0);
          return character === '\\' || character === '/' || code < 0x20 || code === 0x7f ? '_' : character;
        })
        .join('')
        .slice(0, 120);
      attachment = { name, mimeType: dataUrlMatch[1], dataUrl: submitted.dataUrl, size: bytes.length };
    }
    if (body.length > 2000 || (!body && !attachment)) {
      return res.status(400).json({ message: 'Add a message (up to 2000 characters) or attach a receipt.' });
    }

    let conversationId = req.user.id;
    if (req.user.role === 'admin') {
      conversationId = String(req.body?.conversationId || '').trim();
      const customer = readDataStore().users.find((user) => user.id === conversationId && user.role !== 'admin');
      if (!customer) return res.status(404).json({ message: 'Customer conversation not found.' });
    }

    const store = readDataStore();
    const message = {
      id: `message-${randomUUID()}`,
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role === 'admin' ? 'admin' : 'customer',
      senderName: req.user.name,
      body,
      attachment,
      createdAt: new Date().toISOString(),
      readByAdmin: req.user.role === 'admin',
    };
    store.chatMessages.push(message);
    writeDataStore(store);
    return res.status(201).json({ message });
  });

  app.post('/api/reviews', requireUser, (req, res) => {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Administrator accounts cannot post customer reviews.' });
    }

    const productId = String(req.body?.productId || '').trim();
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();
    const store = readDataStore();
    if (!store.products.some((product) => product.id === productId)) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Choose a rating from 1 to 5.' });
    }
    if (comment.length < 3 || comment.length > 1000) {
      return res.status(400).json({ message: 'Review must be between 3 and 1000 characters.' });
    }

    const existingReview = store.reviews.find((review) => review.productId === productId && review.userId === req.user.id);
    const review = {
      id: existingReview?.id || `review-${randomUUID()}`,
      productId,
      userId: req.user.id,
      author: req.user.name,
      rating,
      comment,
      createdAt: existingReview?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingReview) {
      Object.assign(existingReview, review);
    } else {
      store.reviews.push(review);
    }
    writeDataStore(store);
    return res.status(existingReview ? 200 : 201).json({ review });
  });

  app.get('/api/training', (_req, res) => {
    const { trainings, trainingPortalOpen } = readDataStore();
    res.json({ trainings, trainingPortalOpen });
  });

  app.get('/api/training/enrollments', requireUser, (req, res) => {
    const { trainingEnrollments = [] } = readDataStore();
    res.json({ enrollments: trainingEnrollments.filter((entry) => entry.userId === req.user.id) });
  });

  app.post('/api/training/enroll', requireUser, (req, res) => {
    if (req.user.role === 'admin') return res.status(403).json({ message: 'Admin accounts cannot enroll as students.' });
    const trainingId = String(req.body?.trainingId || '').trim();
    const store = readDataStore();
    if (!store.trainingPortalOpen) return res.status(403).json({ message: 'Training registration is currently closed.' });
    const training = store.trainings.find((entry) => entry.id === trainingId);
    if (!training) return res.status(404).json({ message: 'Training course not found.' });
    const existing = store.trainingEnrollments.find((entry) => entry.trainingId === trainingId && entry.userId === req.user.id);
    if (existing) return res.status(409).json({ message: 'You are already enrolled in this course.' });

    const enrollment = {
      id: `enrollment-${randomUUID()}`,
      trainingId,
      title: training.title,
      fee: training.fee,
      userId: req.user.id,
      email: req.user.email,
      student: req.user.name,
      date: training.date,
      status: 'Booked',
      createdAt: new Date().toISOString(),
    };
    store.trainingEnrollments.push(enrollment);
    writeDataStore(store);
    return res.status(201).json({ enrollment });
  });

  app.get('/api/admin/overview', requireUser, requireAdmin, (_req, res) => {
    const { orders = [], reviews = [], users = [], products = [], trainings = [], trainingPortalOpen = true } = readDataStore();
    const today = new Date().toISOString().slice(0, 10);
    const todaysOrders = orders.filter((order) => String(order.createdAt || '').startsWith(today));
    const paidOrders = orders.filter((order) => order.paymentStatus === 'success');
    const revenue = paidOrders.reduce((total, order) => total + Number(order.total || 0), 0);
    const customerCount = users.filter((user) => ['customer', 'student'].includes(user.role)).length;
    const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
    res.json({
      stats: [
        { label: 'Paid revenue', value: currency.format(revenue), change: `${paidOrders.length} paid orders` },
        { label: 'Total orders', value: String(orders.length), change: `${todaysOrders.length} placed today` },
        { label: 'Customer accounts', value: String(customerCount), change: 'Registered customers' },
        { label: 'Product reviews', value: String(reviews.length), change: 'Customer-submitted' },
      ],
      recentOrders: orders.slice(-5).reverse().map((order) => ({
        id: order.id,
        customer: order.customer,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
      })),
      recentReviews: reviews.slice(-5).reverse(),
      products,
      trainings,
      trainingPortalOpen,
    });
  });

  app.put('/api/admin/training-settings', requireUser, requireAdmin, (req, res) => {
    const { isOpen, fees, courseDetails = {} } = req.body || {};
    if (typeof isOpen !== 'boolean' || !fees || typeof fees !== 'object' || Array.isArray(fees)) {
      return res.status(400).json({ message: 'Provide the portal status and course fees.' });
    }
    if (!courseDetails || typeof courseDetails !== 'object' || Array.isArray(courseDetails)) {
      return res.status(400).json({ message: 'Provide valid training course details.' });
    }
    const store = readDataStore();
    for (const training of store.trainings) {
      if (fees[training.id] === undefined) continue;
      const fee = Number(fees[training.id]);
      if (!Number.isFinite(fee) || fee <= 0) {
        return res.status(400).json({ message: `Enter a positive fee for ${training.title}.` });
      }
      training.fee = fee;
    }
    for (const training of store.trainings) {
      const details = courseDetails[training.id];
      if (!details) continue;
      const location = String(details.location ?? training.location).trim();
      const duration = String(details.duration ?? training.duration).trim();
      const date = String(details.date ?? training.date).trim();
      const parsedDate = new Date(`${date}T00:00:00.000Z`);
      if (!location || location.length > 200 || !duration || duration.length > 80
        || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
        return res.status(400).json({ message: `Enter a valid location, starting date, and duration for ${training.title}.` });
      }
      const dateChanged = training.date !== date;
      Object.assign(training, { location, duration, date });
      if (dateChanged) {
        for (const enrollment of store.trainingEnrollments) {
          if (enrollment.trainingId === training.id) enrollment.date = date;
        }
      }
    }
    store.trainingPortalOpen = isOpen;
    writeDataStore(store);
    return res.json({ trainingPortalOpen: store.trainingPortalOpen, trainings: store.trainings });
  });

  app.patch('/api/admin/orders/:orderId/status', requireUser, requireAdmin, (req, res) => {
    const transitions = {
      'Awaiting approval': ['Approved', 'Rejected'],
      Paid: ['Approved', 'Rejected'],
      Approved: ['Processing', 'Rejected'],
      Processing: ['Completed'],
    };
    const nextStatus = String(req.body?.status || '').trim();
    const store = readDataStore();
    const order = store.orders.find((entry) => entry.id === req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.paymentStatus !== 'success') {
      return res.status(409).json({ message: 'Only paid orders can be processed.' });
    }
    if (!transitions[order.status]?.includes(nextStatus)) {
      return res.status(409).json({ message: `Cannot move this order from ${order.status} to ${nextStatus}.` });
    }

    order.status = nextStatus;
    order.statusUpdatedAt = new Date().toISOString();
    writeDataStore(store);
    return res.json({ order: { id: order.id, status: order.status } });
  });

  app.get('/api/payment-details', (_req, res) => {
    const { paymentDetails } = readDataStore();
    res.json({ paymentDetails });
  });

  app.put('/api/admin/admin-signup-code', requireUser, requireAdmin, (req, res) => {
    const code = String(req.body?.code || '').trim();
    if (code.length < 4 || code.length > 64) {
      return res.status(400).json({ message: 'Admin signup code must be between 4 and 64 characters.' });
    }
    const store = readDataStore();
    store.adminSignupCodeHash = hashAdminSignupCode(code);
    writeDataStore(store);
    return res.json({ ok: true });
  });

  app.post('/api/payments/initialize', async (req, res) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    const { customer = {}, items = [], deliveryMethod = 'delivery', deliveryAddress = '' } = req.body || {};
    const customerName = String(customer.name || '').trim();
    const customerEmail = String(customer.email || '').trim().toLowerCase();
    const customerPhone = String(customer.phone || '').trim();
    const address = String(deliveryAddress || '').trim();
    if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !customerPhone) {
      return res.status(400).json({ message: 'Enter a name, valid email address, and phone number.' });
    }
    if (!Array.isArray(items) || !items.length || items.length > 20) {
      return res.status(400).json({ message: 'Your cart is empty or contains too many products.' });
    }
    if (!['delivery', 'pickup'].includes(deliveryMethod)) {
      return res.status(400).json({ message: 'Choose delivery or shop pickup.' });
    }
    if (deliveryMethod === 'delivery' && !address) {
      return res.status(400).json({ message: 'A delivery address is required.' });
    }

    const store = readDataStore();
    const pricedItems = [];
    for (const entry of items) {
      const product = store.products.find((item) => item.id === String(entry.id));
      const quantity = Number(entry.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ message: 'One or more cart items are invalid.' });
      }
      pricedItems.push({
        id: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        total: product.price * quantity,
      });
    }

    const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0);
    const deliveryFee = deliveryMethod === 'delivery' ? Number(store.paymentDetails.deliveryFee) || 0 : 0;
    const total = subtotal + deliveryFee;
    const reference = `ASH-${Date.now()}-${randomUUID()}`;
    const order = {
      id: `ORD-${randomUUID()}`,
      reference,
      customer: customerName,
      email: customerEmail,
      phone: customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? address : '',
      items: pricedItems,
      subtotal,
      deliveryFee,
      total,
      paymentStatus: 'pending',
      status: 'Awaiting payment',
      createdAt: new Date().toISOString(),
    };

    if (!secretKey) {
      store.orders.push(order);
      writeDataStore(store);
      return res.status(201).json({
        paymentMethod: 'bank-transfer',
        order: {
          id: order.id,
          reference: order.reference,
          items: order.items,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          deliveryMethod: order.deliveryMethod,
        },
        paymentDetails: store.paymentDetails,
      });
    }

    try {
      const providerResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          amount: Math.round(total * 100),
          currency: 'NGN',
          reference,
          callback_url: process.env.PAYSTACK_CALLBACK_URL || `${req.protocol}://${req.get('host')}/payment/callback`,
          metadata: {
            order_id: order.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            delivery_method: deliveryMethod,
          },
        }),
      });
      const result = await providerResponse.json();
      if (!providerResponse.ok || !result.status || !result.data?.authorization_url) {
        return res.status(502).json({ message: result.message || 'Could not start Paystack checkout.' });
      }

      store.orders.push(order);
      writeDataStore(store);
      return res.status(201).json({ orderId: order.id, reference, authorizationUrl: result.data.authorization_url });
    } catch (error) {
      console.error('Paystack initialization failed:', error.message);
      return res.status(502).json({ message: 'Could not reach Paystack. Please try again.' });
    }
  });

  app.get('/api/payments/verify', async (req, res) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return res.status(503).json({ message: 'Online payment is not configured yet.' });
    const reference = String(req.query.reference || '').trim();
    const store = readDataStore();
    const order = store.orders.find((entry) => entry.reference === reference);
    if (!order) return res.status(404).json({ message: 'Order reference not found.' });

    try {
      const providerResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const result = await providerResponse.json();
      if (!providerResponse.ok || !result.status) {
        return res.status(502).json({ message: result.message || 'Unable to verify payment with Paystack.' });
      }

      const payment = result.data;
      const amountMatches = Number(payment.amount) === Math.round(order.total * 100);
      const paymentSucceeded = payment.status === 'success' && payment.currency === 'NGN' && amountMatches;
      order.paymentStatus = paymentSucceeded ? 'success' : payment.status === 'failed' ? 'failed' : 'pending';
      order.status = paymentSucceeded ? 'Awaiting approval' : order.paymentStatus === 'failed' ? 'Payment failed' : 'Awaiting payment';
      if (paymentSucceeded) order.paidAt = new Date().toISOString();
      writeDataStore(store);

      return res.json({
        orderId: order.id,
        reference,
        paymentStatus: order.paymentStatus,
        amount: order.total,
        deliveryMethod: order.deliveryMethod,
      });
    } catch (error) {
      console.error('Paystack verification failed:', error.message);
      return res.status(502).json({ message: 'Could not verify payment. Please contact the bakery before retrying.' });
    }
  });

  app.post('/api/paystack/webhook', (req, res) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];
    if (!secretKey || !Buffer.isBuffer(req.body) || !signature) {
      return res.status(401).json({ message: 'Invalid webhook signature.' });
    }

    const expectedSignature = createHmac('sha512', secretKey).update(req.body).digest();
    const receivedSignature = Buffer.from(String(signature), 'hex');
    if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) {
      return res.status(401).json({ message: 'Invalid webhook signature.' });
    }

    let event;
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).json({ message: 'Invalid webhook payload.' });
    }

    if (event.event === 'charge.success') {
      const payment = event.data || {};
      const store = readDataStore();
      const order = store.orders.find((entry) => entry.reference === payment.reference);
      if (order && payment.status === 'success' && payment.currency === 'NGN' && Number(payment.amount) === Math.round(order.total * 100)) {
        order.paymentStatus = 'success';
        order.status = 'Awaiting approval';
        order.paidAt = new Date().toISOString();
        writeDataStore(store);
      }
    }

    return res.json({ received: true });
  });

  app.put('/api/admin/payment-details', requireUser, requireAdmin, (req, res) => {
    const { bankName = '', accountName = '', accountNumber = '', instructions = '', deliveryFee } = req.body || {};
    const values = [bankName, accountName, accountNumber, instructions].map((value) => String(value).trim());
    const normalizedDeliveryFee = Number(deliveryFee);
    if (values.some((value) => !value) || !Number.isFinite(normalizedDeliveryFee) || normalizedDeliveryFee < 0) {
      return res.status(400).json({ message: 'Complete all payment fields and enter a valid non-negative delivery fee.' });
    }

    const store = readDataStore();
    store.paymentDetails = {
      bankName: values[0],
      accountName: values[1],
      accountNumber: values[2],
      instructions: values[3],
      deliveryFee: normalizedDeliveryFee,
    };
    writeDataStore(store);
    return res.json({ paymentDetails: store.paymentDetails });
  });

  app.post('/api/admin/admins', requireUser, requireAdmin, (req, res) => {
    const { name = '', email = '', password = '' } = req.body || {};
    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password).trim();
    if (!normalizedName || !normalizedEmail || normalizedPassword.length < 8) {
      return res.status(400).json({ message: 'Enter a name, valid email, and password of at least 8 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const store = readDataStore();
    if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const admin = {
      id: `admin-${randomUUID()}`,
      name: normalizedName,
      email: normalizedEmail,
      password: hashPassword(normalizedPassword),
      role: 'admin',
    };
    store.users.push(admin);
    writeDataStore(store);
    return res.status(201).json({ user: toPublicUser(admin) });
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
    const providedPassword = String(password);

    if (!normalizedEmail || !providedPassword.trim()) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const store = readDataStore();
    let user = store.users.find((entry) => entry.email.toLowerCase() === normalizedEmail && verifyPassword(providedPassword, entry.password));

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || '');
    if (adminEmail && adminPassword && normalizedEmail === adminEmail && providedPassword === adminPassword) {
      user = store.users.find((entry) => entry.email.toLowerCase() === adminEmail);
      if (!user) {
        user = {
          id: `admin-${randomUUID()}`,
          name: 'Ashmie Administrator',
          email: adminEmail,
          password: hashPassword(adminPassword),
          role: 'admin',
        };
        store.users.push(user);
      } else {
        user.role = 'admin';
        user.password = hashPassword(adminPassword);
      }
      writeDataStore(store);
    }

    if (!user && normalizedEmail === defaultAdminCredentials.email && providedPassword === defaultAdminCredentials.password) {
      user = store.users.find((entry) => entry.email.toLowerCase() === defaultAdminCredentials.email) || {
        id: `admin-${randomUUID()}`,
        name: defaultAdminCredentials.name,
        email: defaultAdminCredentials.email,
        password: hashPassword(defaultAdminCredentials.password),
        role: 'admin',
      };
      if (!store.users.some((entry) => entry.email.toLowerCase() === defaultAdminCredentials.email)) {
        store.users.unshift(user);
      } else {
        const existingUser = store.users.find((entry) => entry.email.toLowerCase() === defaultAdminCredentials.email);
        existingUser.role = 'admin';
        existingUser.password = hashPassword(defaultAdminCredentials.password);
        user = existingUser;
      }
      writeDataStore(store);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.json({ token: createToken(user), user: toPublicUser(user) });
  });

  app.post('/api/auth/signup', (req, res) => {
    const { name = '', email = '', password = '', accountType = 'customer', adminCode = '' } = req.body || {};
    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password).trim();

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (normalizedPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!['customer', 'admin'].includes(accountType)) {
      return res.status(400).json({ message: 'Choose a valid account type.' });
    }

    const store = readDataStore();
    if (accountType === 'admin' && !isValidAdminSignupCode(String(adminCode).trim(), store.adminSignupCodeHash)) {
      return res.status(403).json({ message: 'The admin signup code is incorrect.' });
    }
    const existingUser = store.users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const user = {
      id: `user-${randomUUID()}`,
      name: normalizedName,
      email: normalizedEmail,
      password: hashPassword(normalizedPassword),
      plan: 'Starter',
      role: accountType,
    };

    store.users.push(user);
    writeDataStore(store);

    return res.json({ token: createToken(user), user: toPublicUser(user) });
  });

  app.post('/api/auth/logout', requireUser, (req, res) => {
    sessions.delete(req.token);
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
