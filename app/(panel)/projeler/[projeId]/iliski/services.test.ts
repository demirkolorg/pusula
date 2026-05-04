import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  iliskiOlustur,
  iliskiSil,
  kartinIliskileri,
  projedeKartiAra,
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
let projeId: string;
let kartA: { id: string };
let kartB: { id: string };

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
  kartA = await kartOlusturFiks(adminDb, { listeId: liste.id, baslik: "A" });
  kartB = await kartOlusturFiks(adminDb, { listeId: liste.id, baslik: "B" });
});

describe("iliskiOlustur", () => {
  it("aynı projedeki iki kart arasında BLOCKS ilişkisi kurulur", async () => {
    const r = await iliskiOlustur(ortam.birim.id, {
      kart_a_id: kartA.id,
      kart_b_id: kartB.id,
      tip: "BLOCKS",
    });
    expect(r.id).toBeTruthy();

    const aIliski = await kartinIliskileri(ortam.birim.id, kartA.id);
    expect(aIliski).toHaveLength(1);
    expect(aIliski[0]).toMatchObject({
      tip: "BLOCKS",
      yon: "giden",
    });
    expect(aIliski[0]!.diger_kart.id).toBe(kartB.id);

    // B tarafından da görünür ama yön gelen
    const bIliski = await kartinIliskileri(ortam.birim.id, kartB.id);
    expect(bIliski[0]).toMatchObject({ tip: "BLOCKS", yon: "gelen" });
  });

  it("kart kendisiyle ilişkilendirilemez", async () => {
    await expect(
      iliskiOlustur(ortam.birim.id, {
        kart_a_id: kartA.id,
        kart_b_id: kartA.id,
        tip: "RELATES",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("farklı projedeki kartlar ilişkilendirilemez", async () => {
    const proje2 = await sahipliProjeOlustur(ortam.birim.id, ortam.superAdmin.id);
    const liste2 = await listeOlusturFiks(adminDb, { projeId: proje2.id });
    const baska = await kartOlusturFiks(adminDb, { listeId: liste2.id });
    await expect(
      iliskiOlustur(ortam.birim.id, {
        kart_a_id: kartA.id,
        kart_b_id: baska.id,
        tip: "RELATES",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("aynı (a,b,tip) çifti için duplicate eklenemez (P2002)", async () => {
    await iliskiOlustur(ortam.birim.id, {
      kart_a_id: kartA.id,
      kart_b_id: kartB.id,
      tip: "RELATES",
    });
    await expect(
      iliskiOlustur(ortam.birim.id, {
        kart_a_id: kartA.id,
        kart_b_id: kartB.id,
        tip: "RELATES",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });
});

describe("iliskiSil", () => {
  it("ilişki silinir, listeden düşer", async () => {
    const r = await iliskiOlustur(ortam.birim.id, {
      kart_a_id: kartA.id,
      kart_b_id: kartB.id,
      tip: "RELATES",
    });
    await iliskiSil(ortam.birim.id, r.id);
    const aIliski = await kartinIliskileri(ortam.birim.id, kartA.id);
    expect(aIliski).toEqual([]);
  });
});

describe("projedeKartiAra", () => {
  it("haric_kart_id verilince o kart sonuçtan düşer", async () => {
    const sonuc = await projedeKartiAra(ortam.birim.id, {
      proje_id: projeId,
      haric_kart_id: kartA.id,
    });
    expect(sonuc.find((k) => k.id === kartA.id)).toBeUndefined();
    expect(sonuc.find((k) => k.id === kartB.id)).toBeDefined();
  });

  it("q ile başlık contains araması (case-insensitive)", async () => {
    const sonuc = await projedeKartiAra(ortam.birim.id, {
      proje_id: projeId,
      q: "a",
    });
    expect(sonuc.find((k) => k.id === kartA.id)).toBeDefined();
  });
});
