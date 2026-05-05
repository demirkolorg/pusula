import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kartaYetkiliEkle,
  kartaYetkiliKaldir,
  kartinYetkilileri,
  projeAdayKullanicilariniAra,
  projeYetkilileriniListele,
  projeyeYetkiliEkle,
  projeyeYetkiliKaldir,
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
let proje: { id: string };

// projeOlusturFiks raw create (ProjeYetkilisi otomatik eklenmez). Bizde
// her test için sahip yetkili bir proje gerekli — helper ile setup.
async function sahipliProjeOlustur(
  birimId: string,
  sahipId: string,
): Promise<{ id: string }> {
  const p = await projeOlusturFiks(adminDb, {
    birimId,
    olusturanId: sahipId,
  });
  await adminDb.projeYetkilisi.create({
    data: { proje_id: p.id, kullanici_id: sahipId },
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
  proje = await sahipliProjeOlustur(ortam.birim.id, ortam.superAdmin.id);
});

// =====================================================================
// Proje yetkili yönetimi (ADR-0012: seviye yok)
// =====================================================================

describe("projeYetkilileriniListele", () => {
  it("projedeki yetkilileri kullanıcı bilgileriyle döner", async () => {
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
    });

    const liste = await projeYetkilileriniListele(ortam.birim.id, proje.id);
    expect(liste).toHaveLength(2);
    const personelYetkili = liste.find((u) => u.kullanici_id === ortam.personel.id);
    expect(personelYetkili?.email).toBe(ortam.personel.email);
  });
});

describe("projeyeYetkiliEkle", () => {
  it("aynı kullanıcı iki kez eklenince GECERSIZ_GIRDI hatası", async () => {
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
    });
    await expect(
      projeyeYetkiliEkle(ortam.birim.id, {
        proje_id: proje.id,
        kullanici_id: ortam.personel.id,
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("farklı birim kullanıcısı projeye eklenebilir (sistem geneli atama)", async () => {
    const yeni = await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.digerKullanici.id,
    });
    expect(yeni.kullanici_id).toBe(ortam.digerKullanici.id);
  });

  it("var olmayan/silinmiş kullanıcı eklenemez", async () => {
    await expect(
      projeyeYetkiliEkle(ortam.birim.id, {
        proje_id: proje.id,
        kullanici_id: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

describe("projeyeYetkiliKaldir", () => {
  it("son yetkili çıkarılamaz", async () => {
    await expect(
      projeyeYetkiliKaldir(ortam.birim.id, proje.id, ortam.superAdmin.id),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("birden fazla yetkili varken biri çıkarılabilir", async () => {
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
    });
    await projeyeYetkiliKaldir(ortam.birim.id, proje.id, ortam.personel.id);
    const liste = await projeYetkilileriniListele(ortam.birim.id, proje.id);
    expect(liste.find((u) => u.kullanici_id === ortam.personel.id)).toBeUndefined();
  });

  it("proje yetkisi kaldırılınca doğrudan kart yetkisi korunur", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
    });
    await kartaYetkiliEkle(ortam.birim.id, kart.id, ortam.personel.id);

    await projeyeYetkiliKaldir(ortam.birim.id, proje.id, ortam.personel.id);

    const kartYetkilileri = await kartinYetkilileri(ortam.birim.id, kart.id);
    expect(kartYetkilileri.map((u) => u.kullanici_id)).toEqual([
      ortam.personel.id,
    ]);
    const projeYetkilileri = await projeYetkilileriniListele(ortam.birim.id, proje.id);
    expect(projeYetkilileri.find((u) => u.kullanici_id === ortam.personel.id)).toBeUndefined();
  });
});

describe("projeAdayKullanicilariniAra", () => {
  it("proje yetkilisi olmayanları sistem genelinden döner (birim sınırı yok)", async () => {
    const adaylar = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
    });
    expect(adaylar.find((a) => a.id === ortam.superAdmin.id)).toBeUndefined();
    expect(adaylar.find((a) => a.id === ortam.personel.id)).toBeDefined();
    expect(adaylar.find((a) => a.id === ortam.digerKullanici.id)).toBeDefined();
  });

  it("birim adına göre arama eşleşir", async () => {
    const adaylar = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
      q: "Test Birim B",
    });
    expect(adaylar.find((a) => a.id === ortam.digerKullanici.id)).toBeDefined();
    expect(adaylar.find((a) => a.id === ortam.personel.id)).toBeUndefined();
  });

  it("ad/email araması eşleşir", async () => {
    const personel = await adminDb.kullanici.findUnique({
      where: { id: ortam.personel.id },
      select: { ad: true, email: true },
    });
    if (!personel) throw new Error("personel bulunamadı");
    const adAramasi = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
      q: personel.ad.slice(0, 3),
    });
    expect(adAramasi.find((a) => a.id === ortam.personel.id)).toBeDefined();

    const emailAramasi = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
      q: personel.email.split("@")[0]!,
    });
    expect(emailAramasi.find((a) => a.id === ortam.personel.id)).toBeDefined();
  });

  it("aday satırında birim bilgisi de döner", async () => {
    const adaylar = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
    });
    const personel = adaylar.find((a) => a.id === ortam.personel.id);
    expect(personel).toBeDefined();
    expect(typeof personel?.birim_ad).toBe("string");
    expect(personel?.birim_ad?.length ?? 0).toBeGreaterThan(0);
  });
});

// =====================================================================
// Karta yetkili atama
// =====================================================================

describe("kartaYetkiliEkle", () => {
  it("aktif kullanıcı doğrudan karta yetkili atanabilir", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await kartaYetkiliEkle(ortam.birim.id, kart.id, ortam.personel.id);
    const yetkililer = await kartinYetkilileri(ortam.birim.id, kart.id);
    expect(yetkililer.map((u) => u.kullanici_id)).toEqual([ortam.personel.id]);
  });

  it("karta yetkili atama idempotent çalışır", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
    });

    await kartaYetkiliEkle(ortam.birim.id, kart.id, ortam.personel.id);
    await kartaYetkiliEkle(ortam.birim.id, kart.id, ortam.personel.id);

    const yetkililer = await kartinYetkilileri(ortam.birim.id, kart.id);
    expect(yetkililer.map((u) => u.kullanici_id)).toEqual([ortam.personel.id]);
  });
});

describe("kartaYetkiliKaldir", () => {
  it("yetkiliyi karttan çıkarır, var olmayan idempotent", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
    });
    await kartaYetkiliEkle(ortam.birim.id, kart.id, ortam.personel.id);

    await kartaYetkiliKaldir(ortam.birim.id, kart.id, ortam.personel.id);
    await kartaYetkiliKaldir(ortam.birim.id, kart.id, ortam.personel.id);

    const yetkililer = await kartinYetkilileri(ortam.birim.id, kart.id);
    expect(yetkililer).toEqual([]);
  });
});
