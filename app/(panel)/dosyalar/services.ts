// ADR-0028 / F4 + Sprint 3 S3-3 — Dosya servisi barrel.
//
// Bu dosya ADR-0032 planına göre kategori bazlı parça dosyalara bölündü:
//   services-ortak.ts     — yardımcı helper (hata, dosyayiBulSilinmemis,
//                            kaynagaErisimZorunlu)
//   services-upload.ts    — yükleme + sürüm yükleme akışı (4 export)
//   services-listele.ts   — liste/detay/indir/önizle/metin (5 export)
//   services-etiket.ts    — etiketler 3 export
//   services-baglanti.ts  — bağlantı 2 export
//
// Bu dosya ad/açıklama/gizlilik metadata güncelleme + sil/geri-yükle/
// kalıcı sil lifecycle export'larını ve canDosya re-export'unu tutar.
// Çağıran kod (~6 dosya) `from "./services"` import yolunu korur.

import { db } from "@/lib/db";
import { dosyaUzantisi } from "@/lib/dosya-kategori";
import { dosyaObjesiniSil } from "@/lib/dosya-storage";
import { canDosya, yetkiZorunluDosya } from "@/lib/dosya-yetki";
import type {
  DosyaAdGuncelleGirdi,
  DosyaAciklamaGuncelleGirdi,
  DosyaGizlilikGuncelleGirdi,
} from "./schemas";

// =====================================================================
// Re-export — parça dosyalardan public API
// =====================================================================

export {
  yuklemeBaslat,
  yuklemeOnayla,
  surumYuklemeBaslat,
  surumYuklemeOnayla,
  type YuklemeBaslatSonuc,
} from "./services-upload";

export {
  dosyalariListele,
  dosyaDetay,
  indirUrl,
  onizlemeUrl,
  metinIcerikGetir,
  type DosyaListeSatiri,
  type DosyaListeSonuc,
} from "./services-listele";

export {
  etiketleriGuncelle,
  etiketOlustur,
  etiketSil,
} from "./services-etiket";

export { baglantiEkle, baglantiKaldir } from "./services-baglanti";

// =====================================================================
// Metadata güncelleme (küçük 3 mutation, ana dosyada kalır)
// =====================================================================

export async function adGuncelle(
  kullaniciId: string,
  girdi: DosyaAdGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:edit-meta", girdi.id);
  await db.dosya.update({
    where: { id: girdi.id },
    data: { ad: girdi.ad, uzanti: dosyaUzantisi(girdi.ad) },
  });
}

export async function aciklamaGuncelle(
  kullaniciId: string,
  girdi: DosyaAciklamaGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:edit-meta", girdi.id);
  await db.dosya.update({
    where: { id: girdi.id },
    data: { aciklama: girdi.aciklama },
  });
}

export async function gizlilikGuncelle(
  kullaniciId: string,
  girdi: DosyaGizlilikGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:edit-gizlilik", girdi.id);
  await db.dosya.update({
    where: { id: girdi.id },
    data: { gizlilik: girdi.gizlilik },
  });
}

// =====================================================================
// Sil / Geri yükle / Kalıcı sil
// =====================================================================

export async function sil(
  kullaniciId: string,
  dosyaId: string,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:delete", dosyaId);
  await db.dosya.update({
    where: { id: dosyaId },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
}

export async function geriYukle(
  kullaniciId: string,
  dosyaId: string,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:restore", dosyaId);
  await db.dosya.update({
    where: { id: dosyaId },
    data: { silindi_mi: false, silinme_zamani: null },
  });
}

export async function kaliciSil(
  kullaniciId: string,
  dosyaId: string,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:purge", dosyaId);

  // Tüm sürümlerin storage objelerini sil + DB cascade
  const surumler = await db.dosyaSurumu.findMany({
    where: { dosya_id: dosyaId },
    select: { depolama_yolu: true },
  });
  await db.dosya.delete({ where: { id: dosyaId } });

  // Storage silme idempotent — başarısız obje cleanup cron'a düşer.
  for (const s of surumler) {
    try {
      await dosyaObjesiniSil(s.depolama_yolu);
    } catch {
      // Orphan obje — periodik GC.
    }
  }
}

// =====================================================================
// canDosya re-export (hooks ve UI için yardımcı)
// =====================================================================
export { canDosya };
