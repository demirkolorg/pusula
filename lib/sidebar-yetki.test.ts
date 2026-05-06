import { describe, it, expect } from "vitest";

import { IZIN_KODLARI } from "./permissions-katalog";
import {
  MENU_KODLARI,
  MENU_IZIN_HARITASI,
  menuGorunurMu,
  gorunurMenuKodlari,
} from "./sidebar-yetki";

const bosSet = new Set<string>();

describe("sidebar-yetki — menuGorunurMu", () => {
  it("makam (*) her menüyü görür", () => {
    const izinler = new Set(["*"]);
    for (const kod of Object.values(MENU_KODLARI)) {
      expect(menuGorunurMu(kod, izinler)).toBe(true);
    }
  });

  it("auth-only menüler izin yoksa bile görünür", () => {
    expect(menuGorunurMu(MENU_KODLARI.PROJELER, bosSet)).toBe(true);
    expect(menuGorunurMu(MENU_KODLARI.COP_KUTUSU, bosSet)).toBe(true);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_BILDIRIMLER, bosSet)).toBe(true);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_SABLONLAR, bosSet)).toBe(true);
  });

  it("izin gerektiren menü yetkisize gizlenir", () => {
    expect(menuGorunurMu(MENU_KODLARI.AYAR_DENETIM, bosSet)).toBe(false);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_HATA_LOGLARI, bosSet)).toBe(false);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_ROLLER, bosSet)).toBe(false);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_BIRIMLER, bosSet)).toBe(false);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_GENEL, bosSet)).toBe(false);
    expect(menuGorunurMu(MENU_KODLARI.ONAYLAR, bosSet)).toBe(false);
  });

  it("ilgili izne sahipse menü görünür (atomic kod)", () => {
    const izinler = new Set([IZIN_KODLARI.DENETIM_OKU]);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_DENETIM, izinler)).toBe(true);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_HATA_LOGLARI, izinler)).toBe(false);
  });

  it("Kullanıcılar menüsü 4 izinden herhangi biriyle görünür (OR)", () => {
    // ADR-0025 — onay-bekleyenler bu sayfaya entegre edildiği için
    // KULLANICI_ONAYLA da menü görünürlüğünü tetikler.
    const sadeceDuzenle = new Set([IZIN_KODLARI.KULLANICI_DUZENLE]);
    const sadeceDavet = new Set([IZIN_KODLARI.KULLANICI_DAVET_GONDER]);
    const sadeceSil = new Set([IZIN_KODLARI.KULLANICI_SIL]);
    const sadeceOnay = new Set([IZIN_KODLARI.KULLANICI_ONAYLA]);
    expect(
      menuGorunurMu(MENU_KODLARI.AYAR_KULLANICILAR, sadeceDuzenle),
    ).toBe(true);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_KULLANICILAR, sadeceDavet)).toBe(
      true,
    );
    expect(menuGorunurMu(MENU_KODLARI.AYAR_KULLANICILAR, sadeceSil)).toBe(true);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_KULLANICILAR, sadeceOnay)).toBe(
      true,
    );
    expect(menuGorunurMu(MENU_KODLARI.AYAR_KULLANICILAR, bosSet)).toBe(false);
  });

  it("BIRIM_YONET legacy alias granüler izinden de tetiklenir (izinKoduGenislet)", () => {
    // BIRIM_YONET → "birim:manage" → genişler: BIRIM_OLUSTUR, BIRIM_DUZENLE, ...
    const izinler = new Set([IZIN_KODLARI.BIRIM_OLUSTUR]);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_BIRIMLER, izinler)).toBe(true);
  });

  it("ROL_YONET legacy alias granüler izinden tetiklenir", () => {
    const izinler = new Set([IZIN_KODLARI.ROL_OLUSTUR]);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_ROLLER, izinler)).toBe(true);
  });

  it("KART_TAMAMLA tek izinli — Onaylar menüsünü açar", () => {
    const izinler = new Set([IZIN_KODLARI.KART_TAMAMLA]);
    expect(menuGorunurMu(MENU_KODLARI.ONAYLAR, izinler)).toBe(true);
  });

  it("AYAR_KURUM_DUZENLE — Genel ayarlar menüsünü açar", () => {
    const izinler = new Set([IZIN_KODLARI.AYAR_KURUM_DUZENLE]);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_GENEL, izinler)).toBe(true);
  });

  it("ilgisiz izin görünürlüğü değiştirmez", () => {
    const izinler = new Set([IZIN_KODLARI.PROJE_OLUSTUR]);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_DENETIM, izinler)).toBe(false);
    expect(menuGorunurMu(MENU_KODLARI.AYAR_ROLLER, izinler)).toBe(false);
  });
});

describe("sidebar-yetki — gorunurMenuKodlari", () => {
  it("yetkisiz kullanıcı sadece auth-only menüleri görür", () => {
    const sonuc = gorunurMenuKodlari(bosSet);
    expect(sonuc).toEqual([
      MENU_KODLARI.PROJELER,
      MENU_KODLARI.COP_KUTUSU,
      MENU_KODLARI.AYAR_BILDIRIMLER,
      MENU_KODLARI.AYAR_SABLONLAR,
    ]);
  });

  it("makam tüm menüleri görür", () => {
    const sonuc = gorunurMenuKodlari(new Set(["*"]));
    expect(sonuc).toEqual(Object.values(MENU_KODLARI));
  });

  it("kısmi yetkili sadece izinli + auth-only menüleri görür", () => {
    const izinler = new Set([
      IZIN_KODLARI.HATA_LOGU_OKU,
      IZIN_KODLARI.DENETIM_OKU,
    ]);
    const sonuc = gorunurMenuKodlari(izinler);
    expect(sonuc).toContain(MENU_KODLARI.AYAR_DENETIM);
    expect(sonuc).toContain(MENU_KODLARI.AYAR_HATA_LOGLARI);
    expect(sonuc).toContain(MENU_KODLARI.PROJELER);
    expect(sonuc).not.toContain(MENU_KODLARI.AYAR_ROLLER);
    expect(sonuc).not.toContain(MENU_KODLARI.AYAR_BIRIMLER);
    expect(sonuc).not.toContain(MENU_KODLARI.AYAR_GENEL);
  });
});

describe("sidebar-yetki — harita bütünlüğü", () => {
  it("MENU_KODLARI'ndaki her kod harita içinde tanımlı", () => {
    for (const kod of Object.values(MENU_KODLARI)) {
      expect(MENU_IZIN_HARITASI).toHaveProperty(kod);
    }
  });
});
