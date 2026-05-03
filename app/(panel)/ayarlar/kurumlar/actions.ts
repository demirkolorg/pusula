"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eylem } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import {
  kurumGuncelleSemasi,
  kurumListeSemasi,
  kurumOlusturSemasi,
  kurumSilSemasi,
} from "./schemas";
import {
  kurumGeriYukle,
  kurumGuncelle,
  kurumlariListele,
  kurumOlustur,
  kurumSecenekleri,
  kurumSil,
} from "./services";

export const kurumListele = eylem({
  ad: "kurum:liste",
  girdi: kurumListeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KURUM_YONET);
    return kurumlariListele(girdi);
  },
});

export const kurumSecenekleriniGetir = eylem({
  ad: "kurum:secenekler",
  girisGerekli: false,
  calistir: async () => {
    return kurumSecenekleri();
  },
});

export const kurumOlusturEylem = eylem({
  ad: "kurum:olustur",
  girdi: kurumOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KURUM_YONET);
    const yeni = await kurumOlustur(girdi);
    revalidatePath("/ayarlar/kurumlar");
    return yeni;
  },
});

export const kurumGuncelleEylem = eylem({
  ad: "kurum:guncelle",
  girdi: kurumGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KURUM_YONET);
    await kurumGuncelle(girdi);
    revalidatePath("/ayarlar/kurumlar");
    return { id: girdi.id };
  },
});

export const kurumSilEylem = eylem({
  ad: "kurum:sil",
  girdi: kurumSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KURUM_YONET);
    await kurumSil(girdi.id);
    revalidatePath("/ayarlar/kurumlar");
    return { id: girdi.id };
  },
});

export const kurumGeriYukleEylem = eylem({
  ad: "kurum:geri-yukle",
  girdi: z.object({ id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KURUM_YONET);
    await kurumGeriYukle(girdi.id);
    revalidatePath("/ayarlar/kurumlar");
    return { id: girdi.id };
  },
});
