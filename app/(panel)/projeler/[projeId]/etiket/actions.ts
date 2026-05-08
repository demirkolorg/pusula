"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { bildirimGuvenliCagir } from "@/lib/bildirim-guvenli";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluProje, yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { db } from "@/lib/db";
import { tetikleEtiketDegisti } from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  etiketDetayGetirSemasi,
  etiketGuncelleSemasi,
  etiketKartlariSemasi,
  etiketListeleSemasi,
  etiketOlusturSemasi,
  etiketSilSemasi,
  kartaEtiketEkleSemasi,
  kartaEtiketKaldirSemasi,
} from "./schemas";
import {
  etiketDetayGetir as etiketDetayGetirSrv,
  etiketGuncelle as etiketGuncelleSrv,
  etiketKartlariniListele as etiketKartlariniListeleSrv,
  etiketleriListele,
  etiketOlustur as etiketOlusturSrv,
  etiketSil as etiketSilSrv,
  kartaEtiketEkle as kartaEtiketEkleSrv,
  kartaEtiketKaldir as kartaEtiketKaldirSrv,
  kartinEtiketleri as kartinEtiketleriSrv,
} from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

// Etiket id'sinden proje id'sini ucuz çek (yetki-zorunluProje için).
async function etiketProjesi(etiketId: string): Promise<string> {
  const e = await db.etiket.findUnique({
    where: { id: etiketId },
    select: { proje_id: true },
  });
  if (!e) {
    throw new EylemHatasi("Etiket bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return e.proje_id;
}

// ============================================================
// Etiket CRUD (proje düzeyinde) — granüler izinler
// ============================================================

export const etiketleriListeleEylem = eylem({
  ad: "etiket:listele",
  girdi: etiketListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    const birimId = birimIdAl(ctx);
    return etiketleriListele(birimId, girdi.proje_id);
  },
});

export const etiketDetayEylem = eylem({
  ad: "etiket:detay",
  girdi: etiketDetayGetirSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await etiketProjesi(girdi.id);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", projeId);
    const birimId = birimIdAl(ctx);
    return etiketDetayGetirSrv(birimId, girdi.id);
  },
});

export const etiketKartlariEylem = eylem({
  ad: "etiket:kartlari",
  girdi: etiketKartlariSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await etiketProjesi(girdi.etiket_id);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", projeId);
    const birimId = birimIdAl(ctx);
    return etiketKartlariniListeleSrv(
      birimId,
      girdi.etiket_id,
      girdi.sayfa,
      girdi.sayfa_boyutu,
    );
  },
});

export const etiketOlusturEylem = eylem({
  ad: "etiket:olustur",
  girdi: etiketOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.KART_ETIKET_OLUSTUR,
    );
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:edit",
      girdi.proje_id,
    );
    const birimId = birimIdAl(ctx);
    return etiketOlusturSrv(birimId, girdi);
  },
});

export const etiketGuncelleEylem = eylem({
  ad: "etiket:guncelle",
  girdi: etiketGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.KART_ETIKET_DUZENLE,
    );
    const projeId = await etiketProjesi(girdi.id);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", projeId);
    const birimId = birimIdAl(ctx);
    await etiketGuncelleSrv(birimId, girdi);
    return { id: girdi.id };
  },
});

export const etiketSilEylem = eylem({
  ad: "etiket:sil",
  girdi: etiketSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_ETIKET_SIL);
    const projeId = await etiketProjesi(girdi.id);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", projeId);
    const birimId = birimIdAl(ctx);
    await etiketSilSrv(birimId, girdi.id);
    return { id: girdi.id };
  },
});

// ============================================================
// Karta etiket ata / kaldır — granüler izinler
// ============================================================

async function etiketAdiniGetir(etiketId: string): Promise<string> {
  const e = await db.etiket.findUnique({
    where: { id: etiketId },
    select: { ad: true },
  });
  return e?.ad ?? "Etiket";
}

export const kartaEtiketEkleEylem = eylem({
  ad: "kart:etiket-ekle",
  girdi: kartaEtiketEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_ETIKET_ATA);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const birimId = birimIdAl(ctx);
    await kartaEtiketEkleSrv(birimId, girdi.kart_id, girdi.etiket_id);
    const degistirenId = ctx.oturum?.kullaniciId ?? null;
    if (degistirenId) {
      const etiketAd = await etiketAdiniGetir(girdi.etiket_id);
      void bildirimGuvenliCagir(
        tetikleEtiketDegisti({
          kartId: girdi.kart_id,
          degistirenId,
          etiketAd,
          eylem: "eklendi",
        }),
        "etiket-eklendi",
      );
    }
    return { kart_id: girdi.kart_id, etiket_id: girdi.etiket_id };
  },
});

export const kartaEtiketKaldirEylem = eylem({
  ad: "kart:etiket-kaldir",
  girdi: kartaEtiketKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.KART_ETIKET_CIKAR,
    );
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const birimId = birimIdAl(ctx);
    const degistirenId = ctx.oturum?.kullaniciId ?? null;
    // Etiket adını silmeden önce al — sonra silinir.
    const etiketAd = degistirenId
      ? await etiketAdiniGetir(girdi.etiket_id)
      : null;
    await kartaEtiketKaldirSrv(birimId, girdi.kart_id, girdi.etiket_id);
    if (degistirenId && etiketAd) {
      void bildirimGuvenliCagir(
        tetikleEtiketDegisti({
          kartId: girdi.kart_id,
          degistirenId,
          etiketAd,
          eylem: "kaldirildi",
        }),
        "etiket-kaldirildi",
      );
    }
    return { kart_id: girdi.kart_id, etiket_id: girdi.etiket_id };
  },
});

// Karttaki etiket id'lerini al (kart modal açılırken)
export const kartinEtiketleriEylem = eylem({
  ad: "kart:etiketleri",
  girdi: kartaEtiketKaldirSemasi.pick({ kart_id: true }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    const birimId = birimIdAl(ctx);
    return kartinEtiketleriSrv(birimId, girdi.kart_id);
  },
});
