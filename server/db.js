import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { menuCategories, products, socials, WA_NUMBER, PAYMENT_NUMBER } from '../src/data/catalog.js';
import { hashPassword } from './security.js';

export function createDatabase(path = '.data/waqar.sqlite') {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS socials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL, logo_path TEXT, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS menu_categories (id TEXT PRIMARY KEY, ar_name TEXT NOT NULL, en_name TEXT NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE, ar_name TEXT NOT NULL, en_name TEXT NOT NULL, price REAL NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, group_name TEXT NOT NULL, name TEXT NOT NULL, ar_name TEXT NOT NULL, note TEXT, description TEXT, image_path TEXT, sizes_json TEXT NOT NULL, roasts_json TEXT NOT NULL, types_json TEXT NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL, phone TEXT, address TEXT, pickup TEXT, order_type TEXT NOT NULL, payment_method TEXT NOT NULL, status TEXT DEFAULT 'new', total REAL NOT NULL, proof_path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, item_type TEXT NOT NULL, item_ref TEXT NOT NULL, name TEXT NOT NULL, variant_json TEXT, price REAL NOT NULL, qty INTEGER NOT NULL, note TEXT);
  `);
  seed(db);
  return db;
}

function seed(db) {
  if (!db.prepare('SELECT COUNT(*) AS count FROM products').get().count) {
    const insert = db.prepare('INSERT INTO products (id, group_name, name, ar_name, note, description, image_path, sizes_json, roasts_json, types_json, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    products.forEach((p, index) => insert.run(p.id, p.group, p.name, p.arName, p.note, p.desc, '/uploads/coffee-bag.webp', JSON.stringify(p.sizes), JSON.stringify(p.roasts), JSON.stringify(p.types), index));
  }
  if (!db.prepare('SELECT COUNT(*) AS count FROM menu_categories').get().count) {
    const category = db.prepare('INSERT INTO menu_categories (id, ar_name, en_name, sort_order) VALUES (?, ?, ?, ?)');
    const item = db.prepare('INSERT INTO menu_items (category_id, ar_name, en_name, price, sort_order) VALUES (?, ?, ?, ?, ?)');
    menuCategories.forEach((c, categoryIndex) => {
      category.run(c.id, c.ar, c.en, categoryIndex);
      c.items.forEach(([ar, en, price], itemIndex) => item.run(c.id, ar, en, price, itemIndex));
    });
  }
  if (!db.prepare('SELECT COUNT(*) AS count FROM socials').get().count) {
    const insert = db.prepare('INSERT INTO socials (name, url, sort_order) VALUES (?, ?, ?)');
    socials.forEach((social, index) => insert.run(social.name, social.href, index));
  }
  const defaults = {
    address: 'البحيرة — دمنهور، آخر الجمهورية', whatsapp: WA_NUMBER, payment_number: PAYMENT_NUMBER,
    hero_title_1: 'قهوة تُصنع بهدوء،', hero_title_2: 'وتُشرب بوقار.', site_name: 'وقار كوفي',
  };
  const setting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(defaults).forEach(([key, value]) => setting.run(key, value));

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && !db.prepare('SELECT id FROM admins WHERE email = ?').get(email.toLowerCase())) {
    db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run(email.toLowerCase(), hashPassword(password));
  }
}

export function contentFromDb(db) {
  const productsRows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort_order, id').all().map(mapProduct);
  const categories = db.prepare('SELECT * FROM menu_categories WHERE active = 1 ORDER BY sort_order').all().map((category) => ({
    id: category.id, ar: category.ar_name, en: category.en_name,
    items: db.prepare('SELECT * FROM menu_items WHERE category_id = ? AND active = 1 ORDER BY sort_order, id').all(category.id).map((item) => ({ id: item.id, ar: item.ar_name, en: item.en_name, price: item.price })),
  }));
  return { products: productsRows, menuCategories: categories, settings: Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((row) => [row.key, row.value])), socials: db.prepare('SELECT * FROM socials WHERE active = 1 ORDER BY sort_order, id').all().map(mapSocial) };
}

export function mapProduct(row) {
  return { id: row.id, group: row.group_name, name: row.name, arName: row.ar_name, note: row.note, desc: row.description, image: row.image_path, sizes: JSON.parse(row.sizes_json), roasts: JSON.parse(row.roasts_json), types: JSON.parse(row.types_json), active: Boolean(row.active), sortOrder: row.sort_order };
}

export function mapSocial(row) {
  return { id: row.id, name: row.name, href: row.url, logo: row.logo_path, active: Boolean(row.active), sortOrder: row.sort_order };
}
