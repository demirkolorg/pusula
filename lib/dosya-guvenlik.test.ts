import { describe, expect, it } from "vitest";
import { DosyaKategori } from "@prisma/client";
import {
  boyutKategoriIcinIzinliMi,
  kategoriBoyutLimiti,
  kategoriMimeIcinUygunMu,
  magicByteEsleseMi,
  mimeIzinliMi,
  mimeUzantiTutarliMi,
  uploadGirdisiniDogrula,
} from "./dosya-guvenlik";

const MB = 1024 * 1024;

describe("mimeIzinliMi", () => {
  it("whitelist'teki MIME'leri kabul eder", () => {
    expect(mimeIzinliMi("application/pdf")).toBe(true);
    expect(mimeIzinliMi("image/png")).toBe(true);
    expect(mimeIzinliMi("text/csv")).toBe(true);
  });

  it("whitelist dışı MIME'i reddeder", () => {
    expect(mimeIzinliMi("application/x-msdownload")).toBe(false);
    expect(mimeIzinliMi("application/javascript")).toBe(false);
    expect(mimeIzinliMi("text/html")).toBe(false);
  });

  it("case-insensitive", () => {
    expect(mimeIzinliMi("APPLICATION/PDF")).toBe(true);
    expect(mimeIzinliMi("Image/PNG")).toBe(true);
  });
});

describe("boyutKategoriIcinIzinliMi", () => {
  it("Görsel 25MB altı kabul, üstü ret", () => {
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.GORSEL, 24 * MB)).toBe(
      true,
    );
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.GORSEL, 26 * MB)).toBe(
      false,
    );
  });

  it("Arşiv 100MB altı kabul, üstü ret", () => {
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.ARSIV, 100 * MB)).toBe(
      true,
    );
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.ARSIV, 101 * MB)).toBe(
      false,
    );
  });

  it("Metin 10MB sınırı uygular", () => {
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.METIN, 9 * MB)).toBe(true);
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.METIN, 11 * MB)).toBe(
      false,
    );
  });

  it("0 ve negatif boyut reddedilir", () => {
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.PDF, 0)).toBe(false);
    expect(boyutKategoriIcinIzinliMi(DosyaKategori.PDF, -1)).toBe(false);
  });

  it("kategoriBoyutLimiti her kategori için pozitif sayı döner", () => {
    for (const kategori of Object.values(DosyaKategori)) {
      expect(kategoriBoyutLimiti(kategori)).toBeGreaterThan(0);
    }
  });
});

describe("mimeUzantiTutarliMi", () => {
  it("PDF + .pdf tutarlı", () => {
    expect(mimeUzantiTutarliMi("application/pdf", "rapor.pdf")).toBe(true);
  });

  it("PNG + .png tutarlı", () => {
    expect(mimeUzantiTutarliMi("image/png", "foto.png")).toBe(true);
  });

  it("MIME ve uzantı uyuşmuyorsa reddedilir", () => {
    expect(
      mimeUzantiTutarliMi("application/pdf", "kotu-niyet.docx"),
    ).toBe(false);
    expect(mimeUzantiTutarliMi("image/png", "foto.jpg")).toBe(false);
  });

  it("docx için openxml uyumlu, msword reddedilir", () => {
    expect(
      mimeUzantiTutarliMi(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "tutanak.docx",
      ),
    ).toBe(true);
    expect(
      mimeUzantiTutarliMi("application/msword", "tutanak.docx"),
    ).toBe(false);
  });

  it("csv hem text/csv hem text/plain ile kabul", () => {
    expect(mimeUzantiTutarliMi("text/csv", "veri.csv")).toBe(true);
    expect(mimeUzantiTutarliMi("text/plain", "veri.csv")).toBe(true);
  });

  it("uzantısız dosya reddedilir", () => {
    expect(mimeUzantiTutarliMi("application/pdf", "README")).toBe(false);
  });

  it("bilinmeyen uzantı reddedilir", () => {
    expect(mimeUzantiTutarliMi("application/octet-stream", "veri.exe")).toBe(
      false,
    );
  });
});

