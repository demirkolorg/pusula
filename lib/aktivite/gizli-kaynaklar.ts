import type { Prisma } from "@prisma/client";

export const AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI = [
  "Bildirim",
  "BildirimTercih",
  "BildirimMailKuyrugu",
  "KartSusturma",
  "ProjeSusturma",
] as const;

export function aktiviteAkisiGizliKaynakMi(kaynakTip: string): boolean {
  return AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI.some((tip) => tip === kaynakTip);
}

export function aktiviteAkisiGorunurKaynakWhere(): Prisma.AktiviteLoguWhereInput {
  return {
    kaynak_tip: { notIn: [...AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI] },
  };
}
