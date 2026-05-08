// Sprint 3 / S3-15 — KPI/Metrik kartlarındaki vurgu rengi tipi.
//
// Hem `metrik-kartlari.tsx` hem `makam-kpi-seridi.tsx` aynı tipi ve
// sınıf eşleştirmesini ayrı ayrı tanımlamıştı. Tek noktaya toplandı.

export type Vurgu = "primary" | "uyari" | "basari" | "bilgi";

export const VURGU_SINIFLARI: Record<Vurgu, string> = {
  primary: "text-primary",
  uyari: "text-palet-kirmizi",
  basari: "text-palet-yesil",
  bilgi: "text-palet-mavi",
};
