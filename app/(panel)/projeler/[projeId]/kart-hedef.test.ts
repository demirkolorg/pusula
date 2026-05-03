import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kartHedefKurumlariniListele,
  kartHedefKurumEkle,
  kartHedefKurumKaldir,
} from "./kart-hedef";
import { ortamKur, type Ortam } from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";
import { kurumOlustur } from "../../ayarlar/kurumlar/services";
import { siraSonuna } from "@/lib/sira";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;
let kartId: string;

beforeAll(async () => {
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
  ortam = await ortamKur(adminDb);

  // Bir proje + liste + kart kur
  const proje = await adminDb.proje.create({
    data: {
      kurum_id: ortam.kurum.id,
      ad: "Test Proje",
      sira: siraSonuna(null),
    },
  });
  const liste = await adminDb.liste.create({
    data: {
      proje_id: proje.id,
      ad: "Yapılacak",
      sira: siraSonuna(null),
    },
  });
  const kart = await adminDb.kart.create({
    data: {
      liste_id: liste.id,
      baslik: "Test kart",
      sira: siraSonuna(null),
    },
  });
  kartId = kart.id;
});

describe("kartHedefKurumEkle", () => {
  it("happy: hedef kurumu ekler", async () => {
    const hedef = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Şifa Eczanesi",
    });

    await kartHedefKurumEkle(ortam.kurum.id, kartId, hedef.id);

    const kayitlar = await adminDb.kartHedefKurumu.findMany({
      where: { kart_id: kartId },
    });
    expect(kayitlar).toHaveLength(1);
    expect(kayitlar[0]?.kurum_id).toBe(hedef.id);
  });

  it("aynı çift idempotent — hata atmaz", async () => {
    const hedef = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Eczane",
    });

    await kartHedefKurumEkle(ortam.kurum.id, kartId, hedef.id);
    await expect(
      kartHedefKurumEkle(ortam.kurum.id, kartId, hedef.id),
    ).resolves.not.toThrow();

    const sayim = await adminDb.kartHedefKurumu.count({
      where: { kart_id: kartId },
    });
    expect(sayim).toBe(1);
  });

  it("silinmiş kurum hedef olarak reddedilir", async () => {
    const hedef = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Silinen",
    });
    await adminDb.kurum.update({
      where: { id: hedef.id },
      data: { silindi_mi: true },
    });

    await expect(
      kartHedefKurumEkle(ortam.kurum.id, kartId, hedef.id),
    ).rejects.toThrow(/geçerli değil/);
  });

  it("başka kurumun kartına eklenemez (cross-tenant)", async () => {
    const hedef = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X",
    });

    // Başka kurumun kartına erişim — kart digerKurum'da olduğunu varsay
    await expect(
      kartHedefKurumEkle(ortam.digerKurum.id, kartId, hedef.id),
    ).rejects.toThrow(/Kart bulunamadı/);
  });
});

describe("kartHedefKurumlariniListele", () => {
  it("eklenme sırasına göre listeler", async () => {
    const a = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "A Eczanesi",
    });
    const b = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "B Eczanesi",
    });

    await kartHedefKurumEkle(ortam.kurum.id, kartId, a.id);
    await new Promise((r) => setTimeout(r, 5));
    await kartHedefKurumEkle(ortam.kurum.id, kartId, b.id);

    const liste = await kartHedefKurumlariniListele(ortam.kurum.id, kartId);
    expect(liste).toHaveLength(2);
    expect(liste[0]?.kurum_id).toBe(a.id);
    expect(liste[1]?.kurum_id).toBe(b.id);
    expect(liste[0]?.ad).toBe("A Eczanesi");
    expect(liste[0]?.tip).toBe("ECZANE");
  });

  it("hedef yoksa boş array", async () => {
    const liste = await kartHedefKurumlariniListele(ortam.kurum.id, kartId);
    expect(liste).toEqual([]);
  });
});

describe("kartHedefKurumKaldir", () => {
  it("happy: kaldırır", async () => {
    const hedef = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X",
    });
    await kartHedefKurumEkle(ortam.kurum.id, kartId, hedef.id);
    await kartHedefKurumKaldir(ortam.kurum.id, kartId, hedef.id);

    const sayim = await adminDb.kartHedefKurumu.count({
      where: { kart_id: kartId },
    });
    expect(sayim).toBe(0);
  });

  it("var olmayan bağlantıyı kaldırma BULUNAMADI", async () => {
    const hedef = await kurumOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X",
    });
    await expect(
      kartHedefKurumKaldir(ortam.kurum.id, kartId, hedef.id),
    ).rejects.toThrow(/bulunamadı/i);
  });
});
