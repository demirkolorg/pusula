import { ListeTipi, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { aramaUuidIdleri } from "@/lib/arama";
import { kullaniciErisimBilgisi } from "@/lib/yetki";

// ADR-0009 — Yeni proje yaratıldığında otomatik Arşiv sistem listesi seed.
const ARSIV_LISTESI_SIRA = "ZZZZ";
const ARSIV_LISTESI_AD = "Arşiv";
import type {
  ProjeArsiv,
  ProjeGuncelle,
  ProjeListe,
  ProjeOlustur,
  ProjeSira,
} from "./schemas";

export type ProjeOlusturanOzeti = {
  id: string;
  ad: string;
  soyad: string;
};

export type ProjeKart = {
  id: string;
  ad: string;
  aciklama: string | null;
  kapak_renk: string | null;
  kapak_ikon: string | null;
  yildizli_mi: boolean;
  arsiv_mi: boolean;
  silindi_mi: boolean;
  sira: string;
  yetkili_sayisi: number;
  liste_sayisi: number;
  birim_sayisi: number;
  kart_sayisi: number;
  tamamlanan_kart_sayisi: number;
  madde_sayisi: number;
  tamamlanan_madde_sayisi: number;
  olusturan: ProjeOlusturanOzeti | null;
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
    { yetkililer: { some: { kullanici_id: kullaniciId } } },
    { birimler: { some: birimKosulu } },
    {
      listeler: {
        some: { yetkililer: { some: { kullanici_id: kullaniciId } } },
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
            some: { yetkililer: { some: { kullanici_id: kullaniciId } } },
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
      kapak_ikon: true,
      yildizli_mi: true,
      arsiv_mi: true,
      silindi_mi: true,
      sira: true,
      olusturma_zamani: true,
      olusturan: { select: { id: true, ad: true, soyad: true } },
      _count: {
        select: {
          // Arşiv sistem listesi (ADR-0009) kullanıcıya sayıda görünmesin
          listeler: { where: { tip: ListeTipi.NORMAL } },
        },
      },
    },
    take: 200,
  });

  const projeIdler = kayitlar.map((p) => p.id);
  // Paralel iki aggregate: kart/madde + yetkili (kişi/birim DISTINCT union)
  const [istatistikMap, yetkiliMap] = await Promise.all([
    projeIstatistikleriniGetir(projeIdler),
    projeYetkiliSayilariniGetir(projeIdler),
  ]);

  return kayitlar.map((p) => {
    const ist = istatistikMap.get(p.id) ?? BOS_ISTATISTIK;
    const yet = yetkiliMap.get(p.id) ?? BOS_YETKILI;
    return {
      id: p.id,
      ad: p.ad,
      aciklama: p.aciklama,
      kapak_renk: p.kapak_renk,
      kapak_ikon: p.kapak_ikon,
      yildizli_mi: p.yildizli_mi,
      arsiv_mi: p.arsiv_mi,
      silindi_mi: p.silindi_mi,
      sira: p.sira,
      yetkili_sayisi: yet.kisi_sayisi,
      liste_sayisi: p._count.listeler,
      birim_sayisi: yet.birim_sayisi,
      kart_sayisi: ist.kart_sayisi,
      tamamlanan_kart_sayisi: ist.tamamlanan_kart_sayisi,
      madde_sayisi: ist.madde_sayisi,
      tamamlanan_madde_sayisi: ist.tamamlanan_madde_sayisi,
      olusturan: p.olusturan
        ? { id: p.olusturan.id, ad: p.olusturan.ad, soyad: p.olusturan.soyad }
        : null,
      olusturma_zamani: p.olusturma_zamani,
    };
  });
}

type ProjeIstatistik = {
  kart_sayisi: number;
  tamamlanan_kart_sayisi: number;
  madde_sayisi: number;
  tamamlanan_madde_sayisi: number;
};

