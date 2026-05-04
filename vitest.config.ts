import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { config as dotenvConfig } from "dotenv";

// Test ortami icin env yukle: .env.test > .env.local > .env
// .env.test sadece TEST_DATABASE_URL gibi degerleri tasimali; gercek secret yok.
dotenvConfig({ path: ".env.test", override: true });

// Tur 2: lib/db.ts singleton'i DATABASE_URL'i okur. Integration testlerde
// gercek dev DB'sine yazmamak icin DATABASE_URL'i TEST_DATABASE_URL ile ezeriz.
// Boylece app/(panel)/projeler/services.ts import edildiginde dogru DB'ye baglanir.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export default defineConfig({
  plugins: [react()],
  // Vite 7+: tsconfig paths native destekli, vite-tsconfig-paths gerekmiyor.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // pool: forks → her test dosyasi izole bir surec; jsdom + Prisma'yi karistirmamak icin guvenli.
    // Vitest 4: poolOptions kaldirildi; tek fork yerine fileParallelism=false yeterli
    // (testler dosya bazinda seri calisir, ortak test DB'sinde yaris yok).
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    // Tur 2: globalSetup aktif — test surecleri baslamadan once `prisma migrate deploy`
    // calistirir; idempotent oldugu icin tekrar tekrar calistirilabilir.
    globalSetup: ["./tests/db/global-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Vitest 4: `all` kaldirildi; `include` ile belirlenen dosyalar otomatik raporlanir.
      include: ["lib/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/node_modules/**",
        "**/.next/**",
        "lib/generated/**",
        "app/**/layout.tsx",
        "app/**/page.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
        "app/**/not-found.tsx",
        "app/global-error.tsx",
      ],
      // Tur 1: thresholds yok. Test edilmis dosyalarin coverage'i raporda gorunur,
      // ama global esik dayatmiyoruz. Tur 3 sonunda esik aciklanip enable edilir.
    },
    include: ["**/*.test.{ts,tsx}"],
    // prisma.config.test.ts vitest icin "test" dosyasi degil — Prisma config'i.
    // .test.ts uzantisi taşısa da include glob'undan dislariz.
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "prisma.config.test.ts",
    ],
  },
});
