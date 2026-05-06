import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { aramaBigIntIdleri } from "@/lib/arama";
import { aktiviteAkisiGorunurKaynakWhere } from "@/lib/aktivite/gizli-kaynaklar";
import {
  aktiviteAnlati,
  kapsamBaglamiHazirla,
  kapsamWhere,
  zenginlestirVeOzetle,
  type AktiviteOzeti,
  type AnlatiCumlesi,
} from "@/lib/aktivite";
import {
  aktiviteGunluguFiltreSemasi,
  type AktiviteGunluguFiltre,
} from "./schemas";

export type AktiviteGunluguSatiri = AktiviteOzeti & {
  kaynak_tip: string;
  sebep: string | null;
  anlati: AnlatiCumlesi;
};

export type AktiviteGunluguSayfasi = {
  kayitlar: AktiviteGunluguSatiri[];
  sonrakiCursor: string | null;
};

type HamSatir = {
  id: bigint;
  zaman: Date;
  kullanici_id: string | null;
  islem: string;
  kaynak_tip: string;
  kaynak_id: string | null;
  yeni_veri: unknown;
  eski_veri: unknown;
  diff: unknown;
  sebep: string | null;
};

function tarihKosulu(girdi: AktiviteGunluguFiltre): Prisma.AktiviteLoguWhereInput | null {
  if (!girdi.baslangic && !girdi.bitis) return null;
  const zaman: Prisma.DateTimeFilter<"AktiviteLogu"> = {};
  if (girdi.baslangic) zaman.gte = new Date(girdi.baslangic);
  if (girdi.bitis) zaman.lte = new Date(girdi.bitis);
  return { zaman };
}

async function aramaKosulu(
  arama: string | undefined,
): Promise<Prisma.AktiviteLoguWhereInput | null> {
  if (!arama) return null;
  const idler = await aramaBigIntIdleri({
    tablo: "aktivite_logu",
    sutunlar: ["kaynak_id", "kaynak_tip", "http_yol", "request_id", "sebep"],
    arama,
  });
  if (idler === null) return null;
  if (idler.length === 0) return { id: { in: [] } };
  return { id: { in: idler } };
}

function temizKosullar(
  kosullar: Array<Prisma.AktiviteLoguWhereInput | null>,
): Prisma.AktiviteLoguWhereInput[] {
  return kosullar.filter(
    (kosul): kosul is Prisma.AktiviteLoguWhereInput =>
      kosul !== null && Object.keys(kosul).length > 0,
  );
}

function satirlariBirlestir(
  ham: HamSatir[],
  ozetler: AktiviteOzeti[],
): AktiviteGunluguSatiri[] {
  return ozetler.flatMap((ozet, index) => {
    const satir = ham[index];
    if (!satir) return [];
    return [
      {
        ...ozet,
        kaynak_tip: satir.kaynak_tip,
        sebep: satir.sebep,
        anlati: aktiviteAnlati(ozet),
      },
    ];
  });
}

export async function aktiviteGunluguListele(
  kullaniciId: string,
  girdi: AktiviteGunluguFiltre,
): Promise<AktiviteGunluguSayfasi> {
  const filtre = aktiviteGunluguFiltreSemasi.parse(girdi);
  const baglam = await kapsamBaglamiHazirla(kullaniciId);
  const arama = await aramaKosulu(filtre.arama);
  if (arama && "id" in arama) {
    const idKosulu = arama.id;
    if (
      idKosulu &&
      typeof idKosulu === "object" &&
      "in" in idKosulu &&
      Array.isArray(idKosulu.in) &&
      idKosulu.in.length === 0
    ) {
      return { kayitlar: [], sonrakiCursor: null };
    }
  }

  const kosullar = temizKosullar([
    kapsamWhere(baglam),
    aktiviteAkisiGorunurKaynakWhere(),
    filtre.cursor ? { id: { lt: BigInt(filtre.cursor) } } : null,
    filtre.kapsam === "benim" ? { kullanici_id: kullaniciId } : null,
    filtre.islem ? { islem: filtre.islem } : null,
    filtre.kaynak_tip ? { kaynak_tip: filtre.kaynak_tip } : null,
    tarihKosulu(filtre),
    arama,
  ]);

  const where: Prisma.AktiviteLoguWhereInput =
    kosullar.length > 0 ? { AND: kosullar } : {};

  const ham = await db.aktiviteLogu.findMany({
    where,
    orderBy: { id: "desc" },
    take: filtre.limit + 1,
    select: {
      id: true,
      zaman: true,
      kullanici_id: true,
      islem: true,
      kaynak_tip: true,
      kaynak_id: true,
      yeni_veri: true,
      eski_veri: true,
      diff: true,
      sebep: true,
    },
  });

  const gorunen = ham.slice(0, filtre.limit);
  const ozetler = await zenginlestirVeOzetle(gorunen);
  const sonSatir = gorunen[gorunen.length - 1];
  return {
    kayitlar: satirlariBirlestir(gorunen, ozetler),
    sonrakiCursor:
      ham.length > filtre.limit && sonSatir ? sonSatir.id.toString() : null,
  };
}

export async function aktiviteKaynakTipleriGetir(
  kullaniciId: string,
): Promise<string[]> {
  const baglam = await kapsamBaglamiHazirla(kullaniciId);
  const tipler = await db.aktiviteLogu.findMany({
    where: { AND: [kapsamWhere(baglam), aktiviteAkisiGorunurKaynakWhere()] },
    distinct: ["kaynak_tip"],
    select: { kaynak_tip: true },
    orderBy: { kaynak_tip: "asc" },
    take: 100,
  });
  return tipler.map((t) => t.kaynak_tip);
}
