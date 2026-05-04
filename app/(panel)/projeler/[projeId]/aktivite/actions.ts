"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { kartAktiviteleriListeleSemasi } from "./schemas";
import { kartAktiviteleriniListele } from "./services";

function kurumIdAl(ctx: { oturum: { kurumId?: string } | null }): string {
  const kurumId = ctx.oturum?.kurumId;
  if (!kurumId) {
    throw new EylemHatasi("Kurum bilgisi yok.", HATA_KODU.YETKISIZ);
  }
  return kurumId;
}

export const kartAktiviteleriEylem = eylem({
  ad: "kart:aktiviteleri",
  girdi: kartAktiviteleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartAktiviteleriniListele(kurumIdAl(ctx), girdi);
  },
});
