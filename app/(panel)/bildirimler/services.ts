import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type {
  BildirimleriListele,
  BildirimOkuduIsaretle,
  BildirimTipi,
} from "./schemas";

export type BildirimOzeti = {
  id: string; // BigInt → string
  tip: BildirimTipi;
  baslik: string;
  ozet: string | null;
  ureten: { id: string; ad: string; soyad: string } | null;
  kart_id: string | null;
  proje_id: string | null;
  kaynak_tip: string | null;
  kaynak_id: string | null;
  meta: Record<string, unknown> | null;
  okundu_mu: boolean;
  olusturma_zamani: Date;
};

// =====================================================================
// Listele + sayım
// =====================================================================

export async function bildirimleriListele(
  aliciId: string,
  girdi: BildirimleriListele,
): Promise<BildirimOzeti[]> {
  const cursorWhere = girdi.cursor
    ? { id: { lt: BigInt(girdi.cursor) } }
    : {};
  const okudFiltre =
    girdi.filtre === "okunmamis"
      ? { okundu_mu: false }
      : girdi.filtre === "okunmus"
        ? { okundu_mu: true }
        : {};

  const ham = await db.bildirim.findMany({
    where: { alici_id: aliciId, ...cursorWhere, ...okudFiltre },
    orderBy: { id: "desc" },
    take: girdi.limit,
    select: {
      id: true,
      tip: true,
      baslik: true,
      ozet: true,
      kart_id: true,
      proje_id: true,
      kaynak_tip: true,
      kaynak_id: true,
      meta: true,
      okundu_mu: true,
      olusturma_zamani: true,
      ureten: { select: { id: true, ad: true, soyad: true } },
    },
  });

  return ham.map((b) => ({
    id: b.id.toString(),
    tip: b.tip,
    baslik: b.baslik,
    ozet: b.ozet,
    ureten: b.ureten,
    kart_id: b.kart_id,
    proje_id: b.proje_id,
    kaynak_tip: b.kaynak_tip,
    kaynak_id: b.kaynak_id,
    meta: b.meta as Record<string, unknown> | null,
    okundu_mu: b.okundu_mu,
    olusturma_zamani: b.olusturma_zamani,
  }));
}

export async function okunmamisSayisi(aliciId: string): Promise<number> {
  return db.bildirim.count({
    where: { alici_id: aliciId, okundu_mu: false },
  });
}

// =====================================================================
// Okudu işaretle
// =====================================================================

export async function bildirimOkuduIsaretle(
  aliciId: string,
  girdi: BildirimOkuduIsaretle,
): Promise<void> {
  // Sadece kendi bildirimlerini işaretleyebilir — ID'yi alıcıya kilitle.
  const ids = girdi.ids.map((s) => {
    try {
      return BigInt(s);
    } catch {
      throw new EylemHatasi("Geçersiz bildirim id.", HATA_KODU.GECERSIZ_GIRDI);
    }
  });
  await db.bildirim.updateMany({
    where: {
      id: { in: ids },
      alici_id: aliciId,
      okundu_mu: false,
    },
    data: { okundu_mu: true, okuma_zamani: new Date() },
  });
}

export async function tumunuOkuduIsaretle(aliciId: string): Promise<void> {
  await db.bildirim.updateMany({
    where: { alici_id: aliciId, okundu_mu: false },
    data: { okundu_mu: true, okuma_zamani: new Date() },
  });
}

// =====================================================================
// Yardımcı: birden fazla alıcıya tek bildirim üret (broadcast pattern)
// =====================================================================

export type BildirimUretGirdi = {
  alici_idler: string[];
  ureten_id: string | null;
  tip: BildirimTipi;
  baslik: string;
  ozet?: string | null;
  kart_id?: string | null;
  proje_id?: string | null;
  kaynak_tip?: string | null;
  kaynak_id?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function bildirimUret(
  girdi: BildirimUretGirdi,
): Promise<{ id: string; alici_id: string }[]> {
  if (girdi.alici_idler.length === 0) return [];
  // Tekilleştir + üreteni dışla (kendine bildirim atma)
  const benzersiz = Array.from(new Set(girdi.alici_idler)).filter(
    (id) => id !== girdi.ureten_id,
  );
  if (benzersiz.length === 0) return [];

  const data = benzersiz.map((aliciId) => ({
    alici_id: aliciId,
    ureten_id: girdi.ureten_id,
    tip: girdi.tip,
    baslik: girdi.baslik,
    ozet: girdi.ozet ?? null,
    kart_id: girdi.kart_id ?? null,
    proje_id: girdi.proje_id ?? null,
    kaynak_tip: girdi.kaynak_tip ?? null,
    kaynak_id: girdi.kaynak_id ?? null,
    meta: (girdi.meta as object) ?? undefined,
  }));

  // createManyAndReturn yerine $transaction içinde tek tek (id'leri lazım)
  const sonuclar = await db.$transaction(
    data.map((d) =>
      db.bildirim.create({ data: d, select: { id: true, alici_id: true } }),
    ),
  );
  return sonuclar.map((s) => ({
    id: s.id.toString(),
    alici_id: s.alici_id,
  }));
}
