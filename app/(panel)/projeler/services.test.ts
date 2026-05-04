import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// `services.ts` -> `lib/action-wrapper` -> `@/auth` -> `next-auth` zinciri
// jsdom altinda `next/server` cozulemiyor (Node-only modul). services.ts dogrudan
// auth() cagirmiyor; sadece `EylemHatasi` class'ini istiyor. Bu yuzden `@/auth`'i mock
// ediyoruz — Kontrol Kural 80'in istisnasi: framework boundary, business code degil.
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  projeleriListele,
  projeOlustur,
  projeGuncelle,
  projeArsivle,
  projeSil,
  projeGeriYukle,
  projeyeSiraVer,
} from "./services";
import {
  ortamKur,
  projeOlusturFiks,
  projeleriSeedle,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";

// Tur 2 — services.ts integration testleri.
// Mock yasak (Kontrol Kural 80) — gercek pg-test DB.
// Audit middleware her yazimi `aktivite_logu` tablosuna yazar; truncateAll temizler.

// Ayri bir admin client: schema/truncate operasyonlari (audit middleware'siz).
// `lib/db.ts`'in singleton'i zaten test DB'ye baglanir cunku vitest.config.ts
// process.env.DATABASE_URL'i TEST_DATABASE_URL ile ezer.
const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;

beforeAll(async () => {
  // Bagimsiz client connect — singleton (db) ayri bir baglanti acar.
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
  // Her test temiz seed: birim + roller + kullanicilar.
  ortam = await ortamKur(adminDb);
});

describe("projeleriListele", () => {
  it("filtre 'aktif' verildiginde sadece arsivsiz ve silinmemis projeler doner", async () => {
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [
        { ad: "Aktif 1" },
        { ad: "Arsiv 1", arsiv_mi: true },
        { ad: "Silinmis 1", silindi_mi: true },
        { ad: "Aktif 2" },
      ],
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    const adlar = sonuc.map((p) => p.ad);
    expect(adlar).toHaveLength(2);
    expect(adlar).toContain("Aktif 1");
    expect(adlar).toContain("Aktif 2");
  });

  it("filtre 'yildizli' verildiginde sadece yildizli projeler doner", async () => {
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [
        { ad: "Yildizli", yildizli_mi: true },
        { ad: "Normal" },
        // Silinmis yildizli — `yildizli` filtresi silindi_mi=false zorlar.
        { ad: "Yildizli ama silinmis", yildizli_mi: true, silindi_mi: true },
      ],
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, { filtre: "yildizli" });
    const adlar = sonuc.map((p) => p.ad);
    expect(adlar).toEqual(["Yildizli"]);
  });

  it("filtre 'arsiv' verildiginde arsivlenmis projeler doner", async () => {
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [
        { ad: "Aktif" },
        { ad: "Arsiv 1", arsiv_mi: true },
        { ad: "Arsiv 2", arsiv_mi: true },
        { ad: "Arsiv silinmis", arsiv_mi: true, silindi_mi: true },
      ],
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, { filtre: "arsiv" });
    const adlar = sonuc.map((p) => p.ad).sort();
    expect(adlar).toEqual(["Arsiv 1", "Arsiv 2"]);
  });

  it("filtre 'silinmis' verildiginde silinmis projeler doner", async () => {
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [
        { ad: "Aktif" },
        { ad: "Silinmis 1", silindi_mi: true },
        { ad: "Silinmis 2", silindi_mi: true },
      ],
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, { filtre: "silinmis" });
    const adlar = sonuc.map((p) => p.ad).sort();
    expect(adlar).toEqual(["Silinmis 1", "Silinmis 2"]);
  });

  it("arama parametresi ad ve aciklama icinde case-insensitive eslesir", async () => {
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [
        { ad: "Egitim Projesi", aciklama: "Okullar icin." },
        { ad: "Saglik Calistayi", aciklama: "EGITIM saglik karisimi." },
        { ad: "Yol Yapimi", aciklama: null },
      ],
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, {
      filtre: "aktif",
      arama: "egitim",
    });
    const adlar = sonuc.map((p) => p.ad).sort();
    // 1) "Egitim Projesi" ad eslesir, 2) "Saglik Calistayi" aciklama (EGITIM) ile eslesir.
    expect(adlar).toEqual(["Egitim Projesi", "Saglik Calistayi"]);
  });

  it("siraya gore artan doner (LexoRank)", async () => {
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [
        { ad: "Birinci" },
        { ad: "Ikinci" },
        { ad: "Ucuncu" },
        { ad: "Dorduncu" },
      ],
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    const sortlu = [...sonuc.map((p) => p.sira)].sort();
    expect(sonuc.map((p) => p.sira)).toEqual(sortlu);
    // Seed ediliste verilen sirayla esit gelmeli.
    expect(sonuc.map((p) => p.ad)).toEqual([
      "Birinci",
      "Ikinci",
      "Ucuncu",
      "Dorduncu",
    ]);
  });

  it("max 200 kayit doner", async () => {
    // 250 proje seed — singleton oncesi performans icin paralel ama sira monotonu icin
    // sirali yapmaliyiz; toplu createMany ile (sira'yi manuel uretip).
    const tipler = Array.from({ length: 250 }, (_, i) => ({ ad: `Proje ${i}` }));
    await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler,
    });

    const sonuc = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    expect(sonuc).toHaveLength(200);
  }, 30_000);

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

