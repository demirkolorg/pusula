import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { aramaBigIntIdleri } from "@/lib/arama";
import { aktiviteAkisiGorunurKaynakWhere } from "@/lib/aktivite/gizli-kaynaklar";
import {
  aktiviteAnlati,
  kapsamBaglamiHazirla,
  kapsamWhere,
  kaynakBaglamiWhere,
  zenginlestirVeOzetle,
  type AktiviteKapsamFiltresi,
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

export type AktiviteBaglamSecenekleri = {
  projeler: Array<{ id: string; ad: string }>;
  listeler: Array<{ id: string; ad: string; proje_id: string }>;
  kartlar: Array<{
    id: string;
    baslik: string;
    liste_id: string;
    proje_id: string;
  }>;
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

type KartSecenekHam = {
  id: string;
  baslik: string;
  liste_id: string;
  liste: { proje_id: string };
};

function secenekWhereOlustur(baglam: AktiviteKapsamFiltresi): {
  projeWhere: Prisma.ProjeWhereInput;
  listeWhere: Prisma.ListeWhereInput;
  kartWhere: Prisma.KartWhereInput;
} {
  if (baglam.makam) {
    return {
      projeWhere: { silindi_mi: false },
      listeWhere: { proje: { silindi_mi: false } },
      kartWhere: { silindi_mi: false, liste: { proje: { silindi_mi: false } } },
    };
  }

  return {
    projeWhere: { id: { in: baglam.projeIdleri ?? [] }, silindi_mi: false },
    listeWhere: {
      id: { in: baglam.listeIdleri ?? [] },
      proje: { silindi_mi: false },
    },
    kartWhere: {
      id: { in: baglam.kartIdleri ?? [] },
      silindi_mi: false,
      liste: { proje: { silindi_mi: false } },
    },
  };
}

function kartSecenekleriDonustur(
  kartlar: KartSecenekHam[],
): AktiviteBaglamSecenekleri["kartlar"] {
  return kartlar.map((k) => ({
    id: k.id,
    baslik: k.baslik,
    liste_id: k.liste_id,
    proje_id: k.liste.proje_id,
  }));
}

async function kontrolListesiIdleriGetir(
  kartIdleri: readonly string[],
): Promise<string[]> {
  if (kartIdleri.length === 0) return [];
  const kayitlar = await db.kontrolListesi.findMany({
    where: { kart_id: { in: [...kartIdleri] } },
    select: { id: true },
  });
  return kayitlar.map((k) => k.id);
}

async function seciliBaglamKosulu(
  filtre: AktiviteGunluguFiltre,
): Promise<Prisma.AktiviteLoguWhereInput | null> {
  if (filtre.kart_id) {
    return kaynakBaglamiWhere({
      kartIdleri: [filtre.kart_id],
      kontrolListesiIdleri: await kontrolListesiIdleriGetir([filtre.kart_id]),
    });
  }

  if (filtre.liste_id) {
    const kartlar = await db.kart.findMany({
      where: { liste_id: filtre.liste_id },
      select: { id: true },
    });
    const kartIdleri = kartlar.map((k) => k.id);
    return kaynakBaglamiWhere({
      listeIdleri: [filtre.liste_id],
      kartIdleri,
      kontrolListesiIdleri: await kontrolListesiIdleriGetir(kartIdleri),
    });
  }

  if (filtre.proje_id) {
    const listeler = await db.liste.findMany({
      where: { proje_id: filtre.proje_id },
      select: { id: true },
    });
    const listeIdleri = listeler.map((l) => l.id);
    const kartlar =
      listeIdleri.length > 0
        ? await db.kart.findMany({
            where: { liste_id: { in: listeIdleri } },
            select: { id: true },
          })
        : [];
    const kartIdleri = kartlar.map((k) => k.id);
    return kaynakBaglamiWhere({
      projeIdleri: [filtre.proje_id],
      listeIdleri,
      kartIdleri,
      kontrolListesiIdleri: await kontrolListesiIdleriGetir(kartIdleri),
    });
  }

  return null;
}

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
  const seciliBaglam = await seciliBaglamKosulu(filtre);
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
    seciliBaglam,
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

export async function aktiviteBaglamSecenekleriGetir(
  kullaniciId: string,
): Promise<AktiviteBaglamSecenekleri> {
  const baglam = await kapsamBaglamiHazirla(kullaniciId);
  const { projeWhere, listeWhere, kartWhere } = secenekWhereOlustur(baglam);

  const [projeler, listeler, kartlar] = await Promise.all([
    db.proje.findMany({
      where: projeWhere,
      orderBy: { ad: "asc" },
      select: { id: true, ad: true },
      take: 300,
    }),
    db.liste.findMany({
      where: listeWhere,
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, proje_id: true },
      take: 500,
    }),
    db.kart.findMany({
      where: kartWhere,
      orderBy: { baslik: "asc" },
      select: {
        id: true,
        baslik: true,
        liste_id: true,
        liste: { select: { proje_id: true } },
      },
      take: 700,
    }),
  ]);

  return {
    projeler,
    listeler,
    kartlar: kartSecenekleriDonustur(kartlar),
  };
}
