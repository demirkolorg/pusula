import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// `services.ts` -> `lib/action-wrapper` -> `@/auth` -> `next-auth` zinciri jsdom
// altinda `next/server` cozulemiyor. services.ts dogrudan auth() cagirmiyor; sadece
// `EylemHatasi` class'ini istiyor. Tur 2 ile ayni gerekce — Kontrol Kural 80
// istisnasi: framework boundary, business code degil.
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  projeDetayiniGetir,
  listeOlustur,
  listeGuncelle,
  listeSil,
  listeyeSiraVer,
  kartOlustur,
  kartGuncelle,
  kartSil,
  kartGeriYukle,
  kartiTasi,
  projedeTumKartlar,
} from "./services";
import {
  ortamKur,
  projeOlusturFiks,
  listeOlusturFiks,
  listeleriSeedle,
  kartOlusturFiks,
  kartlariSeedle,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";
import { EylemHatasi } from "@/lib/action-wrapper";
import { SIRA_BAS } from "@/lib/sira";

// Tur 3 — [projeId]/services.ts integration testleri.
// Mock yasak (Kontrol Kural 80) — gercek pg-test DB; Prisma audit middleware her
// yazimi `aktivite_logu`'na yazar; truncateAll temizler.

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

// ============================================================
// projeDetayiniGetir
// ============================================================

describe("projeDetayiniGetir", () => {
  it("proje + listeler (sirali) + kartlar (sirali) hep beraber doner", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Pano",
    });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "Yapilacak" }, { ad: "Devam Ediyor" }, { ad: "Tamamlandi" }],
    });
    await kartlariSeedle(adminDb, {
      listeId: listeler[0]!.id,
      tipler: [{ baslik: "K1" }, { baslik: "K2" }],
    });
    await kartlariSeedle(adminDb, {
      listeId: listeler[1]!.id,
      tipler: [{ baslik: "K3" }],
    });

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);

    expect(detay.id).toBe(proje.id);
    expect(detay.ad).toBe("Pano");
    expect(detay.listeler.map((l) => l.ad)).toEqual([
      "Yapilacak",
      "Devam Ediyor",
      "Tamamlandi",
    ]);
    expect(detay.listeler[0]!.kartlar.map((k) => k.baslik)).toEqual(["K1", "K2"]);
    expect(detay.listeler[1]!.kartlar.map((k) => k.baslik)).toEqual(["K3"]);
    expect(detay.listeler[2]!.kartlar).toEqual([]);
  });

  it("arsivlenmis listeler dahil edilmez", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "Aktif" }, { ad: "Arsiv", arsiv_mi: true }],
    });

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler.map((l) => l.ad)).toEqual(["Aktif"]);
  });

  it("silinmis veya arsivlenmis kartlar dahil edilmez", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [
        { baslik: "Aktif" },
        { baslik: "Silinmis", silindi_mi: true },
        { baslik: "Arsivli", arsiv_mi: true },
      ],
    });

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler[0]!.kartlar.map((k) => k.baslik)).toEqual(["Aktif"]);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.

  it("silinmis proje BULUNAMADI hatasi verir", async () => {
    const p = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      silindi_mi: true,
    });

    await expect(
      projeDetayiniGetir(ortam.superAdmin.id, p.id),
    ).rejects.toBeInstanceOf(EylemHatasi);
  });
});

// ============================================================
// listeOlustur
// ============================================================

