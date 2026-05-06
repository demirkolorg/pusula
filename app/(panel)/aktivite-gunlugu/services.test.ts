import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  aktiviteBaglamSecenekleriGetir,
  aktiviteGunluguListele,
} from "./services";
import {
  kartOlusturFiks,
  listeOlusturFiks,
  ortamKur,
  projeOlusturFiks,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;

beforeAll(async () => {
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
  ortam = await ortamKur(adminDb);
});

describe("aktiviteGunluguListele", () => {
  it("proje, liste ve kart filtresini server tarafında uygular", async () => {
    const projeA = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Kış Tedbirleri",
    });
    const projeB = await projeOlusturFiks(adminDb, {
      birimId: ortam.digerBirim.id,
      ad: "Yaz Hazırlığı",
    });
    const listeA = await listeOlusturFiks(adminDb, {
      projeId: projeA.id,
      ad: "Planlama",
    });
    const listeB = await listeOlusturFiks(adminDb, {
      projeId: projeB.id,
      ad: "Saha",
    });
    const kartA = await kartOlusturFiks(adminDb, {
      listeId: listeA.id,
      baslik: "Tuz stoğu",
    });
    const kartB = await kartOlusturFiks(adminDb, {
      listeId: listeB.id,
      baslik: "Sulama planı",
    });

    await adminDb.aktiviteLogu.createMany({
      data: [
        {
          kullanici_id: ortam.personel.id,
          islem: "UPDATE",
          kaynak_tip: "Kart",
          kaynak_id: kartA.id,
        },
        {
          kullanici_id: ortam.personel.id,
          islem: "UPDATE",
          kaynak_tip: "Kart",
          kaynak_id: kartB.id,
        },
      ],
    });

    const projeSonucu = await aktiviteGunluguListele(ortam.superAdmin.id, {
      limit: 50,
      kapsam: "tum",
      proje_id: projeA.id,
    });
    const listeSonucu = await aktiviteGunluguListele(ortam.superAdmin.id, {
      limit: 50,
      kapsam: "tum",
      liste_id: listeA.id,
    });
    const kartSonucu = await aktiviteGunluguListele(ortam.superAdmin.id, {
      limit: 50,
      kapsam: "tum",
      kart_id: kartA.id,
    });

    expect(projeSonucu.kayitlar.map((k) => k.kaynak_id)).toEqual([kartA.id]);
    expect(listeSonucu.kayitlar.map((k) => k.kaynak_id)).toEqual([kartA.id]);
    expect(kartSonucu.kayitlar.map((k) => k.kaynak_id)).toEqual([kartA.id]);
  });

  it("bildirim altyapısı kaynaklarını varsayılan akıştan gizler", async () => {
    await adminDb.aktiviteLogu.createMany({
      data: [
        { kullanici_id: ortam.personel.id, islem: "UPDATE", kaynak_tip: "Bildirim" },
        { kullanici_id: ortam.personel.id, islem: "CREATE", kaynak_tip: "Proje" },
      ],
    });

    const sonuc = await aktiviteGunluguListele(ortam.superAdmin.id, {
      limit: 50,
      kapsam: "tum",
    });

    expect(sonuc.kayitlar).toHaveLength(1);
    expect(sonuc.kayitlar[0]!.kaynak_tip).toBe("Proje");
  });
});

describe("aktiviteBaglamSecenekleriGetir", () => {
  it("proje, liste ve kart seçeneklerini Türkçe etiketlenecek veriyle döndürür", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Afet Koordinasyonu",
    });
    const liste = await listeOlusturFiks(adminDb, {
      projeId: proje.id,
      ad: "Planlama",
    });
    const kart = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Görev dağılımı",
    });

    const sonuc = await aktiviteBaglamSecenekleriGetir(ortam.superAdmin.id);

    expect(sonuc.projeler).toContainEqual({ id: proje.id, ad: proje.ad });
    expect(sonuc.listeler).toContainEqual({
      id: liste.id,
      ad: liste.ad,
      proje_id: proje.id,
    });
    expect(sonuc.kartlar).toContainEqual({
      id: kart.id,
      baslik: kart.baslik,
      liste_id: liste.id,
      proje_id: proje.id,
    });
  });
});
