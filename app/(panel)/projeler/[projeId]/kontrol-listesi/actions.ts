"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { tetikleMaddeAtama } from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  kontrolListeleriListeleSemasi,
  kontrolListesiGuncelleSemasi,
  kontrolListesiOlusturSemasi,
  kontrolListesiSilSemasi,
  maddeGuncelleSemasi,
  maddeOlusturSemasi,
  maddeSilSemasi,
} from "./schemas";
import {
  kartKontrolListeleriniListele,
  kontrolListesiGuncelle as kontrolListesiGuncelleSrv,
  kontrolListesiOlustur as kontrolListesiOlusturSrv,
  kontrolListesiSil as kontrolListesiSilSrv,
  maddeGuncelle as maddeGuncelleSrv,
  maddeOlustur as maddeOlusturSrv,
  maddeSil as maddeSilSrv,
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
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

// =====================================================================
// Kontrol Listesi
// =====================================================================

export const kontrolListeleriListeleEylem = eylem({
  ad: "kontrol-listesi:listele",
  girdi: kontrolListeleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartKontrolListeleriniListele(kurumIdAl(ctx), girdi.kart_id);
  },
});

export const kontrolListesiOlusturEylem = eylem({
  ad: "kontrol-listesi:olustur",
  girdi: kontrolListesiOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    return kontrolListesiOlusturSrv(kurumIdAl(ctx), girdi);
  },
});

export const kontrolListesiGuncelleEylem = eylem({
  ad: "kontrol-listesi:guncelle",
  girdi: kontrolListesiGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await kontrolListesiGuncelleSrv(kurumIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const kontrolListesiSilEylem = eylem({
  ad: "kontrol-listesi:sil",
  girdi: kontrolListesiSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await kontrolListesiSilSrv(kurumIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

// =====================================================================
// Madde
// =====================================================================

export const maddeOlusturEylem = eylem({
  ad: "kontrol-maddesi:olustur",
  girdi: maddeOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    const atayanId = ctx.oturum?.kullaniciId ?? null;
    const m = await maddeOlusturSrv(kurumIdAl(ctx), girdi);
    if (girdi.atanan_id && atayanId) {
      tetikleMaddeAtama({
        maddeId: m.id,
        metin: m.metin,
        atananId: girdi.atanan_id,
        atayanId,
      }).catch(() => {});
    }
    return m;
  },
});

export const maddeGuncelleEylem = eylem({
  ad: "kontrol-maddesi:guncelle",
  girdi: maddeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    const atayanId = ctx.oturum?.kullaniciId ?? null;
    await maddeGuncelleSrv(kurumIdAl(ctx), kullaniciIdAl(ctx), girdi);
    // atanan_id explicit verildiyse (yeni atama veya değişim) bildir.
    if (girdi.atanan_id && atayanId) {
      tetikleMaddeAtama({
        maddeId: girdi.id,
        metin: girdi.metin ?? "",
        atananId: girdi.atanan_id,
        atayanId,
      }).catch(() => {});
    }
    return { id: girdi.id };
  },
});

export const maddeSilEylem = eylem({
  ad: "kontrol-maddesi:sil",
  girdi: maddeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await maddeSilSrv(kurumIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});
