import { describe, expect, it } from "vitest";
import {
  aktifFiltreSayisi,
  boyutBicim,
  filtreyiSorguStringeyeCevir,
  filtreyiTemizle,
  paramlardanFiltreUret,
  VARSAYILAN_FILTRE,
} from "./dosya-filtre";

describe("paramlardanFiltreUret", () => {
  it("boş params'tan default filtre üretir", () => {
    const f = paramlardanFiltreUret({});
    expect(f.siralama).toBe("yeni-eklenen");
    expect(f.kategori).toBeUndefined();
    expect(f.arama).toBeUndefined();
  });

  it("geçerli kategori parsenir", () => {
    const f = paramlardanFiltreUret({ kategori: "PDF" });
    expect(f.kategori).toBe("PDF");
  });

  it("geçersiz kategori atlanır", () => {
    const f = paramlardanFiltreUret({ kategori: "VIRUS" });
    expect(f.kategori).toBeUndefined();
  });

  it("geçersiz UUID atlanır", () => {
    const f = paramlardanFiltreUret({ proje_id: "kotu-uuid" });
    expect(f.proje_id).toBeUndefined();
  });

  it("geçerli UUID alınır", () => {
    const id = "11111111-1111-4111-9111-111111111111";
    const f = paramlardanFiltreUret({ proje_id: id });
    expect(f.proje_id).toBe(id);
  });

  it("silinmis bool '1'/'0' parser", () => {
    expect(paramlardanFiltreUret({ silinmis: "1" }).silinmis).toBe(true);
    expect(paramlardanFiltreUret({ silinmis: "0" }).silinmis).toBe(false);
    expect(paramlardanFiltreUret({ silinmis: "true" }).silinmis).toBe(true);
    expect(paramlardanFiltreUret({ silinmis: "yanlış" }).silinmis).toBeUndefined();
  });

  it("boyut sayı parsenir, negatif atlanır", () => {
    expect(paramlardanFiltreUret({ boyut_min: "1024" }).boyut_min).toBe(1024);
    expect(paramlardanFiltreUret({ boyut_min: "-1" }).boyut_min).toBeUndefined();
    expect(paramlardanFiltreUret({ boyut_min: "abc" }).boyut_min).toBeUndefined();
  });

  it("tarih ISO string parsenir", () => {
    const f = paramlardanFiltreUret({
      tarih_baslangic: "2026-01-01T00:00:00.000Z",
    });
    expect(f.tarih_baslangic?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("geçersiz sıralama default'a düşer", () => {
    const f = paramlardanFiltreUret({ siralama: "rastgele" });
    expect(f.siralama).toBe("yeni-eklenen");
  });

  it("geçerli sıralama korunur", () => {
    const f = paramlardanFiltreUret({ siralama: "boyut-desc" });
    expect(f.siralama).toBe("boyut-desc");
  });

  it("array search param ilk elemanı alır", () => {
    const f = paramlardanFiltreUret({ kategori: ["PDF", "GORSEL"] });
    expect(f.kategori).toBe("PDF");
  });
});

describe("filtreyiSorguStringeyeCevir", () => {
  it("default değerler yazılmaz", () => {
    const s = filtreyiSorguStringeyeCevir(VARSAYILAN_FILTRE);
    expect(s).toBe("");
  });

  it("arama param eklenir", () => {
    const s = filtreyiSorguStringeyeCevir({
      ...VARSAYILAN_FILTRE,
      arama: "rapor",
    });
    expect(s).toBe("arama=rapor");
  });

  it("birden fazla param ampersand ile bağlanır", () => {
    const s = filtreyiSorguStringeyeCevir({
      ...VARSAYILAN_FILTRE,
      kategori: "PDF",
      durum: "HAZIR",
    });
    expect(s).toContain("kategori=PDF");
    expect(s).toContain("durum=HAZIR");
  });

  it("non-default sıralama yazılır", () => {
    const s = filtreyiSorguStringeyeCevir({
      ...VARSAYILAN_FILTRE,
      siralama: "boyut-desc",
    });
    expect(s).toContain("siralama=boyut-desc");
  });

  it("silinmis '1' olarak yazılır", () => {
    const s = filtreyiSorguStringeyeCevir({
      ...VARSAYILAN_FILTRE,
      silinmis: true,
    });
    expect(s).toBe("silinmis=1");
  });

  it("roundtrip: parse(stringify(x)) === x (önemli alanlar)", () => {
    const f1 = {
      ...VARSAYILAN_FILTRE,
      kategori: "PDF" as const,
      durum: "HAZIR" as const,
      silinmis: true,
      arama: "tutanak",
    };
    const qs = filtreyiSorguStringeyeCevir(f1);
    const params = Object.fromEntries(new URLSearchParams(qs));
    const f2 = paramlardanFiltreUret(params);
    expect(f2.kategori).toBe(f1.kategori);
    expect(f2.durum).toBe(f1.durum);
    expect(f2.silinmis).toBe(f1.silinmis);
    expect(f2.arama).toBe(f1.arama);
  });
});

describe("aktifFiltreSayisi", () => {
  it("default filtrede 0", () => {
    expect(aktifFiltreSayisi(VARSAYILAN_FILTRE)).toBe(0);
  });

  it("3 alanla 3 döner", () => {
    expect(
      aktifFiltreSayisi({
        ...VARSAYILAN_FILTRE,
        arama: "x",
        kategori: "PDF",
        durum: "HAZIR",
      }),
    ).toBe(3);
  });

  it("silinmis=true sayılır, false sayılır, undefined sayılmaz", () => {
    expect(
      aktifFiltreSayisi({ ...VARSAYILAN_FILTRE, silinmis: true }),
    ).toBe(1);
    expect(
      aktifFiltreSayisi({ ...VARSAYILAN_FILTRE, silinmis: undefined }),
    ).toBe(0);
  });
});

describe("filtreyiTemizle", () => {
  it("varsayılan filtreyi döner", () => {
    const t = filtreyiTemizle();
    expect(t.siralama).toBe("yeni-eklenen");
    expect(t.kategori).toBeUndefined();
  });
});

describe("boyutBicim", () => {
  it("byte gösterir", () => {
    expect(boyutBicim(512)).toBe("512 B");
  });

  it("KB gösterir", () => {
    expect(boyutBicim(2048)).toBe("2 KB");
  });

  it("MB gösterir 1 ondalık", () => {
    expect(boyutBicim(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("GB gösterir 1 ondalık", () => {
    expect(boyutBicim(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });
});
