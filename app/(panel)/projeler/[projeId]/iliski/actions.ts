"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart, yetkiZorunluProje } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  iliskiOlusturSemasi,
  iliskiSilSemasi,
  kartIliskileriListeleSemasi,
  projeKartiAraSemasi,
} from "./schemas";
import {
  iliskiOlustur as iliskiOlusturSrv,
  iliskiSil as iliskiSilSrv,
  kartinIliskileri,
  projedeKartiAra,
} from "./services";

function kurumIdAl(ctx: { oturum: { kurumId?: string } | null }): string {
  const kurumId = ctx.oturum?.kurumId;
  if (!kurumId) {
    throw new EylemHatasi("Kurum bilgisi yok.", HATA_KODU.YETKISIZ);
  }
  return kurumId;
}

export const kartIliskileriListeleEylem = eylem({
  ad: "kart:iliskileri",
  girdi: kartIliskileriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartinIliskileri(kurumIdAl(ctx), girdi.kart_id);
  },
});

export const iliskiOlusturEylem = eylem({
  ad: "iliski:olustur",
  girdi: iliskiOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_a_id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_b_id);
    return iliskiOlusturSrv(kurumIdAl(ctx), girdi);
  },
});

export const iliskiSilEylem = eylem({
  ad: "iliski:sil",
  girdi: iliskiSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await iliskiSilSrv(kurumIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

export const projedeKartiAraEylem = eylem({
  ad: "iliski:kart-ara",
  girdi: projeKartiAraSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    return projedeKartiAra(kurumIdAl(ctx), girdi);
  },
});
