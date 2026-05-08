import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Underscore prefix'li argümanlar/değişkenler bilinçli "kullanılmıyor"
      // işaretidir — uyarı verme. Genellikle 3rd party callback imzaları için.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Sprint 5 / S5-12 — Pino logger (`lib/logger`) varken `console.*`
      // structured log'a girmez (request_id, level, JSON shape eksik).
      // Sadece `console.warn` ve `console.error` istisna — emergency
      // debug için. Production'da bunlar da Sentry/DataDog'a geçecek.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Logger modülü kendi tanımı içinde Pino köprüsü için console kullanır.
    // CLI script'leri ve seed çıktısı için console.log gerekli.
    files: [
      "lib/logger.ts",
      "lib/logger.test.ts",
      "prisma/seed.ts",
      "prisma/seed/**/*.ts",
      "prisma/scripts/**/*.ts",
      "socket-server/**/*.ts",
      "tests/**/*.ts",
      "tests/**/*.tsx",
    ],
    rules: {
      "no-console": "off",
    },
  },
  {
    // E2E fixture/test dosyaları — Playwright `use` callback'i React hook değil.
    files: ["tests/e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Üretilen / 3rd party dosyalar — kaynak kod değil.
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