describe("projeOlustur", () => {
  it("yeni proje listenin sonuna eklenir (sira en buyuk)", async () => {
    const oncekiler = await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [{ ad: "Eski 1" }, { ad: "Eski 2" }],
    });
    const enBuyukSira = oncekiler[oncekiler.length - 1]!.sira;

    const yeni = await projeOlustur(ortam.superAdmin.id, {
      ad: "Yepyeni",
    });

    expect(yeni.sira > enBuyukSira).toBe(true);
    // listele de monoton artan donmeli.
    const liste = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    expect(liste.map((p) => p.ad)).toEqual(["Eski 1", "Eski 2", "Yepyeni"]);
  });

  it("olusturan otomatik ProjeUyesi olarak ADMIN seviyesinde eklenir", async () => {
    const yeni = await projeOlustur(ortam.superAdmin.id, {
      ad: "Uyeli Proje",
    });

    const uye = await adminDb.projeUyesi.findUnique({
      where: {
        proje_id_kullanici_id: {
          proje_id: yeni.id,
          kullanici_id: ortam.superAdmin.id,
        },
      },
    });
    expect(uye).not.toBeNull();
    expect(uye?.seviye).toBe("ADMIN");
    // services tarafindan donen `uye_sayisi` 1 olmali.
    expect(yeni.uye_sayisi).toBe(1);
  });

  it("kapak rengi opsiyonel — verilmezse null kalir", async () => {
    const yeni = await projeOlustur(ortam.superAdmin.id, {
      ad: "Renksiz",
    });
    expect(yeni.kapak_renk).toBeNull();

    const renkli = await projeOlustur(ortam.superAdmin.id, {
      ad: "Renkli",
      kapak_renk: "primary",
    });
    expect(renkli.kapak_renk).toBe("primary");
  });
});

