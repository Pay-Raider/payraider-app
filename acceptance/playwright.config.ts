import { defineConfig, devices } from "@playwright/test";

/**
 * Cross-cutting acceptance checks against a running app (accessibility scan,
 * network isolation). Run with: pnpm test:acceptance
 * Set BASE_URL to test a deployed instance instead of localhost.
 */
export default defineConfig({
  testDir: "./acceptance",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
