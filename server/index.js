import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { createApp } from './app.js';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
  console.error('Missing ADMIN_EMAIL, ADMIN_PASSWORD, or SESSION_SECRET. Copy .env.example to .env and set secure values.');
  process.exit(1);
}

const { app } = createApp({ dbPath: process.env.DB_PATH, storageRoot: process.env.STORAGE_ROOT });
const dist = resolve('dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false }));
  app.get('*path', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
}
const port = Number(process.env.PORT || 8790);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => console.log(`Waqar API ready at http://${host}:${port}`));
