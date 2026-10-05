import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, createHmac } from 'node:crypto';
import { createApp } from '../server.js';

function createUniqueEmail() {
  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}@ashmie.io`;
}

async function request(app, path, options = {}) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
    const text = await response.text();
    return { response, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('POST /api/auth/login returns the user and token', async () => {
  const app = createApp();

  const { response, body } = await request(app, '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ava@ashmie.io', password: 'demo123' }),
  });

  assert.equal(response.status, 200);
  assert.equal(body.user.email, 'ava@ashmie.io');
  assert.ok(body.token);
});

test('GET /api/dashboard returns a dashboard payload', async () => {
  const app = createApp();

  const { response, body } = await request(app, '/api/dashboard');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.summary));
  assert.ok(Array.isArray(body.pipeline));
});

test('passwords are stored as hashes instead of plain text', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;

  try {
    const app = createApp();
    const uniqueEmail = createUniqueEmail();

    const signup = await request(app, '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Secure User', email: uniqueEmail, password: 'secure123' }),
    });

    assert.equal(signup.response.status, 200);
    const persistedStore = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const savedUser = persistedStore.users.find((user) => user.email === uniqueEmail);
    assert.ok(savedUser);
    assert.equal(savedUser.password, createHash('sha256').update('secure123').digest('hex'));
    assert.notEqual(savedUser.password, 'secure123');
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
  }
});

test('default bootstrap admin credentials can sign in without env configuration', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  const previousAdminPassword = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;

  try {
    const app = createApp();
    const login = await request(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ashmie.io', password: 'admin12345' }),
    });

    assert.equal(login.response.status, 200);
    assert.equal(login.body.user.role, 'admin');
    assert.equal(login.body.user.email, 'admin@ashmie.io');
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
    if (previousAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousAdminEmail;
    if (previousAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousAdminPassword;
  }
});

test('GET /api/workspace returns a workspace project list', async () => {
  const app = createApp();

  const { response, body } = await request(app, '/api/workspace');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.projects));
  assert.ok(body.projects.length >= 3);
});

test('POST /api/auth/signup creates a user and persists a project', async () => {
  const app = createApp();
  const uniqueEmail = createUniqueEmail();

  const signupResponse = await request(app, '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Lena Park', email: uniqueEmail, password: 'secure123' }),
  });

  assert.equal(signupResponse.response.status, 200);
  assert.equal(signupResponse.body.user.email, uniqueEmail);
  assert.equal(signupResponse.body.user.role, 'customer');
  assert.ok(signupResponse.body.token);

  const adminOverviewResponse = await request(app, '/api/admin/overview', {
    headers: { Authorization: `Bearer ${signupResponse.body.token}` },
  });
  assert.equal(adminOverviewResponse.response.status, 403);

  const paymentUpdateResponse = await request(app, '/api/admin/payment-details', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${signupResponse.body.token}`,
    },
    body: JSON.stringify({ bankName: 'Bank', accountName: 'Ashmie', accountNumber: '123', instructions: 'Transfer' }),
  });
  assert.equal(paymentUpdateResponse.response.status, 403);

  const adminCreateResponse = await request(app, '/api/admin/admins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${signupResponse.body.token}`,
    },
    body: JSON.stringify({ name: 'Unauthorized Admin', email: createUniqueEmail(), password: 'secure123' }),
  });
  assert.equal(adminCreateResponse.response.status, 403);

  const paymentDetailsResponse = await request(app, '/api/payment-details');
  assert.equal(paymentDetailsResponse.response.status, 200);
  assert.ok(paymentDetailsResponse.body.paymentDetails.accountName);

  const projectResponse = await request(app, '/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Brand refresh', description: 'New positioning sprint' }),
  });

  assert.equal(projectResponse.response.status, 200);
  assert.ok(projectResponse.body.project.name.includes('Brand refresh'));
});

