"use server";

import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { bildirimTercihGuncelleSemasi } from "./schemas";
import { tercihGuncelle, tercihleriListele } from "./services";

function kullaniciIdAl(ctx: {
  oturum: { kullaniciId?: string } | null;
}): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

// Tercih sayfası kullanıcının kendi tercihlerini yönetir — RBAC izin
// kontrolü yok, sadece auth (kendi kaydı zaten resource-level izolasyon).

export const bildirimTercihleriniListeleEylem = eylem({
  ad: "bildirim-tercih:listele",
  girdi: z.object({}).optional(),
  calistir: async (_girdi, ctx) => {
    return tercihleriListele(kullaniciIdAl(ctx));
  },
});

export const bildirimTercihGuncelleEylem = eylem({
  ad: "bildirim-tercih:guncelle",
  girdi: bildirimTercihGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    return tercihGuncelle(kullaniciIdAl(ctx), girdi);
  },
});
