import { describe, expect, it } from "vitest";
import {
  davetUygunlugunuHesapla,
  emailFormatindaMi,
} from "./yetkili-kisi-ekle-helper";

describe("emailFormatindaMi", () => {
  it("geçerli e-posta için true döner", () => {
    expect(emailFormatindaMi("ad.soyad@birim.gov.tr")).toBe(true);
    expect(emailFormatindaMi("a@b.co")).toBe(true);
  });
  it("boşluk ve büyük harfli e-postayı normalize edip kabul eder", () => {
    expect(emailFormatindaMi("  Ali@Pusula.Tr  ")).toBe(true);
  });
  it("formatı tutmayanı reddeder", () => {
    expect(emailFormatindaMi("")).toBe(false);
    expect(emailFormatindaMi("ali")).toBe(false);
    expect(emailFormatindaMi("ali@")).toBe(false);
    expect(emailFormatindaMi("@birim.tr")).toBe(false);
    expect(emailFormatindaMi("ali ali@birim.tr")).toBe(false);
  });
});

describe("davetUygunlugunuHesapla", () => {
  const adaylar = ["mevcut@birim.tr"];
  const bekleyenler = ["bekleyen@birim.tr"];

  it("e-posta formatında değilse format-yok döner", () => {
    const sonuc = davetUygunlugunuHesapla({
      arama: "ahmet",
      adayEmailleri: adaylar,
      bekleyenDavetEmailleri: bekleyenler,
    });
    expect(sonuc.tip).toBe("format-yok");
  });

  it("aday listesinde ise kayitli döner", () => {
    const sonuc = davetUygunlugunuHesapla({
      arama: "MEVCUT@BIRIM.TR",
      adayEmailleri: adaylar,
      bekleyenDavetEmailleri: bekleyenler,
    });
    expect(sonuc).toEqual({ tip: "kayitli", email: "mevcut@birim.tr" });
  });

  it("bekleyen davet listesinde ise bekleyen döner", () => {
    const sonuc = davetUygunlugunuHesapla({
      arama: "bekleyen@birim.tr",
      adayEmailleri: adaylar,
      bekleyenDavetEmailleri: bekleyenler,
    });
    expect(sonuc).toEqual({ tip: "bekleyen", email: "bekleyen@birim.tr" });
  });

  it("hiçbir listede yoksa uygun döner", () => {
    const sonuc = davetUygunlugunuHesapla({
      arama: "yeni@birim.tr",
      adayEmailleri: adaylar,
      bekleyenDavetEmailleri: bekleyenler,
    });
    expect(sonuc).toEqual({ tip: "uygun", email: "yeni@birim.tr" });
  });
});
