import { describe, expect, it } from "vitest";
import { dosyaYoluGuvenliMi, dosyaYoluUret } from "./dosya-storage";

describe("dosyaYoluUret", () => {
  it("standart yol formatını üretir: dosyalar/<yyyy>/<mm>/<id>/<surum>/<rastgele>.<uzanti>", () => {
    const yol = dosyaYoluUret(
      "abc-123",
      1,
      "rapor.pdf",
      "rnd9",
      new Date("2026-05-06T12:00:00.000Z"),
    );
    expect(yol).toBe("dosyalar/2026/05/abc-123/1/rnd9.pdf");
  });

  it("ay 2 basamaklı zero-padded olur", () => {
    const yol = dosyaYoluUret(
      "id",
      1,
      "x.png",
      "rnd",
      new Date("2026-01-15T00:00:00.000Z"),
    );
    expect(yol).toBe("dosyalar/2026/01/id/1/rnd.png");
  });

  it("UTC kullanır (timezone'dan etkilenmez)", () => {
    // Aralık 31 23:00 UTC → ay 12 olmalı (lokal saatle Ocak'a kayma yok)
    const yol = dosyaYoluUret(
      "id",
      1,
      "x.txt",
      "r",
      new Date("2026-12-31T23:00:00.000Z"),
    );
    expect(yol).toContain("/2026/12/");
  });

  it("uzantısı olmayan dosyada noktasız yol üretir", () => {
    const yol = dosyaYoluUret(
      "id",
      1,
      "README",
      "rnd",
      new Date("2026-05-06T12:00:00.000Z"),
    );
    expect(yol).toBe("dosyalar/2026/05/id/1/rnd");
  });

  it("uzantıyı lower-case'e çevirir ve özel karakter temizler", () => {
    const yol = dosyaYoluUret(
      "id",
      1,
      "Belge.PDF?ver=2",
      "rnd",
      new Date("2026-05-06T12:00:00.000Z"),
    );
    expect(yol).toBe("dosyalar/2026/05/id/1/rnd.pdfver2");
  });

  it("uzantı 8 karaktere kırpılır", () => {
    const yol = dosyaYoluUret(
      "id",
      1,
      "x.aaaaaaaaaaaaa",
      "r",
      new Date("2026-05-06T12:00:00.000Z"),
    );
    expect(yol).toBe("dosyalar/2026/05/id/1/r.aaaaaaaa");
  });

  it("birden fazla nokta varsa son uzantıyı alır", () => {
    const yol = dosyaYoluUret(
      "id",
      2,
      "arsiv.tar.gz",
      "r",
      new Date("2026-05-06T12:00:00.000Z"),
    );
    expect(yol).toBe("dosyalar/2026/05/id/2/r.gz");
  });

  it("sürüm numarası path'e yansır", () => {
    const yol = dosyaYoluUret(
      "id",
      5,
      "x.pdf",
      "r",
      new Date("2026-05-06T12:00:00.000Z"),
    );
    expect(yol).toContain("/id/5/");
  });
});

describe("dosyaYoluGuvenliMi", () => {
  it("normal dosya yolunu kabul eder", () => {
    expect(
      dosyaYoluGuvenliMi("dosyalar/2026/05/abc/1/rnd.pdf"),
    ).toBe(true);
  });

  it("path traversal '..'yı reddeder", () => {
    expect(dosyaYoluGuvenliMi("dosyalar/../etc/passwd")).toBe(false);
    expect(
      dosyaYoluGuvenliMi("dosyalar/2026/05/abc/../1/rnd.pdf"),
    ).toBe(false);
  });

  it("başta slash veya backslash reddedilir", () => {
    expect(dosyaYoluGuvenliMi("/dosyalar/2026/05/abc/1/r.pdf")).toBe(false);
    expect(dosyaYoluGuvenliMi("\\dosyalar/2026/05/abc/1/r.pdf")).toBe(false);
  });

  it("dosyalar/ prefix'i olmayanı reddeder", () => {
    expect(dosyaYoluGuvenliMi("kartlar/abc/r.pdf")).toBe(false);
    expect(dosyaYoluGuvenliMi("rnd.pdf")).toBe(false);
  });

  it("control karakterli yolu reddeder", () => {
    expect(dosyaYoluGuvenliMi("dosyalar/2026/05/abc\x00/r.pdf")).toBe(false);
    expect(dosyaYoluGuvenliMi("dosyalar/2026/05/abc\n/r.pdf")).toBe(false);
  });

  it("boş ve aşırı uzun yol reddedilir", () => {
    expect(dosyaYoluGuvenliMi("")).toBe(false);
    expect(dosyaYoluGuvenliMi("dosyalar/" + "a".repeat(2000))).toBe(false);
  });
});
