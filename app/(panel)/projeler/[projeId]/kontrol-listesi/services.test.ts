import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kartKontrolListeleriniListele,
  kontrolListesiGuncelle,
  kontrolListesiOlustur,
  kontrolListesiSil,
  maddeGuncelle,
  maddeOlustur,
  maddeSil,
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

// =====================================================================
// Kontrol Listesi
// =====================================================================

describe("kontrolListesiOlustur + listele", () => {
  it("kart için kontrol listesi oluşturur, sıralı döner", async () => {
    const kl1 = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "Liste 1",
    });
    const kl2 = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "Liste 2",
    });

    const liste = await kartKontrolListeleriniListele(ortam.birim.id, kart.id);
    expect(liste).toHaveLength(2);
    expect(liste[0]!.id).toBe(kl1.id);
    expect(liste[1]!.id).toBe(kl2.id);
    expect(liste[0]!.maddeler).toEqual([]);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

describe("kontrolListesiSil", () => {
  it("kontrol listesi silinince maddeler de cascade gider", async () => {
    const kl = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "X",
    });
    await maddeOlustur(ortam.birim.id, {
      kontrol_listesi_id: kl.id,
      metin: "Madde 1",
    });
    await kontrolListesiSil(ortam.birim.id, kl.id);
    const maddeler = await adminDb.kontrolMaddesi.findMany({
      where: { kontrol_listesi_id: kl.id },
    });
    expect(maddeler).toEqual([]);
  });
});

describe("kontrolListesiGuncelle", () => {
  it("ad güncellenir", async () => {
    const kl = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "Eski",
    });
    await kontrolListesiGuncelle(ortam.birim.id, { id: kl.id, ad: "Yeni" });
    const liste = await kartKontrolListeleriniListele(ortam.birim.id, kart.id);
    expect(liste[0]!.ad).toBe("Yeni");
  });
});

// =====================================================================
// Madde
// =====================================================================

describe("maddeOlustur + guncelle (tamamla)", () => {
  it("madde tamamlanınca tamamlama_zamani ve tamamlayan_id set edilir", async () => {
    const kl = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "X",
    });
    const m = await maddeOlustur(ortam.birim.id, {
      kontrol_listesi_id: kl.id,
      metin: "Yap",
    });
    expect(m.tamamlandi_mi).toBe(false);

    await maddeGuncelle(ortam.birim.id, ortam.superAdmin.id, {
      id: m.id,
      tamamlandi_mi: true,
    });
    const liste = await kartKontrolListeleriniListele(ortam.birim.id, kart.id);
    const guncel = liste[0]!.maddeler[0]!;
    expect(guncel.tamamlandi_mi).toBe(true);
    expect(guncel.tamamlama_zamani).toBeInstanceOf(Date);
    expect(guncel.tamamlayan_id).toBe(ortam.superAdmin.id);

    // Tekrar uncheck → null
    await maddeGuncelle(ortam.birim.id, ortam.superAdmin.id, {
      id: m.id,
      tamamlandi_mi: false,
    });
    const liste2 = await kartKontrolListeleriniListele(ortam.birim.id, kart.id);
    expect(liste2[0]!.maddeler[0]!.tamamlandi_mi).toBe(false);
    expect(liste2[0]!.maddeler[0]!.tamamlayan_id).toBeNull();
  });

  it("proje üyesi olmayan kullanıcıya madde atanamaz", async () => {
    const kl = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "X",
    });
    await expect(
      maddeOlustur(ortam.birim.id, {
        kontrol_listesi_id: kl.id,
        metin: "Yap",
        atanan_id: ortam.personel.id, // proje üyesi değil
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("proje üyesi olunca madde atanabilir + atanan ad/soyad döner", async () => {
    await adminDb.projeUyesi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id, seviye: "NORMAL" },
    });
    const kl = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "X",
    });
    const m = await maddeOlustur(ortam.birim.id, {
      kontrol_listesi_id: kl.id,
      metin: "Yap",
      atanan_id: ortam.personel.id,
    });
    expect(m.atanan_id).toBe(ortam.personel.id);
    expect(m.atanan?.ad).toBeTruthy();
  });
});

describe("maddeSil", () => {
  it("maddeyi siler", async () => {
    const kl = await kontrolListesiOlustur(ortam.birim.id, {
      kart_id: kart.id,
      ad: "X",
    });
    const m = await maddeOlustur(ortam.birim.id, {
      kontrol_listesi_id: kl.id,
      metin: "Yap",
    });
    await maddeSil(ortam.birim.id, m.id);
    const liste = await kartKontrolListeleriniListele(ortam.birim.id, kart.id);
    expect(liste[0]!.maddeler).toEqual([]);
  });
});
