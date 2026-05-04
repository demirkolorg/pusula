import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

// `istekContextAl` next/headers kullanır — request scope dışı çağrı hata verir.
vi.mock("@/lib/request-context", () => ({
  ISTEK_BASLIK: "x-request-id",
  istekIdAl: vi.fn(async () => undefined),
  istekContextAl: vi.fn(async () => ({})),
}));

import { kayitOl } from "./actions";
import { birimOlustur, birimSil } from "../../(panel)/ayarlar/birimler/services";
import { truncateAll } from "@/tests/db/setup";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

beforeAll(async () => {
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
});

describe("kayitOl", () => {
  it("happy: BEKLIYOR durumunda hesap oluşturur, aktif=false", async () => {
    const birim = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Şifa Eczanesi",
    });

    const sonuc = await kayitOl({
      ad: "Ahmet",
      soyad: "Yılmaz",
      email: "ahmet@test.local",
      parola: "Test1234!",
      parolaTekrar: "Test1234!",
      birim_id: birim.id,
    });

    expect(sonuc.basarili).toBe(true);
    if (!sonuc.basarili) return;

    const k = await adminDb.kullanici.findUnique({
      where: { id: sonuc.veri.kullaniciId },
    });
    expect(k?.email).toBe("ahmet@test.local");
    expect(k?.birim_id).toBe(birim.id);
    expect(k?.aktif).toBe(false);
    expect(k?.onay_durumu).toBe("BEKLIYOR");
    // Parola hash'lendi (argon2id)
    expect(k?.parola_hash.startsWith("$argon2id$")).toBe(true);
  });

  it("aynı e-posta ile ikinci kayıt CAKISMA hatası verir", async () => {
    const birim = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X Eczanesi",
    });
    await kayitOl({
      ad: "Ali",
      soyad: "Veli",
      email: "duplicate@test.local",
      parola: "Test1234!",
      parolaTekrar: "Test1234!",
      birim_id: birim.id,
    });

    const sonuc = await kayitOl({
      ad: "Cem",
      soyad: "Demir",
      email: "duplicate@test.local",
      parola: "Test1234!",
      parolaTekrar: "Test1234!",
      birim_id: birim.id,
    });
    expect(sonuc.basarili).toBe(false);
    if (sonuc.basarili) return;
    expect(sonuc.kod).toBe("CAKISMA");
  });

  it("silinmiş birime kayıt reddedilir", async () => {
    const birim = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Y Eczanesi",
    });
    await birimSil(birim.id);

    const sonuc = await kayitOl({
      ad: "Ali",
      soyad: "Veli",
      email: "x@test.local",
      parola: "Test1234!",
      parolaTekrar: "Test1234!",
      birim_id: birim.id,
    });
    expect(sonuc.basarili).toBe(false);
    if (sonuc.basarili) return;
    expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
  });

  it("parola eşleşmezse Zod hatası verir", async () => {
    const birim = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Z Eczanesi",
    });
    const sonuc = await kayitOl({
      ad: "Ali",
      soyad: "Veli",
      email: "y@test.local",
      parola: "Test1234!",
      parolaTekrar: "Different1!",
      birim_id: birim.id,
    });
    expect(sonuc.basarili).toBe(false);
    if (sonuc.basarili) return;
    expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
    expect(sonuc.alanlar?.parolaTekrar).toBeTruthy();
  });

  it("kısa parola Zod ile reddedilir (8 karakter altı)", async () => {
    const birim = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "W Eczanesi",
    });
    const sonuc = await kayitOl({
      ad: "Ali",
      soyad: "Veli",
      email: "z@test.local",
      parola: "kisa",
      parolaTekrar: "kisa",
      birim_id: birim.id,
    });
    expect(sonuc.basarili).toBe(false);
    if (sonuc.basarili) return;
    expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
    expect(sonuc.alanlar?.parola).toBeTruthy();
  });

  it("geçersiz UUID birim_id reddedilir", async () => {
    const sonuc = await kayitOl({
      ad: "Ali",
      soyad: "Veli",
      email: "q@test.local",
      parola: "Test1234!",
      parolaTekrar: "Test1234!",
      birim_id: "not-a-uuid",
    });
    expect(sonuc.basarili).toBe(false);
    if (sonuc.basarili) return;
    expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
    expect(sonuc.alanlar?.birim_id).toBeTruthy();
  });
});
