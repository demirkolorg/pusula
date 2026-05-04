"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eylem } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import {
  birimGuncelleSemasi,
  birimListeSemasi,
  birimOlusturSemasi,
  birimSilSemasi,
} from "./schemas";
import {
  birimGeriYukle,
  birimGuncelle,
  birimleriListele,
  birimOlustur,
  birimSecenekleri,
  birimSil,
} from "./services";

export const birimListele = eylem({
  ad: "birim:liste",
  girdi: birimListeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.BIRIM_YONET);
    return birimleriListele(girdi);
  },
});

export const birimSecenekleriniGetir = eylem({
  ad: "birim:secenekler",
  girisGerekli: false,
  calistir: async () => {
    return birimSecenekleri();
  },
});

export const birimOlusturEylem = eylem({
  ad: "birim:olustur",
  girdi: birimOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.BIRIM_YONET);
    const yeni = await birimOlustur(girdi);
    revalidatePath("/ayarlar/birimler");
    return yeni;
  },
});

export const birimGuncelleEylem = eylem({
  ad: "birim:guncelle",
  girdi: birimGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.BIRIM_YONET);
    await birimGuncelle(girdi);
    revalidatePath("/ayarlar/birimler");
    return { id: girdi.id };
  },
});

export const birimSilEylem = eylem({
  ad: "birim:sil",
  girdi: birimSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.BIRIM_YONET);
    await birimSil(girdi.id);
    revalidatePath("/ayarlar/birimler");
    return { id: girdi.id };
  },
});

export const birimGeriYukleEylem = eylem({
  ad: "birim:geri-yukle",
  girdi: z.object({ id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.BIRIM_YONET);
    await birimGeriYukle(girdi.id);
    revalidatePath("/ayarlar/birimler");
    return { id: girdi.id };
  },
});
