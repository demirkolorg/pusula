"use server";

import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { HATA_KODU } from "@/lib/sonuc";
import { bekleyenOnerileriListelemeSemasi } from "./schemas";
import {
  bekleyenKartOnerileri as bekleyenKartOnerileriSrv,
  bekleyenMaddeOnerileri as bekleyenMaddeOnerileriSrv,
  bekleyenOneriSayimi,
} from "./services";

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

// ADR-0019/PR-3 — Sayfa girişi KART_TAMAMLA izni ZORUNLU. Yetki yoksa
// kullanıcının erişebileceği "kendi öneri durumu" sadece bildirim merkezinden
// görülür; bu sayfa "onay verecek kişi" için.

export const bekleyenKartOnerileriniListeleEylem = eylem({
  ad: "onaylar:kart-listele",
  girdi: bekleyenOnerileriListelemeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
    return bekleyenKartOnerileriSrv(kullaniciIdAl(ctx), girdi);
  },
});

export const bekleyenMaddeOnerileriniListeleEylem = eylem({
  ad: "onaylar:madde-listele",
  girdi: bekleyenOnerileriListelemeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
    return bekleyenMaddeOnerileriSrv(kullaniciIdAl(ctx), girdi);
  },
});

// Sayım sidebar badge için sık çağrılır; ek argüman yok.
export const bekleyenOneriSayimiEylem = eylem({
  ad: "onaylar:sayim",
  girdi: z.object({}),
  calistir: async (_girdi, ctx) => {
    // Yetki yoksa 0 dön — badge görünmesin. Sayfa ayrıca KART_TAMAMLA gate'li.
    if (
      !(await import("@/lib/permissions").then((m) =>
        m.izinVarMi(ctx.oturum?.kullaniciId ?? "", IZIN_KODLARI.KART_TAMAMLA),
      ))
    ) {
      return { kart: 0, madde: 0 };
    }
    return bekleyenOneriSayimi(kullaniciIdAl(ctx));
  },
});
