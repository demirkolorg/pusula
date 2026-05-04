"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import {
  bildirimleriListeleSemasi,
  bildirimOkuduIsaretleSemasi,
  tumunuOkuduIsaretleSemasi,
} from "./schemas";
import {
  bildirimleriListele,
  bildirimOkuduIsaretle as bildirimOkuduIsaretleSrv,
  okunmamisSayisi,
  tumunuOkuduIsaretle as tumunuOkuduIsaretleSrv,
} from "./services";

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

export const bildirimleriListeleEylem = eylem({
  ad: "bildirim:listele",
  girdi: bildirimleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    return bildirimleriListele(kullaniciIdAl(ctx), girdi);
  },
});

export const okunmamisSayisiEylem = eylem({
  ad: "bildirim:okunmamis-sayi",
  girdi: tumunuOkuduIsaretleSemasi,
  calistir: async (_girdi, ctx) => {
    return { sayi: await okunmamisSayisi(kullaniciIdAl(ctx)) };
  },
});

export const bildirimOkuduIsaretleEylem = eylem({
  ad: "bildirim:okudu-isaretle",
  girdi: bildirimOkuduIsaretleSemasi,
  calistir: async (girdi, ctx) => {
    await bildirimOkuduIsaretleSrv(kullaniciIdAl(ctx), girdi);
    return { ids: girdi.ids };
  },
});

export const tumunuOkuduIsaretleEylem = eylem({
  ad: "bildirim:tumunu-okudu-isaretle",
  girdi: tumunuOkuduIsaretleSemasi,
  calistir: async (_girdi, ctx) => {
    await tumunuOkuduIsaretleSrv(kullaniciIdAl(ctx));
    return { sayi: 0 };
  },
});
