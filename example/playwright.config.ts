/** Playwright config: serves the example via Expo web and pins the 390x844 @3x viewport. */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-web',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:8081',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  },
  webServer: {
    command: 'pnpm expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
