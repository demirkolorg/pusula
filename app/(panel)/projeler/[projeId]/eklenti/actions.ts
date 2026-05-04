"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { uploadLimiter } from "@/lib/rate-limit";
import { HATA_KODU } from "@/lib/sonuc";
import { tetikleEklentiYuklendi } from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  eklentiIndirSemasi,
  eklentiSilSemasi,
  kartEklentileriListeleSemasi,
  yuklemeBaslatSemasi,
  yuklemeOnaylaSemasi,
} from "./schemas";
import {
  eklentiIndirURL,
  eklentiSil as eklentiSilSrv,
  kartEklentileriniListele,
  yuklemeBaslat as yuklemeBaslatSrv,
  yuklemeOnayla as yuklemeOnaylaSrv,
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

export const eklentileriListeleEylem = eylem({
  ad: "eklenti:listele",
  girdi: kartEklentileriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartEklentileriniListele(kurumIdAl(ctx), girdi.kart_id);
  },
});

export const yuklemeBaslatEylem = eylem({
  ad: "eklenti:yukleme-baslat",
  girdi: yuklemeBaslatSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);

    // Kural 73: upload rate limit — 10/dk/kullanıcı
    const kullaniciId = kullaniciIdAl(ctx);
    if (!uploadLimiter.tryConsume(kullaniciId)) {
      throw new EylemHatasi(
        "Çok fazla yükleme isteği. Lütfen biraz bekleyin.",
        HATA_KODU.YETKISIZ,
      );
    }
    return yuklemeBaslatSrv(kurumIdAl(ctx), girdi);
  },
});

export const yuklemeOnaylaEylem = eylem({
  ad: "eklenti:yukleme-onayla",
  girdi: yuklemeOnaylaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const yukleyenId = kullaniciIdAl(ctx);
    const e = await yuklemeOnaylaSrv(kurumIdAl(ctx), yukleyenId, girdi);
    tetikleEklentiYuklendi({
      eklentiId: e.id,
      kartId: girdi.kart_id,
      yukleyenId,
      ad: e.ad,
    }).catch(() => {});
    return e;
  },
});

export const eklentiIndirEylem = eylem({
  ad: "eklenti:indir",
  girdi: eklentiIndirSemasi,
  calistir: async (girdi, ctx) => {
    const kurumId = kurumIdAl(ctx);
    return eklentiIndirURL(kurumId, girdi.id);
  },
});

export const eklentiSilEylem = eylem({
  ad: "eklenti:sil",
  girdi: eklentiSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await eklentiSilSrv(kurumIdAl(ctx), kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});
