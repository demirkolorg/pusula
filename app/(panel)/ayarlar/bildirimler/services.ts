import { db } from "@/lib/db";
import { BILDIRIM_TIPLERI } from "@/app/(panel)/bildirimler/schemas";
import type { BildirimTipi } from "@/app/(panel)/bildirimler/schemas";
import type { BildirimTercihGuncelle } from "./schemas";

// Default açık (kullanıcı vizyonu — opt-out). Kayıt yoksa bu kullanılır.
const VARSAYILAN_AKIK = true;

export type TercihSatir = {
  tip: BildirimTipi;
  in_app_acik: boolean;
  email_acik: boolean;
};

/**
 * Kullanıcının tüm bildirim tipi tercihlerini döndür. Kayıt olmayan tipler
 * default değerle doldurulur — UI tek bir map render eder.
 */
export async function tercihleriListele(
  kullaniciId: string,
): Promise<TercihSatir[]> {
  const kayitlar = await db.bildirimTercih.findMany({
    where: { kullanici_id: kullaniciId },
    select: { tip: true, in_app_acik: true, email_acik: true },
  });
  const map = new Map<BildirimTipi, TercihSatir>();
  for (const k of kayitlar) {
    map.set(k.tip, {
      tip: k.tip,
      in_app_acik: k.in_app_acik,
      email_acik: k.email_acik,
    });
  }
  return BILDIRIM_TIPLERI.map(
    (tip) =>
      map.get(tip) ?? {
        tip,
        in_app_acik: VARSAYILAN_AKIK,
        email_acik: VARSAYILAN_AKIK,
      },
  );
}

/**
 * Tek bir tip için tercihi upsert. Sadece verilen kanal alanları güncellenir;
 * undefined kanallar için mevcut/default değer korunur. Unique constraint
 * (kullanici_id, tip) ile idempotent.
 */
export async function tercihGuncelle(
  kullaniciId: string,
  girdi: BildirimTercihGuncelle,
): Promise<TercihSatir> {
  const mevcut = await db.bildirimTercih.findUnique({
    where: {
      kullanici_id_tip: {
        kullanici_id: kullaniciId,
        tip: girdi.tip,
      },
    },
    select: { in_app_acik: true, email_acik: true },
  });
  const yeniInApp =
    girdi.in_app_acik ?? mevcut?.in_app_acik ?? VARSAYILAN_AKIK;
  const yeniEmail =
    girdi.email_acik ?? mevcut?.email_acik ?? VARSAYILAN_AKIK;

  const sonuc = await db.bildirimTercih.upsert({
    where: {
      kullanici_id_tip: {
        kullanici_id: kullaniciId,
        tip: girdi.tip,
      },
    },
    create: {
      kullanici_id: kullaniciId,
      tip: girdi.tip,
      in_app_acik: yeniInApp,
      email_acik: yeniEmail,
    },
    update: {
      in_app_acik: yeniInApp,
      email_acik: yeniEmail,
    },
    select: { tip: true, in_app_acik: true, email_acik: true },
  });
  return sonuc;
}
