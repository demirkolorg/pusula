import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  etiketDetayGetir,
  etiketKartlariniListele,
  etiketleriListele,
  etiketOlustur,
  etiketGuncelle,
  etiketSil,
  kartaEtiketEkle,
  kartaEtiketKaldir,
  kartinEtiketleri,
} from "./services";
import {
  ortamKur,
  projeOlusturFiks,
  listeOlusturFiks,
  kartOlusturFiks,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";

// Etiket modülü — pg-test integration. Mock yasak (Kural 80).

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

// =====================================================================
// Etiket CRUD
// =====================================================================

describe("etiketleriListele", () => {
  it("projedeki etiketleri olusturma sirasinda doner", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });

    const e1 = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    const e2 = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "Bilgi",
      renk: "#3b82f6",
    });

    const liste = await etiketleriListele(ortam.birim.id, proje.id);
    expect(liste.map((x) => x.id)).toEqual([e1.id, e2.id]);
    expect(liste[0]!.ad).toBe("Acil");
    expect(liste[1]!.renk).toBe("#3b82f6");
  });

  // Eski birim izolasyonu testi yetkilendirme modeliyle kapsam dışı kaldı.
});

describe("etiketOlustur", () => {
  it("ayni projede ayni adli etiket reddedilir (P2002)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await expect(
      etiketOlustur(ortam.birim.id, {
        proje_id: proje.id,
        ad: "Acil",
        renk: "#22c55e",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("farkli projelerde ayni adli etiket olabilir", async () => {
    const p1 = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const p2 = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    await etiketOlustur(ortam.birim.id, {
      proje_id: p1.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await expect(
      etiketOlustur(ortam.birim.id, {
        proje_id: p2.id,
        ad: "Acil",
        renk: "#ef4444",
      }),
    ).resolves.toMatchObject({ ad: "Acil" });
  });
});

describe("etiketGuncelle", () => {
  it("ad ve rengi gunceller", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });
    await etiketGuncelle(ortam.birim.id, {
      id: e.id,
      ad: "Y",
      renk: "#ef4444",
    });
    const liste = await etiketleriListele(ortam.birim.id, proje.id);
    expect(liste[0]).toMatchObject({ ad: "Y", renk: "#ef4444" });
  });

  // Eski birim izolasyonu testi yetkilendirme modeliyle kapsam dışı kaldı.
});

describe("etiketSil", () => {
  it("etiketi siler ve KartEtiket baglarini cascade ile dusurur", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await kartaEtiketEkle(ortam.birim.id, kart.id, e.id);

    await etiketSil(ortam.birim.id, e.id);

    const kalanlar = await etiketleriListele(ortam.birim.id, proje.id);
    expect(kalanlar).toEqual([]);
    const baglar = await adminDb.kartEtiket.findMany({
      where: { kart_id: kart.id },
    });
    expect(baglar).toEqual([]);
  });
});

// =====================================================================
// Karta etiket atama
// =====================================================================

describe("kartaEtiketEkle", () => {
  it("karta etiket ekler ve idempotent calisir", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });

    await kartaEtiketEkle(ortam.birim.id, kart.id, e.id);
    await kartaEtiketEkle(ortam.birim.id, kart.id, e.id); // ikinci kez — patlamaz

    const ids = await kartinEtiketleri(ortam.birim.id, kart.id);
    expect(ids).toEqual([e.id]);
  });

  it("baska projedeki etiketi karta eklemek YETKISIZ verir", async () => {
    const projeA = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const projeB = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: projeA.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const eB = await etiketOlustur(ortam.birim.id, {
      proje_id: projeB.id,
      ad: "Yanlis",
      renk: "#171717",
    });

    await expect(
      kartaEtiketEkle(ortam.birim.id, kart.id, eB.id),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });
  });
});

