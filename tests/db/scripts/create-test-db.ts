// Test DB'sini Postgres'te olusturur (idempotent).
// Kullanim: `bun run test:db:setup` once `bun run test`.
//
// Tur 1'de DB testi yok; bu script Tur 2 oncesi haziz dursun diye yazildi.
// Idempotent: zaten varsa hata atmaz, sessizce gecer.

import { PrismaClient } from "@prisma/client";
import { config as dotenvConfig } from "dotenv";
import { execSync } from "node:child_process";

dotenvConfig({ path: ".env.test" });

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
if (!TEST_DB_URL) {
  console.error("TEST_DATABASE_URL .env.test'te tanimli degil.");
  process.exit(1);
}

// Admin baglantisi: pusula_test yerine `postgres` veya default DB'ye baglan.
const ADMIN_URL = TEST_DB_URL.replace(/\/[^/?]+(\?|$)/, "/postgres$1");
const TEST_DB_NAME = TEST_DB_URL.match(/\/([^/?]+)(\?|$)/)?.[1];

if (!TEST_DB_NAME || !TEST_DB_NAME.includes("test")) {
  console.error(
    `Test DB ismi gecersiz veya 'test' icermiyor: ${TEST_DB_NAME}`,
  );
  process.exit(1);
}

async function main() {
  const adminClient = new PrismaClient({
    datasources: { db: { url: ADMIN_URL } },
  });
  try {
    const sonuc = await adminClient.$queryRawUnsafe<Array<{ datname: string }>>(
      `SELECT datname FROM pg_database WHERE datname = '${TEST_DB_NAME}'`,
    );
    if (sonuc.length === 0) {
      console.log(`[test:db:setup] DB olusturuluyor: ${TEST_DB_NAME}`);
      await adminClient.$executeRawUnsafe(
        `CREATE DATABASE "${TEST_DB_NAME}";`,
      );
    } else {
      console.log(`[test:db:setup] DB zaten var: ${TEST_DB_NAME}`);
    }
  } finally {
    await adminClient.$disconnect();
  }

  console.log(`[test:db:setup] prisma migrate deploy → ${TEST_DB_NAME}`);
  // prisma.config.test.ts kullanilir; .env.local'i ezmez, dogrudan TEST_DATABASE_URL'e bakar.
  execSync("bunx prisma migrate deploy --config=prisma.config.test.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      TEST_DATABASE_URL: TEST_DB_URL,
      DATABASE_URL: TEST_DB_URL,
    },
  });

  console.log("[test:db:setup] tamam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