describe("listeOlustur", () => {
  it("yeni liste sona eklenir (sira en buyuk)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const oncekiler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "L1" }, { ad: "L2" }],
    });
    const enBuyukSira = oncekiler[oncekiler.length - 1]!.sira;

    const yeni = await listeOlustur(ortam.superAdmin.id, {
      proje_id: proje.id,
      ad: "L3",
    });

    expect(yeni.ad).toBe("L3");
    expect(yeni.sira > enBuyukSira).toBe(true);
    expect(yeni.kartlar).toEqual([]);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler.map((l) => l.ad)).toEqual(["L1", "L2", "L3"]);
  });

  it("bos listede sira degeri SIRA_BAS ile baslar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });

    const yeni = await listeOlustur(ortam.superAdmin.id, {
      proje_id: proje.id,
      ad: "Ilk",
    });

    expect(yeni.sira).toBe(SIRA_BAS);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

// ============================================================
// listeGuncelle
// ============================================================

describe("listeGuncelle", () => {
  it("ad/wip_limit/arsiv_mi alanlari guncellenir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, {
      projeId: proje.id,
      ad: "Eski",
      wip_limit: null,
    });

    await listeGuncelle(ortam.superAdmin.id, {
      id: liste.id,
      ad: "Yeni",
      wip_limit: 5,
      arsiv_mi: true,
    });

    const sonra = await adminDb.liste.findUnique({ where: { id: liste.id } });
    expect(sonra?.ad).toBe("Yeni");
    expect(sonra?.wip_limit).toBe(5);
    expect(sonra?.arsiv_mi).toBe(true);
  });

  it("wip_limit null verilebilir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, {
      projeId: proje.id,
      wip_limit: 5,
    });

    await listeGuncelle(ortam.superAdmin.id, { id: liste.id, wip_limit: null });

    const sonra = await adminDb.liste.findUnique({ where: { id: liste.id } });
    expect(sonra?.wip_limit).toBeNull();
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

// ============================================================
// listeSil (cascade kartlar)
// ============================================================

describe("listeSil", () => {
  it("liste fiziksel olarak silinir (cascade kartlar da gider)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [{ baslik: "K1" }, { baslik: "K2" }],
    });

    await listeSil(ortam.superAdmin.id, liste.id);

    const sonra = await adminDb.liste.findUnique({ where: { id: liste.id } });
    expect(sonra).toBeNull();
    const kartSayisi = await adminDb.kart.count({
      where: { liste_id: liste.id },
    });
    expect(kartSayisi).toBe(0);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

// ============================================================
// listeyeSiraVer
// ============================================================

describe("listeyeSiraVer", () => {
  it("iki liste arasina yeni sira atanir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "A" }, { ad: "B" }, { ad: "C" }],
    });
    const [a, b, c] = listeler;

    // C'yi A ile B arasina al.
    const { sira } = await listeyeSiraVer(ortam.superAdmin.id, {
      id: c!.id,
      proje_id: proje.id,
      onceki_id: a!.id,
      sonraki_id: b!.id,
    });

    expect(sira > a!.sira).toBe(true);
    expect(sira < b!.sira).toBe(true);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler.map((l) => l.ad)).toEqual(["A", "C", "B"]);
  });

  it("ilk pozisyona tasima (onceki=null)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "A" }, { ad: "B" }, { ad: "C" }],
    });
    const [a, , c] = listeler;

    const { sira } = await listeyeSiraVer(ortam.superAdmin.id, {
      id: c!.id,
      proje_id: proje.id,
      onceki_id: null,
      sonraki_id: a!.id,
    });

    expect(sira < a!.sira).toBe(true);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler[0]!.ad).toBe("C");
  });

  it("son pozisyona tasima (sonraki=null)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "A" }, { ad: "B" }, { ad: "C" }],
    });
    const [a, , c] = listeler;

    const { sira } = await listeyeSiraVer(ortam.superAdmin.id, {
      id: a!.id,
      proje_id: proje.id,
      onceki_id: c!.id,
      sonraki_id: null,
    });

    expect(sira > c!.sira).toBe(true);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler[detay.listeler.length - 1]!.ad).toBe("A");
  });

  it("baska projeden onceki/sonraki YETKISIZ hatasi", async () => {
    const projeA = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const projeB = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeA = await listeOlusturFiks(adminDb, { projeId: projeA.id });
    const listeB = await listeOlusturFiks(adminDb, { projeId: projeB.id });

    await expect(
      listeyeSiraVer(ortam.superAdmin.id, {
        id: listeA.id,
        proje_id: projeA.id,
        onceki_id: listeB.id,
        sonraki_id: null,
      }),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });

    await expect(
      listeyeSiraVer(ortam.superAdmin.id, {
        id: listeA.id,
        proje_id: projeA.id,
        onceki_id: null,
        sonraki_id: listeB.id,
      }),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });
  });
});

// ============================================================
// kartOlustur
// ============================================================