const BOS_ISTATISTIK: ProjeIstatistik = {
  kart_sayisi: 0,
  tamamlanan_kart_sayisi: 0,
  madde_sayisi: 0,
  tamamlanan_madde_sayisi: 0,
};

type ProjeYetkili = {
  kisi_sayisi: number;
  birim_sayisi: number;
};

const BOS_YETKILI: ProjeYetkili = {
  kisi_sayisi: 0,
  birim_sayisi: 0,
};

// Tek aggregate raw SQL — N+1'siz toplam/tamamlanan kart ve madde sayıları.
// Why raw: Prisma `groupBy` nested by (Liste.proje_id) desteklemiyor; alternatif
// 4 ayrı groupBy + manuel mapping daha karışık. Prisma.sql + parametreli IN
// SQL injection güvenli (Kural 71).
async function projeIstatistikleriniGetir(
  projeIdler: string[],
): Promise<Map<string, ProjeIstatistik>> {
  if (projeIdler.length === 0) return new Map();

  const satirlar = await db.$queryRaw<
    Array<{
      proje_id: string;
      kart_sayisi: bigint;
      tamamlanan_kart_sayisi: bigint;
      madde_sayisi: bigint;
      tamamlanan_madde_sayisi: bigint;
    }>
  >(Prisma.sql`
    SELECT
      l.proje_id::text AS proje_id,
      COUNT(DISTINCT k.id) AS kart_sayisi,
      COUNT(DISTINCT k.id) FILTER (WHERE k.tamamlandi_mi) AS tamamlanan_kart_sayisi,
      COUNT(km.id) AS madde_sayisi,
      COUNT(km.id) FILTER (WHERE km.tamamlandi_mi) AS tamamlanan_madde_sayisi
    FROM "Liste" l
    LEFT JOIN "Kart" k ON k.liste_id = l.id AND k.silindi_mi = false
    LEFT JOIN "KontrolListesi" kl ON kl.kart_id = k.id
    LEFT JOIN "KontrolMaddesi" km ON km.kontrol_listesi_id = kl.id
    WHERE l.proje_id IN (${Prisma.join(projeIdler.map((id) => Prisma.sql`${id}::uuid`))})
      AND l.tip = 'NORMAL'
    GROUP BY l.proje_id
  `);

  const harita = new Map<string, ProjeIstatistik>();
  for (const s of satirlar) {
    harita.set(s.proje_id, {
      kart_sayisi: Number(s.kart_sayisi),
      tamamlanan_kart_sayisi: Number(s.tamamlanan_kart_sayisi),
      madde_sayisi: Number(s.madde_sayisi),
      tamamlanan_madde_sayisi: Number(s.tamamlanan_madde_sayisi),
    });
  }
  return harita;
}

