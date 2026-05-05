"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluProje, yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { tetikleKartYetkiliAtama } from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  kartAdayKullanicilarSemasi,
  kartaYetkiliEkleSemasi,
  kartaYetkiliKaldirSemasi,
  kartinYetkilileriSemasi,
  projeAdayKullanicilarSemasi,
  projeYetkilileriListeleSemasi,
  projeYetkilisiSeviyeGuncelleSemasi,
  projeyeYetkiliEkleSemasi,
  projeyeYetkiliKaldirSemasi,
} from "./schemas";
import {
  kartAdayKullanicilariniAra,
  kartProjeIdGetir,
  kartaYetkiliEkle as kartaYetkiliEkleSrv,
  kartaYetkiliKaldir as kartaYetkiliKaldirSrv,
  kartinYetkilileri as kartinYetkilileriSrv,
  projeAdayKullanicilariniAra,
  projeYetkilileriniListele,
  projeYetkilisiSeviyeGuncelle as projeYetkilisiSeviyeGuncelleSrv,
  projeyeYetkiliEkle as projeyeYetkiliEkleSrv,
  projeyeYetkiliKaldir as projeyeYetkiliKaldirSrv,
} from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

// =====================================================================
// Proje yetkili yönetimi (proje admin işi — Kural 50: RBAC her action başında)
// =====================================================================

export const projeYetkilileriniListeleEylem = eylem({
  ad: "proje:yetkilileri-listele",
  girdi: projeYetkilileriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    return projeYetkilileriniListele(birimIdAl(ctx), girdi.proje_id);
  },
});

export const projeAdayKullanicilarEylem = eylem({
  ad: "proje:aday-kullanicilar",
  girdi: projeAdayKullanicilarSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    return projeAdayKullanicilariniAra(birimIdAl(ctx), girdi);
  },
});

export const projeyeYetkiliEkleEylem = eylem({
  ad: "proje:yetkili-ekle",
  girdi: projeyeYetkiliEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    return projeyeYetkiliEkleSrv(birimIdAl(ctx), girdi);
  },
});

export const projeyeYetkiliKaldirEylem = eylem({
  ad: "proje:yetkili-kaldir",
  girdi: projeyeYetkiliKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    await projeyeYetkiliKaldirSrv(
      birimIdAl(ctx),
      girdi.proje_id,
      girdi.kullanici_id,
    );
    return { proje_id: girdi.proje_id, kullanici_id: girdi.kullanici_id };
  },
});

export const projeYetkilisiSeviyeGuncelleEylem = eylem({
  ad: "proje:yetkili-seviye",
  girdi: projeYetkilisiSeviyeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    await projeYetkilisiSeviyeGuncelleSrv(birimIdAl(ctx), girdi);
    return {
      proje_id: girdi.proje_id,
      kullanici_id: girdi.kullanici_id,
      seviye: girdi.seviye,
    };
  },
});

// =====================================================================
// Karta yetkili atama
// =====================================================================

export const kartinYetkilileriEylem = eylem({
  ad: "kart:yetkilileri",
  girdi: kartinYetkilileriSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartinYetkilileriSrv(birimIdAl(ctx), girdi.kart_id);
  },
});

export const kartAdayKullanicilarEylem = eylem({
  ad: "kart:aday-kullanicilar",
  girdi: kartAdayKullanicilarSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    return kartAdayKullanicilariniAra(birimIdAl(ctx), girdi);
  },
});

export const kartaYetkiliEkleEylem = eylem({
  ad: "kart:yetkili-ekle",
  girdi: kartaYetkiliEkleSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    const atayanId = ctx.oturum?.kullaniciId ?? null;
    await kartaYetkiliEkleSrv(birimIdAl(ctx), girdi.kart_id, girdi.kullanici_id);
    if (atayanId) {
      tetikleKartYetkiliAtama({
        kartId: girdi.kart_id,
        atananId: girdi.kullanici_id,
        atayanId,
      }).catch(() => {
        /* Bildirim hatası işlemi bozmaz */
      });
    }
    return { kart_id: girdi.kart_id, kullanici_id: girdi.kullanici_id };
  },
});

export const kartaYetkiliKaldirEylem = eylem({
  ad: "kart:yetkili-kaldir",
  girdi: kartaYetkiliKaldirSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await kartaYetkiliKaldirSrv(birimIdAl(ctx), girdi.kart_id, girdi.kullanici_id);
    return { kart_id: girdi.kart_id, kullanici_id: girdi.kullanici_id };
  },
});