describe("kartOlustur", () => {
  it("yeni kart liste sonuna eklenir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const oncekiler = await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [{ baslik: "K1" }, { baslik: "K2" }],
    });
    const enBuyukSira = oncekiler[oncekiler.length - 1]!.sira;

    const yeni = await kartOlustur(
      ortam.superAdmin.id,
      {
        liste_id: liste.id,
        baslik: "K3",
      },
    );

    expect(yeni.baslik).toBe("K3");
    expect(yeni.sira > enBuyukSira).toBe(true);
    expect(yeni.liste_id).toBe(liste.id);
    expect(yeni.uye_sayisi).toBe(1);
    expect(yeni.etiket_sayisi).toBe(0);
  });

  it("bos listede SIRA_BAS ile baslar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });

    const yeni = await kartOlustur(
      ortam.superAdmin.id,
      { liste_id: liste.id, baslik: "Ilk" },
    );

    expect(yeni.sira).toBe(SIRA_BAS);
  });

  it("olusturan_id set edilir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });

    const yeni = await kartOlustur(
      ortam.personel.id,
      { liste_id: liste.id, baslik: "X" },
    );

    const ham = await adminDb.kart.findUnique({ where: { id: yeni.id } });
    expect(ham?.olusturan_id).toBe(ortam.personel.id);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

// ============================================================
// kartGuncelle
// ============================================================

describe("kartGuncelle", () => {
  it("baslik/aciklama/kapak_renk/baslangic/bitis/arsiv_mi guncellenir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Eski",
      aciklama: null,
    });

    const baslangic = new Date("2026-01-01T00:00:00Z");
    const bitis = new Date("2026-12-31T00:00:00Z");

    await kartGuncelle(ortam.superAdmin.id, {
      id: k.id,
      baslik: "Yeni",
      aciklama: "Aciklama",
      kapak_renk: "tertiary",
      baslangic,
      bitis,
      arsiv_mi: true,
    });

    const sonra = await adminDb.kart.findUnique({ where: { id: k.id } });
    expect(sonra?.baslik).toBe("Yeni");
    expect(sonra?.aciklama).toBe("Aciklama");
    expect(sonra?.kapak_renk).toBe("tertiary");
    expect(sonra?.baslangic?.toISOString()).toBe(baslangic.toISOString());
    expect(sonra?.bitis?.toISOString()).toBe(bitis.toISOString());
    expect(sonra?.arsiv_mi).toBe(true);
  });

  it("tarih null verilebilir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslangic: new Date("2026-01-01"),
      bitis: new Date("2026-12-31"),
    });

    await kartGuncelle(ortam.superAdmin.id, {
      id: k.id,
      baslangic: null,
      bitis: null,
    });

    const sonra = await adminDb.kart.findUnique({ where: { id: k.id } });
    expect(sonra?.baslangic).toBeNull();
    expect(sonra?.bitis).toBeNull();
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});

// ============================================================
// kartSil (soft delete)
// ============================================================

describe("kartSil", () => {
  it("silindi_mi=true + silinme_zamani set edilir (soft delete)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k = await kartOlusturFiks(adminDb, { listeId: liste.id });

    await kartSil(ortam.superAdmin.id, k.id);

    const sonra = await adminDb.kart.findUnique({ where: { id: k.id } });
    expect(sonra?.silindi_mi).toBe(true);
    expect(sonra?.silinme_zamani).toBeInstanceOf(Date);
    // Fiziksel kayit duruyor.
    expect(sonra).not.toBeNull();
  });
});

// ============================================================
// kartGeriYukle
// ============================================================

describe("kartGeriYukle", () => {
  it("silindi_mi=false + silinme_zamani=null olur", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      silindi_mi: true,
    });

    await kartGeriYukle(ortam.superAdmin.id, k.id);

    const sonra = await adminDb.kart.findUnique({ where: { id: k.id } });
    expect(sonra?.silindi_mi).toBe(false);
    expect(sonra?.silinme_zamani).toBeNull();
  });
});

// ============================================================
// kartiTasi (drag-drop semantigi — KRITIK)
// ============================================================

