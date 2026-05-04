"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { kartAktiviteleriListeleSemasi } from "./schemas";
import { kartAktiviteleriniListele } from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

export const kartAktiviteleriEylem = eylem({
  ad: "kart:aktiviteleri",
  girdi: kartAktiviteleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartAktiviteleriniListele(birimIdAl(ctx), girdi);
  },
});
