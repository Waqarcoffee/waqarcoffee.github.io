import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { createDatabase, contentFromDb, mapProduct, mapSocial } from './db.js';
import { isImage, safeEqual, SESSION_COOKIE, sha256, verifyPassword } from './security.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const statusValues = ['new', 'confirmed', 'preparing', 'delivery', 'completed', 'cancelled'];

export function createApp(options = {}) {
  const db = options.db || createDatabase(options.dbPath);
  const storageRoot = options.storageRoot || 'storage';
  mkdirSync(join(storageRoot, 'public'), { recursive: true });
  mkdirSync(join(storageRoot, 'private'), { recursive: true });
  const seededBag = join(storageRoot, 'public', 'coffee-bag.webp');
  if (!existsSync(seededBag) && existsSync('storage/public/coffee-bag.webp')) copyFileSync('storage/public/coffee-bag.webp', seededBag);
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' }, contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(join(storageRoot, 'public'), { dotfiles: 'deny', maxAge: '1d', immutable: false }));

  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });
  const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/content', (_req, res) => res.json(contentFromDb(db)));

  app.post('/api/orders', orderLimiter, upload.single('proof'), (req, res, next) => {
    try {
      const schema = z.object({
        customerName: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).optional().default(''), address: z.string().trim().max(300).optional().default(''), pickup: z.string().trim().max(30).optional().default(''),
        orderType: z.enum(['delivery', 'dine']), paymentMethod: z.enum(['vodafone', 'instapay', 'cod']), items: z.string().min(2),
      });
      const input = schema.parse(req.body);
      if (input.orderType === 'delivery' && (!input.phone || !input.address)) throw new Error('بيانات التوصيل ناقصة');
      const submitted = z.array(z.object({ id: z.union([z.string(), z.number()]), type: z.enum(['product', 'menu']), qty: z.number().int().min(1).max(50), size: z.string().optional(), roast: z.string().optional(), grindType: z.string().optional(), note: z.string().max(300).optional() })).min(1).max(50).parse(JSON.parse(input.items));
      const online = input.paymentMethod !== 'cod';
      if (online && (!req.file || !isImage(req.file.buffer))) return res.status(400).json({ error: 'صورة إثبات الدفع مطلوبة ويجب أن تكون PNG أو JPG أو WebP.' });
      if (req.file && !isImage(req.file.buffer)) return res.status(400).json({ error: 'صيغة الصورة غير مسموحة.' });

      let total = 0;
      const resolved = submitted.map((item) => {
        if (item.type === 'menu') {
          const row = db.prepare('SELECT * FROM menu_items WHERE id = ? AND active = 1').get(Number(item.id));
          if (!row) throw new Error('أحد مشروبات الطلب غير متاح');
          total += row.price * item.qty;
          return { ...item, ref: String(row.id), name: row.ar_name, price: row.price, variant: {} };
        }
        const row = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(String(item.id));
        if (!row) throw new Error('أحد المنتجات غير متاح');
        const sizes = JSON.parse(row.sizes_json);
        if (!item.size || sizes[item.size] == null) throw new Error('حجم المنتج غير صالح');
        const price = Number(sizes[item.size]);
        total += price * item.qty;
        return { ...item, ref: row.id, name: row.ar_name, price, variant: { size: item.size, roast: item.roast, type: item.grindType } };
      });

      const proofPath = req.file ? saveImage(req.file, join(storageRoot, 'private')) : null;
      const orderNumber = `WQ-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
      const result = db.prepare('INSERT INTO orders (order_number, customer_name, phone, address, pickup, order_type, payment_method, total, proof_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(orderNumber, input.customerName, input.phone, input.address, input.pickup, input.orderType, input.paymentMethod, total, proofPath);
      const itemInsert = db.prepare('INSERT INTO order_items (order_id, item_type, item_ref, name, variant_json, price, qty, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      resolved.forEach((item) => itemInsert.run(result.lastInsertRowid, item.type, item.ref, item.name, JSON.stringify(item.variant), item.price, item.qty, item.note || ''));
      res.status(201).json({ orderNumber, total, status: 'new' });
    } catch (error) { next(error); }
  });

  app.post('/api/admin/login', loginLimiter, (req, res) => {
    const input = z.object({ email: z.string().email(), password: z.string().min(8).max(200) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'بيانات الدخول غير صحيحة.' });
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(input.data.email.toLowerCase());
    if (!admin || !verifyPassword(input.data.password, admin.password_hash)) return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة.' });
    const token = randomBytes(32).toString('base64url');
    const csrf = randomBytes(24).toString('base64url');
    const expires = Date.now() + 8 * 60 * 60 * 1000;
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    db.prepare('INSERT INTO sessions (token_hash, admin_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)').run(sha256(token), admin.id, csrf, expires);
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' });
    res.json({ admin: { id: admin.id, email: admin.email }, csrf });
  });

  app.get('/api/admin/session', requireAdmin(db), (req, res) => res.json({ admin: req.admin, csrf: req.session.csrf_token }));
  app.post('/api/admin/logout', requireAdmin(db), requireCsrf, (req, res) => { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.session.token_hash); res.clearCookie(SESSION_COOKIE); res.status(204).end(); });

  app.use('/api/admin', requireAdmin(db));
  app.get('/api/admin/dashboard', (_req, res) => {
    const stats = { orders: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, newOrders: db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'new'").get().count, revenue: db.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'cancelled'").get().total, products: db.prepare('SELECT COUNT(*) AS count FROM products WHERE active = 1').get().count };
    res.json(stats);
  });
  app.get('/api/admin/orders', (_req, res) => res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all().map((order) => ({ ...order, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id).map((item) => ({ ...item, variant: JSON.parse(item.variant_json || '{}') })) }))));
  app.patch('/api/admin/orders/:id/status', requireCsrf, (req, res) => { const status = z.enum(statusValues).parse(req.body.status); db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, Number(req.params.id)); res.json({ ok: true }); });
  app.get('/api/admin/orders/:id/proof', (req, res) => { const order = db.prepare('SELECT proof_path FROM orders WHERE id = ?').get(Number(req.params.id)); if (!order?.proof_path) return res.sendStatus(404); res.sendFile(resolve(storageRoot, 'private', order.proof_path), { dotfiles: 'deny' }); });
  app.delete('/api/admin/orders/:id', requireCsrf, (req, res) => {
    const id = Number(req.params.id);
    const order = db.prepare('SELECT proof_path FROM orders WHERE id = ?').get(id);
    if (!order) return res.sendStatus(404);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    if (order.proof_path) {
      const proof = join(storageRoot, 'private', order.proof_path);
      if (existsSync(proof)) unlinkSync(proof);
    }
    res.status(204).end();
  });

  app.get('/api/admin/products', (_req, res) => res.json(db.prepare('SELECT * FROM products ORDER BY sort_order, id').all().map(mapProduct)));
  app.post('/api/admin/products', requireCsrf, upload.single('image'), (req, res, next) => { try { const data = productInput(req.body); const image = req.file ? publicImage(req.file, storageRoot) : '/uploads/coffee-bag.webp'; db.prepare('INSERT INTO products (id, group_name, name, ar_name, note, description, image_path, sizes_json, roasts_json, types_json, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(data.id, data.group, data.name, data.arName, data.note, data.desc, image, JSON.stringify(data.sizes), JSON.stringify(data.roasts), JSON.stringify(data.types), data.active ? 1 : 0, data.sortOrder); res.status(201).json({ ok: true }); } catch (error) { next(error); } });
  app.patch('/api/admin/products/:id', requireCsrf, upload.single('image'), (req, res, next) => { try { const current = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id); if (!current) return res.sendStatus(404); const data = productInput({ ...mapProduct(current), ...req.body, id: req.params.id }); const image = req.file ? publicImage(req.file, storageRoot) : current.image_path; db.prepare('UPDATE products SET group_name=?, name=?, ar_name=?, note=?, description=?, image_path=?, sizes_json=?, roasts_json=?, types_json=?, active=?, sort_order=? WHERE id=?').run(data.group, data.name, data.arName, data.note, data.desc, image, JSON.stringify(data.sizes), JSON.stringify(data.roasts), JSON.stringify(data.types), data.active ? 1 : 0, data.sortOrder, req.params.id); res.json({ ok: true }); } catch (error) { next(error); } });
  app.delete('/api/admin/products/:id', requireCsrf, (req, res) => { db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id); res.status(204).end(); });

  app.get('/api/admin/menu', (_req, res) => res.json(contentFromDb(db).menuCategories));
  app.post('/api/admin/menu/items', requireCsrf, (req, res) => { const data = menuItemInput(req.body); const result = db.prepare('INSERT INTO menu_items (category_id, ar_name, en_name, price, sort_order) VALUES (?, ?, ?, ?, ?)').run(data.categoryId, data.ar, data.en, data.price, data.sortOrder); res.status(201).json({ id: Number(result.lastInsertRowid) }); });
  app.patch('/api/admin/menu/items/:id', requireCsrf, (req, res) => { const data = menuItemInput(req.body); db.prepare('UPDATE menu_items SET category_id=?, ar_name=?, en_name=?, price=?, sort_order=? WHERE id=?').run(data.categoryId, data.ar, data.en, data.price, data.sortOrder, Number(req.params.id)); res.json({ ok: true }); });
  app.delete('/api/admin/menu/items/:id', requireCsrf, (req, res) => { db.prepare('DELETE FROM menu_items WHERE id = ?').run(Number(req.params.id)); res.status(204).end(); });

  app.get('/api/admin/settings', (_req, res) => res.json({ settings: contentFromDb(db).settings, socials: db.prepare('SELECT * FROM socials ORDER BY sort_order, id').all().map(mapSocial) }));
  app.patch('/api/admin/settings', requireCsrf, (req, res) => { const data = z.record(z.string(), z.string().max(500)).parse(req.body); const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'); Object.entries(data).forEach(([key, value]) => stmt.run(key, value)); res.json({ ok: true }); });
  app.post('/api/admin/socials', requireCsrf, upload.single('logo'), (req, res, next) => { try { const data = socialInput(req.body); const logo = req.file ? publicImage(req.file, storageRoot) : null; const result = db.prepare('INSERT INTO socials (name, url, logo_path, active, sort_order) VALUES (?, ?, ?, ?, ?)').run(data.name, data.href, logo, data.active ? 1 : 0, data.sortOrder); res.status(201).json({ id: Number(result.lastInsertRowid) }); } catch (error) { next(error); } });
  app.patch('/api/admin/socials/:id', requireCsrf, upload.single('logo'), (req, res, next) => { try { const current = db.prepare('SELECT * FROM socials WHERE id = ?').get(Number(req.params.id)); if (!current) return res.sendStatus(404); const data = socialInput({ ...mapSocial(current), ...req.body }); const logo = req.file ? publicImage(req.file, storageRoot) : current.logo_path; db.prepare('UPDATE socials SET name=?, url=?, logo_path=?, active=?, sort_order=? WHERE id=?').run(data.name, data.href, logo, data.active ? 1 : 0, data.sortOrder, Number(req.params.id)); res.json({ ok: true }); } catch (error) { next(error); } });
  app.delete('/api/admin/socials/:id', requireCsrf, (req, res) => { db.prepare('DELETE FROM socials WHERE id = ?').run(Number(req.params.id)); res.status(204).end(); });

  app.use((error, _req, res, _next) => { const isValidation = error instanceof z.ZodError; res.status(isValidation ? 400 : 400).json({ error: isValidation ? 'البيانات المرسلة غير صالحة.' : (error.message || 'تعذر تنفيذ الطلب.') }); });
  return { app, db };
}

function requireAdmin(db) { return (req, res, next) => { const token = req.cookies[SESSION_COOKIE]; if (!token) return res.status(401).json({ error: 'غير مصرح.' }); const session = db.prepare('SELECT sessions.*, admins.email FROM sessions JOIN admins ON admins.id=sessions.admin_id WHERE token_hash=? AND expires_at>?').get(sha256(token), Date.now()); if (!session) return res.status(401).json({ error: 'انتهت الجلسة.' }); req.session = session; req.admin = { id: session.admin_id, email: session.email }; next(); }; }
function requireCsrf(req, res, next) { if (!safeEqual(req.get('x-csrf-token'), req.session.csrf_token)) return res.status(403).json({ error: 'رمز الحماية غير صالح.' }); next(); }
function saveImage(file, directory) { if (!isImage(file.buffer)) throw new Error('صيغة الصورة غير مسموحة.'); const extension = file.mimetype.includes('png') ? '.png' : file.mimetype.includes('webp') ? '.webp' : '.jpg'; const name = `${Date.now()}-${randomBytes(12).toString('hex')}${extension}`; writeFileSync(join(directory, name), file.buffer, { flag: 'wx', mode: 0o600 }); return name; }
function publicImage(file, root) { return `/uploads/${saveImage(file, join(root, 'public'))}`; }
function parseJson(value, fallback) { if (typeof value === 'object') return value; try { return JSON.parse(value); } catch { return fallback; } }
function asBoolean(value) { return value === true || value === 'true' || value === 1 || value === '1'; }
function productInput(body) { return z.object({ id: z.string().regex(/^[a-z0-9-]{2,50}$/), group: z.enum(['blends', 'single']), name: z.string().min(2).max(100), arName: z.string().min(2).max(100), note: z.string().max(100).default(''), desc: z.string().max(1000).default(''), sizes: z.record(z.string(), z.number().positive()), roasts: z.array(z.string()).min(1), types: z.array(z.string()).min(1), active: z.boolean(), sortOrder: z.number().int() }).parse({ ...body, sizes: parseJson(body.sizes, {}), roasts: parseJson(body.roasts, []), types: parseJson(body.types, []), active: asBoolean(body.active), sortOrder: Number(body.sortOrder || 0) }); }
function menuItemInput(body) { return z.object({ categoryId: z.string().min(2), ar: z.string().min(2).max(100), en: z.string().min(2).max(100), price: z.number().positive(), sortOrder: z.number().int() }).parse({ ...body, price: Number(body.price), sortOrder: Number(body.sortOrder || 0) }); }
function socialInput(body) { return z.object({ name: z.string().min(2).max(50), href: z.string().url(), active: z.boolean(), sortOrder: z.number().int() }).parse({ ...body, active: asBoolean(body.active), sortOrder: Number(body.sortOrder || 0) }); }
