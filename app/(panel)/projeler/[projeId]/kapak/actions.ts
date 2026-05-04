"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { kapagiAyarlaSemasi, kapagiKaldirSemasi } from "./schemas";
import { kapagiAyarla as kapagiAyarlaSrv, kapagiKaldir as kapagiKaldirSrv } from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

export const kapagiAyarlaEylem = eylem({
  ad: "kart:kapak-ayarla",
  girdi: kapagiAyarlaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapagiAyarlaSrv(birimIdAl(ctx), girdi.kart_id, girdi.eklenti_id);
    return { kart_id: girdi.kart_id, eklenti_id: girdi.eklenti_id };
  },
});

export const kapagiKaldirEylem = eylem({
  ad: "kart:kapak-kaldir",
  girdi: kapagiKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapagiKaldirSrv(birimIdAl(ctx), girdi.kart_id);
    return { kart_id: girdi.kart_id };
  },
});
