// Prisma config — env yükleme: .env.local > .env
import { config } from "dotenv";
config({ path: ".env.local", override: true });
config();

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
