import { menuCategories, products, socials, PAYMENT_NUMBER, WA_NUMBER } from '../src/data/catalog.js';

const COOKIE_NAME = 'waqar_admin_session';
const ORDER_STATUSES = ['new', 'confirmed', 'preparing', 'delivery', 'completed', 'cancelled'];
const IMAGE_LIMIT = 5 * 1024 * 1024;
const encoder = new TextEncoder();

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
        await ensureSeeded(env);
        return secure(await route(request, env, url));
      }
      return secure(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error(error);
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'تعذر تنفيذ الطلب.';
      return secure(json({ error: message }, status));
    }
  },
};

async function route(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/health' && method === 'GET') return json({ ok: true, runtime: 'cloudflare' });
  if (pathname === '/api/content' && method === 'GET') return json(await getContent(env));
  if (pathname === '/api/orders' && method === 'POST') return createOrder(request, env);
  if (pathname.startsWith('/uploads/') && method === 'GET') return publicFile(env, decodeURIComponent(pathname.slice('/uploads/'.length)));
  if (pathname === '/api/admin/login' && method === 'POST') return adminLogin(request, env);

  if (!pathname.startsWith('/api/admin/')) throw new HttpError(404, 'المسار غير موجود.');
  const session = await requireAdmin(request, env);
  if (pathname === '/api/admin/session' && method === 'GET') return json({ admin: { email: session.email }, csrf: session.csrf_token });
  if (pathname === '/api/admin/logout' && method === 'POST') {
    requireCsrf(request, session);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.token_hash).run();
    return new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookie() } });
  }

  if (pathname === '/api/admin/dashboard' && method === 'GET') return dashboard(env);
  if (pathname === '/api/admin/orders' && method === 'GET') return adminOrders(env);

  let match = pathname.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
  if (match && method === 'PATCH') {
    requireCsrf(request, session);
    const body = await request.json();
    if (!ORDER_STATUSES.includes(body.status)) throw new HttpError(400, 'حالة الطلب غير صالحة.');
    await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(body.status, Number(match[1])).run();
    return json({ ok: true });
  }
  match = pathname.match(/^\/api\/admin\/orders\/(\d+)\/proof$/);
  if (match && method === 'GET') return privateProof(env, Number(match[1]));
  match = pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
  if (match && method === 'DELETE') {
    requireCsrf(request, session);
    return deleteOrder(env, Number(match[1]));
  }

  if (pathname === '/api/admin/products' && method === 'GET') return json(await getProducts(env, false));
  if (pathname === '/api/admin/products' && method === 'POST') {
    requireCsrf(request, session);
    return createProduct(request, env);
  }
  match = pathname.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
  if (match && method === 'PATCH') {
    requireCsrf(request, session);
    return updateProduct(request, env, match[1]);
  }
  if (match && method === 'DELETE') {
    requireCsrf(request, session);
    return deleteProduct(env, match[1]);
  }

  if (pathname === '/api/admin/menu' && method === 'GET') return json(await getMenu(env, false));
  if (pathname === '/api/admin/menu/items' && method === 'POST') {
    requireCsrf(request, session);
    return createMenuItem(request, env);
  }
  match = pathname.match(/^\/api\/admin\/menu\/items\/(\d+)$/);
  if (match && method === 'PATCH') {
    requireCsrf(request, session);
    return updateMenuItem(request, env, Number(match[1]));
  }
  if (match && method === 'DELETE') {
    requireCsrf(request, session);
    await env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(Number(match[1])).run();
    return new Response(null, { status: 204 });
  }

  if (pathname === '/api/admin/settings' && method === 'GET') return json({ settings: await getSettings(env), socials: await getSocials(env, false) });
  if (pathname === '/api/admin/settings' && method === 'PATCH') {
    requireCsrf(request, session);
    return updateSettings(request, env);
  }
  if (pathname === '/api/admin/socials' && method === 'POST') {
    requireCsrf(request, session);
    return createSocial(request, env);
  }
  match = pathname.match(/^\/api\/admin\/socials\/(\d+)$/);
  if (match && method === 'PATCH') {
    requireCsrf(request, session);
    return updateSocial(request, env, Number(match[1]));
  }
  if (match && method === 'DELETE') {
    requireCsrf(request, session);
    return deleteSocial(env, Number(match[1]));
  }

  throw new HttpError(404, 'المسار غير موجود.');
}