describe("projeGuncelle", () => {
  it("ad/aciklama/kapak_renk/yildizli_mi alanlari guncellenir", async () => {
    const p = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Eski Ad",
      aciklama: "Eski aciklama",
      kapak_renk: null,
      yildizli_mi: false,
    });

    await projeGuncelle({
      id: p.id,
      ad: "Yeni Ad",
      aciklama: "Yeni aciklama",
      kapak_renk: "secondary",
      yildizli_mi: true,
    });

    const sonra = await adminDb.proje.findUnique({ where: { id: p.id } });
    expect(sonra?.ad).toBe("Yeni Ad");
    expect(sonra?.aciklama).toBe("Yeni aciklama");
    expect(sonra?.kapak_renk).toBe("secondary");
    expect(sonra?.yildizli_mi).toBe(true);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

describe("projeArsivle", () => {
  it("arsiv_mi=true ise arsiv_zamani set edilir", async () => {
    const p = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });

    await projeArsivle({ id: p.id, arsiv_mi: true });

    const sonra = await adminDb.proje.findUnique({ where: { id: p.id } });
    expect(sonra?.arsiv_mi).toBe(true);
    expect(sonra?.arsiv_zamani).toBeInstanceOf(Date);
  });

  it("arsiv_mi=false ise arsiv_zamani null olur", async () => {
    const p = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      arsiv_mi: true,
    });
    // Once arsivde baslayan bir kayit; geri al.
    await projeArsivle({ id: p.id, arsiv_mi: false });

    const sonra = await adminDb.proje.findUnique({ where: { id: p.id } });
    expect(sonra?.arsiv_mi).toBe(false);
    expect(sonra?.arsiv_zamani).toBeNull();
  });
});

describe("projeSil", () => {
  it("soft delete: silindi_mi=true + silinme_zamani set edilir", async () => {
    const p = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });

    await projeSil(p.id);

    const sonra = await adminDb.proje.findUnique({ where: { id: p.id } });
    expect(sonra?.silindi_mi).toBe(true);
    expect(sonra?.silinme_zamani).toBeInstanceOf(Date);
  });

  it("kayit fiziksel olarak DB'de kalir", async () => {
    const p = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    await projeSil(p.id);

    // findUnique ile hala bulunabilmeli (soft delete; fiziksel silme yok).
    const sonra = await adminDb.proje.findUnique({ where: { id: p.id } });
    expect(sonra).not.toBeNull();
  });
});

describe("projeGeriYukle", () => {
  it("silindi_mi=false + silinme_zamani=null olur", async () => {
    const p = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      silindi_mi: true,
    });

    await projeGeriYukle(p.id);

    const sonra = await adminDb.proje.findUnique({ where: { id: p.id } });
    expect(sonra?.silindi_mi).toBe(false);
    expect(sonra?.silinme_zamani).toBeNull();
  });
});

describe("projeyeSiraVer", () => {
  it("iki proje arasina yeni sira atanir", async () => {
    const projeler = await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [{ ad: "A" }, { ad: "B" }, { ad: "C" }],
    });
    const [a, b, c] = projeler;

    // C'yi A ile B arasina tasimak: onceki=A, sonraki=B.
    const { sira } = await projeyeSiraVer({
      id: c!.id,
      onceki_id: a!.id,
      sonraki_id: b!.id,
    });

    expect(sira > a!.sira).toBe(true);
    expect(sira < b!.sira).toBe(true);

    const liste = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    expect(liste.map((p) => p.ad)).toEqual(["A", "C", "B"]);
  });

  it("ilk pozisyona tasininca onceki=null sonraki=ilkProje", async () => {
    const projeler = await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [{ ad: "A" }, { ad: "B" }, { ad: "C" }],
    });
    const [a, , c] = projeler;

    const { sira } = await projeyeSiraVer({
      id: c!.id,
      onceki_id: null,
      sonraki_id: a!.id,
    });

    expect(sira < a!.sira).toBe(true);

    const liste = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    expect(liste.map((p) => p.ad)[0]).toBe("C");
  });

  it("son pozisyona tasininca onceki=sonProje sonraki=null", async () => {
    const projeler = await projeleriSeedle(adminDb, {
      birimId: ortam.birim.id,
      tipler: [{ ad: "A" }, { ad: "B" }, { ad: "C" }],
    });
    const [a, , c] = projeler;

    const { sira } = await projeyeSiraVer({
      id: a!.id,
      onceki_id: c!.id,
      sonraki_id: null,
    });

    expect(sira > c!.sira).toBe(true);

    const liste = await projeleriListele(ortam.superAdmin.id, { filtre: "aktif" });
    expect(liste.map((p) => p.ad)[liste.length - 1]).toBe("A");
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});
