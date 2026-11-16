import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './screenshots/test-results',
  use: { baseURL: 'http://127.0.0.1:8799', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:8799/api/health',
    reuseExistingServer: false,
    env: { ...process.env, DEV_PORT: '8799', NODE_ENV: 'development', DB_PATH: '.data/e2e-v3.sqlite', STORAGE_ROOT: '.data/e2e-storage', ADMIN_EMAIL: 'admin@e2e.invalid', ADMIN_PASSWORD: 'E2E-Only-Test-Password-2026!', SESSION_SECRET: 'e2e-only-secret-value-at-least-32-characters' },
  },
});
