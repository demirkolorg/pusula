"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import {
  bildirimKartaGoreOkuduSemasi,
  bildirimleriListeleSemasi,
  bildirimOkuduIsaretleSemasi,
  tumunuOkuduIsaretleSemasi,
} from "./schemas";
import {
  bildirimleriKartaGoreOkuduIsaretle,
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

export const bildirimKartaGoreOkuduIsaretleEylem = eylem({
  ad: "bildirim:karta-gore-okudu-isaretle",
  girdi: bildirimKartaGoreOkuduSemasi,
  calistir: async (girdi, ctx) => {
    return bildirimleriKartaGoreOkuduIsaretle(
      kullaniciIdAl(ctx),
      girdi.kart_id,
    );
  },
});
