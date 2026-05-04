"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluProje, yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  etiketGuncelleSemasi,
  etiketListeleSemasi,
  etiketOlusturSemasi,
  etiketSilSemasi,
  kartaEtiketEkleSemasi,
  kartaEtiketKaldirSemasi,
} from "./schemas";
import {
  etiketGuncelle as etiketGuncelleSrv,
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

// ============================================================
// Etiket CRUD (proje düzeyinde)
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

export const etiketOlusturEylem = eylem({
  ad: "etiket:olustur",
  girdi: etiketOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
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
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    const birimId = birimIdAl(ctx);
    await etiketGuncelleSrv(birimId, girdi);
    return { id: girdi.id };
  },
});

export const etiketSilEylem = eylem({
  ad: "etiket:sil",
  girdi: etiketSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    const birimId = birimIdAl(ctx);
    await etiketSilSrv(birimId, girdi.id);
    return { id: girdi.id };
  },
});

// ============================================================
// Karta etiket ata / kaldır
// ============================================================

export const kartaEtiketEkleEylem = eylem({
  ad: "kart:etiket-ekle",
  girdi: kartaEtiketEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const birimId = birimIdAl(ctx);
    await kartaEtiketEkleSrv(birimId, girdi.kart_id, girdi.etiket_id);
    return { kart_id: girdi.kart_id, etiket_id: girdi.etiket_id };
  },
});

export const kartaEtiketKaldirEylem = eylem({
  ad: "kart:etiket-kaldir",
  girdi: kartaEtiketKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const birimId = birimIdAl(ctx);
    await kartaEtiketKaldirSrv(birimId, girdi.kart_id, girdi.etiket_id);
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
