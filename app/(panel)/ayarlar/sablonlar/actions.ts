"use server";

// Proje Şablonları Server Actions (ADR-0021).
// Kontrol Kural 48 (server action), 49 (Zod), 50 (RBAC), 53 (try/catch wrapper).

import { eylem } from "@/lib/action-wrapper";
import {
  sablonGuncelleSemasi,
  sablonOlusturSemasi,
  sablonSilSemasi,
} from "./schemas";
import {
  sablonGuncelle,
  sablonlariListele,
  sablonOlustur,
  sablonSil,
} from "./services";

export const sablonlariListeleEylem = eylem({
  ad: "sablon:listele",
  calistir: async (_girdi, ctx) => {
    return sablonlariListele(ctx.oturum!.kullaniciId);
  },
});

export const sablonOlusturEylem = eylem({
  ad: "sablon:olustur",
  girdi: sablonOlusturSemasi,
  calistir: async (girdi, ctx) => {
    return sablonOlustur(ctx.oturum!.kullaniciId, girdi);
  },
});

export const sablonGuncelleEylem = eylem({
  ad: "sablon:guncelle",
  girdi: sablonGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    return sablonGuncelle(ctx.oturum!.kullaniciId, girdi);
  },
});

export const sablonSilEylem = eylem({
  ad: "sablon:sil",
  girdi: sablonSilSemasi,
  calistir: async (girdi, ctx) => {
    return sablonSil(ctx.oturum!.kullaniciId, girdi);
  },
});
