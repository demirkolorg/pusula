import type { Prisma } from "@prisma/client";

export const AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI = [
  "Bildirim",
  "BildirimTercih",
  "BildirimMailKuyrugu",
  "KartSusturma",
  "ProjeSusturma",
  // ADR-0028 — Dosya yönetimi internal/forensik kayıtları.
  // DosyaErisimLogu: önizleme/indirme okuma event'leri (forensik audit'te
  // tutulur, ham yüzeyde görünür ama kullanıcı odaklı aktivite akışında gürültü).
  // DosyaYuklemeOturumu: presigned upload state (yarım/onaylı/iptal); kullanıcı
  // için anlamlı aktivite Dosya CREATE event'inden gelir.
  "DosyaErisimLogu",
  "DosyaYuklemeOturumu",
  // EtiketBaglantisi: many-to-many bağ kaydı; kullanıcı eylemi DosyaEtiketi
  // CREATE veya etiket güncelleme cümlesinde zaten görünür.
  "DosyaEtiketBaglantisi",
] as const;

export function aktiviteAkisiGizliKaynakMi(kaynakTip: string): boolean {
  return AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI.some((tip) => tip === kaynakTip);
}

export function aktiviteAkisiGorunurKaynakWhere(): Prisma.AktiviteLoguWhereInput {
  return {
    kaynak_tip: { notIn: [...AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI] },
  };
}
