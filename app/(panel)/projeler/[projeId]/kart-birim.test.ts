import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kartBirimleriniListele,
  kartBirimEkle,
  kartBirimKaldir,
} from "./kart-birim";
import { ortamKur, type Ortam } from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";
import { birimOlustur } from "../../ayarlar/birimler/services";
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
      ad: "Test Proje",
      sira: siraSonuna(null),
      birimler: { create: { birim_id: ortam.birim.id } },
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

describe("kartBirimEkle", () => {
  it("happy: birimi ekler", async () => {
    const hedef = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Şifa Eczanesi",
    });

    await kartBirimEkle(ortam.birim.id, kartId, hedef.id);

    const kayitlar = await adminDb.kartBirimi.findMany({
      where: { kart_id: kartId },
    });
    expect(kayitlar).toHaveLength(1);
    expect(kayitlar[0]?.birim_id).toBe(hedef.id);
  });

  it("aynı çift idempotent — hata atmaz", async () => {
    const hedef = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Eczane",
    });

    await kartBirimEkle(ortam.birim.id, kartId, hedef.id);
    await expect(
      kartBirimEkle(ortam.birim.id, kartId, hedef.id),
    ).resolves.not.toThrow();

    const sayim = await adminDb.kartBirimi.count({
      where: { kart_id: kartId },
    });
    expect(sayim).toBe(1);
  });

  it("silinmiş birim hedef olarak reddedilir", async () => {
    const hedef = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Silinen",
    });
    await adminDb.birim.update({
      where: { id: hedef.id },
      data: { silindi_mi: true },
    });

    await expect(
      kartBirimEkle(ortam.birim.id, kartId, hedef.id),
    ).rejects.toThrow(/geçerli değil/);
  });

  it("farklı birim oturumu da karta hedef ekleyebilir (tek-birim mimarisi)", async () => {
    // ADR-0007 — birim izolasyonu kaldırıldı; erişim ProjeUyesi seviyesinde
    // (test fixtures sahibi superAdmin proje üyesi olduğu için ekleme başarılı).
    const hedef = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X",
    });
    await expect(
      kartBirimEkle(ortam.digerBirim.id, kartId, hedef.id),
    ).resolves.not.toThrow();
  });
});

describe("kartBirimleriniListele", () => {
  it("eklenme sırasına göre listeler", async () => {
    const a = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "A Eczanesi",
    });
    const b = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "B Eczanesi",
    });

    await kartBirimEkle(ortam.birim.id, kartId, a.id);
    await new Promise((r) => setTimeout(r, 5));
    await kartBirimEkle(ortam.birim.id, kartId, b.id);

    const liste = await kartBirimleriniListele(ortam.birim.id, kartId);
    expect(liste).toHaveLength(2);
    expect(liste[0]?.birim_id).toBe(a.id);
    expect(liste[1]?.birim_id).toBe(b.id);
    expect(liste[0]?.ad).toBe("A Eczanesi");
    expect(liste[0]?.tip).toBe("ECZANE");
  });

  it("hedef yoksa boş array", async () => {
    const liste = await kartBirimleriniListele(ortam.birim.id, kartId);
    expect(liste).toEqual([]);
  });
});

describe("kartBirimKaldir", () => {
  it("happy: kaldırır", async () => {
    const hedef = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X",
    });
    await kartBirimEkle(ortam.birim.id, kartId, hedef.id);
    await kartBirimKaldir(ortam.birim.id, kartId, hedef.id);

    const sayim = await adminDb.kartBirimi.count({
      where: { kart_id: kartId },
    });
    expect(sayim).toBe(0);
  });

  it("var olmayan bağlantıyı kaldırma BULUNAMADI", async () => {
    const hedef = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X",
    });
    await expect(
      kartBirimKaldir(ortam.birim.id, kartId, hedef.id),
    ).rejects.toThrow(/bulunamadı/i);
  });
});
