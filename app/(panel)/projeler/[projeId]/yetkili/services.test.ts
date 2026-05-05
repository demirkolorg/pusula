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
  projeYetkilisiSeviyeGuncelle,
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
// her test için sahip-ADMIN bir proje gerekli — helper ile setup.
async function sahipliProjeOlustur(
  birimId: string,
  sahipId: string,
): Promise<{ id: string }> {
  const p = await projeOlusturFiks(adminDb, {
    birimId,
    olusturanId: sahipId,
  });
  await adminDb.projeYetkilisi.create({
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
  proje = await sahipliProjeOlustur(ortam.birim.id, ortam.superAdmin.id);
});

// =====================================================================
// Proje yetkili yönetimi
// =====================================================================

describe("projeYetkilileriniListele", () => {
  it("projedeki yetkilileri kullanıcı bilgileriyle döner", async () => {
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });

    const liste = await projeYetkilileriniListele(ortam.birim.id, proje.id);
    expect(liste).toHaveLength(2);
    expect(liste.find((u) => u.kullanici_id === ortam.superAdmin.id)?.seviye).toBe("ADMIN");
    const personelYetkili = liste.find((u) => u.kullanici_id === ortam.personel.id);
    expect(personelYetkili?.seviye).toBe("NORMAL");
    expect(personelYetkili?.email).toBe(ortam.personel.email);
  });
});

describe("projeyeYetkiliEkle", () => {
  it("aynı kullanıcı iki kez eklenince GECERSIZ_GIRDI hatası", async () => {
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });
    await expect(
      projeyeYetkiliEkle(ortam.birim.id, {
        proje_id: proje.id,
        kullanici_id: ortam.personel.id,
        seviye: "NORMAL",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("farklı birim kullanıcısı projeye eklenebilir (sistem geneli atama)", async () => {
    // Mimari karar: aday havuzu sistem geneli, projeye farklı birim
    // kullanıcısı atanabilir. İzolasyon proje yetkisi seviyesinde değil
    // proje erişimi seviyesindedir.
    const yeni = await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.digerKullanici.id,
      seviye: "NORMAL",
    });
    expect(yeni.kullanici_id).toBe(ortam.digerKullanici.id);
    expect(yeni.seviye).toBe("NORMAL");
  });

  it("var olmayan/silinmiş kullanıcı eklenemez", async () => {
    await expect(
      projeyeYetkiliEkle(ortam.birim.id, {
        proje_id: proje.id,
        kullanici_id: "00000000-0000-0000-0000-000000000000",
        seviye: "NORMAL",
      }),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

describe("projeyeYetkiliKaldir", () => {
  it("son ADMIN çıkarılamaz", async () => {
    await expect(
      projeyeYetkiliKaldir(ortam.birim.id, proje.id, ortam.superAdmin.id),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("proje yetkisi kaldırılınca doğrudan kart yetkisi korunur", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
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

describe("projeYetkilisiSeviyeGuncelle", () => {
  it("son ADMIN'i NORMAL'e düşüremez", async () => {
    await expect(
      projeYetkilisiSeviyeGuncelle(ortam.birim.id, {
        proje_id: proje.id,
        kullanici_id: ortam.superAdmin.id,
        seviye: "NORMAL",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("ikinci ADMIN olunca ilk admin NORMAL'e düşürülebilir", async () => {
    await projeyeYetkiliEkle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "ADMIN",
    });
    await projeYetkilisiSeviyeGuncelle(ortam.birim.id, {
      proje_id: proje.id,
      kullanici_id: ortam.superAdmin.id,
      seviye: "NORMAL",
    });
    const liste = await projeYetkilileriniListele(ortam.birim.id, proje.id);
    expect(liste.find((u) => u.kullanici_id === ortam.superAdmin.id)?.seviye).toBe("NORMAL");
  });
});

describe("projeAdayKullanicilariniAra", () => {
  it("proje yetkilisi olmayanları sistem genelinden döner (birim sınırı yok)", async () => {
    const adaylar = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
    });
    // Proje yetkilisi olan superAdmin filtreli
    expect(adaylar.find((a) => a.id === ortam.superAdmin.id)).toBeUndefined();
    // Aynı birim personeli aday
    expect(adaylar.find((a) => a.id === ortam.personel.id)).toBeDefined();
    // Farklı birim kullanıcısı da aday (sistem geneli)
    expect(adaylar.find((a) => a.id === ortam.digerKullanici.id)).toBeDefined();
  });

  it("birim adına göre arama eşleşir", async () => {
    // Why: kullanıcı "Test Birim B" yazıp digerBirim'daki kullanıcılara
    // hızlıca süzebilmeli — birim.ad ve birim.kisa_ad da OR'da.
    const adaylar = await projeAdayKullanicilariniAra(ortam.birim.id, {
      proje_id: proje.id,
      q: "Test Birim B",
    });
    expect(adaylar.find((a) => a.id === ortam.digerKullanici.id)).toBeDefined();
    // Aynı birim personeli birim filtresine takılmaz (Test Birim eşleşse
    // bile B harfi yoksa eşleşmez — fixture: ortam.birim "Test Birim")
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
      seviye: "NORMAL",
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
      seviye: "NORMAL",
    });
    await kartaYetkiliEkle(ortam.birim.id, kart.id, ortam.personel.id);

    await kartaYetkiliKaldir(ortam.birim.id, kart.id, ortam.personel.id);
    await kartaYetkiliKaldir(ortam.birim.id, kart.id, ortam.personel.id);

    const yetkililer = await kartinYetkilileri(ortam.birim.id, kart.id);
    expect(yetkililer).toEqual([]);
  });
});
