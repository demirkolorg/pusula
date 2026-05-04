import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { aramaUuidIdleri } from "@/lib/arama";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import type {
  ProjeArsiv,
  ProjeGuncelle,
  ProjeListe,
  ProjeOlustur,
  ProjeSira,
} from "./schemas";

export type ProjeKart = {
  id: string;
  ad: string;
  aciklama: string | null;
  kapak_renk: string | null;
  yildizli_mi: boolean;
  arsiv_mi: boolean;
  silindi_mi: boolean;
  sira: string;
  uye_sayisi: number;
  liste_sayisi: number;
  olusturma_zamani: Date;
};

function filtreWhere(girdi: ProjeListe): Prisma.ProjeWhereInput {
  const where: Prisma.ProjeWhereInput = {};
  switch (girdi.filtre) {
    case "yildizli":
      where.yildizli_mi = true;
      where.silindi_mi = false;
      break;
    case "arsiv":
      where.arsiv_mi = true;
      where.silindi_mi = false;
      break;
    case "silinmis":
      where.silindi_mi = true;
      break;
    case "aktif":
    default:
      where.silindi_mi = false;
      where.arsiv_mi = false;
      break;
  }
  return where;
}

async function projeListeWhere(
  kullaniciId: string,
  girdi: ProjeListe,
): Promise<Prisma.ProjeWhereInput> {
  const where = filtreWhere(girdi);
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (erisim.makam) return where;

  const birimKosulu = erisim.birimId
    ? { birim_id: erisim.birimId }
    : { birim_id: { in: [] } };
  const erisimKosullari: Prisma.ProjeWhereInput[] = [
    { uyeler: { some: { kullanici_id: kullaniciId } } },
    { birimler: { some: birimKosulu } },
    {
      listeler: {
        some: { uyeler: { some: { kullanici_id: kullaniciId } } },
      },
    },
    {
      listeler: {
        some: { birimler: { some: birimKosulu } },
      },
    },
    {
      listeler: {
        some: {
          kartlar: {
            some: { uyeler: { some: { kullanici_id: kullaniciId } } },
          },
        },
      },
    },
    {
      listeler: {
        some: { kartlar: { some: { birimler: { some: birimKosulu } } } },
      },
    },
  ];
  where.OR = erisimKosullari;
  return where;
}

export async function projeleriListele(
  kullaniciId: string,
  girdi: ProjeListe,
): Promise<ProjeKart[]> {
  const where = await projeListeWhere(kullaniciId, girdi);
  if (girdi.arama) {
    const idler = await aramaUuidIdleri({
      tablo: "Proje",
      sutunlar: ["ad", "aciklama"],
      arama: girdi.arama,
    });
    if (idler !== null) {
      if (idler.length === 0) return [];
      where.id = { in: idler };
    }
  }

  const kayitlar = await db.proje.findMany({
    where,
    orderBy: [{ sira: "asc" }],
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      yildizli_mi: true,
      arsiv_mi: true,
      silindi_mi: true,
      sira: true,
      olusturma_zamani: true,
      _count: { select: { uyeler: true, listeler: true } },
    },
    take: 200,
  });

  return kayitlar.map((p) => ({
    id: p.id,
    ad: p.ad,
    aciklama: p.aciklama,
    kapak_renk: p.kapak_renk,
    yildizli_mi: p.yildizli_mi,
    arsiv_mi: p.arsiv_mi,
    silindi_mi: p.silindi_mi,
    sira: p.sira,
    uye_sayisi: p._count.uyeler,
    liste_sayisi: p._count.listeler,
    olusturma_zamani: p.olusturma_zamani,
  }));
}

