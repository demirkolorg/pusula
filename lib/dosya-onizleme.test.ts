import { describe, expect, it } from "vitest";
import { DosyaDurumu, DosyaKategori } from "@prisma/client";
import {
  ONIZLEME_STRATEJI,
  ONIZLEME_STRATEJI_ETIKETI,
  inlineOnizlemeMi,
  onizlemeStratejisi,
} from "./dosya-onizleme";

describe("onizlemeStratejisi", () => {
  describe("durum filtresi", () => {
    it("KARANTINA hep INDIR_FALLBACK döner", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.GORSEL,
          "image/png",
          DosyaDurumu.KARANTINA,
        ),
      ).toBe(ONIZLEME_STRATEJI.INDIR_FALLBACK);
      expect(
        onizlemeStratejisi(
          DosyaKategori.PDF,
          "application/pdf",
          DosyaDurumu.KARANTINA,
        ),
      ).toBe(ONIZLEME_STRATEJI.INDIR_FALLBACK);
    });

    it("YUKLENIYOR INDIR_FALLBACK döner", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.PDF,
          "application/pdf",
          DosyaDurumu.YUKLENIYOR,
        ),
      ).toBe(ONIZLEME_STRATEJI.INDIR_FALLBACK);
    });

    it("HATALI INDIR_FALLBACK döner", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.PDF,
          "application/pdf",
          DosyaDurumu.HATALI,
        ),
      ).toBe(ONIZLEME_STRATEJI.INDIR_FALLBACK);
    });
  });

  describe("SVG XSS koruması", () => {
    it("SVG GORSEL kategorisi olsa bile inline render etmez", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.GORSEL,
          "image/svg+xml",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.INDIR_FALLBACK);
    });
  });

  describe("görsel", () => {
    it("PNG GORSEL_VIEWER", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.GORSEL,
          "image/png",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.GORSEL_VIEWER);
    });

    it("JPEG GORSEL_VIEWER", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.GORSEL,
          "image/jpeg",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.GORSEL_VIEWER);
    });
  });

  describe("PDF", () => {
    it("PDF kategori PDF_IFRAME", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.PDF,
          "application/pdf",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.PDF_IFRAME);
    });
  });

  describe("metin", () => {
    it("text/plain METIN_PLAIN", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.METIN,
          "text/plain",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.METIN_PLAIN);
    });

    it("text/csv METIN_PLAIN", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.METIN,
          "text/csv",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.METIN_PLAIN);
    });

    it("text/markdown MARKDOWN_SANITIZE", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.METIN,
          "text/markdown",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.MARKDOWN_SANITIZE);
    });
  });

  describe("Office", () => {
    it("Word OFIS_INDIR", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.OFIS_BELGESI,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.OFIS_INDIR);
    });

    it("Excel OFIS_INDIR", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.TABLO,
          "application/vnd.ms-excel",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.OFIS_INDIR);
    });

    it("PowerPoint OFIS_INDIR", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.SUNUM,
          "application/vnd.ms-powerpoint",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.OFIS_INDIR);
    });
  });

  describe("arşiv ve diğer", () => {
    it("zip ARSIV_INDIR", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.ARSIV,
          "application/zip",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.ARSIV_INDIR);
    });

    it("DIGER kategori INDIR_FALLBACK", () => {
      expect(
        onizlemeStratejisi(
          DosyaKategori.DIGER,
          "application/octet-stream",
          DosyaDurumu.HAZIR,
        ),
      ).toBe(ONIZLEME_STRATEJI.INDIR_FALLBACK);
    });
  });
});

describe("inlineOnizlemeMi", () => {
  it("görsel/PDF/metin/markdown stratejileri inline'dır", () => {
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.GORSEL_VIEWER)).toBe(true);
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.PDF_IFRAME)).toBe(true);
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.METIN_PLAIN)).toBe(true);
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.MARKDOWN_SANITIZE)).toBe(true);
  });

  it("indir-bazlı stratejiler inline değil", () => {
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.OFIS_INDIR)).toBe(false);
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.ARSIV_INDIR)).toBe(false);
    expect(inlineOnizlemeMi(ONIZLEME_STRATEJI.INDIR_FALLBACK)).toBe(false);
  });
});

describe("ONIZLEME_STRATEJI_ETIKETI", () => {
  it("her strateji için Türkçe etiket sağlar", () => {
    for (const strateji of Object.values(ONIZLEME_STRATEJI)) {
      expect(ONIZLEME_STRATEJI_ETIKETI[strateji]).toBeTruthy();
      expect(ONIZLEME_STRATEJI_ETIKETI[strateji].length).toBeGreaterThan(0);
    }
  });
});
