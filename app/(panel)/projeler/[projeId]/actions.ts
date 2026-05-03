"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import {
  yetkiZorunluProje,
  yetkiZorunluListe,
  yetkiZorunluKart,
} from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  kartGeriYukleSemasi,
  kartGuncelleSemasi,
  kartOlusturSemasi,
  kartSilSemasi,
  kartTasiSemasi,
  listeGuncelleSemasi,
  listeOlusturSemasi,
  listeSilSemasi,
  listeSiraSemasi,
  projeDetaySemasi,
} from "./schemas";
import {
  kartGeriYukle,
  kartGuncelle as kartGuncelleSrv,
  kartiTasi,
  kartOlustur as kartOlusturSrv,
  kartSil,
  listeGuncelle,
  listeOlustur,
  listeSil,
  listeyeSiraVer,
  projeDetayiniGetir,
  projedeTumKartlar,
} from "./services";
import {
  kartHedefKurumEkle,
  kartHedefKurumKaldir,
  kartHedefKurumlariniListele,
} from "./kart-hedef";

function kurumIdAl(ctx: { oturum: { kurumId?: string } | null }): string {
  const kurumId = ctx.oturum?.kurumId;
  if (!kurumId) {
    throw new EylemHatasi("Kurum bilgisi yok.", HATA_KODU.YETKISIZ);
  }
  return kurumId;
}

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

// ============================================================
// Proje detayı (pano + liste görünümü)
// ============================================================

export const projeDetayEylem = eylem({
  ad: "proje:detay",
  girdi: projeDetaySemasi,
  calistir: async (girdi, ctx) => {
    const kurumId = kurumIdAl(ctx);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", girdi.proje_id);
    return projeDetayiniGetir(kurumId, girdi.proje_id);
  },
});

export const projeKartlarEylem = eylem({
  ad: "proje:kartlar",
  girdi: projeDetaySemasi,
  calistir: async (girdi, ctx) => {
    const kurumId = kurumIdAl(ctx);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", girdi.proje_id);
    return projedeTumKartlar(kurumId, girdi.proje_id);
  },
});

// ============================================================
// Liste eylemleri
// ============================================================

export const listeOlusturEylem = eylem({
  ad: "liste:olustur",
  girdi: listeOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_OLUSTUR);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", girdi.proje_id);
    const kurumId = kurumIdAl(ctx);
    const yeni = await listeOlustur(kurumId, girdi);
    revalidatePath(`/projeler/${girdi.proje_id}`);
    return yeni;
  },
});

export const listeGuncelleEylem = eylem({
  ad: "liste:guncelle",
  girdi: listeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_DUZENLE);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:edit", girdi.id);
    const kurumId = kurumIdAl(ctx);
    await listeGuncelle(kurumId, girdi);
    return { id: girdi.id };
  },
});

export const listeSilEylem = eylem({
  ad: "liste:sil",
  girdi: listeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_SIL);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:delete", girdi.id);
    const kurumId = kurumIdAl(ctx);
    await listeSil(kurumId, girdi.id);
    return { id: girdi.id };
  },
});

export const listeSiralaEylem = eylem({
  ad: "liste:sirala",
  girdi: listeSiraSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_DUZENLE);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:edit", girdi.id);
    const kurumId = kurumIdAl(ctx);
    return listeyeSiraVer(kurumId, girdi);
  },
});

// ============================================================
// Kart eylemleri
// ============================================================

export const kartOlusturEylem = eylem({
  ad: "kart:olustur",
  girdi: kartOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_OLUSTUR);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:create", girdi.liste_id);
    const kurumId = kurumIdAl(ctx);
    const kullaniciId = kullaniciIdAl(ctx);
    return kartOlusturSrv(kurumId, kullaniciId, girdi);
  },
});

export const kartGuncelleEylem = eylem({
  ad: "kart:guncelle",
  girdi: kartGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.id);
    const kurumId = kurumIdAl(ctx);
    await kartGuncelleSrv(kurumId, girdi);
    return { id: girdi.id };
  },
});

export const kartSilEylem = eylem({
  ad: "kart:sil",
  girdi: kartSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_SIL);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:delete", girdi.id);
    const kurumId = kurumIdAl(ctx);
    await kartSil(kurumId, girdi.id);
    return { id: girdi.id };
  },
});

export const kartGeriYukleEylem = eylem({
  ad: "kart:geri-yukle",
  girdi: kartGeriYukleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_SIL);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.id);
    const kurumId = kurumIdAl(ctx);
    await kartGeriYukle(kurumId, girdi.id);
    return { id: girdi.id };
  },
});

export const kartTasiEylem = eylem({
  ad: "kart:tasi",
  girdi: kartTasiSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TASI);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:tasi", girdi.id);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:edit", girdi.hedef_liste_id);
    const kurumId = kurumIdAl(ctx);
    return kartiTasi(kurumId, girdi);
  },
});

// ============================================================
// Kart Hedef Kurum (KartHedefKurumu join — ADR-0001)
// ============================================================

export const kartHedefKurumlariEylem = eylem({
  ad: "kart:hedef-kurumlar",
  girdi: z.object({ kart_id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    const kurumId = kurumIdAl(ctx);
    return kartHedefKurumlariniListele(kurumId, girdi.kart_id);
  },
});

export const kartHedefKurumEkleEylem = eylem({
  ad: "kart:hedef-kurum-ekle",
  girdi: z.object({
    kart_id: z.string().uuid(),
    hedef_kurum_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    const kurumId = kurumIdAl(ctx);
    await kartHedefKurumEkle(kurumId, girdi.kart_id, girdi.hedef_kurum_id);
    return { kart_id: girdi.kart_id, hedef_kurum_id: girdi.hedef_kurum_id };
  },
});

export const kartHedefKurumKaldirEylem = eylem({
  ad: "kart:hedef-kurum-kaldir",
  girdi: z.object({
    kart_id: z.string().uuid(),
    hedef_kurum_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    const kurumId = kurumIdAl(ctx);
    await kartHedefKurumKaldir(kurumId, girdi.kart_id, girdi.hedef_kurum_id);
    return { kart_id: girdi.kart_id, hedef_kurum_id: girdi.hedef_kurum_id };
  },
});
