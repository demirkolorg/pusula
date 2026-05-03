"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluProje, yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  kartaUyeEkleSemasi,
  kartaUyeKaldirSemasi,
  kartinUyeleriSemasi,
  projeAdayKullanicilarSemasi,
  projeUyeleriListeleSemasi,
  projeUyesiSeviyeGuncelleSemasi,
  projeyeUyeEkleSemasi,
  projeyeUyeKaldirSemasi,
} from "./schemas";
import {
  kartaUyeEkle as kartaUyeEkleSrv,
  kartaUyeKaldir as kartaUyeKaldirSrv,
  kartinUyeleri as kartinUyeleriSrv,
  projeAdayKullanicilariniAra,
  projeUyeleriniListele,
  projeUyesiSeviyeGuncelle as projeUyesiSeviyeGuncelleSrv,
  projeyeUyeEkle as projeyeUyeEkleSrv,
  projeyeUyeKaldir as projeyeUyeKaldirSrv,
} from "./services";

function kurumIdAl(ctx: { oturum: { kurumId?: string } | null }): string {
  const kurumId = ctx.oturum?.kurumId;
  if (!kurumId) {
    throw new EylemHatasi("Kurum bilgisi yok.", HATA_KODU.YETKISIZ);
  }
  return kurumId;
}

// =====================================================================
// Proje üye yönetimi (proje admin işi — Kural 50: RBAC her action başında)
// =====================================================================

export const projeUyeleriniListeleEylem = eylem({
  ad: "proje:uyeleri-listele",
  girdi: projeUyeleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    return projeUyeleriniListele(kurumIdAl(ctx), girdi.proje_id);
  },
});

export const projeAdayKullanicilarEylem = eylem({
  ad: "proje:aday-kullanicilar",
  girdi: projeAdayKullanicilarSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_UYE_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:uye-yonet",
      girdi.proje_id,
    );
    return projeAdayKullanicilariniAra(kurumIdAl(ctx), girdi);
  },
});

export const projeyeUyeEkleEylem = eylem({
  ad: "proje:uye-ekle",
  girdi: projeyeUyeEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_UYE_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:uye-yonet",
      girdi.proje_id,
    );
    return projeyeUyeEkleSrv(kurumIdAl(ctx), girdi);
  },
});

export const projeyeUyeKaldirEylem = eylem({
  ad: "proje:uye-kaldir",
  girdi: projeyeUyeKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_UYE_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:uye-yonet",
      girdi.proje_id,
    );
    await projeyeUyeKaldirSrv(
      kurumIdAl(ctx),
      girdi.proje_id,
      girdi.kullanici_id,
    );
    return { proje_id: girdi.proje_id, kullanici_id: girdi.kullanici_id };
  },
});

export const projeUyesiSeviyeGuncelleEylem = eylem({
  ad: "proje:uye-seviye",
  girdi: projeUyesiSeviyeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_UYE_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:uye-yonet",
      girdi.proje_id,
    );
    await projeUyesiSeviyeGuncelleSrv(kurumIdAl(ctx), girdi);
    return {
      proje_id: girdi.proje_id,
      kullanici_id: girdi.kullanici_id,
      seviye: girdi.seviye,
    };
  },
});

// =====================================================================
// Karta üye atama
// =====================================================================

export const kartinUyeleriEylem = eylem({
  ad: "kart:uyeleri",
  girdi: kartinUyeleriSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartinUyeleriSrv(kurumIdAl(ctx), girdi.kart_id);
  },
});

export const kartaUyeEkleEylem = eylem({
  ad: "kart:uye-ekle",
  girdi: kartaUyeEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kartaUyeEkleSrv(kurumIdAl(ctx), girdi.kart_id, girdi.kullanici_id);
    return { kart_id: girdi.kart_id, kullanici_id: girdi.kullanici_id };
  },
});

export const kartaUyeKaldirEylem = eylem({
  ad: "kart:uye-kaldir",
  girdi: kartaUyeKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kartaUyeKaldirSrv(kurumIdAl(ctx), girdi.kart_id, girdi.kullanici_id);
    return { kart_id: girdi.kart_id, kullanici_id: girdi.kullanici_id };
  },
});
