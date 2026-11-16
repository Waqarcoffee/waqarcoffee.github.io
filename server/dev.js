import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app.js';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
  console.error('Missing ADMIN_EMAIL, ADMIN_PASSWORD, or SESSION_SECRET. Copy .env.example to .env and set secure values.');
  process.exit(1);
}

const { app } = createApp({ dbPath: process.env.DB_PATH, storageRoot: process.env.STORAGE_ROOT });
const vite = await createViteServer({
  appType: 'spa',
  server: { middlewareMode: true },
});

app.use(vite.middlewares);

const port = Number(process.env.DEV_PORT || 8000);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Waqar site + API ready at http://${host}:${port}`);
  console.log(`Admin dashboard: http://${host}:${port}/admin`);
});