async function ensureSeeded(env) {
  const marker = await env.DB.prepare("SELECT value FROM settings WHERE key = 'seed_version'").first();
  if (marker) return;
  const statements = [];
  const settingValues = {
    seed_version: '1', address: 'البحيرة — دمنهور، آخر الجمهورية', whatsapp: WA_NUMBER,
    payment_number: PAYMENT_NUMBER, hero_title_1: 'قهوة تُصنع بهدوء،', hero_title_2: 'وتُشرب بوقار.', site_name: 'وقار كوفي',
  };
  for (const [key, value] of Object.entries(settingValues)) statements.push(env.DB.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').bind(key, value));
  menuCategories.forEach((category, categoryIndex) => {
    statements.push(env.DB.prepare('INSERT OR IGNORE INTO menu_categories (id, ar_name, en_name, sort_order) VALUES (?, ?, ?, ?)').bind(category.id, category.ar, category.en, categoryIndex));
    category.items.forEach(([ar, en, price], itemIndex) => statements.push(env.DB.prepare('INSERT INTO menu_items (category_id, ar_name, en_name, price, sort_order) VALUES (?, ?, ?, ?, ?)').bind(category.id, ar, en, price, itemIndex)));
  });
  products.forEach((product, index) => statements.push(env.DB.prepare('INSERT OR IGNORE INTO products (id, group_name, name, ar_name, note, description, image_path, sizes_json, roasts_json, types_json, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(product.id, product.group, product.name, product.arName, product.note, product.desc, null, JSON.stringify(product.sizes), JSON.stringify(product.roasts), JSON.stringify(product.types), index)));
  socials.forEach((social, index) => statements.push(env.DB.prepare('INSERT INTO socials (name, url, sort_order) VALUES (?, ?, ?)').bind(social.name, social.href, index)));
  await env.DB.batch(statements);
}

async function getContent(env) {
  return { products: await getProducts(env, true), menuCategories: await getMenu(env, true), settings: await getSettings(env), socials: await getSocials(env, true) };
}

async function getProducts(env, activeOnly) {
  const query = `SELECT * FROM products ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort_order, id`;
  const { results } = await env.DB.prepare(query).all();
  return results.map((row, index) => ({ id: row.id, group: row.group_name, name: row.name, arName: row.ar_name, note: row.note, desc: row.description, image: row.image_path, sizes: JSON.parse(row.sizes_json), roasts: JSON.parse(row.roasts_json), types: JSON.parse(row.types_json), active: Boolean(row.active), sortOrder: row.sort_order, accent: String(index + 1).padStart(2, '0') }));
}

async function getMenu(env, activeOnly) {
  const { results: categories } = await env.DB.prepare(`SELECT * FROM menu_categories ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort_order, id`).all();
  const { results: items } = await env.DB.prepare(`SELECT * FROM menu_items ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort_order, id`).all();
  return categories.map((category) => ({ id: category.id, ar: category.ar_name, en: category.en_name, items: items.filter((item) => item.category_id === category.id).map((item) => ({ id: item.id, ar: item.ar_name, en: item.en_name, price: item.price })) }));
}

async function getSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(results.map((row) => [row.key, row.value]));
}

async function getSocials(env, activeOnly) {
  const { results } = await env.DB.prepare(`SELECT * FROM socials ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort_order, id`).all();
  return results.map((row) => ({ id: row.id, name: row.name, href: row.url, logo: row.logo_path, active: Boolean(row.active), sortOrder: row.sort_order }));
}

async function createOrder(request, env) {
  if (!await rateLimit(env, `order:${clientIp(request)}`, 20, 10 * 60 * 1000)) throw new HttpError(429, 'طلبات كثيرة، حاول بعد شوية.');
  const form = await request.formData();
  const customerName = clean(form.get('customerName'), 100);
  const phone = clean(form.get('phone'), 30, true);
  const address = clean(form.get('address'), 300, true);
  const pickup = clean(form.get('pickup'), 30, true);
  const orderType = String(form.get('orderType') || '');
  const paymentMethod = String(form.get('paymentMethod') || '');
  if (customerName.length < 2 || !['delivery', 'dine'].includes(orderType) || !['vodafone', 'instapay', 'cod'].includes(paymentMethod)) throw new HttpError(400, 'بيانات الطلب غير صالحة.');
  if (orderType === 'delivery' && (!phone || !address)) throw new HttpError(400, 'بيانات التوصيل ناقصة.');
  let submitted;
  try { submitted = JSON.parse(String(form.get('items') || '[]')); } catch { throw new HttpError(400, 'تفاصيل الطلب غير صالحة.'); }
  if (!Array.isArray(submitted) || !submitted.length || submitted.length > 50) throw new HttpError(400, 'السلة غير صالحة.');

  let total = 0;
  const resolved = [];
  for (const item of submitted) {
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new HttpError(400, 'الكمية غير صالحة.');
    if (item.type === 'menu') {
      const row = await env.DB.prepare('SELECT * FROM menu_items WHERE id = ? AND active = 1').bind(Number(item.id)).first();
      if (!row) throw new HttpError(400, 'أحد مشروبات الطلب غير متاح.');
      total += Number(row.price) * qty;
      resolved.push({ type: 'menu', ref: String(row.id), name: row.ar_name, price: Number(row.price), qty, note: clean(item.note, 300, true), variant: {} });
    } else if (item.type === 'product') {
      const row = await env.DB.prepare('SELECT * FROM products WHERE id = ? AND active = 1').bind(String(item.id)).first();
      if (!row) throw new HttpError(400, 'أحد المنتجات غير متاح.');
      const sizes = JSON.parse(row.sizes_json);
      if (!item.size || sizes[item.size] == null) throw new HttpError(400, 'حجم المنتج غير صالح.');
      const price = Number(sizes[item.size]);
      total += price * qty;
      resolved.push({ type: 'product', ref: row.id, name: row.ar_name, price, qty, note: clean(item.note, 300, true), variant: { size: item.size, roast: clean(item.roast, 30, true), type: clean(item.grindType, 30, true) } });
    } else throw new HttpError(400, 'نوع المنتج غير صالح.');
  }

  const proof = form.get('proof');
  const online = paymentMethod !== 'cod';
  if (online && !isFile(proof)) throw new HttpError(400, 'صورة إثبات الدفع مطلوبة.');
  let proofKey = null;
  if (isFile(proof)) proofKey = await saveImage(env, proof, 'private/proofs');

  const orderNumber = `WQ-${Date.now().toString(36).toUpperCase()}-${randomHex(2)}`;
  try {
    const inserted = await env.DB.prepare('INSERT INTO orders (order_number, customer_name, phone, address, pickup, order_type, payment_method, total, proof_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(orderNumber, customerName, phone, address, pickup, orderType, paymentMethod, total, proofKey).run();
    const orderId = inserted.meta.last_row_id;
    await env.DB.batch(resolved.map((item) => env.DB.prepare('INSERT INTO order_items (order_id, item_type, item_ref, name, variant_json, price, qty, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(orderId, item.type, item.ref, item.name, JSON.stringify(item.variant), item.price, item.qty, item.note)));
  } catch (error) {
    if (proofKey) await env.FILES.delete(proofKey);
    throw error;
  }
  return json({ orderNumber, total, status: 'new' }, 201);
}

async function adminLogin(request, env) {
  if (!await rateLimit(env, `login:${clientIp(request)}`, 8, 15 * 60 * 1000)) throw new HttpError(429, 'محاولات كثيرة، حاول لاحقًا.');
  const body = await request.json().catch(() => ({}));
  const validEmail = String(body.email || '').toLowerCase() === String(env.ADMIN_EMAIL || '').toLowerCase();
  const validPassword = await verifyPassword(String(body.password || ''), env.ADMIN_PASSWORD_HASH || '');
  if (!validEmail || !validPassword) throw new HttpError(401, 'البريد أو كلمة المرور غير صحيحة.');
  const token = randomToken(32);
  const csrf = randomToken(24);
  const tokenHash = await sha256(token);
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
    env.DB.prepare('INSERT INTO sessions (token_hash, email, csrf_token, expires_at) VALUES (?, ?, ?, ?)').bind(tokenHash, env.ADMIN_EMAIL, csrf, expires),
  ]);
  return json({ admin: { email: env.ADMIN_EMAIL }, csrf }, 200, { 'Set-Cookie': sessionCookie(token) });
}

async function requireAdmin(request, env) {
  const token = cookieValue(request.headers.get('Cookie'), COOKIE_NAME);
  if (!token) throw new HttpError(401, 'غير مصرح.');
  const hash = await sha256(token);
  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(hash, Date.now()).first();
  if (!session) throw new HttpError(401, 'انتهت الجلسة.');
  return session;
}

function requireCsrf(request, session) {
  if (!safeEqual(request.headers.get('x-csrf-token') || '', session.csrf_token)) throw new HttpError(403, 'رمز الحماية غير صالح.');
}

async function dashboard(env) {
  const [orders, newOrders, revenue, productCount] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS count FROM orders'),
    env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'new'"),
    env.DB.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'cancelled'"),
    env.DB.prepare('SELECT COUNT(*) AS count FROM products WHERE active = 1'),
  ]);
  return json({ orders: orders.results[0].count, newOrders: newOrders.results[0].count, revenue: revenue.results[0].total, products: productCount.results[0].count });
}

async function adminOrders(env) {
  const { results: orders } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all();
  const { results: items } = await env.DB.prepare('SELECT * FROM order_items ORDER BY id').all();
  return json(orders.map((order) => ({ ...order, items: items.filter((item) => item.order_id === order.id).map((item) => ({ ...item, variant: JSON.parse(item.variant_json || '{}') })) })));
}

async function privateProof(env, id) {
  const order = await env.DB.prepare('SELECT proof_path FROM orders WHERE id = ?').bind(id).first();
  if (!order?.proof_path) throw new HttpError(404, 'لا يوجد إثبات دفع.');
  const stored = await env.FILES.getWithMetadata(order.proof_path, { type: 'arrayBuffer' });
  if (!stored.value) throw new HttpError(404, 'الملف غير موجود.');
  return new Response(stored.value, { headers: { 'Content-Type': stored.metadata?.contentType || 'application/octet-stream', 'Cache-Control': 'private, no-store' } });
}

async function deleteOrder(env, id) {
  const order = await env.DB.prepare('SELECT proof_path FROM orders WHERE id = ?').bind(id).first();
  if (!order) throw new HttpError(404, 'الطلب غير موجود.');
  await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  if (order.proof_path) await env.FILES.delete(order.proof_path);
  return new Response(null, { status: 204 });
}

async function createProduct(request, env) {
  const form = await request.formData();
  const data = productForm(form);
  const file = form.get('image');
  const imagePath = isFile(file) ? `/uploads/${await saveImage(env, file, 'public/products')}` : null;
  await env.DB.prepare('INSERT INTO products (id, group_name, name, ar_name, note, description, image_path, sizes_json, roasts_json, types_json, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(data.id, data.group, data.name, data.arName, data.note, data.desc, imagePath, JSON.stringify(data.sizes), JSON.stringify(data.roasts), JSON.stringify(data.types), data.active ? 1 : 0, data.sortOrder).run();
  return json({ ok: true }, 201);
}

async function updateProduct(request, env, id) {
  const current = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!current) throw new HttpError(404, 'المنتج غير موجود.');
  const form = await request.formData();
  const data = productForm(form, id);
  const file = form.get('image');
  let imagePath = current.image_path;
  if (isFile(file)) {
    imagePath = `/uploads/${await saveImage(env, file, 'public/products')}`;
    await deletePublicPath(env, current.image_path);
  }
  await env.DB.prepare('UPDATE products SET group_name=?, name=?, ar_name=?, note=?, description=?, image_path=?, sizes_json=?, roasts_json=?, types_json=?, active=?, sort_order=? WHERE id=?').bind(data.group, data.name, data.arName, data.note, data.desc, imagePath, JSON.stringify(data.sizes), JSON.stringify(data.roasts), JSON.stringify(data.types), data.active ? 1 : 0, data.sortOrder, id).run();
  return json({ ok: true });
}

async function deleteProduct(env, id) {
  const current = await env.DB.prepare('SELECT image_path FROM products WHERE id = ?').bind(id).first();
  if (!current) throw new HttpError(404, 'المنتج غير موجود.');
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  await deletePublicPath(env, current.image_path);
  return new Response(null, { status: 204 });
}

async function createMenuItem(request, env) {
  const data = menuInput(await request.json());
  const result = await env.DB.prepare('INSERT INTO menu_items (category_id, ar_name, en_name, price, sort_order) VALUES (?, ?, ?, ?, ?)').bind(data.categoryId, data.ar, data.en, data.price, data.sortOrder).run();
  return json({ id: result.meta.last_row_id }, 201);
}

async function updateMenuItem(request, env, id) {
  const data = menuInput(await request.json());
  await env.DB.prepare('UPDATE menu_items SET category_id=?, ar_name=?, en_name=?, price=?, sort_order=? WHERE id=?').bind(data.categoryId, data.ar, data.en, data.price, data.sortOrder, id).run();
  return json({ ok: true });
}

async function updateSettings(request, env) {
  const body = await request.json();
  const entries = Object.entries(body || {});
  if (!entries.length || entries.some(([key, value]) => key.length > 100 || typeof value !== 'string' || value.length > 500)) throw new HttpError(400, 'البيانات المرسلة غير صالحة.');
  await env.DB.batch(entries.map(([key, value]) => env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, value)));
  return json({ ok: true });
}

async function createSocial(request, env) {
  const form = await request.formData();
  const data = socialForm(form);
  const file = form.get('logo');
  const logoPath = isFile(file) ? `/uploads/${await saveImage(env, file, 'public/socials')}` : null;
  const result = await env.DB.prepare('INSERT INTO socials (name, url, logo_path, active, sort_order) VALUES (?, ?, ?, ?, ?)').bind(data.name, data.href, logoPath, data.active ? 1 : 0, data.sortOrder).run();
  return json({ id: result.meta.last_row_id }, 201);
}

async function updateSocial(request, env, id) {
  const current = await env.DB.prepare('SELECT * FROM socials WHERE id = ?').bind(id).first();
  if (!current) throw new HttpError(404, 'الرابط غير موجود.');
  const form = await request.formData();
  const data = socialForm(form);
  const file = form.get('logo');
  let logoPath = current.logo_path;
  if (isFile(file)) {
    logoPath = `/uploads/${await saveImage(env, file, 'public/socials')}`;
    await deletePublicPath(env, current.logo_path);
  }
  await env.DB.prepare('UPDATE socials SET name=?, url=?, logo_path=?, active=?, sort_order=? WHERE id=?').bind(data.name, data.href, logoPath, data.active ? 1 : 0, data.sortOrder, id).run();
  return json({ ok: true });
}

async function deleteSocial(env, id) {
  const current = await env.DB.prepare('SELECT logo_path FROM socials WHERE id = ?').bind(id).first();
  if (!current) throw new HttpError(404, 'الرابط غير موجود.');
  await env.DB.prepare('DELETE FROM socials WHERE id = ?').bind(id).run();
  await deletePublicPath(env, current.logo_path);
  return new Response(null, { status: 204 });
}

async function publicFile(env, key) {
  if (!key.startsWith('public/')) throw new HttpError(404, 'الملف غير موجود.');
  const stored = await env.FILES.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!stored.value) throw new HttpError(404, 'الملف غير موجود.');
  return new Response(stored.value, { headers: { 'Content-Type': stored.metadata?.contentType || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
}

async function saveImage(env, file, prefix) {
  if (file.size < 8 || file.size > IMAGE_LIMIT) throw new HttpError(400, 'حجم الصورة غير مسموح.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) throw new HttpError(400, 'صيغة الصورة غير مسموحة.');
  const key = `${prefix}/${Date.now()}-${randomHex(12)}.${extension}`;
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  await env.FILES.put(key, bytes, { metadata: { contentType } });
  return key;
}

async function deletePublicPath(env, path) {
  if (path?.startsWith('/uploads/public/')) await env.FILES.delete(path.slice('/uploads/'.length));
}

function productForm(form, forcedId) {
  const id = forcedId || clean(form.get('id'), 50);
  const group = String(form.get('group') || '');
  const name = clean(form.get('name'), 100);
  const arName = clean(form.get('arName'), 100);
  const note = clean(form.get('note'), 100, true);
  const desc = clean(form.get('desc'), 1000, true);
  let sizes; let roasts; let types;
  try { sizes = JSON.parse(String(form.get('sizes') || '{}')); roasts = JSON.parse(String(form.get('roasts') || '[]')); types = JSON.parse(String(form.get('types') || '[]')); } catch { throw new HttpError(400, 'خيارات المنتج غير صالحة.'); }
  if (!/^[a-z0-9-]{2,50}$/.test(id) || !['blends', 'single'].includes(group) || name.length < 2 || arName.length < 2 || !sizes || !Object.keys(sizes).length || Object.values(sizes).some((price) => !Number.isFinite(Number(price)) || Number(price) <= 0) || !Array.isArray(roasts) || !roasts.length || !Array.isArray(types) || !types.length) throw new HttpError(400, 'بيانات المنتج غير صالحة.');
  return { id, group, name, arName, note, desc, sizes: Object.fromEntries(Object.entries(sizes).map(([key, value]) => [key, Number(value)])), roasts: roasts.map(String), types: types.map(String), active: bool(form.get('active')), sortOrder: Number(form.get('sortOrder') || 0) };
}

function menuInput(body) {
  const data = { categoryId: clean(body.categoryId, 50), ar: clean(body.ar, 100), en: clean(body.en, 100), price: Number(body.price), sortOrder: Number(body.sortOrder || 0) };
  if (data.categoryId.length < 2 || data.ar.length < 2 || data.en.length < 2 || !Number.isFinite(data.price) || data.price <= 0 || !Number.isInteger(data.sortOrder)) throw new HttpError(400, 'بيانات المشروب غير صالحة.');
  return data;
}

function socialForm(form) {
  const name = clean(form.get('name'), 50);
  const href = clean(form.get('href'), 500);
  try { new URL(href); } catch { throw new HttpError(400, 'رابط السوشيال غير صالح.'); }
  if (name.length < 2) throw new HttpError(400, 'اسم منصة التواصل غير صالح.');
  return { name, href, active: bool(form.get('active')), sortOrder: Number(form.get('sortOrder') || 0) };
}

async function rateLimit(env, key, limit, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').bind(key).first();
  if (!row || row.reset_at <= now) {
    await env.DB.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=1, reset_at=excluded.reset_at').bind(key, now + windowMs).run();
    return true;
  }
  if (row.count >= limit) return false;
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}

async function verifyPassword(password, encoded) {
  const parts = encoded.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.length * 8);
  return safeEqualBytes(new Uint8Array(bits), expected);
}

async function sha256(value) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return [...hash].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function imageExtension(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'webp';
  return null;
}

function secure(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'DENY');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders } });
}

function clean(value, max, optional = false) {
  const text = String(value ?? '').trim();
  if (text.length > max || (!optional && !text)) throw new HttpError(400, 'البيانات المرسلة غير صالحة.');
  return text;
}

function bool(value) { return value === true || value === 'true' || value === 1 || value === '1'; }
function isFile(value) { return value && typeof value.arrayBuffer === 'function' && typeof value.size === 'number' && value.size > 0; }
function clientIp(request) { return request.headers.get('CF-Connecting-IP') || 'unknown'; }
function randomHex(bytes) { const values = crypto.getRandomValues(new Uint8Array(bytes)); return [...values].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase(); }
function randomToken(bytes) { const values = crypto.getRandomValues(new Uint8Array(bytes)); return toBase64(values).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
function toBase64(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
function fromBase64(value) { const binary = atob(value); return Uint8Array.from(binary, (char) => char.charCodeAt(0)); }
function safeEqual(a, b) { return safeEqualBytes(encoder.encode(a), encoder.encode(b)); }
function safeEqualBytes(a, b) { if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i]; return result === 0; }
function cookieValue(header, name) { return String(header || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || ''; }
function sessionCookie(token) { return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`; }
function clearCookie() { return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`; }

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
