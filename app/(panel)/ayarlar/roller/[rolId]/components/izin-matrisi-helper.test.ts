import { describe, expect, it } from "vitest";
import { IzinKategorisi } from "@prisma/client";
import {
  diffBosMu,
  izinDiffi,
  izinKategoriBasligi,
  izinleriAra,
  izinleriKategoriyeGore,
  izinTogglela,
  grubuToggle,
  kategoriToggle,
  rolYonetKaldiriliyorMu,
  tumuToggle,
  type IzinSatiri,
} from "./izin-matrisi-helper";
import { IZIN_KODLARI } from "@/lib/permissions-katalog";

const ornekIzinler: IzinSatiri[] = [
  {
    id: "1",
    kod: IZIN_KODLARI.KART_OLUSTUR,
    ad: "Yeni Kart Oluştur",
    aciklama: "Yeni kart açma",
    kategori: IzinKategorisi.KART,
    alt_kategori: null,
  },
  {
    id: "2",
    kod: IZIN_KODLARI.KART_BASLIK_DUZENLE,
    ad: "Kart Başlığı Düzenle",
    aciklama: null,
    kategori: IzinKategorisi.KART,
    alt_kategori: null,
  },
  {
    id: "3",
    kod: IZIN_KODLARI.KART_KAPAK_RENK,
    ad: "Kart Kapak Rengi",
    aciklama: null,
    kategori: IzinKategorisi.KART,
    alt_kategori: "kapak",
  },
  {
    id: "4",
    kod: IZIN_KODLARI.KART_KAPAK_GORSEL,
    ad: "Kart Kapak Görseli",
    aciklama: null,
    kategori: IzinKategorisi.KART,
    alt_kategori: "kapak",
  },
  {
    id: "5",
    kod: IZIN_KODLARI.PROJE_OLUSTUR,
    ad: "Proje Oluştur",
    aciklama: "Yeni proje",
    kategori: IzinKategorisi.PROJE,
    alt_kategori: null,
  },
  {
    id: "6",
    kod: IZIN_KODLARI.ROL_IZIN_ATA,
    ad: "Rol İzinleri",
    aciklama: null,
    kategori: IzinKategorisi.ROL,
    alt_kategori: null,
  },
];

describe("izinleriKategoriyeGore", () => {
  it("kategoriye göre üst gruplar oluşturur", () => {
    const gruplar = izinleriKategoriyeGore(ornekIzinler, new Set());
    expect(gruplar.map((g) => g.kategori).sort()).toEqual(
      [IzinKategorisi.KART, IzinKategorisi.PROJE, IzinKategorisi.ROL].sort(),
    );
  });

  it("alt-kategori varsa subgrup üretir", () => {
    const gruplar = izinleriKategoriyeGore(ornekIzinler, new Set());
    const kart = gruplar.find((g) => g.kategori === IzinKategorisi.KART);
    expect(kart).toBeTruthy();
    // Genel + kapak = 2 alt grup
    expect(kart!.altGruplar).toHaveLength(2);
    const genel = kart!.altGruplar.find((a) => a.altKategori === null);
    const kapak = kart!.altGruplar.find((a) => a.altKategori === "kapak");
    expect(genel?.toplamSayisi).toBe(2);
    expect(kapak?.toplamSayisi).toBe(2);
  });

  it("seçilmiş sayısı her seviyede doğru", () => {
    const secili = new Set([
      IZIN_KODLARI.KART_OLUSTUR,
      IZIN_KODLARI.KART_KAPAK_RENK,
    ] as string[]);
    const gruplar = izinleriKategoriyeGore(ornekIzinler, secili);
    const kart = gruplar.find((g) => g.kategori === IzinKategorisi.KART)!;
    expect(kart.secilmisSayisi).toBe(2);

    const genel = kart.altGruplar.find((a) => a.altKategori === null);
    const kapak = kart.altGruplar.find((a) => a.altKategori === "kapak");
    expect(genel?.secilmisSayisi).toBe(1);
    expect(kapak?.secilmisSayisi).toBe(1);
  });

  it("alt-kategori 'temel' (null) önce gelir", () => {
    const gruplar = izinleriKategoriyeGore(ornekIzinler, new Set());
    const kart = gruplar.find((g) => g.kategori === IzinKategorisi.KART)!;
    expect(kart.altGruplar[0]?.altKategori).toBeNull();
  });

  it("boş listede boş döner", () => {
    expect(izinleriKategoriyeGore([], new Set())).toEqual([]);
  });
});

describe("izinleriAra", () => {
  it("kod ile bulur", () => {
    expect(izinleriAra(ornekIzinler, "kapak")).toHaveLength(2);
  });

  it("ad ile bulur (case-insensitive Türkçe)", () => {
    expect(izinleriAra(ornekIzinler, "BAŞLIĞI")).toHaveLength(1);
  });

  it("açıklamada arar", () => {
    expect(izinleriAra(ornekIzinler, "yeni kart")).toHaveLength(1);
  });

  it("kategori başlığında arar (Türkçe)", () => {
    // KATEGORI_BASLIKLARI[ROL] = "Rol & Yetki"
    const sonuc = izinleriAra(ornekIzinler, "Yetki");
    expect(sonuc.some((i) => i.kod === IZIN_KODLARI.ROL_IZIN_ATA)).toBe(true);
  });

  it("alt-kategori başlığında arar", () => {
    // ALT_KATEGORI_BASLIKLARI[kapak] = "Kapak"
    const sonuc = izinleriAra(ornekIzinler, "Kapak");
    expect(sonuc.length).toBeGreaterThanOrEqual(2);
  });

  it("boş aramada tümünü döner", () => {
    expect(izinleriAra(ornekIzinler, "")).toHaveLength(ornekIzinler.length);
    expect(izinleriAra(ornekIzinler, "   ")).toHaveLength(ornekIzinler.length);
  });
});

