import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

  const projectResponse = await request(app, '/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Brand refresh', description: 'New positioning sprint' }),
  });

  assert.equal(projectResponse.response.status, 200);
  assert.ok(projectResponse.body.project.name.includes('Brand refresh'));
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
