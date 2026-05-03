"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { HATA_KODU } from "@/lib/sonuc";
import { aramaBigIntIdleri } from "@/lib/arama";
import { hataCozumSemasi, hataListeSemasi } from "./schemas";

export type HataSatiri = {
  id: string;
  zaman: Date;
  seviye: string;
  taraf: string;
  hata_tipi: string | null;
  mesaj: string;
  url: string | null;
  http_metod: string | null;
  http_durum: number | null;
  request_id: string | null;
  ip: string | null;
  user_agent: string | null;
  kullanici_id: string | null;
  kullanici_ad: string | null;
  stack: string | null;
  istek_govdesi: unknown;
  istek_basliklari: unknown;
  ekstra: unknown;
  cozuldu_mu: boolean;
  cozum_notu: string | null;
};

export const hataListele = eylem({
  ad: "hata-logu:liste",
  girdi: hataListeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.HATA_LOGU_OKU);

    const where: Prisma.HataLoguWhereInput = {};
    if (girdi.seviye) where.seviye = girdi.seviye;
    if (girdi.taraf) where.taraf = girdi.taraf;
    if (girdi.cozuldu_mu !== undefined) where.cozuldu_mu = girdi.cozuldu_mu;
    if (girdi.arama) {
      const idler = await aramaBigIntIdleri({
        tablo: "hata_logu",
        sutunlar: ["mesaj", "hata_tipi", "url", "request_id"],
        arama: girdi.arama,
      });
      if (idler !== null) {
        if (idler.length === 0) return { kayitlar: [], toplam: 0 };
        where.id = { in: idler };
      }
    }

    const [toplam, satirlar] = await db.$transaction([
      db.hataLogu.count({ where }),
      db.hataLogu.findMany({
        where,
        orderBy: { zaman: "desc" },
        skip: (girdi.sayfa - 1) * girdi.sayfaBoyutu,
        take: girdi.sayfaBoyutu,
      }),
    ]);

    const kullaniciIdleri = Array.from(
      new Set(
        satirlar
          .map((s) => s.kullanici_id)
          .filter((v): v is string => !!v),
      ),
    );
    const kullanicilar =
      kullaniciIdleri.length > 0
        ? await db.kullanici.findMany({
            where: { id: { in: kullaniciIdleri } },
            select: { id: true, ad: true, soyad: true },
          })
        : [];
    const kullaniciMap = new Map(
      kullanicilar.map((k) => [k.id, `${k.ad} ${k.soyad}`]),
    );

    const kayitlar: HataSatiri[] = satirlar.map((s) => ({
      id: s.id.toString(),
      zaman: s.zaman,
      seviye: s.seviye,
      taraf: s.taraf,
      hata_tipi: s.hata_tipi,
      mesaj: s.mesaj,
      url: s.url,
      http_metod: s.http_metod,
      http_durum: s.http_durum,
      request_id: s.request_id,
      ip: s.ip,
      user_agent: s.user_agent,
      kullanici_id: s.kullanici_id,
      kullanici_ad: s.kullanici_id
        ? (kullaniciMap.get(s.kullanici_id) ?? null)
        : null,
      stack: s.stack,
      istek_govdesi: s.istek_govdesi,
      istek_basliklari: s.istek_basliklari,
      ekstra: s.ekstra,
      cozuldu_mu: s.cozuldu_mu,
      cozum_notu: s.cozum_notu,
    }));

    return { kayitlar, toplam };
  },
});

export const hataCozumIsaretle = eylem({
  ad: "hata-logu:cozum",
  girdi: hataCozumSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.HATA_LOGU_OKU);
    const idBig = BigInt(girdi.id);
    if (Number.isNaN(Number(idBig))) {
      throw new EylemHatasi("Geçersiz kayıt.", HATA_KODU.GECERSIZ_GIRDI);
    }
    await db.hataLogu.update({
      where: { id: idBig },
      data: {
        cozuldu_mu: true,
        cozum_notu: girdi.cozum_notu?.trim() || null,
      },
    });
    revalidatePath("/ayarlar/hata-loglari");
    return { id: girdi.id };
  },
});
