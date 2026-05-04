"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  yorumGuncelleSemasi,
  yorumlariListeleSemasi,
  yorumOlusturSemasi,
  yorumSilSemasi,
} from "./schemas";
import {
  kartYorumlariniListele,
  yorumGuncelle as yorumGuncelleSrv,
  yorumOlustur as yorumOlusturSrv,
  yorumSil as yorumSilSrv,
} from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

export const yorumlariListeleEylem = eylem({
  ad: "yorum:listele",
  girdi: yorumlariListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartYorumlariniListele(birimIdAl(ctx), girdi.kart_id);
  },
});

export const yorumOlusturEylem = eylem({
  ad: "yorum:olustur",
  girdi: yorumOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    return yorumOlusturSrv(birimIdAl(ctx), kullaniciIdAl(ctx), girdi);
  },
});

export const yorumGuncelleEylem = eylem({
  ad: "yorum:guncelle",
  girdi: yorumGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yorumGuncelleSrv(birimIdAl(ctx), kullaniciIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const yorumSilEylem = eylem({
  ad: "yorum:sil",
  girdi: yorumSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yorumSilSrv(birimIdAl(ctx), kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});
