"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { superAdminMi } from "@/lib/permissions";
import { aramaBigIntIdleri } from "@/lib/arama";
import { kaynakEtiketleriOlustur } from "@/lib/audit-kaynak-etiket";
import { aktiviteAnlati, zenginlestirVeOzetle } from "@/lib/aktivite";
import { HATA_KODU } from "@/lib/sonuc";
import { denetimListeSemasi } from "./schemas";

export type DenetimSatiri = {
  id: string;
  zaman: Date;
  islem: string;
  kaynak_tip: string;
  kaynak_id: string | null;
  kaynak_etiket: string | null;
  kullanici_id: string | null;
  kullanici_ad: string | null;
  ip: string | null;
  http_yol: string | null;
  http_metod: string | null;
  request_id: string | null;
  sebep: string | null;
  oturum_id: string | null;
  user_agent: string | null;
  anlati: string | null;
  diff: unknown;
  eski_veri: unknown;
  yeni_veri: unknown;
  meta: unknown;
};

async function superAdminZorunlu(kullaniciId: string | null | undefined): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await superAdminMi(kullaniciId))) {
    throw new EylemHatasi(
      "Bu sayfa yalnızca süper yöneticiler içindir.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}

export const denetimListele = eylem({
  ad: "denetim:liste",
  girdi: denetimListeSemasi,
  calistir: async (girdi, ctx) => {
    await superAdminZorunlu(ctx.oturum?.kullaniciId);

    const where: Prisma.AktiviteLoguWhereInput = {};
    if (girdi.islem) where.islem = girdi.islem;
    if (girdi.kaynak_tip) where.kaynak_tip = girdi.kaynak_tip;
    if (girdi.kullanici_id) where.kullanici_id = girdi.kullanici_id;
    if (girdi.baslangic || girdi.bitis) {
      where.zaman = {};
      if (girdi.baslangic) where.zaman.gte = new Date(girdi.baslangic);
      if (girdi.bitis) where.zaman.lte = new Date(girdi.bitis);
    }
    if (girdi.arama) {
      const idler = await aramaBigIntIdleri({
        tablo: "aktivite_logu",
        sutunlar: ["kaynak_id", "kaynak_tip", "http_yol", "request_id"],
        arama: girdi.arama,
      });
      if (idler !== null) {
        if (idler.length === 0) return { kayitlar: [], toplam: 0 };
        where.id = { in: idler };
      }
    }

    const [toplam, satirlar] = await db.$transaction([
      db.aktiviteLogu.count({ where }),
      db.aktiviteLogu.findMany({
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
            select: { id: true, ad: true, soyad: true, email: true },
          })
        : [];
    const kullaniciMap = new Map(
      kullanicilar.map((k) => [k.id, `${k.ad} ${k.soyad}`]),
    );
    const kaynakEtiketleri = await kaynakEtiketleriOlustur(satirlar);
    const ozetler = await zenginlestirVeOzetle(satirlar);
    const anlatiMap = new Map(
      ozetler.map((ozet) => [ozet.id, aktiviteAnlati(ozet).metin]),
    );

    const kayitlar: DenetimSatiri[] = satirlar.map((s, index) => ({
      id: s.id.toString(),
      zaman: s.zaman,
      islem: s.islem,
      kaynak_tip: s.kaynak_tip,
      kaynak_id: s.kaynak_id,
      kaynak_etiket: kaynakEtiketleri[index] ?? null,
      kullanici_id: s.kullanici_id,
      kullanici_ad: s.kullanici_id
        ? (kullaniciMap.get(s.kullanici_id) ?? null)
        : null,
      ip: s.ip,
      http_yol: s.http_yol,
      http_metod: s.http_metod,
      request_id: s.request_id,
      sebep: s.sebep,
      oturum_id: s.oturum_id,
      user_agent: s.user_agent,
      anlati: anlatiMap.get(s.id.toString()) ?? null,
      diff: s.diff,
      eski_veri: s.eski_veri,
      yeni_veri: s.yeni_veri,
      meta: s.meta,
    }));

    return { kayitlar, toplam };
  },
});

export const kaynakTipleriniGetir = eylem({
  ad: "denetim:kaynak-tipleri",
  calistir: async (_g, ctx) => {
    await superAdminZorunlu(ctx.oturum?.kullaniciId);
    const tipler = await db.aktiviteLogu.findMany({
      distinct: ["kaynak_tip"],
      select: { kaynak_tip: true },
      orderBy: { kaynak_tip: "asc" },
      take: 100,
    });
    return tipler.map((t) => t.kaynak_tip);
  },
});
