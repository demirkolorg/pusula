"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { bildirimGuvenliCagir } from "@/lib/bildirim-guvenli";
import {
  herhangiBirIzin,
  yetkiZorunlu,
  IZIN_KODLARI,
} from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { db } from "@/lib/db";
import {
  tetikleYorumGuncellendi,
  tetikleYorumSilindi,
} from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  yorumGuncelleSemasi,
  yorumlariListeleSemasi,
  yorumOlusturSemasi,
  yorumSilSemasi,
} from "./schemas";
import {
  kartYorumlariniListele,
  yorumGuncelle as yorumGuncelleSrv,
  yorumOlustur as yorumOlusturSrv,
  yorumSil as yorumSilSrv,
} from "./services";

// Sprint 3 / S3-14 — `birimIdAl` aslında kullaniciId döndürüyordu (yanlış ad).
// `kullaniciIdAl` ile birleştirildi; service çağrılarında ikinci kez aynı id
// geçmek yerine tek değişken kullanılır.
import { kullaniciIdAl } from "@/lib/action-helpers";

export const yorumlariListeleEylem = eylem({
  ad: "yorum:listele",
  girdi: yorumlariListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartYorumlariniListele(kullaniciIdAl(ctx), girdi.kart_id);
  },
});

export const yorumOlusturEylem = eylem({
  ad: "yorum:olustur",
  girdi: yorumOlusturSemasi,
  calistir: async (girdi, ctx) => {
    // Sprint 1 / S1-7 — granüler izin (Kural V.2 / #146).
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_YORUM_YAZ);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    return yorumOlusturSrv(kullaniciIdAl(ctx), kullaniciIdAl(ctx), girdi);
  },
});

export const yorumGuncelleEylem = eylem({
  ad: "yorum:guncelle",
  girdi: yorumGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    // Sprint 1 / S1-7 — kullanıcı sadece KENDİ yorumunu düzenleyebilir;
    // service `yorumGuncelle` sahip kontrolü yapar. Action katmanında
    // izin kodu kontrolü.
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE,
    );
    const yazanId = ctx.oturum?.kullaniciId ?? null;
    await yorumGuncelleSrv(kullaniciIdAl(ctx), kullaniciIdAl(ctx), girdi);
    if (yazanId) {
      const yorum = await db.yorum.findUnique({
        where: { id: girdi.id },
        select: { kart_id: true },
      });
      if (yorum) {
        void bildirimGuvenliCagir(
          tetikleYorumGuncellendi({
            yorumId: girdi.id,
            kartId: yorum.kart_id,
            yazanId,
            icerik: girdi.icerik,
          }),
          "yorum-guncellendi",
        );
      }
    }
    return { id: girdi.id };
  },
});

export const yorumSilEylem = eylem({
  ad: "yorum:sil",
  girdi: yorumSilSemasi,
  calistir: async (girdi, ctx) => {
    // Sprint 1 / S1-7 — kendi veya başka yorum silme. Service hangi izinin
    // kullanıldığını sahip-mi kontrolüyle ayırır (S1-8); action katmanında
    // en az birine sahip olmak yeter.
    const kullaniciId = ctx.oturum?.kullaniciId;
    if (!kullaniciId) {
      throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
    }
    const yetkili = await herhangiBirIzin(
      kullaniciId,
      IZIN_KODLARI.KART_YORUM_KENDI_SIL,
      IZIN_KODLARI.KART_YORUM_BASKA_SIL,
    );
    if (!yetkili) {
      throw new EylemHatasi(
        "Yorum silme yetkiniz yok.",
        HATA_KODU.YETKISIZ,
        undefined,
        "WARN",
      );
    }
    // Silmeden ÖNCE kart_id'yi yakala — silinince yorum kaydı yok olur.
    const yorum = await db.yorum.findUnique({
      where: { id: girdi.id },
      select: { kart_id: true },
    });
    await yorumSilSrv(kullaniciIdAl(ctx), kullaniciIdAl(ctx), girdi.id);
    if (yorum) {
      void bildirimGuvenliCagir(
        tetikleYorumSilindi({
          yorumId: girdi.id,
          kartId: yorum.kart_id,
          silenId: kullaniciId,
        }),
        "yorum-silindi",
      );
    }
    return { id: girdi.id };
  },
});
