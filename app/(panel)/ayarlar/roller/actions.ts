"use server";

import { revalidatePath } from "next/cache";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import {
  herhangiBirIzin,
  IZIN_KODLARI,
  yetkiZorunlu,
} from "@/lib/permissions";
import { HATA_KODU } from "@/lib/sonuc";
import {
  kullaniciyaRolAtaSemasi,
  rolCogaltSemasi,
  rolDetaySemasi,
  rolGuncelleSemasi,
  rolIzinleriniGuncelleSemasi,
  rolListeSemasi,
  rolOlusturSemasi,
  rolSilSemasi,
} from "./schemas";
import {
  kullaniciyaRolAta as kullaniciyaRolAtaServis,
  rolCogalt as rolCogaltServis,
  rolDetayiniGetir,
  rolGuncelle as rolGuncelleServis,
  rolIzinleriniGuncelle as rolIzinleriniGuncelleServis,
  rolleriListele,
  rolOlustur as rolOlusturServis,
  rolSil as rolSilServis,
  tumIzinleriListele,
} from "./services";

const ROL_YOL = "/ayarlar/roller";

// ADR-0014: liste/detay görüntüleme için herhangi bir rol-yönetimi izni
// yeterli — kullanıcı en azından rol panelini görmeye yetkili.
const ROL_GORUNTULEME_IZINLERI = [
  IZIN_KODLARI.ROL_OLUSTUR,
  IZIN_KODLARI.ROL_DUZENLE,
  IZIN_KODLARI.ROL_IZIN_ATA,
  IZIN_KODLARI.ROL_COGALT,
  IZIN_KODLARI.ROL_SIL,
  IZIN_KODLARI.ROL_KULLANICIYA_ATA,
] as const;

function oturumIdYoksaFirlat(id: string | undefined | null): string {
  if (!id) {
    throw new EylemHatasi("Oturum bilgisi eksik.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

async function herhangiRolYonetimiZorunlu(
  kullaniciId: string | null | undefined,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Bu işlem için giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  const var_ = await herhangiBirIzin(
    kullaniciId,
    ...ROL_GORUNTULEME_IZINLERI,
  );
  if (!var_) {
    throw new EylemHatasi("Bu işlem için yetkiniz yok.", HATA_KODU.YETKISIZ);
  }
}

export const rolleriListeleEylem = eylem({
  ad: "rol:listele",
  girdi: rolListeSemasi,
  calistir: async (girdi, ctx) => {
    await herhangiRolYonetimiZorunlu(ctx.oturum?.kullaniciId);
    return rolleriListele(girdi.arama);
  },
});

export const rolDetayiEylem = eylem({
  ad: "rol:detay",
  girdi: rolDetaySemasi,
  calistir: async (girdi, ctx) => {
    await herhangiRolYonetimiZorunlu(ctx.oturum?.kullaniciId);
    return rolDetayiniGetir(girdi.id);
  },
});

export const tumIzinleriListeleEylem = eylem({
  ad: "izin:listele",
  calistir: async (_, ctx) => {
    await herhangiRolYonetimiZorunlu(ctx.oturum?.kullaniciId);
    return tumIzinleriListele();
  },
});

export const rolOlusturEylem = eylem({
  ad: "rol:olustur",
  girdi: rolOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.ROL_OLUSTUR);
    const sonuc = await rolOlusturServis(girdi);
    revalidatePath(ROL_YOL);
    return sonuc;
  },
});

export const rolGuncelleEylem = eylem({
  ad: "rol:guncelle",
  girdi: rolGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.ROL_DUZENLE);
    await rolGuncelleServis(girdi);
    revalidatePath(ROL_YOL);
    revalidatePath(`${ROL_YOL}/${girdi.id}`);
    return { id: girdi.id };
  },
});

export const rolIzinleriniGuncelleEylem = eylem({
  ad: "rol:izinleri-guncelle",
  girdi: rolIzinleriniGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    const yapanId = oturumIdYoksaFirlat(ctx.oturum?.kullaniciId);
    await yetkiZorunlu(yapanId, IZIN_KODLARI.ROL_IZIN_ATA);
    const sonuc = await rolIzinleriniGuncelleServis(girdi, yapanId);
    revalidatePath(ROL_YOL);
    revalidatePath(`${ROL_YOL}/${girdi.id}`);
    return sonuc;
  },
});

export const rolCogaltEylem = eylem({
  ad: "rol:cogalt",
  girdi: rolCogaltSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.ROL_COGALT);
    const sonuc = await rolCogaltServis(girdi);
    revalidatePath(ROL_YOL);
    return sonuc;
  },
});

export const rolSilEylem = eylem({
  ad: "rol:sil",
  girdi: rolSilSemasi,
  calistir: async (girdi, ctx) => {
    const yapanId = oturumIdYoksaFirlat(ctx.oturum?.kullaniciId);
    await yetkiZorunlu(yapanId, IZIN_KODLARI.ROL_SIL);
    await rolSilServis(girdi.id, yapanId);
    revalidatePath(ROL_YOL);
    return { id: girdi.id };
  },
});

export const kullaniciyaRolAtaEylem = eylem({
  ad: "rol:kullaniciya-ata",
  girdi: kullaniciyaRolAtaSemasi,
  calistir: async (girdi, ctx) => {
    const yapanId = oturumIdYoksaFirlat(ctx.oturum?.kullaniciId);
    await yetkiZorunlu(yapanId, IZIN_KODLARI.ROL_KULLANICIYA_ATA);
    await kullaniciyaRolAtaServis(girdi, yapanId);
    revalidatePath(ROL_YOL);
    revalidatePath("/ayarlar/kullanicilar");
    return { kullaniciId: girdi.kullaniciId };
  },
});