describe("kartaEtiketKaldir", () => {
  it("karttan etiketi cikarir, var olmayan baglanti idempotent", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });
    await kartaEtiketEkle(ortam.birim.id, kart.id, e.id);

    await kartaEtiketKaldir(ortam.birim.id, kart.id, e.id);
    await kartaEtiketKaldir(ortam.birim.id, kart.id, e.id); // ikinci kez — patlamaz

    const ids = await kartinEtiketleri(ortam.birim.id, kart.id);
    expect(ids).toEqual([]);
  });
});

// =====================================================================
// Etiket detay & kartlari listeleme
// =====================================================================

describe("etiketDetayGetir", () => {
  it("etiket bilgisi + kart_sayisi doner", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k1 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const k2 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await kartaEtiketEkle(ortam.birim.id, k1.id, e.id);
    await kartaEtiketEkle(ortam.birim.id, k2.id, e.id);

    const detay = await etiketDetayGetir(ortam.birim.id, e.id);

    expect(detay).toMatchObject({
      id: e.id,
      ad: "Acil",
      renk: "#ef4444",
      proje_id: proje.id,
      kart_sayisi: 2,
    });
    expect(detay.olusturma_zamani).toBeInstanceOf(Date);
  });

  it("var olmayan etiket icin BULUNAMADI atar", async () => {
    await expect(
      etiketDetayGetir(
        ortam.birim.id,
        "00000000-0000-0000-0000-000000000000",
      ),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

describe("etiketKartlariniListele", () => {
  it("etikete bagli kartlari sayfalayarak doner", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k1 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const k2 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const k3 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await kartaEtiketEkle(ortam.birim.id, k1.id, e.id);
    await kartaEtiketEkle(ortam.birim.id, k2.id, e.id);
    // k3 etikete BAĞLI DEĞİL — listede gözükmemeli

    const sayfa = await etiketKartlariniListele(ortam.birim.id, e.id, 1, 50);

    expect(sayfa.toplam).toBe(2);
    expect(sayfa.kayitlar).toHaveLength(2);
    const idler = sayfa.kayitlar.map((k) => k.id);
    expect(idler).toContain(k1.id);
    expect(idler).toContain(k2.id);
    expect(idler).not.toContain(k3.id);
    // Liste adi geliyor
    expect(sayfa.kayitlar[0]!.liste_adi).toBe(liste.ad);
  });

  it("silinmis kartlari haric tutar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });
    await kartaEtiketEkle(ortam.birim.id, k.id, e.id);
    await adminDb.kart.update({
      where: { id: k.id },
      data: { silindi_mi: true, silinme_zamani: new Date() },
    });

    const sayfa = await etiketKartlariniListele(ortam.birim.id, e.id, 1, 50);
    expect(sayfa.toplam).toBe(0);
    expect(sayfa.kayitlar).toEqual([]);
  });

  it("sayfalama dogru calisir (sayfa=2 ile sonraki dilim)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const e = await etiketOlustur(ortam.birim.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });
    // 5 kart oluştur ve hepsini etikete bağla
    for (let i = 0; i < 5; i++) {
      const k = await kartOlusturFiks(adminDb, { listeId: liste.id });
      await kartaEtiketEkle(ortam.birim.id, k.id, e.id);
    }

    const sayfa1 = await etiketKartlariniListele(ortam.birim.id, e.id, 1, 2);
    const sayfa2 = await etiketKartlariniListele(ortam.birim.id, e.id, 2, 2);
    const sayfa3 = await etiketKartlariniListele(ortam.birim.id, e.id, 3, 2);

    expect(sayfa1.toplam).toBe(5);
    expect(sayfa1.kayitlar).toHaveLength(2);
    expect(sayfa2.kayitlar).toHaveLength(2);
    expect(sayfa3.kayitlar).toHaveLength(1);
    // Aynı kayıt iki sayfada gözükmemeli
    const tum = [
      ...sayfa1.kayitlar,
      ...sayfa2.kayitlar,
      ...sayfa3.kayitlar,
    ].map((k) => k.id);
    expect(new Set(tum).size).toBe(5);
  });
});
