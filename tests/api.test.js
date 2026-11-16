import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';

let testRoot;
let app;
let agent;
let csrf;
let menuItemId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_EMAIL = 'admin@test.local';
  process.env.ADMIN_PASSWORD = 'A-Strong-Test-Password-2026!';
  testRoot = mkdtempSync(join(tmpdir(), 'waqar-api-'));
  ({ app } = createApp({ dbPath: join(testRoot, 'test.sqlite'), storageRoot: join(testRoot, 'storage') }));
  agent = request.agent(app);
  const content = await request(app).get('/api/content');
  menuItemId = content.body.menuCategories[0].items[0].id;
});

afterAll(() => rmSync(testRoot, { recursive: true, force: true }));

describe('public API', () => {
  it('returns health, security headers and seeded content', async () => {
    const health = await request(app).get('/api/health').expect(200);
    expect(health.body.ok).toBe(true);
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    const content = await request(app).get('/api/content').expect(200);
    expect(content.body.products.length).toBeGreaterThan(5);
    expect(content.body.menuCategories.length).toBeGreaterThan(5);
  });

  it('recalculates prices and creates a cash order', async () => {
    const response = await request(app).post('/api/orders').field('customerName', 'عميل تجريبي').field('phone', '01000000000').field('address', 'دمنهور').field('pickup', '').field('orderType', 'delivery').field('paymentMethod', 'cod').field('items', JSON.stringify([{ id: menuItemId, type: 'menu', qty: 2 }])).expect(201);
    expect(response.body.orderNumber).toMatch(/^WQ-/);
    expect(response.body.total).toBe(50);
  });

  it('requires a real image proof for online payments', async () => {
    await request(app).post('/api/orders').field('customerName', 'عميل تجريبي').field('phone', '01000000000').field('address', 'دمنهور').field('orderType', 'delivery').field('paymentMethod', 'vodafone').field('items', JSON.stringify([{ id: menuItemId, type: 'menu', qty: 1 }])).expect(400);
    await request(app).post('/api/orders').field('customerName', 'عميل تجريبي').field('phone', '01000000000').field('address', 'دمنهور').field('orderType', 'delivery').field('paymentMethod', 'instapay').field('items', JSON.stringify([{ id: menuItemId, type: 'menu', qty: 1 }])).attach('proof', Buffer.from('not-an-image'), { filename: 'fake.jpg', contentType: 'image/jpeg' }).expect(400);
  });
});

describe('admin security and management', () => {
  it('blocks unauthenticated access and rejects bad credentials', async () => {
    await request(app).get('/api/admin/orders').expect(401);
    await request(app).post('/api/admin/login').send({ email: 'admin@test.local', password: 'wrong-password' }).expect(401);
  });

  it('logs in with an HttpOnly cookie', async () => {
    const response = await agent.post('/api/admin/login').send({ email: 'admin@test.local', password: 'A-Strong-Test-Password-2026!' }).expect(200);
    csrf = response.body.csrf;
    expect(csrf.length).toBeGreaterThan(20);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
  });

  it('enforces CSRF on mutations', async () => {
    await agent.patch('/api/admin/settings').send({ address: 'test' }).expect(403);
    await agent.patch('/api/admin/settings').set('x-csrf-token', csrf).send({ address: 'عنوان آمن' }).expect(200);
  });

  it('supports product CRUD from the dashboard API', async () => {
    const product = { id: 'test-blend', group: 'blends', name: 'Test Blend', arName: 'توليفة اختبار', note: 'Test', desc: 'منتج للاختبار', sizes: JSON.stringify({ '125g': 70 }), roasts: JSON.stringify(['وسط']), types: JSON.stringify(['سادة']), active: 'true', sortOrder: '99' };
    const create = agent.post('/api/admin/products').set('x-csrf-token', csrf);
    Object.entries(product).forEach(([key, value]) => create.field(key, value));
    await create.expect(201);
    const products = await agent.get('/api/admin/products').expect(200);
    expect(products.body.some((item) => item.id === 'test-blend')).toBe(true);
    await agent.delete('/api/admin/products/test-blend').set('x-csrf-token', csrf).expect(204);
  });

  it('keeps valid payment proof private but available to admin', async () => {
    const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(32)]);
    await request(app).post('/api/orders').field('customerName', 'دافع إلكتروني').field('phone', '01000000000').field('address', 'دمنهور').field('orderType', 'delivery').field('paymentMethod', 'vodafone').field('items', JSON.stringify([{ id: menuItemId, type: 'menu', qty: 1 }])).attach('proof', png, { filename: 'proof.png', contentType: 'image/png' }).expect(201);
    const orders = await agent.get('/api/admin/orders').expect(200);
    const paid = orders.body.find((order) => order.payment_method === 'vodafone');
    expect(paid.proof_path).toBeTruthy();
    await request(app).get(`/api/admin/orders/${paid.id}/proof`).expect(401);
    await agent.get(`/api/admin/orders/${paid.id}/proof`).expect(200);
  });
});
