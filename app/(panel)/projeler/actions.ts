"use server";

import { revalidatePath } from "next/cache";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { HATA_KODU } from "@/lib/sonuc";
import {
  projeArsivSemasi,
  projeGeriYukleSemasi,
  projeGuncelleSemasi,
  projeListeSemasi,
  projeOlusturSemasi,
  projeSilSemasi,
  projeSiraSemasi,
} from "./schemas";
import {
  projeArsivle,
  projeGeriYukle,
  projeGuncelle,
  projeleriListele,
  projeOlustur,
  projeSil,
  projeyeSiraVer,
} from "./services";

function kurumIdAl(ctx: { oturum: { kurumId?: string } | null }): string {
  const kurumId = ctx.oturum?.kurumId;
  if (!kurumId) {
    throw new EylemHatasi("Kurum bilgisi yok.", HATA_KODU.YETKISIZ);
  }
  return kurumId;
}

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

export const projeListele = eylem({
  ad: "proje:liste",
  girdi: projeListeSemasi,
  calistir: async (girdi, ctx) => {
    const kurumId = kurumIdAl(ctx);
    return projeleriListele(kurumId, girdi);
  },
});

export const projeOlusturEylem = eylem({
  ad: "proje:olustur",
  girdi: projeOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_OLUSTUR);
    const kurumId = kurumIdAl(ctx);
    const kullaniciId = kullaniciIdAl(ctx);
    const yeni = await projeOlustur(kurumId, kullaniciId, girdi);
    revalidatePath("/projeler");
    return yeni;
  },
});

export const projeGuncelleEylem = eylem({
  ad: "proje:guncelle",
  girdi: projeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    const kurumId = kurumIdAl(ctx);
    await projeGuncelle(kurumId, girdi);
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeArsivleEylem = eylem({
  ad: "proje:arsiv",
  girdi: projeArsivSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    const kurumId = kurumIdAl(ctx);
    await projeArsivle(kurumId, girdi);
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeSilEylem = eylem({
  ad: "proje:sil",
  girdi: projeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_SIL);
    const kurumId = kurumIdAl(ctx);
    await projeSil(kurumId, girdi.id);
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeGeriYukleEylem = eylem({
  ad: "proje:geri-yukle",
  girdi: projeGeriYukleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_SIL);
    const kurumId = kurumIdAl(ctx);
    await projeGeriYukle(kurumId, girdi.id);
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeSiralaEylem = eylem({
  ad: "proje:sirala",
  girdi: projeSiraSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    const kurumId = kurumIdAl(ctx);
    return projeyeSiraVer(kurumId, girdi);
  },
});
