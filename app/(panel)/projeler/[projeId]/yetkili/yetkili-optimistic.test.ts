import { describe, expect, it } from "vitest";
import {
  optimistikBirimEkle,
  optimistikBirimKaldir,
  optimistikKisiEkle,
  optimistikKisiKaldir,
} from "./yetkili-optimistic";
import type {
  YetkiliBirimOzeti,
  YetkiliKisiAdayi,
  YetkiliKisiOzeti,
} from "./yetkili-tipler";

describe("optimistikBirimEkle", () => {
  it("yeni birim listeye eklenir", () => {
    const sonuc = optimistikBirimEkle([], {
      id: "b1",
      ad: "Özel Kalem",
      tip: "OZEL_KALEM",
    });
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]?.birim_id).toBe("b1");
    expect(sonuc[0]?.ad).toBe("Özel Kalem");
  });

  it("aynı birim çift eklenmez (idempotent)", () => {
    const mevcut: YetkiliBirimOzeti[] = [
      {
        birim_id: "b1",
        ad: "Özel Kalem",
        tip: "OZEL_KALEM",
        eklenme_zamani: new Date(),
      },
    ];
    const sonuc = optimistikBirimEkle(mevcut, {
      id: "b1",
      ad: "Özel Kalem",
      tip: "OZEL_KALEM",
    });
    expect(sonuc).toBe(mevcut);
  });

  it("undefined liste ile başlasa da çalışır", () => {
    const sonuc = optimistikBirimEkle(undefined, {
      id: "b1",
      ad: null,
      tip: "OZEL_KALEM",
    });
    expect(sonuc).toHaveLength(1);
  });
});

describe("optimistikBirimKaldir", () => {
  it("verilen birim listeden silinir", () => {
    const mevcut: YetkiliBirimOzeti[] = [
      { birim_id: "a", ad: null, tip: "OZEL_KALEM", eklenme_zamani: new Date() },
      { birim_id: "b", ad: null, tip: "OZEL_KALEM", eklenme_zamani: new Date() },
    ];
    const sonuc = optimistikBirimKaldir(mevcut, "a");
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]?.birim_id).toBe("b");
  });

  it("var olmayan id güvenle yok sayılır", () => {
    const mevcut: YetkiliBirimOzeti[] = [
      { birim_id: "a", ad: null, tip: "OZEL_KALEM", eklenme_zamani: new Date() },
    ];
    const sonuc = optimistikBirimKaldir(mevcut, "z");
    expect(sonuc).toHaveLength(1);
  });
});

describe("optimistikKisiEkle", () => {
  const aday: YetkiliKisiAdayi = {
    id: "u1",
    ad: "Murat",
    soyad: "Aksoy",
    email: "murat@test.tr",
    birim_ad: "Özel Kalem",
    birim_yetkili: false,
  };

  it("kişi listeye eklenir (ADR-0012: seviye yok)", () => {
    const sonuc = optimistikKisiEkle([], aday);
    expect(sonuc[0]?.kullanici_id).toBe("u1");
    expect(sonuc[0]?.ad).toBe("Murat");
  });

  it("aynı kullanıcı çift eklenmez", () => {
    const mevcut: YetkiliKisiOzeti[] = [
      {
        kullanici_id: "u1",
        ad: "Murat",
        soyad: "Aksoy",
        email: "murat@test.tr",
        birim_ad: null,
        eklenme_zamani: new Date(),
      },
    ];
    const sonuc = optimistikKisiEkle(mevcut, aday);
    expect(sonuc).toBe(mevcut);
  });
});

describe("optimistikKisiKaldir", () => {
  it("verilen kullanıcı listeden silinir", () => {
    const mevcut: YetkiliKisiOzeti[] = [
      {
        kullanici_id: "a",
        ad: "A",
        soyad: "A",
        email: "a@x",
        birim_ad: null,
        eklenme_zamani: new Date(),
      },
      {
        kullanici_id: "b",
        ad: "B",
        soyad: "B",
        email: "b@x",
        birim_ad: null,
        eklenme_zamani: new Date(),
      },
    ];
    const sonuc = optimistikKisiKaldir(mevcut, "a");
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]?.kullanici_id).toBe("b");
  });
});
