"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { HATA_KODU } from "@/lib/sonuc";
import {
  davetGonderSemasi,
  kullaniciGuncelleSemasi,
  kullaniciListeSemasi,
  kullaniciOnaylaSemasi,
  kullaniciReddetSemasi,
  kullaniciSilSemasi,
} from "./schemas";
import {
  bekleyenKullanicilariListele,
  davetOlustur,
  kullanicilariListele,
  kullaniciyiGeriYukle,
  kullaniciyiGuncelle,
  kullaniciyiOnayla,
  kullaniciyiReddet,
  kullaniciyiSil,
  rolleriListele,
} from "./services";

export const kullaniciListele = eylem({
  ad: "kullanici:liste",
  girdi: kullaniciListeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.KULLANICI_DUZENLE,
    );
    return kullanicilariListele(girdi);
  },
});

export const rolListele = eylem({
  ad: "rol:liste",
  calistir: async () => {
    return rolleriListele();
  },
});

export const kullaniciGuncelleEylem = eylem({
  ad: "kullanici:guncelle",
  girdi: kullaniciGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_DUZENLE);
    if (!ctx.oturum?.kullaniciId) {
      throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
    }
    await kullaniciyiGuncelle(girdi, ctx.oturum.kullaniciId);
    revalidatePath("/ayarlar/kullanicilar");
    return { id: girdi.id };
  },
});

export const kullaniciSilEylem = eylem({
  ad: "kullanici:sil",
  girdi: kullaniciSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_SIL);
    if (ctx.oturum?.kullaniciId === girdi.id) {
      throw new EylemHatasi("Kendinizi silemezsiniz.", HATA_KODU.CAKISMA);
    }
    await kullaniciyiSil(girdi.id);
    revalidatePath("/ayarlar/kullanicilar");
    return { id: girdi.id };
  },
});

export const kullaniciGeriYukleEylem = eylem({
  ad: "kullanici:geri-yukle",
  girdi: z.object({ id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_DUZENLE);
    await kullaniciyiGeriYukle(girdi.id);
    revalidatePath("/ayarlar/kullanicilar");
    return { id: girdi.id };
  },
});

export const davetGonderEylem = eylem({
  ad: "kullanici:davet-gonder",
  girdi: davetGonderSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_DAVET);
    if (!ctx.oturum?.kullaniciId) {
      throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
    }
    try {
      const kayit = await davetOlustur(ctx.oturum.kullaniciId, girdi);
      revalidatePath("/ayarlar/kullanicilar");
      return kayit;
    } catch (err) {
      if (err instanceof Error) {
        throw new EylemHatasi(err.message, HATA_KODU.CAKISMA);
      }
      throw err;
    }
  },
});

export const bekleyenKullanicilariListeleEylem = eylem({
  ad: "kullanici:bekleyenler",
  calistir: async (_g, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_ONAYLA);
    return bekleyenKullanicilariListele();
  },
});

export const kullaniciOnaylaEylem = eylem({
  ad: "kullanici:onayla",
  girdi: kullaniciOnaylaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_ONAYLA);
    if (!ctx.oturum?.kullaniciId) {
      throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
    }
    await kullaniciyiOnayla(girdi.id, ctx.oturum.kullaniciId);
    revalidatePath("/ayarlar/kullanicilar");
    revalidatePath("/ayarlar/onay-bekleyenler");
    return { id: girdi.id };
  },
});

export const kullaniciReddetEylem = eylem({
  ad: "kullanici:reddet",
  girdi: kullaniciReddetSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KULLANICI_ONAYLA);
    if (!ctx.oturum?.kullaniciId) {
      throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
    }
    await kullaniciyiReddet(girdi.id, ctx.oturum.kullaniciId, girdi.sebep);
    revalidatePath("/ayarlar/onay-bekleyenler");
    return { id: girdi.id };
  },
});
