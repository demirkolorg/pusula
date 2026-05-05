"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunluKart, yetkiZorunluProje } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  kartAktiviteleriListeleSemasi,
  projeAktiviteleriListeleSemasi,
} from "./schemas";
import {
  kartAktiviteleriniListele,
  projeAktiviteleriniListele,
} from "./services";

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

export const projeAktiviteleriEylem = eylem({
  ad: "proje:aktiviteleri",
  girdi: projeAktiviteleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    // Resource-level RBAC (Kural 146) — projeye okuma izni zorunlu.
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    return projeAktiviteleriniListele(birimIdAl(ctx), girdi);
  },
});
