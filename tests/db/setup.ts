import { PrismaClient } from "@prisma/client";

// Test PrismaClient factory.
// Tur 2: vitest.config.ts process.env.DATABASE_URL'i TEST_DATABASE_URL ile ezdigi icin
// `lib/db.ts`'in singleton'i da test DB'ye baglanir. Yine de izole bir client lazimsa
// (audit middleware'siz yan kanal) `olusturTestDb()` saglar.

const TEST_DB_URL = process.env.TEST_DATABASE_URL;

export function olusturTestDb(): PrismaClient {
  if (!TEST_DB_URL) {
    throw new Error(
      "TEST_DATABASE_URL tanimli degil. .env.test dosyasini kontrol et.",
    );
  }
  if (!TEST_DB_URL.includes("test")) {
    // Guvenlik tampini: yanlislikla production/development DB'ye baglanmayi engelle.
    throw new Error(
      `TEST_DATABASE_URL 'test' kelimesi icermiyor (gorulen: ${TEST_DB_URL}). Yanlis DB'ye yazma riski.`,
    );
  }
  return new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
    log: ["error"],
  });
}

// Audit ile uretilen yan kayitlari ve domain tablolarini TRUNCATE eder.
// `aktivite_logu` ve `hata_logu` da bu listeye dahildir (services.ts ile yapilan her
// yazma audit middleware'i tetikledigi icin).
//
// Tablo isimlerini pg_tables'tan cekip CASCADE ile temizliyoruz; FK iliskileri zincirleme
// silinir. Sira garantisi gerekmez (RESTART IDENTITY CASCADE tek statement).
export async function truncateAll(prisma: {
  $queryRaw: PrismaClient["$queryRaw"];
  $executeRawUnsafe: PrismaClient["$executeRawUnsafe"];
}): Promise<void> {
  const sonuc = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'`;

  if (sonuc.length === 0) return;

  const tablolar = sonuc
    .map((s) => `"public"."${s.tablename}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablolar} RESTART IDENTITY CASCADE;`,
  );
}