test('signup distinguishes customers from admins and rotates the admin key', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;

  try {
    const existingStore = previousStore ? JSON.parse(previousStore) : {};
    existingStore.adminSignupCodeHash = createHash('sha256').update('RAJI').digest('hex');
    fs.writeFileSync(dataFile, JSON.stringify(existingStore, null, 2));
    const app = createApp();
    const signup = (name, accountType, adminCode) => request(app, '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: createUniqueEmail(), password: 'secure123', accountType, adminCode }),
    });

    const customer = await signup('New Customer', 'customer');
    assert.equal(customer.response.status, 200);
    assert.equal(customer.body.user.role, 'customer');

    const incorrectCode = await signup('Rejected Admin', 'admin', 'WRONG');
    assert.equal(incorrectCode.response.status, 403);

    const admin = await signup('New Admin', 'admin', 'RAJI');
    assert.equal(admin.response.status, 200);
    assert.equal(admin.body.user.role, 'admin');
    const authorization = { Authorization: `Bearer ${admin.body.token}`, 'Content-Type': 'application/json' };

    const rotation = await request(app, '/api/admin/admin-signup-code', {
      method: 'PUT',
      headers: authorization,
      body: JSON.stringify({ code: 'NEWWKEY' }),
    });
    assert.equal(rotation.response.status, 200);

    const oldCode = await signup('Old Code Admin', 'admin', 'RAJI');
    assert.equal(oldCode.response.status, 403);
    const newCode = await signup('New Code Admin', 'admin', 'NEWWKEY');
    assert.equal(newCode.response.status, 200);
    assert.equal(newCode.body.user.role, 'admin');

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    assert.equal(persistedStore.adminSignupCodeHash, createHash('sha256').update('NEWWKEY').digest('hex'));
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
  }
});

test('admins manage shop products and Academy registration settings', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  const previousAdminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = createUniqueEmail();
  const adminPassword = 'catalog-admin-secure123';
  process.env.ADMIN_EMAIL = adminEmail;
  process.env.ADMIN_PASSWORD = adminPassword;

  try {
    const app = createApp();
    const adminLogin = await request(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminAuth = { Authorization: `Bearer ${adminLogin.body.token}`, 'Content-Type': 'application/json' };
    const customerSignup = await request(app, '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Catalog Customer', email: createUniqueEmail(), password: 'secure123', accountType: 'customer' }),
    });

    const productBody = { name: 'Admin Test Cake', category: 'cakes', price: 15000, image: '', description: 'Test product description.' };
    const createdProduct = await request(app, '/api/admin/products', {
      method: 'POST',
      headers: adminAuth,
      body: JSON.stringify(productBody),
    });
    assert.equal(createdProduct.response.status, 201);
    const productId = createdProduct.body.product.id;

    const forbiddenEdit = await request(app, `/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerSignup.body.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 1 }),
    });
    assert.equal(forbiddenEdit.response.status, 403);

    const updateProduct = await request(app, `/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: adminAuth,
      body: JSON.stringify({ ...productBody, price: 17500 }),
    });
    assert.equal(updateProduct.response.status, 200);
    assert.equal(updateProduct.body.product.price, 17500);

    const closePortal = await request(app, '/api/admin/training-settings', {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({
        isOpen: false,
        fees: { 'cake-basic': 42000 },
        courseDetails: { 'cake-basic': { location: 'Hotoro Behind Chula Fueling Station', date: '2026-11-15', duration: '5 Weeks' } },
      }),
    });
    assert.equal(closePortal.response.status, 200);
    const updatedTraining = closePortal.body.trainings.find((item) => item.id === 'cake-basic');
    assert.equal(updatedTraining.fee, 42000);
    assert.equal(updatedTraining.location, 'Hotoro Behind Chula Fueling Station');
    assert.equal(updatedTraining.date, '2026-11-15');
    assert.equal(updatedTraining.duration, '5 Weeks');

    const invalidTrainingDate = await request(app, '/api/admin/training-settings', {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({
        isOpen: false,
        fees: { 'cake-basic': 42000 },
        courseDetails: { 'cake-basic': { location: 'Hotoro Behind Chula Fueling Station', date: '2026-02-30', duration: '5 Weeks' } },
      }),
    });
    assert.equal(invalidTrainingDate.response.status, 400);

    const closedSettings = await request(app, '/api/training');
    assert.equal(closedSettings.body.trainingPortalOpen, false);
    const closedEnrollment = await request(app, '/api/training/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerSignup.body.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainingId: 'cake-basic' }),
    });
    assert.equal(closedEnrollment.response.status, 403);

    await request(app, '/api/admin/training-settings', {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({ isOpen: true, fees: { 'cake-basic': 42000 } }),
    });
    const enrollment = await request(app, '/api/training/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerSignup.body.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainingId: 'cake-basic' }),
    });
    assert.equal(enrollment.response.status, 201);
    assert.equal(enrollment.body.enrollment.fee, 42000);
    assert.equal(enrollment.body.enrollment.date, '2026-11-15');

    const rescheduledTraining = await request(app, '/api/admin/training-settings', {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({
        isOpen: true,
        fees: { 'cake-basic': 42000 },
        courseDetails: { 'cake-basic': { location: 'Hotoro Behind Chula Fueling Station', date: '2026-11-22', duration: '6 Weeks' } },
      }),
    });
    assert.equal(rescheduledTraining.response.status, 200);
    const refreshedEnrollments = await request(app, '/api/training/enrollments', { headers: { Authorization: `Bearer ${customerSignup.body.token}` } });
    assert.equal(refreshedEnrollments.body.enrollments[0].date, '2026-11-22');

    const duplicateEnrollment = await request(app, '/api/training/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerSignup.body.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainingId: 'cake-basic' }),
    });
    assert.equal(duplicateEnrollment.response.status, 409);

    const deletedProduct = await request(app, `/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminLogin.body.token}` },
    });
    assert.equal(deletedProduct.response.status, 200);
    const remainingProducts = await request(app, '/api/products');
    assert.equal(remainingProducts.body.products.some((item) => item.id === productId), false);
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
    if (previousAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousAdminEmail;
    if (previousAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousAdminPassword;
  }
});

