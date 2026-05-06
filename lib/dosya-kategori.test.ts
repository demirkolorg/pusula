import { describe, expect, it } from "vitest";
import { DosyaKategori } from "@prisma/client";
import {
  DOSYA_KATEGORI_ETIKETI,
  dosyaKategorisi,
  dosyaUzantisi,
} from "./dosya-kategori";

describe("dosyaUzantisi", () => {
  it("normal dosya adından uzantı çıkarır (lower-case)", () => {
    expect(dosyaUzantisi("Belge.PDF")).toBe("pdf");
    expect(dosyaUzantisi("foto.JPEG")).toBe("jpeg");
  });

  it("birden fazla nokta varsa son uzantıyı döner", () => {
    expect(dosyaUzantisi("arsiv.tar.gz")).toBe("gz");
    expect(dosyaUzantisi("rapor.v2.docx")).toBe("docx");
  });

  it("uzantısı olmayan dosya için null döner", () => {
    expect(dosyaUzantisi("README")).toBeNull();
    expect(dosyaUzantisi("hiçbir-uzantı")).toBeNull();
  });

  it("nokta ile başlayan veya biten dosyaları null döner", () => {
    expect(dosyaUzantisi(".env")).toBeNull();
    expect(dosyaUzantisi("dosya.")).toBeNull();
  });

  it("uzantıdaki özel karakterleri temizler", () => {
    expect(dosyaUzantisi("dosya.pdf?ver=2")).toBe("pdfver2");
    expect(dosyaUzantisi("dosya.zi p")).toBe("zip");
  });
});

describe("dosyaKategorisi — MIME ile", () => {
  it("görsel MIME'lerini GORSEL döner", () => {
    expect(dosyaKategorisi("image/png", "x.png")).toBe(DosyaKategori.GORSEL);
    expect(dosyaKategorisi("image/jpeg", "x.jpg")).toBe(DosyaKategori.GORSEL);
    expect(dosyaKategorisi("image/svg+xml", "x.svg")).toBe(
      DosyaKategori.GORSEL,
    );
  });

  it("PDF MIME'ini PDF döner", () => {
    expect(dosyaKategorisi("application/pdf", "rapor.pdf")).toBe(
      DosyaKategori.PDF,
    );
  });

  it("Word MIME'lerini OFIS_BELGESI döner", () => {
    expect(dosyaKategorisi("application/msword", "tutanak.doc")).toBe(
      DosyaKategori.OFIS_BELGESI,
    );
    expect(
      dosyaKategorisi(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "tutanak.docx",
      ),
    ).toBe(DosyaKategori.OFIS_BELGESI);
  });

  it("Excel MIME'lerini TABLO döner", () => {
    expect(dosyaKategorisi("application/vnd.ms-excel", "liste.xls")).toBe(
      DosyaKategori.TABLO,
    );
    expect(
      dosyaKategorisi(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "liste.xlsx",
      ),
    ).toBe(DosyaKategori.TABLO);
  });

  it("PowerPoint MIME'lerini SUNUM döner", () => {
    expect(
      dosyaKategorisi("application/vnd.ms-powerpoint", "sunum.ppt"),
    ).toBe(DosyaKategori.SUNUM);
    expect(
      dosyaKategorisi(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "sunum.pptx",
      ),
    ).toBe(DosyaKategori.SUNUM);
  });

  it("metin MIME'lerini METIN döner", () => {
    expect(dosyaKategorisi("text/plain", "not.txt")).toBe(DosyaKategori.METIN);
    expect(dosyaKategorisi("text/csv", "veri.csv")).toBe(DosyaKategori.METIN);
    expect(dosyaKategorisi("text/markdown", "not.md")).toBe(
      DosyaKategori.METIN,
    );
  });

  it("arşiv MIME'lerini ARSIV döner", () => {
    expect(dosyaKategorisi("application/zip", "x.zip")).toBe(
      DosyaKategori.ARSIV,
    );
    expect(dosyaKategorisi("application/x-7z-compressed", "x.7z")).toBe(
      DosyaKategori.ARSIV,
    );
  });

  it("MIME karşılaştırması case-insensitive", () => {
    expect(dosyaKategorisi("APPLICATION/PDF", "x.pdf")).toBe(DosyaKategori.PDF);
    expect(dosyaKategorisi("Image/PNG", "x.png")).toBe(DosyaKategori.GORSEL);
  });
});

describe("dosyaKategorisi — uzantı fallback", () => {
  it("MIME bilinmiyorsa uzantıya düşer", () => {
    expect(dosyaKategorisi("application/octet-stream", "rapor.pdf")).toBe(
      DosyaKategori.PDF,
    );
    expect(dosyaKategorisi("application/x-bin", "foto.png")).toBe(
      DosyaKategori.GORSEL,
    );
    expect(dosyaKategorisi("", "tutanak.docx")).toBe(
      DosyaKategori.OFIS_BELGESI,
    );
  });

  it("hem MIME hem uzantı bilinmiyorsa DIGER döner", () => {
    expect(dosyaKategorisi("application/octet-stream", "veri.bin")).toBe(
      DosyaKategori.DIGER,
    );
    expect(dosyaKategorisi("", "uzantısız")).toBe(DosyaKategori.DIGER);
  });
});

describe("DOSYA_KATEGORI_ETIKETI", () => {
  it("8 kategori için Türkçe etiket sağlar", () => {
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.GORSEL]).toBe("Görsel");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.PDF]).toBe("PDF");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.OFIS_BELGESI]).toBe("Word");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.TABLO]).toBe("Excel");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.SUNUM]).toBe("PowerPoint");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.METIN]).toBe("Metin");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.ARSIV]).toBe("Arşiv");
    expect(DOSYA_KATEGORI_ETIKETI[DosyaKategori.DIGER]).toBe("Diğer");
  });
});
