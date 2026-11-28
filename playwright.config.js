import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    }
  },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:3000/api/salud', reuseExistingServer: !process.env.CI }
});
