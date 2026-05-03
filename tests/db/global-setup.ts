import { execSync } from "node:child_process";
import { config as dotenvConfig } from "dotenv";

// Vitest globalSetup: tum test surec(leri) baslamadan ONCE bir kere calisir.
// Tur 1'de aktif degil (vitest.config.ts'te yorum satirinda).
// Tur 2'de DB testleri eklendiginde aktiflesecek:
//   - .env.test'i yukler
//   - TEST_DATABASE_URL'e prisma migrate deploy ile semayi uygular
//
// Migration zaten basariliysa idempotent calisir (prisma migrate deploy).

export async function setup(): Promise<void> {
  dotenvConfig({ path: ".env.test", override: true });

  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL tanimli degil. .env.test dosyasi olustur.",
    );
  }
  if (!url.includes("test")) {
    throw new Error(
      `TEST_DATABASE_URL 'test' kelimesi icermiyor (gorulen: ${url}).`,
    );
  }

  console.log("[test:setup] prisma migrate deploy → test DB");
  // prisma.config.test.ts: .env.local override etmez; TEST_DATABASE_URL'i okur.
  execSync("bunx prisma migrate deploy --config=prisma.config.test.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      TEST_DATABASE_URL: url,
      DATABASE_URL: url,
    },
  });
}

export async function teardown(): Promise<void> {
  // Volume'u silmiyoruz; bir sonraki run hizla baslasin.
}