test('product reviews start empty and customers can add or update their own rating', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;

  try {
    const existingStore = previousStore ? JSON.parse(previousStore) : {};
    existingStore.reviews = [];
    fs.writeFileSync(dataFile, JSON.stringify(existingStore, null, 2));
    const app = createApp();

    const initialReviews = await request(app, '/api/reviews?productId=strawberry-royale');
    assert.equal(initialReviews.response.status, 200);
    assert.deepEqual(initialReviews.body.reviews, []);

    const unauthorizedReview = await request(app, '/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'strawberry-royale', rating: 5, comment: 'Excellent cake.' }),
    });
    assert.equal(unauthorizedReview.response.status, 401);

    const signup = await request(app, '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Review Customer', email: createUniqueEmail(), password: 'secure123' }),
    });
    const authorization = { Authorization: `Bearer ${signup.body.token}`, 'Content-Type': 'application/json' };
    const submission = await request(app, '/api/reviews', {
      method: 'POST',
      headers: authorization,
      body: JSON.stringify({ productId: 'strawberry-royale', rating: 5, comment: 'Excellent cake.' }),
    });
    assert.equal(submission.response.status, 201);
    assert.equal(submission.body.review.rating, 5);

    const update = await request(app, '/api/reviews', {
      method: 'POST',
      headers: authorization,
      body: JSON.stringify({ productId: 'strawberry-royale', rating: 4, comment: 'Still delicious.' }),
    });
    assert.equal(update.response.status, 200);
    assert.equal(update.body.review.rating, 4);

    const savedReviews = await request(app, '/api/reviews?productId=strawberry-royale');
    assert.equal(savedReviews.body.reviews.length, 1);
    assert.equal(savedReviews.body.reviews[0].comment, 'Still delicious.');
    assert.equal('userId' in savedReviews.body.reviews[0], false);
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
  }
});

