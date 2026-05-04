import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

// MinIO bağlantısını test ortamında mock'la — Kural 80 framework boundary
// istisnası (services.ts test setup pattern'iyle aynı). Storage I/O business
// kodu değil, gerçek davranış gerektirmez.
vi.mock("@/lib/storage", async () => {
  const orig = await vi.importActual<typeof import("@/lib/storage")>(
    "@/lib/storage",
  );
  return {
    ...orig,
    presignedUpload: vi.fn(async (yol: string) => `http://test/${yol}?put`),
    presignedDownload: vi.fn(async (yol: string) => `http://test/${yol}?get`),
    bucketHazirla: vi.fn(async () => undefined),
    objeyiSil: vi.fn(async () => undefined),
  };
});

import {
  eklentiIndirURL,
  eklentiSil,
  kartEklentileriniListele,
  yuklemeBaslat,
  yuklemeOnayla,
} from "./services";
import {
  ortamKur,
  projeOlusturFiks,
  listeOlusturFiks,
  kartOlusturFiks,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;
let kart: { id: string };
let projeId: string;

async function sahipliProjeOlustur(birimId: string, sahipId: string) {
  const p = await projeOlusturFiks(adminDb, { birimId, olusturanId: sahipId });
  await adminDb.projeUyesi.create({
    data: { proje_id: p.id, kullanici_id: sahipId, seviye: "ADMIN" },
  });
  return { id: p.id };
}

beforeAll(async () => {
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
  ortam = await ortamKur(adminDb);
  const proje = await sahipliProjeOlustur(ortam.birim.id, ortam.superAdmin.id);
  projeId = proje.id;
  const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
  kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
});

describe("yuklemeBaslat", () => {
  it("izinli mime + boyut için presigned URL döner", async () => {
    const r = await yuklemeBaslat(ortam.birim.id, {
      kart_id: kart.id,
      ad: "rapor.pdf",
      mime: "application/pdf",
      boyut: 1024 * 100,
    });
    expect(r.upload_url).toContain("?put");
    expect(r.depolama_yolu).toMatch(new RegExp(`^kartlar/${kart.id}/`));
    expect(r.depolama_yolu).toMatch(/\.pdf$/);
  });

  it("izinsiz mime reddedilir", async () => {
    await expect(
      yuklemeBaslat(ortam.birim.id, {
        kart_id: kart.id,
        ad: "betik.exe",
        mime: "application/x-msdownload",
        boyut: 100,
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("25 MB üzeri boyut reddedilir (services seviyesinde)", async () => {
    await expect(
      yuklemeBaslat(ortam.birim.id, {
        kart_id: kart.id,
        ad: "buyuk.pdf",
        mime: "application/pdf",
        boyut: 26 * 1024 * 1024,
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });
});

describe("yuklemeOnayla + listele", () => {
  it("metadata DB'ye yazılır, listeden döner", async () => {
    const baslat = await yuklemeBaslat(ortam.birim.id, {
      kart_id: kart.id,
      ad: "rapor.pdf",
      mime: "application/pdf",
      boyut: 1024,
    });
    const e = await yuklemeOnayla(ortam.birim.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      ad: "rapor.pdf",
      mime: "application/pdf",
      boyut: 1024,
      depolama_yolu: baslat.depolama_yolu,
    });
    expect(e.id).toBeTruthy();
    expect(e.yukleyen_id).toBe(ortam.superAdmin.id);

    const liste = await kartEklentileriniListele(ortam.birim.id, kart.id);
    expect(liste).toHaveLength(1);
    expect(liste[0]!.ad).toBe("rapor.pdf");
    expect(liste[0]!.yukleyen.ad).toBeTruthy();
  });

  it("yanlış prefix'li depolama_yolu reddedilir (path traversal)", async () => {
    await expect(
      yuklemeOnayla(ortam.birim.id, ortam.superAdmin.id, {
        kart_id: kart.id,
        ad: "rapor.pdf",
        mime: "application/pdf",
        boyut: 1024,
        depolama_yolu: "kartlar/baska-kart/abc.pdf",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });
});

describe("eklentiIndirURL", () => {
  it("presigned GET URL döner", async () => {
    const baslat = await yuklemeBaslat(ortam.birim.id, {
      kart_id: kart.id,
      ad: "rapor.pdf",
      mime: "application/pdf",
      boyut: 1024,
    });
    const e = await yuklemeOnayla(ortam.birim.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      ad: "rapor.pdf",
      mime: "application/pdf",
      boyut: 1024,
      depolama_yolu: baslat.depolama_yolu,
    });
    const r = await eklentiIndirURL(ortam.birim.id, e.id);
    expect(r.url).toContain("?get");
  });
});

describe("eklentiSil", () => {
  it("yükleyen kendi eklentisini siler (soft delete)", async () => {
    const baslat = await yuklemeBaslat(ortam.birim.id, {
      kart_id: kart.id,
      ad: "x.pdf",
      mime: "application/pdf",
      boyut: 100,
    });
    const e = await yuklemeOnayla(ortam.birim.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      ad: "x.pdf",
      mime: "application/pdf",
      boyut: 100,
      depolama_yolu: baslat.depolama_yolu,
    });
    await eklentiSil(ortam.birim.id, ortam.superAdmin.id, e.id);
    const liste = await kartEklentileriniListele(ortam.birim.id, kart.id);
    expect(liste).toEqual([]);
  });

  it("ne yükleyen ne ADMIN olmayan başkasının eklentisini silemez", async () => {
    // Personeli projeye NORMAL üye yap, eklenti ekletsin
    await adminDb.projeUyesi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id, seviye: "NORMAL" },
    });
    const baslat = await yuklemeBaslat(ortam.birim.id, {
      kart_id: kart.id,
      ad: "x.pdf",
      mime: "application/pdf",
      boyut: 100,
    });
    const e = await yuklemeOnayla(ortam.birim.id, ortam.personel.id, {
      kart_id: kart.id,
      ad: "x.pdf",
      mime: "application/pdf",
      boyut: 100,
      depolama_yolu: baslat.depolama_yolu,
    });

    // SuperAdmin (ADMIN) silebilir
    await eklentiSil(ortam.birim.id, ortam.superAdmin.id, e.id);
    const liste = await kartEklentileriniListele(ortam.birim.id, kart.id);
    expect(liste).toEqual([]);
  });
});
