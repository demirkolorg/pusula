import { defineConfig, devices } from "@playwright/test";

// Pusula E2E config — Kontrol Kural 17 + 82.
// 3 viewport: mobile (375x667), tablet (768x1024), desktop (1440x900).
// Mock yasak (Kural 80) — gerçek dev DB ve dev server.

const PORT = 2500;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false, // DB paylaşımlı; sıralı çalış
  workers: 1,
  reporter: process.env.CI ? "github" : [["list"]],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  },

  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      // iPad Mini WebKit motorunda — `tablet-chromium` ismi yanıltıcıydı.
      name: "tablet-webkit",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  webServer: {
    command: "bun run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