describe("izinTogglela", () => {
  it("yoksa ekler, varsa kaldırır", () => {
    const s1 = izinTogglela(new Set(["a"]), "b");
    expect(s1.has("b")).toBe(true);
    expect(s1.has("a")).toBe(true);
    const s2 = izinTogglela(s1, "a");
    expect(s2.has("a")).toBe(false);
    expect(s2.has("b")).toBe(true);
  });

  it("orijinal seti mutate etmez", () => {
    const orjinal = new Set(["a"]);
    izinTogglela(orjinal, "b");
    expect(orjinal.size).toBe(1);
  });
});

describe("grubuToggle", () => {
  const kapakIzinleri = ornekIzinler.filter(
    (i) => i.alt_kategori === "kapak",
  );

  it("hiçbiri seçili değilse tümünü ekler", () => {
    const sonuc = grubuToggle(new Set(), kapakIzinleri);
    expect(sonuc.size).toBe(kapakIzinleri.length);
  });

  it("tümü seçiliyse hepsini kaldırır", () => {
    const sonuc = grubuToggle(
      new Set(kapakIzinleri.map((i) => i.kod)),
      kapakIzinleri,
    );
    expect(sonuc.size).toBe(0);
  });

  it("kategoriToggle alias çalışır (geri uyum)", () => {
    const sonuc = kategoriToggle(new Set(), kapakIzinleri);
    expect(sonuc.size).toBe(kapakIzinleri.length);
  });
});

describe("tumuToggle", () => {
  it("hiçbiri seçili değilse tümünü seçer", () => {
    const sonuc = tumuToggle(new Set(), ornekIzinler);
    expect(sonuc.size).toBe(ornekIzinler.length);
  });

  it("tümü seçiliyse boşaltır", () => {
    const sonuc = tumuToggle(
      new Set(ornekIzinler.map((i) => i.kod)),
      ornekIzinler,
    );
    expect(sonuc.size).toBe(0);
  });
});

describe("izinDiffi", () => {
  it("eklenen, kaldırılan, değişmemişi ayırır", () => {
    const baseline = new Set(["a", "b", "c"]);
    const yeni = new Set(["b", "c", "d"]);
    const diff = izinDiffi(baseline, yeni);
    expect(diff.eklenen).toEqual(["d"]);
    expect(diff.kaldirilan).toEqual(["a"]);
    expect(diff.degismemis.sort()).toEqual(["b", "c"]);
  });

  it("aynıysa boş diff", () => {
    const set = new Set(["a"]);
    const diff = izinDiffi(set, new Set(set));
    expect(diff.eklenen).toEqual([]);
    expect(diff.kaldirilan).toEqual([]);
  });
});

describe("diffBosMu", () => {
  it("ikisi de boşsa true", () => {
    expect(
      diffBosMu({ eklenen: [], kaldirilan: [], degismemis: ["a"] }),
    ).toBe(true);
  });

  it("herhangi biri varsa false", () => {
    expect(
      diffBosMu({ eklenen: ["a"], kaldirilan: [], degismemis: [] }),
    ).toBe(false);
  });
});

describe("rolYonetKaldiriliyorMu", () => {
  it("yeni granüler kodlar için: ROL_IZIN_ATA varken kaldırılırsa true", () => {
    expect(
      rolYonetKaldiriliyorMu(
        new Set([IZIN_KODLARI.ROL_IZIN_ATA, IZIN_KODLARI.KART_OLUSTUR]),
        new Set([IZIN_KODLARI.KART_OLUSTUR]),
      ),
    ).toBe(true);
  });

  it("eski 'rol:manage' kodu da algılanır (geri uyum)", () => {
    expect(
      rolYonetKaldiriliyorMu(new Set(["rol:manage"]), new Set([])),
    ).toBe(true);
  });

  it("yenide en az bir rol:* varsa false", () => {
    expect(
      rolYonetKaldiriliyorMu(
        new Set([IZIN_KODLARI.ROL_OLUSTUR, IZIN_KODLARI.ROL_SIL]),
        new Set([IZIN_KODLARI.ROL_OLUSTUR]),
      ),
    ).toBe(false);
  });

  it("baseline'da hiç yoksa false", () => {
    expect(
      rolYonetKaldiriliyorMu(
        new Set([IZIN_KODLARI.KART_OLUSTUR]),
        new Set([]),
      ),
    ).toBe(false);
  });
});

describe("izinKategoriBasligi", () => {
  it("bilinen izin kodu → kategori başlığı", () => {
    expect(izinKategoriBasligi(IZIN_KODLARI.KART_OLUSTUR)).toBe("Kart");
    expect(izinKategoriBasligi(IZIN_KODLARI.ROL_IZIN_ATA)).toBe("Rol & Yetki");
  });

  it("bilinmeyen kod → 'Diğer'", () => {
    expect(izinKategoriBasligi("yok:olan")).toBe("Diğer");
  });
});
