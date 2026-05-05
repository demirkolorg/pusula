"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { tetikleKapakDegisti } from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  kapagiAyarlaSemasi,
  kapagiKaldirSemasi,
  kapakRenginiAyarlaSemasi,
  kapakRenginiKaldirSemasi,
} from "./schemas";
import {
  kapagiAyarla as kapagiAyarlaSrv,
  kapagiKaldir as kapagiKaldirSrv,
  kapakRenginiAyarla as kapakRenginiAyarlaSrv,
  kapakRenginiKaldir as kapakRenginiKaldirSrv,
} from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

function tetikleKapakBildirim(
  kartId: string,
  ctx: { oturum: { kullaniciId?: string } | null },
  altEylem:
    | "kapak-ayarlandi"
    | "kapak-kaldirildi"
    | "renk-ayarlandi"
    | "renk-kaldirildi",
): void {
  const id = ctx.oturum?.kullaniciId;
  if (!id) return;
  tetikleKapakDegisti({
    kartId,
    degistirenId: id,
    alt_eylem: altEylem,
  }).catch(() => {});
}

export const kapagiAyarlaEylem = eylem({
  ad: "kart:kapak-ayarla",
  girdi: kapagiAyarlaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapagiAyarlaSrv(birimIdAl(ctx), girdi.kart_id, girdi.eklenti_id);
    tetikleKapakBildirim(girdi.kart_id, ctx, "kapak-ayarlandi");
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
    tetikleKapakBildirim(girdi.kart_id, ctx, "kapak-kaldirildi");
    return { kart_id: girdi.kart_id };
  },
});

export const kapakRenginiAyarlaEylem = eylem({
  ad: "kart:kapak-rengi-ayarla",
  girdi: kapakRenginiAyarlaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapakRenginiAyarlaSrv(birimIdAl(ctx), girdi.kart_id, girdi.renk);
    tetikleKapakBildirim(girdi.kart_id, ctx, "renk-ayarlandi");
    return { kart_id: girdi.kart_id, renk: girdi.renk };
  },
});

export const kapakRenginiKaldirEylem = eylem({
  ad: "kart:kapak-rengi-kaldir",
  girdi: kapakRenginiKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    await kapakRenginiKaldirSrv(birimIdAl(ctx), girdi.kart_id);
    tetikleKapakBildirim(girdi.kart_id, ctx, "renk-kaldirildi");
    return { kart_id: girdi.kart_id };
  },
});
