import { describe, expect, it } from "vitest";
import {
  gecikmisMi,
  oneriDurumuHesapla,
  tamamlamaYasakHesapla,
} from "./kart-tamamla-kontrol";

describe("tamamlamaYasakHesapla", () => {
  it("yetki yokken her durumda yasak (yetki-yok)", () => {
    const sonuc = tamamlamaYasakHesapla({
      yetkiVar: false,
      yeniDurum: true,
      kontrol: { toplam: 0, tamamlanan: 0 },
    });
    expect(sonuc?.sebep).toBe("yetki-yok");
    expect(sonuc?.mesaj).toContain("yetki");
  });

  it("yetkili + yeniden açma her zaman serbest (kontrol durumu önemsiz)", () => {
    const sonuc = tamamlamaYasakHesapla({
      yetkiVar: true,
      yeniDurum: false,
      kontrol: { toplam: 5, tamamlanan: 1 },
    });
    expect(sonuc).toBeNull();
  });

  it("yetkili + kart kapatma + kontrol listesi tam → serbest", () => {
    const sonuc = tamamlamaYasakHesapla({
      yetkiVar: true,
      yeniDurum: true,
      kontrol: { toplam: 3, tamamlanan: 3 },
    });
    expect(sonuc).toBeNull();
  });

  it("yetkili + kart kapatma + kontrol listesi yarım → kontrol-yarim yasağı", () => {
    const sonuc = tamamlamaYasakHesapla({
      yetkiVar: true,
      yeniDurum: true,
      kontrol: { toplam: 5, tamamlanan: 2 },
    });
    expect(sonuc?.sebep).toBe("kontrol-yarim");
    // Eksik madde sayısı mesajda görünür → kullanıcı kaç eksik kaldığını anlar.
    expect(sonuc?.mesaj).toContain("3");
  });

  it("yetkili + kart kapatma + boş kontrol listesi → serbest (madde yoksa blok yok)", () => {
    const sonuc = tamamlamaYasakHesapla({
      yetkiVar: true,
      yeniDurum: true,
      kontrol: { toplam: 0, tamamlanan: 0 },
    });
    expect(sonuc).toBeNull();
  });

  it("yetki yok → kontrol listesi tam olsa bile yetki-yok yasağı (yetki önce gelir)", () => {
    const sonuc = tamamlamaYasakHesapla({
      yetkiVar: false,
      yeniDurum: true,
      kontrol: { toplam: 3, tamamlanan: 3 },
    });
    expect(sonuc?.sebep).toBe("yetki-yok");
  });
});

describe("oneriDurumuHesapla (ADR-0019)", () => {
  const oneren = { ad: "Ali", soyad: "Yılmaz" };

  it("tamamlanmış kart → her durumda aktif (yeniden açma standart)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: false,
      tamamlandi: true,
      oneriDurumu: "YOK",
      oneren: null,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("aktif");
  });

  it("yetkili + durum YOK + tamamlanmamış → aktif (standart toggle)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: true,
      tamamlandi: false,
      oneriDurumu: "YOK",
      oneren: null,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("aktif");
  });

  it("yetkisiz + durum YOK + tamamlanmamış → onerilebilir", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: false,
      tamamlandi: false,
      oneriDurumu: "YOK",
      oneren: null,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("onerilebilir");
  });

  it("yetkisiz + REDDEDILDI → reddedildi (sebep döner)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: false,
      tamamlandi: false,
      oneriDurumu: "REDDEDILDI",
      oneren,
      redSebebi: "Belge eksik",
    });
    expect(sonuc.tip).toBe("reddedildi");
    if (sonuc.tip === "reddedildi") {
      expect(sonuc.sebep).toBe("Belge eksik");
    }
  });

  it("yetkili + REDDEDILDI → aktif (yetkili doğrudan kapatabilir)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: true,
      tamamlandi: false,
      oneriDurumu: "REDDEDILDI",
      oneren,
      redSebebi: "Belge eksik",
    });
    expect(sonuc.tip).toBe("aktif");
  });

  it("BEKLIYOR + yetkili → onerildi (banner gösterimi için)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: true,
      tamamlandi: false,
      oneriDurumu: "BEKLIYOR",
      oneren,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("onerildi");
    if (sonuc.tip === "onerildi") {
      expect(sonuc.onerenAd).toBe("Ali Yılmaz");
    }
  });

  it("BEKLIYOR + yetkisiz → onerildi (kullanıcı bilgi alır)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: false,
      tamamlandi: false,
      oneriDurumu: "BEKLIYOR",
      oneren,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("onerildi");
  });

  it("BEKLIYOR + öneren null → onerildi (onerenAd null)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: true,
      tamamlandi: false,
      oneriDurumu: "BEKLIYOR",
      oneren: null,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("onerildi");
    if (sonuc.tip === "onerildi") {
      expect(sonuc.onerenAd).toBeNull();
    }
  });

  it("REDDEDILDI + yetkisiz + sebep null → reddedildi (sebep null)", () => {
    const sonuc = oneriDurumuHesapla({
      yetkiVar: false,
      tamamlandi: false,
      oneriDurumu: "REDDEDILDI",
      oneren,
      redSebebi: null,
    });
    expect(sonuc.tip).toBe("reddedildi");
    if (sonuc.tip === "reddedildi") {
      expect(sonuc.sebep).toBeNull();
    }
  });
});

describe("gecikmisMi", () => {
  const sabitSimdi = new Date("2026-05-05T12:00:00Z");

  it("bitiş tarihi geçmiş + tamamlanmamış → gecikmiş", () => {
    expect(
      gecikmisMi({
        bitis: new Date("2026-05-01T00:00:00Z"),
        tamamlandi: false,
        simdi: sabitSimdi,
      }),
    ).toBe(true);
  });

  it("bitiş tarihi geçmiş + tamamlandı → gecikmiş DEĞİL", () => {
    expect(
      gecikmisMi({
        bitis: new Date("2026-05-01T00:00:00Z"),
        tamamlandi: true,
        simdi: sabitSimdi,
      }),
    ).toBe(false);
  });

  it("bitiş tarihi gelecek + tamamlanmamış → gecikmiş DEĞİL", () => {
    expect(
      gecikmisMi({
        bitis: new Date("2026-06-01T00:00:00Z"),
        tamamlandi: false,
        simdi: sabitSimdi,
      }),
    ).toBe(false);
  });

  it("bitiş null → gecikmiş DEĞİL (tarih yoksa rozet yok)", () => {
    expect(
      gecikmisMi({
        bitis: null,
        tamamlandi: false,
        simdi: sabitSimdi,
      }),
    ).toBe(false);
  });

  it("bitiş tarihi tam şu an → gecikmiş DEĞİL (sınır eşit)", () => {
    expect(
      gecikmisMi({
        bitis: sabitSimdi,
        tamamlandi: false,
        simdi: sabitSimdi,
      }),
    ).toBe(false);
  });
});
