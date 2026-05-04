import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kartaUyeEkle,
  kartaUyeKaldir,
  kartinUyeleri,
  projeAdayKullanicilariniAra,
  projeUyeleriniListele,
  projeUyesiSeviyeGuncelle,
  projeyeUyeEkle,
  projeyeUyeKaldir,
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

// projeOlusturFiks raw create (ProjeUyesi otomatik eklenmez). Bizde
// her test için sahip-ADMIN bir proje gerekli — helper ile setup.
async function sahipliProjeOlustur(
  kurumId: string,
  sahipId: string,
): Promise<{ id: string }> {
  const p = await projeOlusturFiks(adminDb, {
    kurumId,
    olusturanId: sahipId,
  });
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
  proje = await sahipliProjeOlustur(ortam.kurum.id, ortam.superAdmin.id);
});

// =====================================================================
// Proje üye yönetimi
// =====================================================================

describe("projeUyeleriniListele", () => {
  it("projedeki üyeleri kullanıcı bilgileriyle döner", async () => {
    await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });

    const liste = await projeUyeleriniListele(ortam.kurum.id, proje.id);
    expect(liste).toHaveLength(2);
    expect(liste.find((u) => u.kullanici_id === ortam.superAdmin.id)?.seviye).toBe("ADMIN");
    const personelUye = liste.find((u) => u.kullanici_id === ortam.personel.id);
    expect(personelUye?.seviye).toBe("NORMAL");
    expect(personelUye?.email).toBe(ortam.personel.email);
  });
});

