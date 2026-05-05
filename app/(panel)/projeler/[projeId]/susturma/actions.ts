"use server";

import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yetkiZorunluKart } from "@/lib/yetki";
import {
  kartSustur,
  kartSusturmayiKaldir,
  kartSusturuluyorMu,
} from "@/lib/bildirim-susturma";

const kartSusturmaSemasi = z.object({
  kart_id: z.string().uuid(),
});

const kartSusturmaToggleSemasi = z.object({
  kart_id: z.string().uuid(),
  sustur: z.boolean(),
});

function kullaniciIdAl(ctx: {
  oturum: { kullaniciId?: string } | null;
}): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

export const kartSusturmaDurumuEylem = eylem({
  ad: "kart-susturma:durum",
  girdi: kartSusturmaSemasi,
  calistir: async (girdi, ctx) => {
    // Kullanıcının kartı görme yetkisi olmadan susturma da anlamlı değil.
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    const susturuluyor = await kartSusturuluyorMu(
      kullaniciIdAl(ctx),
      girdi.kart_id,
    );
    return { susturuluyor };
  },
});

export const kartSusturmaToggleEylem = eylem({
  ad: "kart-susturma:toggle",
  girdi: kartSusturmaToggleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    const kullaniciId = kullaniciIdAl(ctx);
    if (girdi.sustur) {
      await kartSustur(kullaniciId, girdi.kart_id);
    } else {
      await kartSusturmayiKaldir(kullaniciId, girdi.kart_id);
    }
    return { kart_id: girdi.kart_id, susturuluyor: girdi.sustur };
  },
});