// Proje + liste + kart üzerindeki tüm yetkili kişi/birim'in DISTINCT union sayısı.
// Why union: kart üzerindeki rozet "bu projede aktif kim/hangi birim var" sorusunun
// cevabı; sadece doğrudan projeye atananları saymak alt kümeyi gizler. Personel
// X'in 1 listeye atanmış olması yine projede aktif olduğu anlamına gelir.
// Performans: tek query, projeIdler için indeks taraması, COUNT(DISTINCT) postgres
// için ucuz. N+1'siz (Kural 43). Parametreli (Kural 71).
async function projeYetkiliSayilariniGetir(
  projeIdler: string[],
): Promise<Map<string, ProjeYetkili>> {
  if (projeIdler.length === 0) return new Map();

  const idParam = Prisma.join(
    projeIdler.map((id) => Prisma.sql`${id}::uuid`),
  );

  const satirlar = await db.$queryRaw<
    Array<{
      proje_id: string;
      kisi_sayisi: bigint;
      birim_sayisi: bigint;
    }>
  >(Prisma.sql`
    SELECT
      proje_id::text AS proje_id,
      COUNT(DISTINCT kullanici_id) AS kisi_sayisi,
      COUNT(DISTINCT birim_id) AS birim_sayisi
    FROM (
      -- Proje seviyesi
      SELECT proje_id, kullanici_id, NULL::uuid AS birim_id
        FROM "ProjeUyesi"
        WHERE proje_id IN (${idParam})
      UNION ALL
      SELECT proje_id, NULL::uuid, birim_id
        FROM "ProjeBirimi"
        WHERE proje_id IN (${idParam})
      -- Liste seviyesi
      UNION ALL
      SELECT l.proje_id, ly.kullanici_id, NULL::uuid
        FROM "ListeUyesi" ly
        JOIN "Liste" l ON l.id = ly.liste_id
        WHERE l.proje_id IN (${idParam})
      UNION ALL
      SELECT l.proje_id, NULL::uuid, lb.birim_id
        FROM "ListeBirimi" lb
        JOIN "Liste" l ON l.id = lb.liste_id
        WHERE l.proje_id IN (${idParam})
      -- Kart seviyesi (silinmemiş kartlar)
      UNION ALL
      SELECT l.proje_id, ku.kullanici_id, NULL::uuid
        FROM "KartUyesi" ku
        JOIN "Kart" k ON k.id = ku.kart_id AND k.silindi_mi = false
        JOIN "Liste" l ON l.id = k.liste_id
        WHERE l.proje_id IN (${idParam})
      UNION ALL
      SELECT l.proje_id, NULL::uuid, kb.birim_id
        FROM "KartBirimi" kb
        JOIN "Kart" k ON k.id = kb.kart_id AND k.silindi_mi = false
        JOIN "Liste" l ON l.id = k.liste_id
        WHERE l.proje_id IN (${idParam})
    ) AS yetkililer
    GROUP BY proje_id
  `);

  const harita = new Map<string, ProjeYetkili>();
  for (const s of satirlar) {
    harita.set(s.proje_id, {
      kisi_sayisi: Number(s.kisi_sayisi),
      birim_sayisi: Number(s.birim_sayisi),
    });
  }
  return harita;
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
      kapak_ikon: girdi.kapak_ikon || null,
      sira,
      olusturan_id: olusturanId,
      yetkililer: {
        create: { kullanici_id: olusturanId },
      },
      birimler: olusturan?.birim_id
        ? { create: { birim_id: olusturan.birim_id } }
        : undefined,
      // ADR-0009 — projeyle birlikte Arşiv sistem listesini de oluştur
      listeler: {
        create: {
          ad: ARSIV_LISTESI_AD,
          sira: ARSIV_LISTESI_SIRA,
          tip: ListeTipi.ARSIV,
        },
      },
    },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      kapak_ikon: true,
      yildizli_mi: true,
      arsiv_mi: true,
      silindi_mi: true,
      sira: true,
      olusturma_zamani: true,
      olusturan: { select: { id: true, ad: true, soyad: true } },
    },
  });

  return {
    id: yeni.id,
    ad: yeni.ad,
    aciklama: yeni.aciklama,
    kapak_renk: yeni.kapak_renk,
    kapak_ikon: yeni.kapak_ikon,
    yildizli_mi: yeni.yildizli_mi,
    arsiv_mi: yeni.arsiv_mi,
    silindi_mi: yeni.silindi_mi,
    sira: yeni.sira,
    olusturma_zamani: yeni.olusturma_zamani,
    yetkili_sayisi: 1,
    liste_sayisi: 0,
    birim_sayisi: olusturan?.birim_id ? 1 : 0,
    kart_sayisi: 0,
    tamamlanan_kart_sayisi: 0,
    madde_sayisi: 0,
    tamamlanan_madde_sayisi: 0,
    olusturan: yeni.olusturan
      ? {
          id: yeni.olusturan.id,
          ad: yeni.olusturan.ad,
          soyad: yeni.olusturan.soyad,
        }
      : null,
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
  if (girdi.kapak_ikon !== undefined) veri.kapak_ikon = girdi.kapak_ikon || null;
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
