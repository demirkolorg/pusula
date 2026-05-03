import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kartYorumlariniListele,
  yorumGuncelle,
  yorumOlustur,
  yorumSil,
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

async function sahipliProjeOlustur(kurumId: string, sahipId: string) {
  const p = await projeOlusturFiks(adminDb, { kurumId, olusturanId: sahipId });
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
  const proje = await sahipliProjeOlustur(ortam.kurum.id, ortam.superAdmin.id);
  const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
  kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
});

describe("yorumOlustur + listele", () => {
  it("yorum eklenir, listede yazan bilgisi ile döner", async () => {
    const y = await yorumOlustur(ortam.kurum.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      icerik: "İlk yorum",
    });
    expect(y.icerik).toBe("İlk yorum");
    expect(y.yazan.email).toBe(ortam.superAdmin.email);

    const liste = await kartYorumlariniListele(ortam.kurum.id, kart.id);
    expect(liste).toHaveLength(1);
    expect(liste[0]!.duzenlendi_mi).toBe(false);
  });

  it("yanıt yorum aynı kartta olmalı", async () => {
    const proje2 = await sahipliProjeOlustur(ortam.kurum.id, ortam.superAdmin.id);
    const liste2 = await listeOlusturFiks(adminDb, { projeId: proje2.id });
    const baskaKart = await kartOlusturFiks(adminDb, { listeId: liste2.id });
    const y1 = await yorumOlustur(ortam.kurum.id, ortam.superAdmin.id, {
      kart_id: baskaKart.id,
      icerik: "Birinci",
    });

    await expect(
      yorumOlustur(ortam.kurum.id, ortam.superAdmin.id, {
        kart_id: kart.id,
        icerik: "Yanıt başka karttan",
        yanit_yorum_id: y1.id,
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });
});

describe("yorumGuncelle", () => {
  it("sadece yazan kendi yorumunu güncelleyebilir", async () => {
    const y = await yorumOlustur(ortam.kurum.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      icerik: "Asıl",
    });

    // Personel projeye üye değil ama services seviyesinde yetki kontrolü
    // sadece "yazan_id == silenId" çıkışı YETKISIZ verir.
    await expect(
      yorumGuncelle(ortam.kurum.id, ortam.personel.id, {
        id: y.id,
        icerik: "Hile",
      }),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });

    await yorumGuncelle(ortam.kurum.id, ortam.superAdmin.id, {
      id: y.id,
      icerik: "Düzeltildi",
    });
    const liste = await kartYorumlariniListele(ortam.kurum.id, kart.id);
    expect(liste[0]).toMatchObject({ icerik: "Düzeltildi", duzenlendi_mi: true });
  });
});

describe("yorumSil", () => {
  it("yazan kendi yorumunu silebilir (soft delete)", async () => {
    const y = await yorumOlustur(ortam.kurum.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      icerik: "Silinecek",
    });
    await yorumSil(ortam.kurum.id, ortam.superAdmin.id, y.id);
    const liste = await kartYorumlariniListele(ortam.kurum.id, kart.id);
    expect(liste).toEqual([]);
  });

  it("proje ADMIN başkasının yorumunu silebilir", async () => {
    // Personeli projeye NORMAL üye yap, yorum ekletsin
    const proje = await adminDb.projeUyesi.findFirst({
      where: { kullanici_id: ortam.superAdmin.id },
      select: { proje_id: true },
    });
    await adminDb.projeUyesi.create({
      data: {
        proje_id: proje!.proje_id,
        kullanici_id: ortam.personel.id,
        seviye: "NORMAL",
      },
    });
    const y = await yorumOlustur(ortam.kurum.id, ortam.personel.id, {
      kart_id: kart.id,
      icerik: "Personel yorumu",
    });

    // SuperAdmin (ADMIN) silebilmeli
    await yorumSil(ortam.kurum.id, ortam.superAdmin.id, y.id);
    const liste = await kartYorumlariniListele(ortam.kurum.id, kart.id);
    expect(liste).toEqual([]);
  });

  it("ne yazan ne admin başkasının yorumunu silemez", async () => {
    // diger kullanıcı (başka kurumdan) -> kart erişimi BULUNAMADI
    const y = await yorumOlustur(ortam.kurum.id, ortam.superAdmin.id, {
      kart_id: kart.id,
      icerik: "Sahip",
    });
    await expect(
      yorumSil(ortam.kurum.id, ortam.personel.id, y.id),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });
  });
});
