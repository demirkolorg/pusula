// Prisma config for TEST runs.
// .env.local YUKLEMEZ — sadece process.env'deki TEST_DATABASE_URL'i kullanir.
// Tur 2'den itibaren DB integration testleri bu config'i kullanir:
//   bunx prisma migrate deploy --config=prisma.config.test.ts

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["TEST_DATABASE_URL"] ?? "",
  },
});