export async function projeOlustur(
  olusturanId: string,
  girdi: ProjeOlustur,
): Promise<ProjeKart> {
  const [son, olusturan] = await Promise.all([
    db.proje.findFirst({
      where: { silindi_mi: false },
      orderBy: { sira: "desc" },
      select: { sira: true },
    }),
    db.kullanici.findUnique({
      where: { id: olusturanId },
      select: { birim_id: true },
    }),
  ]);
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.proje.create({
    data: {
      ad: girdi.ad.trim(),
      aciklama: girdi.aciklama?.trim() || null,
      kapak_renk: girdi.kapak_renk || null,
      sira,
      olusturan_id: olusturanId,
      uyeler: {
        create: { kullanici_id: olusturanId, seviye: "ADMIN" },
      },
      birimler: olusturan?.birim_id
        ? { create: { birim_id: olusturan.birim_id } }
        : undefined,
    },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      yildizli_mi: true,
      arsiv_mi: true,
      silindi_mi: true,
      sira: true,
      olusturma_zamani: true,
    },
  });

  return {
    ...yeni,
    uye_sayisi: 1,
    liste_sayisi: 0,
  };
}

async function projeyiBul(id: string): Promise<void> {
  const p = await db.proje.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!p) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }
}

export async function projeGuncelle(girdi: ProjeGuncelle): Promise<void> {
  await projeyiBul(girdi.id);
  const veri: Prisma.ProjeUpdateInput = {};
  if (girdi.ad !== undefined) veri.ad = girdi.ad.trim();
  if (girdi.aciklama !== undefined) veri.aciklama = girdi.aciklama?.trim() || null;
  if (girdi.kapak_renk !== undefined) veri.kapak_renk = girdi.kapak_renk || null;
  if (girdi.yildizli_mi !== undefined) veri.yildizli_mi = girdi.yildizli_mi;
  await db.proje.update({ where: { id: girdi.id }, data: veri });
}

export async function projeArsivle(girdi: ProjeArsiv): Promise<void> {
  await projeyiBul(girdi.id);
  await db.proje.update({
    where: { id: girdi.id },
    data: {
      arsiv_mi: girdi.arsiv_mi,
      arsiv_zamani: girdi.arsiv_mi ? new Date() : null,
    },
  });
}

export async function projeSil(id: string): Promise<void> {
  await projeyiBul(id);
  await db.proje.update({
    where: { id },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
}

export async function projeGeriYukle(id: string): Promise<void> {
  await projeyiBul(id);
  await db.proje.update({
    where: { id },
    data: { silindi_mi: false, silinme_zamani: null },
  });
}

async function projeleriRebalance(): Promise<void> {
  const projeler = await db.proje.findMany({
    where: { silindi_mi: false },
    orderBy: { sira: "asc" },
    select: { id: true },
  });
  if (projeler.length === 0) return;

  const yeniSiralar: string[] = [];
  let son: string | null = null;
  for (let i = 0; i < projeler.length; i++) {
    const yeni = siraSonuna(son);
    yeniSiralar.push(yeni);
    son = yeni;
  }

  await db.$transaction(
    projeler.map((p, i) =>
      db.proje.update({ where: { id: p.id }, data: { sira: yeniSiralar[i] } }),
    ),
  );
}

export async function projeyeSiraVer(
  girdi: ProjeSira,
): Promise<{ sira: string }> {
  await projeyiBul(girdi.id);

  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.proje.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true },
          })
        : null,
      girdi.sonraki_id
        ? db.proje.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true },
          })
        : null,
    ]);
    return { onceki, sonraki };
  }

  let { onceki, sonraki } = await komsulariOku();
  let yeniSira: string;
  try {
    yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
  } catch (err) {
    if (err instanceof Error && err.message.includes("alfabe tabanı")) {
      await projeleriRebalance();
      const yeni = await komsulariOku();
      onceki = yeni.onceki;
      sonraki = yeni.sonraki;
      yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
    } else {
      throw err;
    }
  }

  await db.proje.update({
    where: { id: girdi.id },
    data: { sira: yeniSira },
  });
  return { sira: yeniSira };
}