describe("kartiTasi", () => {
  it("ayni liste icinde sira degisir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kartlar = await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [{ baslik: "A" }, { baslik: "B" }, { baslik: "C" }],
    });
    const [a, b, c] = kartlar;

    // C'yi A ve B arasina tasi.
    const { sira, liste_id } = await kartiTasi(ortam.superAdmin.id, {
      id: c!.id,
      hedef_liste_id: liste.id,
      onceki_id: a!.id,
      sonraki_id: b!.id,
    });

    expect(liste_id).toBe(liste.id);
    expect(sira > a!.sira).toBe(true);
    expect(sira < b!.sira).toBe(true);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler[0]!.kartlar.map((k) => k.baslik)).toEqual([
      "A",
      "C",
      "B",
    ]);
  });

  it("ayni proje icinde farkli listeye tasinir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "Kaynak" }, { ad: "Hedef" }],
    });
    const [kaynak, hedef] = listeler;
    const kKaynak = await kartlariSeedle(adminDb, {
      listeId: kaynak!.id,
      tipler: [{ baslik: "K1" }, { baslik: "K2" }],
    });
    const kHedef = await kartlariSeedle(adminDb, {
      listeId: hedef!.id,
      tipler: [{ baslik: "H1" }],
    });

    // K2'yi hedefin sonuna tasi.
    const { liste_id } = await kartiTasi(ortam.superAdmin.id, {
      id: kKaynak[1]!.id,
      hedef_liste_id: hedef!.id,
      onceki_id: kHedef[0]!.id,
      sonraki_id: null,
    });

    expect(liste_id).toBe(hedef!.id);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    const kaynakL = detay.listeler.find((l) => l.id === kaynak!.id);
    const hedefL = detay.listeler.find((l) => l.id === hedef!.id);
    expect(kaynakL?.kartlar.map((k) => k.baslik)).toEqual(["K1"]);
    expect(hedefL?.kartlar.map((k) => k.baslik)).toEqual(["H1", "K2"]);
  });

  it("bos hedef listeye tasinir (onceki=null sonraki=null)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "Kaynak" }, { ad: "Bos" }],
    });
    const [kaynak, bos] = listeler;
    const kartlar = await kartlariSeedle(adminDb, {
      listeId: kaynak!.id,
      tipler: [{ baslik: "K1" }],
    });

    const { liste_id, sira } = await kartiTasi(ortam.superAdmin.id, {
      id: kartlar[0]!.id,
      hedef_liste_id: bos!.id,
      onceki_id: null,
      sonraki_id: null,
    });

    expect(liste_id).toBe(bos!.id);
    // Bos listeye tasininca SIRA_BAS gibi orta nokta uretilir (siraArasi(null,null)).
    expect(sira.length).toBeGreaterThan(0);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    const bosL = detay.listeler.find((l) => l.id === bos!.id);
    expect(bosL?.kartlar.map((k) => k.baslik)).toEqual(["K1"]);
  });

  it("ilk pozisyona tasinir (onceki=null sonraki=ilk)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kartlar = await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [{ baslik: "A" }, { baslik: "B" }, { baslik: "C" }],
    });
    const [a, , c] = kartlar;

    const { sira } = await kartiTasi(ortam.superAdmin.id, {
      id: c!.id,
      hedef_liste_id: liste.id,
      onceki_id: null,
      sonraki_id: a!.id,
    });

    expect(sira < a!.sira).toBe(true);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    expect(detay.listeler[0]!.kartlar[0]!.baslik).toBe("C");
  });

  it("son pozisyona tasinir (onceki=son sonraki=null)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kartlar = await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [{ baslik: "A" }, { baslik: "B" }, { baslik: "C" }],
    });
    const [a, , c] = kartlar;

    const { sira } = await kartiTasi(ortam.superAdmin.id, {
      id: a!.id,
      hedef_liste_id: liste.id,
      onceki_id: c!.id,
      sonraki_id: null,
    });

    expect(sira > c!.sira).toBe(true);

    const detay = await projeDetayiniGetir(ortam.superAdmin.id, proje.id);
    const sonuncu = detay.listeler[0]!.kartlar.at(-1);
    expect(sonuncu?.baslik).toBe("A");
  });

  it("proje disina tasima reddedilir (YETKISIZ — MVP kisiti)", async () => {
    // Iki ayri proje (ayni birimda); biri kaynak, digeri hedef.
    const projeA = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const projeB = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeA = await listeOlusturFiks(adminDb, { projeId: projeA.id });
    const listeB = await listeOlusturFiks(adminDb, { projeId: projeB.id });
    const k = await kartOlusturFiks(adminDb, { listeId: listeA.id });

    await expect(
      kartiTasi(ortam.superAdmin.id, {
        id: k.id,
        hedef_liste_id: listeB.id,
        onceki_id: null,
        sonraki_id: null,
      }),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });

    // Kart hala kaynak listede.
    const halen = await adminDb.kart.findUnique({ where: { id: k.id } });
    expect(halen?.liste_id).toBe(listeA.id);
  });

  it("onceki kart hedef listeden degilse YETKISIZ", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "L1" }, { ad: "L2" }],
    });
    const [l1, l2] = listeler;
    const kL1 = await kartOlusturFiks(adminDb, { listeId: l1!.id, baslik: "K1" });
    const kL2 = await kartOlusturFiks(adminDb, { listeId: l2!.id, baslik: "K2" });

    // K1'i L2'ye tasimaya calis ama onceki olarak L1'deki bir karti ver.
    await expect(
      kartiTasi(ortam.superAdmin.id, {
        id: kL2.id,
        hedef_liste_id: l2!.id,
        onceki_id: kL1.id, // L1 listesinde — gecersiz
        sonraki_id: null,
      }),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });
  });

  it("sonraki kart hedef listeden degilse YETKISIZ", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "L1" }, { ad: "L2" }],
    });
    const [l1, l2] = listeler;
    const kL1 = await kartOlusturFiks(adminDb, { listeId: l1!.id, baslik: "K1" });
    const kL2 = await kartOlusturFiks(adminDb, { listeId: l2!.id, baslik: "K2" });

    await expect(
      kartiTasi(ortam.superAdmin.id, {
        id: kL2.id,
        hedef_liste_id: l2!.id,
        onceki_id: null,
        sonraki_id: kL1.id, // L1 listesinde — gecersiz
      }),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });
  });
});