describe("magicByteEsleseMi", () => {
  it("PDF imzasını tanır", () => {
    const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    expect(magicByteEsleseMi(buffer, "application/pdf")).toBe(true);
  });

  it("PNG imzasını tanır", () => {
    const buffer = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(magicByteEsleseMi(buffer, "image/png")).toBe(true);
  });

  it("yanlış imzayı reddeder (mime sahteciliği)", () => {
    // PDF iddiası ama PNG byte'ları
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(magicByteEsleseMi(png, "application/pdf")).toBe(false);
  });

  it("docx için zip imzası kabul edilir", () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(
      magicByteEsleseMi(
        zip,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(true);
  });

  it("GIF87a ve GIF89a iki varyantı tanır", () => {
    const gif87 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
    const gif89 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(magicByteEsleseMi(gif87, "image/gif")).toBe(true);
    expect(magicByteEsleseMi(gif89, "image/gif")).toBe(true);
  });

  it("imzası tanımlanmamış MIME için null döner", () => {
    const txt = new Uint8Array([0x4d, 0x65, 0x72, 0x68]); // "Merh"
    expect(magicByteEsleseMi(txt, "text/plain")).toBeNull();
  });

  it("buffer çok kısa ise eşleşmez", () => {
    const kisa = new Uint8Array([0x25]);
    expect(magicByteEsleseMi(kisa, "application/pdf")).toBe(false);
  });
});

describe("kategoriMimeIcinUygunMu", () => {
  it("PDF + application/pdf + .pdf → PDF kategorisi", () => {
    expect(
      kategoriMimeIcinUygunMu(
        "application/pdf",
        "rapor.pdf",
        DosyaKategori.PDF,
      ),
    ).toBe(true);
  });

  it("Word docx + OFIS_BELGESI uyumlu", () => {
    expect(
      kategoriMimeIcinUygunMu(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "tutanak.docx",
        DosyaKategori.OFIS_BELGESI,
      ),
    ).toBe(true);
  });

  it("Excel xlsx + TABLO uyumlu, OFIS_BELGESI reddedilir", () => {
    expect(
      kategoriMimeIcinUygunMu(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "liste.xlsx",
        DosyaKategori.TABLO,
      ),
    ).toBe(true);
    expect(
      kategoriMimeIcinUygunMu(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "liste.xlsx",
        DosyaKategori.OFIS_BELGESI,
      ),
    ).toBe(false);
  });
});

describe("uploadGirdisiniDogrula", () => {
  it("geçerli PDF girdisini kabul eder, kategoriyi döner", () => {
    const sonuc = uploadGirdisiniDogrula({
      ad: "rapor.pdf",
      mime: "application/pdf",
      boyut: 5 * MB,
    });
    expect(sonuc.gecerli).toBe(true);
    if (sonuc.gecerli) {
      expect(sonuc.kategori).toBe(DosyaKategori.PDF);
    }
  });

  it("boş ad reddedilir", () => {
    const sonuc = uploadGirdisiniDogrula({
      ad: "",
      mime: "application/pdf",
      boyut: 1024,
    });
    expect(sonuc.gecerli).toBe(false);
    if (!sonuc.gecerli) expect(sonuc.alan).toBe("ad");
  });

  it("aşırı uzun ad reddedilir (>255)", () => {
    const sonuc = uploadGirdisiniDogrula({
      ad: "a".repeat(300) + ".pdf",
      mime: "application/pdf",
      boyut: 1024,
    });
    expect(sonuc.gecerli).toBe(false);
  });

  it("whitelist dışı MIME reddedilir", () => {
    const sonuc = uploadGirdisiniDogrula({
      ad: "kotu.exe",
      mime: "application/x-msdownload",
      boyut: 1024,
    });
    expect(sonuc.gecerli).toBe(false);
    if (!sonuc.gecerli) expect(sonuc.alan).toBe("mime");
  });

  it("MIME-uzantı uyumsuzluğu reddedilir", () => {
    const sonuc = uploadGirdisiniDogrula({
      ad: "kotuniyet.docx",
      mime: "application/pdf",
      boyut: 1024,
    });
    expect(sonuc.gecerli).toBe(false);
    if (!sonuc.gecerli) expect(sonuc.alan).toBe("ad");
  });

  it("kategori boyut sınırını aşan upload reddedilir", () => {
    const sonuc = uploadGirdisiniDogrula({
      ad: "buyuk.txt",
      mime: "text/plain",
      boyut: 11 * MB, // METIN limiti 10MB
    });
    expect(sonuc.gecerli).toBe(false);
    if (!sonuc.gecerli) expect(sonuc.alan).toBe("boyut");
  });
});
