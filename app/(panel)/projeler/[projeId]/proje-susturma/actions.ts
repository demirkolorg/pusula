"use server";

import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yetkiZorunluProje } from "@/lib/yetki";
import {
  projeSustur,
  projeSusturmayiKaldir,
  projeSusturuluyorMu,
} from "@/lib/bildirim-susturma";

const projeSusturmaSemasi = z.object({
  proje_id: z.string().uuid(),
});

const projeSusturmaToggleSemasi = z.object({
  proje_id: z.string().uuid(),
  sustur: z.boolean(),
});

function kullaniciIdAl(ctx: {
  oturum: { kullaniciId?: string } | null;
}): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

export const projeSusturmaDurumuEylem = eylem({
  ad: "proje-susturma:durum",
  girdi: projeSusturmaSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    const susturuluyor = await projeSusturuluyorMu(
      kullaniciIdAl(ctx),
      girdi.proje_id,
    );
    return { susturuluyor };
  },
});

export const projeSusturmaToggleEylem = eylem({
  ad: "proje-susturma:toggle",
  girdi: projeSusturmaToggleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    const kullaniciId = kullaniciIdAl(ctx);
    if (girdi.sustur) {
      await projeSustur(kullaniciId, girdi.proje_id);
    } else {
      await projeSusturmayiKaldir(kullaniciId, girdi.proje_id);
    }
    return { proje_id: girdi.proje_id, susturuluyor: girdi.sustur };
  },
});
