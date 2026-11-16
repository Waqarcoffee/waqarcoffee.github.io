PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS socials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL, logo_path TEXT, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS menu_categories (id TEXT PRIMARY KEY, ar_name TEXT NOT NULL, en_name TEXT NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE, ar_name TEXT NOT NULL, en_name TEXT NOT NULL, price REAL NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, group_name TEXT NOT NULL, name TEXT NOT NULL, ar_name TEXT NOT NULL, note TEXT, description TEXT, image_path TEXT, sizes_json TEXT NOT NULL, roasts_json TEXT NOT NULL, types_json TEXT NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL, phone TEXT, address TEXT, pickup TEXT, order_type TEXT NOT NULL, payment_method TEXT NOT NULL, status TEXT DEFAULT 'new', total REAL NOT NULL, proof_path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, item_type TEXT NOT NULL, item_ref TEXT NOT NULL, name TEXT NOT NULL, variant_json TEXT, price REAL NOT NULL, qty INTEGER NOT NULL, note TEXT);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
