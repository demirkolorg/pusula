import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// services.ts auth zincirini tetiklemiyor ama action-wrapper içinden EylemHatasi
// kullanıyor; framework boundary mock (Kontrol Kural 80 istisnası).
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  birimleriListele,
  birimOlustur,
  birimGuncelle,
  birimSil,
  birimGeriYukle,
  birimSecenekleri,
} from "./services";
import { truncateAll } from "@/tests/db/setup";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

beforeAll(async () => {
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
});

describe("birimOlustur", () => {
  it("tekil tipte ad null bırakılabilir", async () => {
    const yeni = await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    const k = await adminDb.birim.findUnique({ where: { id: yeni.id } });
    expect(k).toBeTruthy();
    expect(k?.ad).toBeNull();
    expect(k?.tip).toBe("KAYMAKAMLIK");
  });

  it("çoklu tipte ad'la birlikte oluşturulur", async () => {
    const yeni = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Şifa Eczanesi",
    });
    const k = await adminDb.birim.findUnique({ where: { id: yeni.id } });
    expect(k?.ad).toBe("Şifa Eczanesi");
    expect(k?.tip).toBe("ECZANE");
  });

  it("aynı tekil tipte ikinci kayıt oluşturulamaz", async () => {
    await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    await expect(
      birimOlustur({
        kategori: "MULKI_IDARE",
        tip: "KAYMAKAMLIK",
        ad: null,
      }),
    ).rejects.toThrow(/zaten kayıtlı/);
  });

  it("aynı çoklu tipte birden fazla kayıt oluşturulabilir", async () => {
    await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Şifa Eczanesi",
    });
    const ikinci = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Merkez Eczanesi",
    });
    expect(ikinci.id).toBeTruthy();
    const sayim = await adminDb.birim.count({ where: { tip: "ECZANE" } });
    expect(sayim).toBe(2);
  });

  it("silinmiş tekil kayıt varken aynı tipte yeni kayıt oluşturulabilir", async () => {
    const ilk = await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    await birimSil(ilk.id);
    const yeni = await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    expect(yeni.id).toBeTruthy();
  });
});

describe("birimGuncelle", () => {
  it("tekil tip değiştirme — yeni tipte halihazırda kayıt varsa hata", async () => {
    await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    const yazi = await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "YAZI_ISLERI_MUDURLUGU",
      ad: null,
    });
    await expect(
      birimGuncelle({
        id: yazi.id,
        kategori: "MULKI_IDARE",
        tip: "KAYMAKAMLIK",
        ad: null,
      }),
    ).rejects.toThrow(/zaten kayıtlı/);
  });

  it("aynı kayıt aynı tipe güncellenebilir (kendisi dışlanır)", async () => {
    const k = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "A Eczanesi",
    });
    await birimGuncelle({
      id: k.id,
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "A Eczanesi (Yeni)",
    });
    const guncel = await adminDb.birim.findUnique({ where: { id: k.id } });
    expect(guncel?.ad).toBe("A Eczanesi (Yeni)");
  });
});

describe("birimSil & birimGeriYukle", () => {
  it("yumuşak silme — silindi_mi=true, silinme_zamani set", async () => {
    const k = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X Eczanesi",
    });
    await birimSil(k.id);
    const silinmis = await adminDb.birim.findUnique({ where: { id: k.id } });
    expect(silinmis?.silindi_mi).toBe(true);
    expect(silinmis?.silinme_zamani).toBeTruthy();
    expect(silinmis?.aktif).toBe(false);
  });

  it("geri yükleme silme bayrağını temizler", async () => {
    const k = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "X Eczanesi",
    });
    await birimSil(k.id);
    await birimGeriYukle(k.id);
    const geri = await adminDb.birim.findUnique({ where: { id: k.id } });
    expect(geri?.silindi_mi).toBe(false);
    expect(geri?.silinme_zamani).toBeNull();
    expect(geri?.aktif).toBe(true);
  });
});

describe("birimleriListele", () => {
  it("kategori filtresi uygular", async () => {
    await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Eczane 1",
    });
    const sonuc = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      kategori: "SAGLIK",
    });
    expect(sonuc.toplam).toBe(1);
    expect(sonuc.kayitlar[0]?.tip).toBe("ECZANE");
  });

  it("silindi_mi=true kayıtlar listede görünmez", async () => {
    const k = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Silinen",
    });
    await birimSil(k.id);
    const aktif = await birimleriListele({ sayfa: 1, sayfaBoyutu: 20 });
    expect(aktif.toplam).toBe(0);
  });

  it("ad/kisa_ad araması case-insensitive", async () => {
    await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "ŞİFA Eczanesi",
      kisa_ad: "SFE",
    });
    const r1 = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "şifa",
    });
    expect(r1.toplam).toBe(1);
    const r2 = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "sfe",
    });
    expect(r2.toplam).toBe(1);
  });

  it("Türkçe karakterler ASCII karşılıklarıyla bulunur", async () => {
    await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Çağlar Eczanesi",
    });
    await birimOlustur({
      kategori: "EGITIM",
      tip: "ANAOKULU",
      ad: "Güneş Anaokulu",
    });

    // ç -> c
    const c = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "caglar",
    });
    expect(c.toplam).toBe(1);

    // ğ ve ş -> g/s, büyük harf
    const g = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "GUNES",
    });
    expect(g.toplam).toBe(1);
  });

  it("İ/I/ı eşleşmesi her iki yönde çalışır", async () => {
    await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "İsmail Eczanesi",
    });

    const a = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "ismail",
    });
    expect(a.toplam).toBe(1);
    const b = await birimleriListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "ısmaıl",
    });
    expect(b.toplam).toBe(1);
  });
});

describe("birimSecenekleri", () => {
  it("sadece aktif ve silinmemiş birimlerı döner, hassas alan yok", async () => {
    const a = await birimOlustur({
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: null,
    });
    const b = await birimOlustur({
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: "Eczane",
    });
    await birimSil(b.id);

    const liste = await birimSecenekleri();
    expect(liste).toHaveLength(1);
    expect(liste[0]?.id).toBe(a.id);
    // Sadece id, ad, kategori, tip — başka hassas alan yok
    expect(Object.keys(liste[0] ?? {}).sort()).toEqual(
      ["ad", "id", "kategori", "tip"].sort(),
    );
  });
});
