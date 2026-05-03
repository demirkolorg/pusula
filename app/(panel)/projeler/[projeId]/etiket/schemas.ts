import { z } from "zod";

// Etiket renk paleti — Trello-benzeri preset; özel renk girişi yok (UX kararı:
// tutarlı görünüm için sınırlı palet). Tailwind class'ları değil hex'ler —
// inline style ile uygulanır (badge bg).
export const ETIKET_RENKLERI = [
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#a855f7", // purple
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
  "#171717", // neutral-900
] as const;

export const etiketRenkSemasi = z.enum(ETIKET_RENKLERI);
export type EtiketRenk = z.infer<typeof etiketRenkSemasi>;

export const etiketOlusturSemasi = z.object({
  proje_id: z.string().uuid(),
  ad: z.string().trim().min(1, "Ad zorunlu").max(40),
  renk: etiketRenkSemasi,
});

export const etiketGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: z.string().trim().min(1).max(40).optional(),
  renk: etiketRenkSemasi.optional(),
});

export const etiketSilSemasi = z.object({
  id: z.string().uuid(),
});

export const etiketListeleSemasi = z.object({
  proje_id: z.string().uuid(),
});

export const kartaEtiketEkleSemasi = z.object({
  kart_id: z.string().uuid(),
  etiket_id: z.string().uuid(),
});

export const kartaEtiketKaldirSemasi = kartaEtiketEkleSemasi;

export type EtiketOlustur = z.infer<typeof etiketOlusturSemasi>;
export type EtiketGuncelle = z.infer<typeof etiketGuncelleSemasi>;
export type EtiketSil = z.infer<typeof etiketSilSemasi>;
export type EtiketListele = z.infer<typeof etiketListeleSemasi>;
export type KartaEtiketEkle = z.infer<typeof kartaEtiketEkleSemasi>;
export type KartaEtiketKaldir = z.infer<typeof kartaEtiketKaldirSemasi>;
