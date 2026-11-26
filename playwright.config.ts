import { defineConfig, devices } from "@playwright/test";

/**
 * Tests end-to-end de Gesta : https://playwright.dev/docs/test-configuration
 *
 * Données maîtrisées : Playwright démarre lui-même l'API sur une base dédiée
 * (backend/data/gesta-e2e.db), recréée à partir du seed à chaque lancement. La base de
 * développement (gesta.db) n'est jamais touchée et les tests ne dépendent pas de son état.
 *
 * Prérequis : backend/.env existe (npm run setup), pour JWT_SECRET et DEMO_AUTH_ENABLED.
 * Les ports par défaut sont ceux de npm run dev : arrêter npm run dev avant de lancer
 * les tests, ou choisir d'autres ports (E2E_WEB_PORT=5174 E2E_API_PORT=3001 npx playwright test).
 */
const WEB_PORT = process.env.E2E_WEB_PORT ?? "5173";
const API_PORT = process.env.E2E_API_PORT ?? "3000";
const E2E_DATABASE_PATH = "data/gesta-e2e.db"; // relatif à backend/

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Pas de réutilisation d'un serveur déjà lancé : il pourrait servir une autre base.
  webServer: [
    {
      // API : base E2E recréée depuis le seed, puis serveur.
      command: "npm run db:reset -w backend && npm run dev -w backend",
      url: `http://localhost:${API_PORT}/health`,
      env: { API_PORT, DATABASE_PATH: E2E_DATABASE_PATH },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Frontend Vite : API_PORT règle la cible du proxy /api (voir frontend/vite.config.ts).
      command: `npm run dev -w frontend -- --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