// ============================================================
// projedeTumKartlar (DataTable beslemesi)
// ============================================================

describe("projedeTumKartlar", () => {
  it("tum aktif kartlar liste sirasi + kart sirasi gore doner", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "L1" }, { ad: "L2" }],
    });
    await kartlariSeedle(adminDb, {
      listeId: listeler[0]!.id,
      tipler: [{ baslik: "L1-K1" }, { baslik: "L1-K2" }],
    });
    await kartlariSeedle(adminDb, {
      listeId: listeler[1]!.id,
      tipler: [{ baslik: "L2-K1" }],
    });

    const kartlar = await projedeTumKartlar(ortam.superAdmin.id, proje.id);
    expect(kartlar.map((k) => k.baslik)).toEqual([
      "L1-K1",
      "L1-K2",
      "L2-K1",
    ]);
  });

  it("silinmis kartlar dahil edilmez", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    await kartlariSeedle(adminDb, {
      listeId: liste.id,
      tipler: [{ baslik: "Aktif" }, { baslik: "Silinmis", silindi_mi: true }],
    });

    const kartlar = await projedeTumKartlar(ortam.superAdmin.id, proje.id);
    expect(kartlar.map((k) => k.baslik)).toEqual(["Aktif"]);
  });

  it("arsivlenmis listelerin kartlari dahil edilmez", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const listeler = await listeleriSeedle(adminDb, {
      projeId: proje.id,
      tipler: [{ ad: "Aktif" }, { ad: "Arsiv", arsiv_mi: true }],
    });
    await kartlariSeedle(adminDb, {
      listeId: listeler[0]!.id,
      tipler: [{ baslik: "AKart" }],
    });
    await kartlariSeedle(adminDb, {
      listeId: listeler[1]!.id,
      tipler: [{ baslik: "ArsivKart" }],
    });

    const kartlar = await projedeTumKartlar(ortam.superAdmin.id, proje.id);
    expect(kartlar.map((k) => k.baslik)).toEqual(["AKart"]);
  });

  it("liste_ad join ile dahil edilir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, {
      projeId: proje.id,
      ad: "Yapilacak",
    });
    await kartOlusturFiks(adminDb, { listeId: liste.id, baslik: "T" });

    const kartlar = await projedeTumKartlar(ortam.superAdmin.id, proje.id);
    expect(kartlar[0]!.liste_ad).toBe("Yapilacak");
    expect(kartlar[0]!.liste_id).toBe(liste.id);
  });

  // Eski birim izolasyonu testi paylaşım modeliyle kapsam dışı kaldı.
});