describe("projeyeUyeEkle", () => {
  it("aynı kullanıcı iki kez eklenince GECERSIZ_GIRDI hatası", async () => {
    await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });
    await expect(
      projeyeUyeEkle(ortam.kurum.id, {
        proje_id: proje.id,
        kullanici_id: ortam.personel.id,
        seviye: "NORMAL",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("farklı kurum kullanıcısı projeye eklenebilir (sistem geneli atama)", async () => {
    // Mimari karar: aday havuzu sistem geneli, projeye farklı kurum
    // kullanıcısı atanabilir. İzolasyon proje üyeliği seviyesinde değil
    // proje erişimi seviyesindedir.
    const yeni = await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.digerKullanici.id,
      seviye: "NORMAL",
    });
    expect(yeni.kullanici_id).toBe(ortam.digerKullanici.id);
    expect(yeni.seviye).toBe("NORMAL");
  });

  it("var olmayan/silinmiş kullanıcı eklenemez", async () => {
    await expect(
      projeyeUyeEkle(ortam.kurum.id, {
        proje_id: proje.id,
        kullanici_id: "00000000-0000-0000-0000-000000000000",
        seviye: "NORMAL",
      }),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

describe("projeyeUyeKaldir", () => {
  it("son ADMIN çıkarılamaz", async () => {
    await expect(
      projeyeUyeKaldir(ortam.kurum.id, proje.id, ortam.superAdmin.id),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("üye kaldırılınca kart üyelikleri de silinir", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });
    await kartaUyeEkle(ortam.kurum.id, kart.id, ortam.personel.id);

    await projeyeUyeKaldir(ortam.kurum.id, proje.id, ortam.personel.id);

    const kartUyeleri = await kartinUyeleri(ortam.kurum.id, kart.id);
    expect(kartUyeleri).toEqual([]);
    const projeUyeleri = await projeUyeleriniListele(ortam.kurum.id, proje.id);
    expect(projeUyeleri.find((u) => u.kullanici_id === ortam.personel.id)).toBeUndefined();
  });
});

describe("projeUyesiSeviyeGuncelle", () => {
  it("son ADMIN'i NORMAL'e düşüremez", async () => {
    await expect(
      projeUyesiSeviyeGuncelle(ortam.kurum.id, {
        proje_id: proje.id,
        kullanici_id: ortam.superAdmin.id,
        seviye: "NORMAL",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("ikinci ADMIN olunca ilk admin NORMAL'e düşürülebilir", async () => {
    await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "ADMIN",
    });
    await projeUyesiSeviyeGuncelle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.superAdmin.id,
      seviye: "NORMAL",
    });
    const liste = await projeUyeleriniListele(ortam.kurum.id, proje.id);
    expect(liste.find((u) => u.kullanici_id === ortam.superAdmin.id)?.seviye).toBe("NORMAL");
  });
});

describe("projeAdayKullanicilariniAra", () => {
  it("proje üyesi olmayanları sistem genelinden döner (kurum sınırı yok)", async () => {
    const adaylar = await projeAdayKullanicilariniAra(ortam.kurum.id, {
      proje_id: proje.id,
    });
    // Proje üyesi olan superAdmin filtreli
    expect(adaylar.find((a) => a.id === ortam.superAdmin.id)).toBeUndefined();
    // Aynı kurum personeli aday
    expect(adaylar.find((a) => a.id === ortam.personel.id)).toBeDefined();
    // Farklı kurum kullanıcısı da aday (sistem geneli)
    expect(adaylar.find((a) => a.id === ortam.digerKullanici.id)).toBeDefined();
  });

  it("kurum adına göre arama eşleşir", async () => {
    // Why: kullanıcı "Test Kurum B" yazıp digerKurum'daki kullanıcılara
    // hızlıca süzebilmeli — kurum.ad ve kurum.kisa_ad da OR'da.
    const adaylar = await projeAdayKullanicilariniAra(ortam.kurum.id, {
      proje_id: proje.id,
      q: "Test Kurum B",
    });
    expect(adaylar.find((a) => a.id === ortam.digerKullanici.id)).toBeDefined();
    // Aynı kurum personeli kurum filtresine takılmaz (Test Kurum eşleşse
    // bile B harfi yoksa eşleşmez — fixture: ortam.kurum "Test Kurum")
    expect(adaylar.find((a) => a.id === ortam.personel.id)).toBeUndefined();
  });

  it("ad/email araması eşleşir", async () => {
    const personel = await adminDb.kullanici.findUnique({
      where: { id: ortam.personel.id },
      select: { ad: true, email: true },
    });
    if (!personel) throw new Error("personel bulunamadı");
    const adAramasi = await projeAdayKullanicilariniAra(ortam.kurum.id, {
      proje_id: proje.id,
      q: personel.ad.slice(0, 3),
    });
    expect(adAramasi.find((a) => a.id === ortam.personel.id)).toBeDefined();

    const emailAramasi = await projeAdayKullanicilariniAra(ortam.kurum.id, {
      proje_id: proje.id,
      q: personel.email.split("@")[0]!,
    });
    expect(emailAramasi.find((a) => a.id === ortam.personel.id)).toBeDefined();
  });

  it("aday satırında kurum bilgisi de döner", async () => {
    const adaylar = await projeAdayKullanicilariniAra(ortam.kurum.id, {
      proje_id: proje.id,
    });
    const personel = adaylar.find((a) => a.id === ortam.personel.id);
    expect(personel).toBeDefined();
    expect(typeof personel?.kurum_ad).toBe("string");
    expect(personel?.kurum_ad?.length ?? 0).toBeGreaterThan(0);
  });
});

// =====================================================================
// Karta üye atama
// =====================================================================

describe("kartaUyeEkle", () => {
  it("proje üyesi olmayan kullanıcı karta atanamaz", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await expect(
      kartaUyeEkle(ortam.kurum.id, kart.id, ortam.personel.id),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("proje üyesi karta atanabilir, idempotent", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });

    await kartaUyeEkle(ortam.kurum.id, kart.id, ortam.personel.id);
    await kartaUyeEkle(ortam.kurum.id, kart.id, ortam.personel.id);

    const uyeler = await kartinUyeleri(ortam.kurum.id, kart.id);
    expect(uyeler.map((u) => u.kullanici_id)).toEqual([ortam.personel.id]);
  });
});

describe("kartaUyeKaldir", () => {
  it("üyeyi karttan çıkarır, var olmayan idempotent", async () => {
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await projeyeUyeEkle(ortam.kurum.id, {
      proje_id: proje.id,
      kullanici_id: ortam.personel.id,
      seviye: "NORMAL",
    });
    await kartaUyeEkle(ortam.kurum.id, kart.id, ortam.personel.id);

    await kartaUyeKaldir(ortam.kurum.id, kart.id, ortam.personel.id);
    await kartaUyeKaldir(ortam.kurum.id, kart.id, ortam.personel.id);

    const uyeler = await kartinUyeleri(ortam.kurum.id, kart.id);
    expect(uyeler).toEqual([]);
  });
});
