"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { kapagiAyarlaSemasi, kapagiKaldirSemasi } from "./schemas";
import { kapagiAyarla as kapagiAyarlaSrv, kapagiKaldir as kapagiKaldirSrv } from "./services";

function kurumIdAl(ctx: { oturum: { kurumId?: string } | null }): string {
  const kurumId = ctx.oturum?.kurumId;
  if (!kurumId) {
    throw new EylemHatasi("Kurum bilgisi yok.", HATA_KODU.YETKISIZ);
  }
  return kurumId;
}

export const kapagiAyarlaEylem = eylem({
  ad: "kart:kapak-ayarla",
  girdi: kapagiAyarlaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapagiAyarlaSrv(kurumIdAl(ctx), girdi.kart_id, girdi.eklenti_id);
    return { kart_id: girdi.kart_id, eklenti_id: girdi.eklenti_id };
  },
});

export const kapagiKaldirEylem = eylem({
  ad: "kart:kapak-kaldir",
  girdi: kapagiKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapagiKaldirSrv(kurumIdAl(ctx), girdi.kart_id);
    return { kart_id: girdi.kart_id };
  },
});
