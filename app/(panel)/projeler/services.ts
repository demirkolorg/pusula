import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { aramaUuidIdleri } from "@/lib/arama";
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

function whereYap(kurumId: string, girdi: ProjeListe): Prisma.ProjeWhereInput {
  const taban: Prisma.ProjeWhereInput = { kurum_id: kurumId };
  switch (girdi.filtre) {
    case "yildizli":
      taban.yildizli_mi = true;
      taban.silindi_mi = false;
      break;
    case "arsiv":
      taban.arsiv_mi = true;
      taban.silindi_mi = false;
      break;
    case "silinmis":
      taban.silindi_mi = true;
      break;
    case "aktif":
    default:
      taban.silindi_mi = false;
      taban.arsiv_mi = false;
      break;
  }
  return taban;
}

export async function projeleriListele(
  kurumId: string,
  girdi: ProjeListe,
): Promise<ProjeKart[]> {
  const where = whereYap(kurumId, girdi);
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
  kurumId: string,
  olusturanId: string,
  girdi: ProjeOlustur,
): Promise<ProjeKart> {
  // Sonraki sıra: en sondaki proje + bir adım.
  const son = await db.proje.findFirst({
    where: { kurum_id: kurumId, silindi_mi: false },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.proje.create({
    data: {
      kurum_id: kurumId,
      ad: girdi.ad.trim(),
      aciklama: girdi.aciklama?.trim() || null,
      kapak_renk: girdi.kapak_renk || null,
      sira,
      olusturan_id: olusturanId,
      uyeler: {
        create: { kullanici_id: olusturanId, seviye: "ADMIN" },
      },
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

async function projeyiBulVeKurumDogrula(
  kurumId: string,
  id: string,
): Promise<void> {
  const p = await db.proje.findUnique({
    where: { id },
    select: { kurum_id: true },
  });
  if (!p || p.kurum_id !== kurumId) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }
}

export async function projeGuncelle(
  kurumId: string,
  girdi: ProjeGuncelle,
): Promise<void> {
  await projeyiBulVeKurumDogrula(kurumId, girdi.id);
  const veri: Prisma.ProjeUpdateInput = {};
  if (girdi.ad !== undefined) veri.ad = girdi.ad.trim();
  if (girdi.aciklama !== undefined) veri.aciklama = girdi.aciklama?.trim() || null;
  if (girdi.kapak_renk !== undefined) veri.kapak_renk = girdi.kapak_renk || null;
  if (girdi.yildizli_mi !== undefined) veri.yildizli_mi = girdi.yildizli_mi;
  await db.proje.update({ where: { id: girdi.id }, data: veri });
}

export async function projeArsivle(
  kurumId: string,
  girdi: ProjeArsiv,
): Promise<void> {
  await projeyiBulVeKurumDogrula(kurumId, girdi.id);
  await db.proje.update({
    where: { id: girdi.id },
    data: {
      arsiv_mi: girdi.arsiv_mi,
      arsiv_zamani: girdi.arsiv_mi ? new Date() : null,
    },
  });
}

export async function projeSil(kurumId: string, id: string): Promise<void> {
  await projeyiBulVeKurumDogrula(kurumId, id);
  await db.proje.update({
    where: { id },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
}

export async function projeGeriYukle(kurumId: string, id: string): Promise<void> {
  await projeyiBulVeKurumDogrula(kurumId, id);
  await db.proje.update({
    where: { id },
    data: { silindi_mi: false, silinme_zamani: null },
  });
}

async function kurumProjeleriniRebalance(kurumId: string): Promise<void> {
  const projeler = await db.proje.findMany({
    where: { kurum_id: kurumId, silindi_mi: false },
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
  kurumId: string,
  girdi: ProjeSira,
): Promise<{ sira: string }> {
  await projeyiBulVeKurumDogrula(kurumId, girdi.id);

  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.proje.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true, kurum_id: true },
          })
        : null,
      girdi.sonraki_id
        ? db.proje.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true, kurum_id: true },
          })
        : null,
    ]);
    if (onceki && onceki.kurum_id !== kurumId) {
      throw new EylemHatasi("Önceki kayıt bu kurumdan değil.", HATA_KODU.YETKISIZ);
    }
    if (sonraki && sonraki.kurum_id !== kurumId) {
      throw new EylemHatasi("Sonraki kayıt bu kurumdan değil.", HATA_KODU.YETKISIZ);
    }
    return { onceki, sonraki };
  }

  let { onceki, sonraki } = await komsulariOku();

  let yeniSira: string;
  try {
    yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
  } catch (err) {
    if (err instanceof Error && err.message.includes("alfabe tabanı")) {
      await kurumProjeleriniRebalance(kurumId);
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
