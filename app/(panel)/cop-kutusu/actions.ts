"use server";

// Çöp Kutusu Server Actions (ADR-0018).
// Kontrol Kural 48 (server action), 49 (Zod), 50 (RBAC), 53 (try/catch wrapper).

import { eylem } from "@/lib/action-wrapper";
import {
  copGeriYukleSemasi,
  copKaliciSilSemasi,
  copKutusuListeleSemasi,
} from "./schemas";
import { copGeriYukle, copKaliciSil, copKutusuListele } from "./services";

export const copKutusuListeleEylem = eylem({
  ad: "cop-kutusu:listele",
  girdi: copKutusuListeleSemasi,
  calistir: async (girdi, ctx) => {
    return copKutusuListele(ctx.oturum!.kullaniciId, girdi);
  },
});

export const copGeriYukleEylem = eylem({
  ad: "cop-kutusu:geri-yukle",
  girdi: copGeriYukleSemasi,
  calistir: async (girdi, ctx) => {
    return copGeriYukle(ctx.oturum!.kullaniciId, girdi);
  },
});

export const copKaliciSilEylem = eylem({
  ad: "cop-kutusu:kalici-sil",
  girdi: copKaliciSilSemasi,
  calistir: async (girdi, ctx) => {
    return copKaliciSil(ctx.oturum!.kullaniciId, girdi);
  },
});
