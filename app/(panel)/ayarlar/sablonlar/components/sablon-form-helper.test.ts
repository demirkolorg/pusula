import { describe, expect, it } from "vitest";
import {
  listeEkle,
  listeGuncelle,
  listeSil,
  listeyiAsagiTasi,
  listeyiYukariTasi,
  type SablonListeTaslagi,
} from "./sablon-form-helper";

const A: SablonListeTaslagi = { ad: "A", wip_limit: null };
const B: SablonListeTaslagi = { ad: "B", wip_limit: 3 };
const C: SablonListeTaslagi = { ad: "C", wip_limit: null };

describe("listeEkle", () => {
  it("boş liste sona yeni boş eleman ekler", () => {
    const sonuc = listeEkle([]);
    expect(sonuc).toEqual([{ ad: "", wip_limit: null }]);
  });

  it("dolu listenin sonuna ekler", () => {
    const sonuc = listeEkle([A]);
    expect(sonuc).toHaveLength(2);
    expect(sonuc[0]).toEqual(A);
    expect(sonuc[1]).toEqual({ ad: "", wip_limit: null });
  });

  it("orijinali değiştirmez", () => {
    const orijinal = [A];
    listeEkle(orijinal);
    expect(orijinal).toEqual([A]);
  });
});

describe("listeSil", () => {
  it("verilen index'i çıkarır", () => {
    expect(listeSil([A, B, C], 1)).toEqual([A, C]);
  });

  it("ilk elemanı çıkarır", () => {
    expect(listeSil([A, B, C], 0)).toEqual([B, C]);
  });

  it("son elemanı çıkarır", () => {
    expect(listeSil([A, B, C], 2)).toEqual([A, B]);
  });

  it("geçersiz index'te listeyi olduğu gibi döndürür", () => {
    expect(listeSil([A, B], -1)).toEqual([A, B]);
    expect(listeSil([A, B], 99)).toEqual([A, B]);
  });
});

describe("listeyiYukariTasi", () => {
  it("ortadaki elemanı bir yukarı taşır", () => {
    expect(listeyiYukariTasi([A, B, C], 1)).toEqual([B, A, C]);
  });

  it("son elemanı bir yukarı taşır", () => {
    expect(listeyiYukariTasi([A, B, C], 2)).toEqual([A, C, B]);
  });

  it("ilk eleman yerinde kalır", () => {
    expect(listeyiYukariTasi([A, B, C], 0)).toEqual([A, B, C]);
  });

  it("geçersiz index'te liste değişmez", () => {
    expect(listeyiYukariTasi([A, B], -1)).toEqual([A, B]);
    expect(listeyiYukariTasi([A, B], 99)).toEqual([A, B]);
  });
});

describe("listeyiAsagiTasi", () => {
  it("ortadaki elemanı bir aşağı taşır", () => {
    expect(listeyiAsagiTasi([A, B, C], 1)).toEqual([A, C, B]);
  });

  it("ilk elemanı bir aşağı taşır", () => {
    expect(listeyiAsagiTasi([A, B, C], 0)).toEqual([B, A, C]);
  });

  it("son eleman yerinde kalır", () => {
    expect(listeyiAsagiTasi([A, B, C], 2)).toEqual([A, B, C]);
  });

  it("geçersiz index'te liste değişmez", () => {
    expect(listeyiAsagiTasi([A, B], -1)).toEqual([A, B]);
    expect(listeyiAsagiTasi([A, B], 99)).toEqual([A, B]);
  });
});

describe("listeGuncelle", () => {
  it("ad alanını günceller", () => {
    expect(listeGuncelle([A, B], 0, { ad: "Yeni" })).toEqual([
      { ad: "Yeni", wip_limit: null },
      B,
    ]);
  });

  it("wip_limit alanını günceller", () => {
    expect(listeGuncelle([A, B], 0, { wip_limit: 5 })).toEqual([
      { ad: "A", wip_limit: 5 },
      B,
    ]);
  });

  it("wip_limit'i null yapar", () => {
    expect(listeGuncelle([B], 0, { wip_limit: null })).toEqual([
      { ad: "B", wip_limit: null },
    ]);
  });

  it("geçersiz index'te liste değişmez", () => {
    expect(listeGuncelle([A], 5, { ad: "X" })).toEqual([A]);
  });

  it("orijinali değiştirmez (referans değişir)", () => {
    const orijinal = [A, B];
    const sonuc = listeGuncelle(orijinal, 0, { ad: "X" });
    expect(orijinal).toEqual([A, B]);
    expect(sonuc).not.toBe(orijinal);
  });
});
