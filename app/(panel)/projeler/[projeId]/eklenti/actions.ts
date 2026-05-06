"use server";

// ADR-0028 / F5 — Kart eklenti compatibility action wrapper.
// Eski action imzaları korunur; içerik yeni `dosyalar` modülünün service
// fonksiyonlarına delege edilir. Yeni Eklenti tablosu yazımı YOK.

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

function kullaniciIdAl(ctx: {
  oturum: { kullaniciId?: string } | null;
}): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

export const eklentileriListeleEylem = eylem({
  ad: "eklenti:listele",
  girdi: kartEklentileriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartEklentileriniListele(kullaniciIdAl(ctx), girdi.kart_id);
  },
});

export const yuklemeBaslatEylem = eylem({
  ad: "eklenti:yukleme-baslat",
  girdi: yuklemeBaslatSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);

    const kullaniciId = kullaniciIdAl(ctx);
    if (!uploadLimiter.tryConsume(kullaniciId)) {
      throw new EylemHatasi(
        "Çok fazla yükleme isteği. Lütfen biraz bekleyin.",
        HATA_KODU.YETKISIZ,
      );
    }
    return yuklemeBaslatSrv(kullaniciId, girdi);
  },
});

export const yuklemeOnaylaEylem = eylem({
  ad: "eklenti:yukleme-onayla",
  girdi: yuklemeOnaylaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const kullaniciId = kullaniciIdAl(ctx);
    const sonuc = await yuklemeOnaylaSrv(kullaniciId, girdi);
    tetikleEklentiYuklendi({
      eklentiId: sonuc.id,
      kartId: girdi.kart_id,
      yukleyenId: kullaniciId,
      ad: "",
    }).catch(() => {});
    return sonuc;
  },
});

export const eklentiIndirEylem = eylem({
  ad: "eklenti:indir",
  girdi: eklentiIndirSemasi,
  calistir: async (girdi, ctx) =>
    eklentiIndirURL(kullaniciIdAl(ctx), girdi.id),
});

export const eklentiSilEylem = eylem({
  ad: "eklenti:sil",
  girdi: eklentiSilSemasi,
  calistir: async (girdi, ctx) => {
    await eklentiSilSrv(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});
