// Genel Arama Server Action.
// Kontrol Kural 48 (server action default), 49 (Zod validate), 73 (throttle).

"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { aramaLimiter } from "@/lib/rate-limit";
import { HATA_KODU } from "@/lib/sonuc";
import { aramaSorgusuSemasi } from "./schemas";
import { genelArama } from "./services";
import type { AramaCikti } from "./tipler";

/**
 * Genel arama eylemi: oturum kullanıcısı için 9 tabloyu arar.
 * Throttle: 30 sorgu/dk/kullanıcı (Kontrol Kural 73/147).
 *
 * UI tarafı debounce 250ms uygular; bu rate limit kötü niyetli istemci
 * (debounce'u bypass eden) için ek savunma.
 */
export const genelAramaEylem = eylem({
  ad: "genel-arama:ara",
  girdi: aramaSorgusuSemasi,
  calistir: async (girdi, ctx): Promise<AramaCikti> => {
    const kullaniciId = ctx.oturum!.kullaniciId;
    if (!aramaLimiter.tryConsume(kullaniciId)) {
      throw new EylemHatasi(
        "Çok fazla arama yaptınız. Lütfen biraz bekleyin.",
        HATA_KODU.RATE_LIMIT,
      );
    }
    return genelArama(girdi, kullaniciId);
  },
});
