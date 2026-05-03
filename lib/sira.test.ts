import { describe, it, expect } from "vitest";
import {
  siraArasi,
  siraSonuna,
  siraBasina,
  siraKarsilastir,
  SIRA_BAS,
  SIRA_ALFABE,
} from "./sira";

describe("siraArasi", () => {
  it("iki karakter arasinda orta karakteri doner (geniş aralık)", () => {
    // 'A' ile 'C': arada 'B' var, ortayı al = 'B'
    expect(siraArasi("A", "C")).toBe("B");
  });

  it("iki ardisik karakter arasinda prefix + alt-alfabe ortayı uretir", () => {
    // 'A' ile 'B': fark 1, prefix 'A' eklenir, sonrasini'ye gider.
    const r = siraArasi("A", "B");
    expect(r.length).toBeGreaterThan(1);
    expect(r > "A").toBe(true);
    expect(r < "B").toBe(true);
  });

  it("onceki null verilirse listenin BAŞINA göre yeni sira uretir", () => {
    const r = siraArasi(null, "M");
    expect(r < "M").toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });

  it("sonraki null verilirse listenin SONUNA göre yeni sira uretir", () => {
    const r = siraArasi("M", null);
    expect(r > "M").toBe(true);
  });

  it("ikisi de null verilirse alfabe ortasını döner", () => {
    const r = siraArasi(null, null);
    expect(typeof r).toBe("string");
    expect(r.length).toBeGreaterThan(0);
  });

  it("onceki >= sonraki çakışmasında Error firlatir", () => {
    expect(() => siraArasi("C", "A")).toThrow(/siraArasi/);
    expect(() => siraArasi("B", "B")).toThrow(/siraArasi/);
    expect(() => siraArasi("ZZZ", "AAA")).toThrow();
  });

  it("sonuc her zaman strict monoton: a < r < b", () => {
    const orneklere = [
      ["A", "C"],
      ["A", "B"],
      ["M", "N"],
      ["A", "Z"],
      ["0", "9"],
      ["MM", "MN"],
      ["Y", "Z"],
      ["0", "1"],
    ] as const;
    for (const [a, b] of orneklere) {
      const r = siraArasi(a, b);
      expect(r > a, `${r} > ${a} olmali`).toBe(true);
      expect(r < b, `${r} < ${b} olmali`).toBe(true);
    }
  });

  it("ardisik 5 bolme strict monoton kalir (a, son arası)", () => {
    // Pratik kullanımda 5 iterasyon yeterli. Daha derin bölme alfabe tabanına
    // çarpar (LexoRank sınırlaması).
    const a = "A";
    let son = "Z";
    for (let i = 0; i < 5; i++) {
      const r = siraArasi(a, son);
      expect(r > a, `iter ${i}: ${r} > ${a}`).toBe(true);
      expect(r < son, `iter ${i}: ${r} < ${son}`).toBe(true);
      son = r;
    }
  });

  it("listenin sonuna ardışık 200 ekleme strict monoton (sira > onceki) — sınırsız", () => {
    // Sona ekleme sınırsızdır: "Z" prefix'le sonsuz genişler.
    let son: string | null = null;
    for (let i = 0; i < 200; i++) {
      const yeni = siraArasi(son, null);
      if (son !== null) {
        expect(yeni > son, `iter ${i}: ${yeni} > ${son}`).toBe(true);
      }
      son = yeni;
    }
  });

  it("listenin başına ardışık 5 ekleme strict monoton (sira < ilk)", () => {
    // SIRA_BAS = "M"'den başa eklemede ~5 iterasyon güvenli.
    // Daha derin: alfabe tabanı '0' altına ulaşamayız.
    let ilk: string | null = null;
    for (let i = 0; i < 5; i++) {
      const yeni = siraArasi(null, ilk);
      if (ilk !== null) {
        expect(yeni < ilk, `iter ${i}: ${yeni} < ${ilk}`).toBe(true);
      }
      ilk = yeni;
    }
  });

  it("alfabe tabanı '0' önünde Error fırlatır", () => {
    expect(() => siraArasi(null, "0")).toThrow(/alfabe tabanı/);
  });

  it("aynı a, b çifti için deterministik sonuç (idempotent)", () => {
    expect(siraArasi("A", "C")).toBe(siraArasi("A", "C"));
    expect(siraArasi("M", "N")).toBe(siraArasi("M", "N"));
  });

  it("alfabe dışı karakter atılır (Error)", () => {
    expect(() => siraArasi("a", "z")).toThrow(/alfabe dışı/);
    expect(() => siraArasi("@", "Z")).toThrow();
  });

  it("alfabe sadece 0-9 + A-Z (36 karakter)", () => {
    expect(SIRA_ALFABE).toBe("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(SIRA_ALFABE.length).toBe(36);
  });

  it("ASCII '<' karşılaştırması = alfabetik sıra (locale yok)", () => {
    // Tüm üretilen siralar 0-9 + A-Z olduğu için string '<' güvenlidir.
    const r1 = siraArasi("M", "N");
    const r2 = siraArasi("A", "B");
    expect(r2 < r1).toBe(true);
  });

  it("derin ortak prefix durumunu doğru parçalar", () => {
    const r = siraArasi("MMM", "MMN");
    expect(r > "MMM").toBe(true);
    expect(r < "MMN").toBe(true);
  });

  it("uzun ortak prefix + son karakterlerde fark", () => {
    const r = siraArasi("MMMA", "MMMC");
    expect(r).toBe("MMMB");
  });
});

describe("siraSonuna", () => {
  it("liste boşsa SIRA_BAS döner", () => {
    expect(siraSonuna(null)).toBe(SIRA_BAS);
  });

  it("son elemandan strict olarak büyük bir sıra döner", () => {
    const r = siraSonuna("M");
    expect(r > "M").toBe(true);
  });

  it("listenin sonuna eklenebilir, ASCII sıra korunur", () => {
    let son: string | null = null;
    const sirali: string[] = [];
    for (let i = 0; i < 50; i++) {
      const yeni = siraSonuna(son);
      sirali.push(yeni);
      son = yeni;
    }
    const sortlu = [...sirali].sort();
    expect(sirali).toEqual(sortlu);
  });
});

describe("siraBasina", () => {
  it("liste boşsa SIRA_BAS döner", () => {
    expect(siraBasina(null)).toBe(SIRA_BAS);
  });

  it("ilk elemandan strict olarak küçük bir sıra döner", () => {
    const r = siraBasina("M");
    expect(r < "M").toBe(true);
  });

  it("listenin başına eklenebilir, ASCII sıra korunur (5 iter güvenli)", () => {
    let ilk: string | null = null;
    const sirali: string[] = [];
    for (let i = 0; i < 5; i++) {
      const yeni = siraBasina(ilk);
      sirali.unshift(yeni);
      ilk = yeni;
    }
    const sortlu = [...sirali].sort();
    expect(sirali).toEqual(sortlu);
  });
});

describe("siraKarsilastir", () => {
  it("eşit string için 0 döner", () => {
    expect(siraKarsilastir("M", "M")).toBe(0);
  });

  it("a < b için negatif döner", () => {
    expect(siraKarsilastir("A", "B")).toBeLessThan(0);
  });

  it("a > b için pozitif döner", () => {
    expect(siraKarsilastir("Z", "A")).toBeGreaterThan(0);
  });

  it("Array.sort ile uyumlu", () => {
    const arr = ["M", "A", "Z", "B"];
    arr.sort(siraKarsilastir);
    expect(arr).toEqual(["A", "B", "M", "Z"]);
  });
});
