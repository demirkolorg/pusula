"use server";

import { eylem } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { aktiviteGunluguFiltreSemasi } from "./schemas";
import {
  aktiviteGunluguListele,
  aktiviteKaynakTipleriGetir,
} from "./services";

export const aktiviteGunluguListeleEylem = eylem({
  ad: "aktivite-gunlugu:liste",
  girdi: aktiviteGunluguFiltreSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.AKTIVITE_OKU);
    return aktiviteGunluguListele(ctx.oturum!.kullaniciId, girdi);
  },
});

export const aktiviteKaynakTipleriEylem = eylem({
  ad: "aktivite-gunlugu:kaynak-tipleri",
  calistir: async (_g, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.AKTIVITE_OKU);
    return aktiviteKaynakTipleriGetir(ctx.oturum!.kullaniciId);
  },
});
