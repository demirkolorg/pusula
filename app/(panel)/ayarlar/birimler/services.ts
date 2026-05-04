import type { Prisma } from "@prisma/client";
import type { BirimKategorisi, BirimTipi } from "@prisma/client";
import { db } from "@/lib/db";
import { BIRIM_TIP_TEKIL } from "@/lib/constants/birim";
import { aramaUuidIdleri } from "@/lib/arama";
import type {
  BirimGuncelle,
  BirimListe,
  BirimOlustur,
} from "./schemas";

export type BirimSatiri = {
  id: string;
  ad: string | null;
  kisa_ad: string | null;
  kategori: BirimKategorisi;
  tip: BirimTipi;
  il: string | null;
  ilce: string | null;
  aktif: boolean;
  silindi_mi: boolean;
  kullanici_sayisi: number;
  olusturma_zamani: Date;
};

export async function birimleriListele(
  girdi: BirimListe,
): Promise<{ kayitlar: BirimSatiri[]; toplam: number }> {
  const where: Prisma.BirimWhereInput = { silindi_mi: false };
  if (girdi.kategori) where.kategori = girdi.kategori;
  if (girdi.tip) where.tip = girdi.tip;
  if (girdi.arama) {
    const idler = await aramaUuidIdleri({
      tablo: "Birim",
      sutunlar: ["ad", "kisa_ad", "il", "ilce", "tip", "kategori"],
      arama: girdi.arama,
    });
    if (idler !== null) {
      if (idler.length === 0) return { kayitlar: [], toplam: 0 };
      where.id = { in: idler };
    }
  }

  const [toplam, kayitlar] = await db.$transaction([
    db.birim.count({ where }),
    db.birim.findMany({
      where,
      orderBy: [{ kategori: "asc" }, { tip: "asc" }, { ad: "asc" }],
      skip: (girdi.sayfa - 1) * girdi.sayfaBoyutu,
      take: girdi.sayfaBoyutu,
      select: {
        id: true,
        ad: true,
        kisa_ad: true,
        kategori: true,
        tip: true,
        il: true,
        ilce: true,
        aktif: true,
        silindi_mi: true,
        olusturma_zamani: true,
        _count: { select: { kullanicilar: true } },
      },
    }),
  ]);

  return {
    toplam,
    kayitlar: kayitlar.map((k) => ({
      id: k.id,
      ad: k.ad,
      kisa_ad: k.kisa_ad,
      kategori: k.kategori,
      tip: k.tip,
      il: k.il,
      ilce: k.ilce,
      aktif: k.aktif,
      silindi_mi: k.silindi_mi,
      olusturma_zamani: k.olusturma_zamani,
      kullanici_sayisi: k._count.kullanicilar,
    })),
  };
}

/**
 * Self-register sayfasında kullanılır: aktif (silinmemiş) tüm birimlerın
 * id, ad, kategori, tip listesini döner. Hassas alan içermez.
 */
export async function birimSecenekleri() {
  return db.birim.findMany({
    where: { silindi_mi: false, aktif: true },
    select: { id: true, ad: true, kategori: true, tip: true },
    orderBy: [{ kategori: "asc" }, { tip: "asc" }, { ad: "asc" }],
  });
}

/**
 * Tekil tipte aynı birima ikinci kayıt eklenmesini engeller.
 */
async function tekilCakismaKontrolu(
  tip: BirimTipi,
  hariciId: string | null = null,
): Promise<void> {
  if (!BIRIM_TIP_TEKIL.has(tip)) return;
  const mevcut = await db.birim.findFirst({
    where: {
      tip,
      silindi_mi: false,
      ...(hariciId ? { id: { not: hariciId } } : {}),
    },
    select: { id: true },
  });
  if (mevcut) {
    throw new Error("Bu tipte bir birim zaten kayıtlı.");
  }
}

export async function birimOlustur(
  girdi: BirimOlustur,
): Promise<{ id: string }> {
  await tekilCakismaKontrolu(girdi.tip);
  const yeni = await db.birim.create({
    data: {
      kategori: girdi.kategori,
      tip: girdi.tip,
      ad: girdi.ad?.trim() || null,
      kisa_ad: girdi.kisa_ad?.trim() || null,
      il: girdi.il?.trim() || null,
      ilce: girdi.ilce?.trim() || null,
    },
    select: { id: true },
  });
  return { id: yeni.id };
}

export async function birimGuncelle(girdi: BirimGuncelle): Promise<void> {
  await tekilCakismaKontrolu(girdi.tip, girdi.id);
  await db.birim.update({
    where: { id: girdi.id },
    data: {
      kategori: girdi.kategori,
      tip: girdi.tip,
      ad: girdi.ad?.trim() || null,
      kisa_ad: girdi.kisa_ad?.trim() || null,
      il: girdi.il?.trim() || null,
      ilce: girdi.ilce?.trim() || null,
      aktif: girdi.aktif ?? undefined,
    },
  });
}

export async function birimSil(id: string): Promise<void> {
  await db.birim.update({
    where: { id },
    data: { silindi_mi: true, silinme_zamani: new Date(), aktif: false },
  });
}

export async function birimGeriYukle(id: string): Promise<void> {
  await db.birim.update({
    where: { id },
    data: { silindi_mi: false, silinme_zamani: null, aktif: true },
  });
}
