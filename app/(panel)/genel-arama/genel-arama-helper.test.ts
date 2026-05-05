// Genel Arama saf logic testleri (Kontrol Kural 139).

import { describe, expect, it } from "vitest";
import {
  metniKirp,
  rankaGoreSirala,
  tipeGoreGrupla,
  tsqueryyeCevir,
} from "./genel-arama-helper";
import type { AramaSonucu } from "./tipler";

describe("tsqueryyeCevir", () => {
  it("tek kelimede prefix wildcard ekler", () => {
    expect(tsqueryyeCevir("yetk")).toBe("yetk:*");
  });

  it("birden fazla kelimeyi & ile birleştirir, son kelimeye wildcard", () => {
    expect(tsqueryyeCevir("yetki ay")).toBe("yetki & ay:*");
    expect(tsqueryyeCevir("kış tedbiri planı")).toBe("kış & tedbiri & planı:*");
  });

  it("Türkçe karakterleri korur", () => {
    expect(tsqueryyeCevir("şikayet")).toBe("şikayet:*");
    expect(tsqueryyeCevir("öğrenci güvenliği")).toBe("öğrenci & güvenliği:*");
  });

  it("özel tsquery karakterlerini söker", () => {
    expect(tsqueryyeCevir("kart&yorum")).toBe("kartyorum:*");
    expect(tsqueryyeCevir("(yetki) !kontrol")).toBe("yetki & kontrol:*");
  });

  it("min 2 karakterden kısa sorgu null döndürür", () => {
    expect(tsqueryyeCevir("")).toBeNull();
    expect(tsqueryyeCevir("a")).toBeNull();
    expect(tsqueryyeCevir(" ")).toBeNull();
  });

  it("sadece özel karakter içeren kelime null döndürür", () => {
    expect(tsqueryyeCevir("&|!")).toBeNull();
    expect(tsqueryyeCevir("()")).toBeNull();
  });

  it("tek karakter kelimeleri (1 karakter) atar — gürültüyü engeller", () => {
    expect(tsqueryyeCevir("a yetki")).toBe("yetki:*");
    expect(tsqueryyeCevir("yetki a b ay")).toBe("yetki & ay:*");
  });
});

describe("rankaGoreSirala", () => {
  const sonuc = (id: string, rank: number): AramaSonucu => ({
    tip: "kart",
    id,
    baslik: id,
    detay: null,
    rank,
    proje_id: "p",
    liste_id: "l",
  });

  it("rank büyükten küçüğe sıralar", () => {
    const r = rankaGoreSirala([sonuc("a", 0.1), sonuc("b", 0.5), sonuc("c", 0.3)], 10);
    expect(r.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("limit'e indirger", () => {
    const liste = [sonuc("a", 0.5), sonuc("b", 0.4), sonuc("c", 0.3)];
    expect(rankaGoreSirala(liste, 2)).toHaveLength(2);
  });

  it("orijinal listeyi mutate etmez (immutability — Kural CLAUDE.md)", () => {
    const liste = [sonuc("a", 0.1), sonuc("b", 0.5)];
    const oncekiSira = liste.map((s) => s.id);
    rankaGoreSirala(liste, 10);
    expect(liste.map((s) => s.id)).toEqual(oncekiSira);
  });
});

describe("tipeGoreGrupla", () => {
  it("aynı tipteki sonuçları gruplandırır, sıra korunur", () => {
    const sonuclar: AramaSonucu[] = [
      { tip: "kart", id: "k1", baslik: "K1", detay: null, rank: 0.5, proje_id: "p", liste_id: "l" },
      { tip: "yorum", id: "y1", baslik: "Y1", detay: null, rank: 0.4, kart_id: "k" },
      { tip: "kart", id: "k2", baslik: "K2", detay: null, rank: 0.3, proje_id: "p", liste_id: "l" },
    ];
    const grup = tipeGoreGrupla(sonuclar);
    expect(grup.get("kart")?.map((s) => s.id)).toEqual(["k1", "k2"]);
    expect(grup.get("yorum")?.map((s) => s.id)).toEqual(["y1"]);
    expect(grup.get("kullanici")).toBeUndefined();
  });

  it("boş listede boş Map döner", () => {
    expect(tipeGoreGrupla([]).size).toBe(0);
  });
});

describe("metniKirp", () => {
  it("max'dan kısa metni olduğu gibi döndürür", () => {
    expect(metniKirp("kısa metin", "kısa", 120)).toBe("kısa metin");
  });

  it("uzun metni sorgu kelimesinin etrafından kırpar", () => {
    const uzun = "a".repeat(40) + " yetki burada bir yerde " + "b".repeat(80);
    const kirpik = metniKirp(uzun, "yetki", 60);
    expect(kirpik).toContain("yetki");
    expect(kirpik.length).toBeLessThanOrEqual(62); // ± elipsler
  });

  it("sorgu metinde yoksa baştan kırpar", () => {
    const uzun = "x".repeat(200);
    expect(metniKirp(uzun, "bulunamaz", 50)).toBe("x".repeat(50) + "…");
  });

  it("uzun metnin sonuna elipsis koyar", () => {
    const uzun = "ön " + "a".repeat(200);
    const kirpik = metniKirp(uzun, "ön", 50);
    expect(kirpik.endsWith("…")).toBe(true);
  });
});