test('chat messages stay in each customer thread and admins can reply', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  const previousAdminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = createUniqueEmail();
  const adminPassword = 'chat-admin-secure123';
  process.env.ADMIN_EMAIL = adminEmail;
  process.env.ADMIN_PASSWORD = adminPassword;

  try {
    const existingStore = previousStore ? JSON.parse(previousStore) : {};
    existingStore.chatMessages = [];
    fs.writeFileSync(dataFile, JSON.stringify(existingStore, null, 2));
    const app = createApp();
    const signup = async (name) => request(app, '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: createUniqueEmail(), password: 'secure123' }),
    });
    const firstCustomer = await signup('First Customer');
    const secondCustomer = await signup('Second Customer');
    const firstAuth = { Authorization: `Bearer ${firstCustomer.body.token}`, 'Content-Type': 'application/json' };
    const secondAuth = { Authorization: `Bearer ${secondCustomer.body.token}` };

    const anonymousMessages = await request(app, '/api/chat/messages');
    assert.equal(anonymousMessages.response.status, 401);

    const sentMessage = await request(app, '/api/chat/messages', {
      method: 'POST',
      headers: firstAuth,
      body: JSON.stringify({ body: 'Can I ask about a custom cake order?' }),
    });
    assert.equal(sentMessage.response.status, 201);
    assert.equal(sentMessage.body.message.conversationId, firstCustomer.body.user.id);

    const receiptData = Buffer.from('%PDF-1.4\nReceipt\n%%EOF', 'ascii').toString('base64');
    const sentReceipt = await request(app, '/api/chat/messages', {
      method: 'POST',
      headers: firstAuth,
      body: JSON.stringify({
        body: 'Here is my transfer receipt.',
        attachment: { name: 'transfer-receipt.pdf', mimeType: 'application/pdf', dataUrl: `data:application/pdf;base64,${receiptData}` },
      }),
    });
    assert.equal(sentReceipt.response.status, 201);
    assert.equal(sentReceipt.body.message.attachment.name, 'transfer-receipt.pdf');

    const invalidReceipt = await request(app, '/api/chat/messages', {
      method: 'POST',
      headers: firstAuth,
      body: JSON.stringify({ attachment: { name: 'receipt.pdf', mimeType: 'application/pdf', dataUrl: 'data:application/pdf;base64,aGVsbG8=' } }),
    });
    assert.equal(invalidReceipt.response.status, 400);

    const secondThread = await request(app, '/api/chat/messages', { headers: secondAuth });
    assert.deepEqual(secondThread.body.messages, []);
    const adminDenied = await request(app, '/api/admin/chat/conversations', { headers: secondAuth });
    assert.equal(adminDenied.response.status, 403);

    const adminLogin = await request(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminAuth = { Authorization: `Bearer ${adminLogin.body.token}`, 'Content-Type': 'application/json' };
    const inbox = await request(app, '/api/admin/chat/conversations', { headers: adminAuth });
    assert.equal(inbox.body.conversations.length, 1);
    assert.equal(inbox.body.conversations[0].conversationId, firstCustomer.body.user.id);
    assert.equal(inbox.body.conversations[0].unreadCount, 2);

    const adminThread = await request(app, `/api/chat/messages?conversationId=${firstCustomer.body.user.id}`, { headers: adminAuth });
    assert.equal(adminThread.response.status, 200);
    assert.equal(adminThread.body.messages[1].attachment.name, 'transfer-receipt.pdf');
    const readInbox = await request(app, '/api/admin/chat/conversations', { headers: adminAuth });
    assert.equal(readInbox.body.conversations[0].unreadCount, 0);

    const reply = await request(app, '/api/chat/messages', {
      method: 'POST',
      headers: adminAuth,
      body: JSON.stringify({ conversationId: firstCustomer.body.user.id, body: 'Yes, please send the date and size.' }),
    });
    assert.equal(reply.response.status, 201);
    const firstThread = await request(app, '/api/chat/messages', { headers: firstAuth });
    assert.equal(firstThread.body.messages.length, 3);
    assert.equal(firstThread.body.messages[2].senderRole, 'admin');
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
    if (previousAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousAdminEmail;
    if (previousAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousAdminPassword;
  }
});

test('configured administrator can manage payment details and invite another admin', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  const previousAdminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = createUniqueEmail();
  const adminPassword = 'admin-secure123';
  process.env.ADMIN_EMAIL = adminEmail;
  process.env.ADMIN_PASSWORD = adminPassword;

  try {
    const existingStore = previousStore ? JSON.parse(previousStore) : {};
    existingStore.orders = [
      { id: 'test-paid-order', customer: 'Status Customer', total: 18000, paymentStatus: 'success', status: 'Awaiting approval', createdAt: new Date().toISOString() },
      { id: 'test-unpaid-order', customer: 'Unpaid Customer', total: 9000, paymentStatus: 'pending', status: 'Awaiting payment', createdAt: new Date().toISOString() },
    ];
    fs.writeFileSync(dataFile, JSON.stringify(existingStore, null, 2));
    const app = createApp();
    const login = await request(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    assert.equal(login.response.status, 200);
    assert.equal(login.body.user.role, 'admin');
    const authorization = { Authorization: `Bearer ${login.body.token}` };

    const overview = await request(app, '/api/admin/overview', { headers: authorization });
    assert.equal(overview.response.status, 200);

    const orderStatusRequest = (orderId, status) => request(app, `/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    assert.equal((await orderStatusRequest('test-paid-order', 'Processing')).response.status, 409);
    assert.equal((await orderStatusRequest('test-unpaid-order', 'Approved')).response.status, 409);
    assert.equal((await orderStatusRequest('test-paid-order', 'Approved')).response.status, 200);
    assert.equal((await orderStatusRequest('test-paid-order', 'Processing')).response.status, 200);
    assert.equal((await orderStatusRequest('test-paid-order', 'Completed')).response.status, 200);
    assert.equal((await orderStatusRequest('test-paid-order', 'Rejected')).response.status, 409);

    const paymentUpdate = await request(app, '/api/admin/payment-details', {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankName: 'Test Bank', accountName: 'Ashmie Bakery', accountNumber: '1234567890', instructions: 'Use order ID.', deliveryFee: 3200 }),
    });
    assert.equal(paymentUpdate.response.status, 200);
    assert.equal(paymentUpdate.body.paymentDetails.bankName, 'Test Bank');
    assert.equal(paymentUpdate.body.paymentDetails.deliveryFee, 3200);

    const checkoutSettings = await request(app, '/api/payment-details');
    assert.equal(checkoutSettings.body.paymentDetails.deliveryFee, 3200);

    const newAdmin = await request(app, '/api/admin/admins', {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Additional Admin', email: createUniqueEmail(), password: 'another-secure123' }),
    });
    assert.equal(newAdmin.response.status, 201);
    assert.equal(newAdmin.body.user.role, 'admin');
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
    if (previousAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousAdminEmail;
    if (previousAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousAdminPassword;
  }
});

test('checkout creates a pending bank transfer order when Paystack is not configured', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;
  const previousSecret = process.env.PAYSTACK_SECRET_KEY;
  delete process.env.PAYSTACK_SECRET_KEY;

  try {
    const existingStore = previousStore ? JSON.parse(previousStore) : {};
    existingStore.paymentDetails = {
      ...(existingStore.paymentDetails || {}),
      bankName: 'Test Bank',
      accountName: 'Ashmie Cakes',
      accountNumber: '1234567890',
      instructions: 'Use your order reference.',
      deliveryFee: 2400,
    };
    fs.writeFileSync(dataFile, JSON.stringify(existingStore, null, 2));
    const app = createApp();
    const checkout = await request(app, '/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Manual Pay Customer', email: createUniqueEmail(), phone: '+2348000000000' },
        items: [{ id: 'strawberry-royale', quantity: 1, price: 1 }],
        deliveryMethod: 'delivery',
        deliveryAddress: '12 Baker Street, Lagos',
      }),
    });

    assert.equal(checkout.response.status, 201);
    assert.equal(checkout.body.paymentMethod, 'bank-transfer');
    assert.equal(checkout.body.paymentDetails.accountNumber, '1234567890');
    assert.equal(checkout.body.order.total, 20400);
    const savedStore = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const savedOrder = savedStore.orders.find((order) => order.id === checkout.body.order.id);
    assert.equal(savedOrder.paymentStatus, 'pending');
    assert.equal(savedOrder.status, 'Awaiting payment');
  } finally {
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
    if (previousSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = previousSecret;
  }
});

test('Paystack checkout uses server prices and only marks verified payments paid', async () => {
  const dataFile = path.join(process.cwd(), 'data', 'store.json');
  const previousStore = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;
  const previousSecret = process.env.PAYSTACK_SECRET_KEY;
  const previousCallback = process.env.PAYSTACK_CALLBACK_URL;
  const previousFetch = globalThis.fetch;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret';
  process.env.PAYSTACK_CALLBACK_URL = 'https://ashmie.example/payment/callback';
  const initializedTransactions = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestedUrl = String(url);
    if (requestedUrl === 'https://api.paystack.co/transaction/initialize') {
      const initializedTransaction = JSON.parse(options.body);
      initializedTransactions.push(initializedTransaction);
      return new Response(JSON.stringify({
        status: true,
        data: { authorization_url: 'https://checkout.paystack.com/mock', reference: initializedTransaction.reference },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (requestedUrl.startsWith('https://api.paystack.co/transaction/verify/')) {
      const reference = decodeURIComponent(requestedUrl.split('/').pop());
      return new Response(JSON.stringify({
        status: true,
        data: { status: 'success', amount: 1800000, currency: 'NGN', reference },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return previousFetch(url, options);
  };

  try {
    const app = createApp();
    const initialized = await request(app, '/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Test Customer', email: createUniqueEmail(), phone: '+2348000000000' },
        items: [{ id: 'strawberry-royale', quantity: 1, price: 1 }],
        deliveryMethod: 'pickup',
      }),
    });

    assert.equal(initialized.response.status, 201);
    assert.equal(initialized.body.authorizationUrl, 'https://checkout.paystack.com/mock');
    assert.equal(initializedTransactions[0].amount, 1800000);
    assert.equal(initializedTransactions[0].currency, 'NGN');
    assert.equal(initializedTransactions[0].metadata.delivery_method, 'pickup');

    const settingsResponse = await request(app, '/api/payment-details');
    const deliveryFee = settingsResponse.body.paymentDetails.deliveryFee;
    const deliveryOrder = await request(app, '/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Test Customer', email: createUniqueEmail(), phone: '+2348000000000' },
        items: [{ id: 'strawberry-royale', quantity: 1 }],
        deliveryMethod: 'delivery',
        deliveryAddress: '12 Baker Street, Lagos',
      }),
    });
    assert.equal(deliveryOrder.response.status, 201);
    assert.equal(initializedTransactions[1].amount, (18000 + deliveryFee) * 100);

    const verified = await request(app, `/api/payments/verify?reference=${encodeURIComponent(initialized.body.reference)}`);
    assert.equal(verified.response.status, 200);
    assert.equal(verified.body.paymentStatus, 'success');
    assert.equal(verified.body.amount, 18000);

    const store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const order = store.orders.find((entry) => entry.reference === initialized.body.reference);
    assert.equal(order.paymentStatus, 'success');
    assert.equal(order.deliveryFee, 0);

    const webhookPayload = JSON.stringify({
      event: 'charge.success',
      data: { status: 'success', amount: 1800000, currency: 'NGN', reference: initialized.body.reference },
    });
    const signature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(webhookPayload).digest('hex');
    const webhook = await request(app, '/api/paystack/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
      body: webhookPayload,
    });
    assert.equal(webhook.response.status, 200);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousStore === null) fs.rmSync(dataFile, { force: true });
    else fs.writeFileSync(dataFile, previousStore);
    if (previousSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = previousSecret;
    if (previousCallback === undefined) delete process.env.PAYSTACK_CALLBACK_URL;
    else process.env.PAYSTACK_CALLBACK_URL = previousCallback;
  }
});

test('GET /api/projects recovers when the data store is corrupted', async () => {
  const dataDir = path.join(process.cwd(), 'data');
  const dataFile = path.join(dataDir, 'store.json');
  const previous = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null;

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, '{broken json');

  try {
    const app = createApp();
    const { response, body } = await request(app, '/api/projects');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.projects));
  } finally {
    if (previous === null) {
      fs.rmSync(dataFile, { force: true });
    } else {
      fs.writeFileSync(dataFile, previous);
    }
  }
});
