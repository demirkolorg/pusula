import { z } from "zod";

// =====================================================================
// Kontrol Listesi (KontrolListesi) — kart içi listele
// =====================================================================

export const kontrolListesiOlusturSemasi = z.object({
  id_taslak: z.string().optional(),
  kart_id: z.string().uuid(),
  ad: z.string().trim().min(1, "Ad zorunlu").max(120),
});

export const kontrolListesiGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: z.string().trim().min(1).max(120),
});

export const kontrolListesiSilSemasi = z.object({
  id: z.string().uuid(),
});

export const kontrolListeleriListeleSemasi = z.object({
  kart_id: z.string().uuid(),
});

// =====================================================================
// Kontrol Maddesi (KontrolMaddesi) — listenin maddeleri
// =====================================================================

export const maddeOlusturSemasi = z.object({
  id_taslak: z.string().optional(),
  kontrol_listesi_id: z.string().uuid(),
  metin: z.string().trim().min(1, "Metin zorunlu").max(500),
  atanan_id: z.string().uuid().nullable().optional(),
  bitis: z.coerce.date().nullable().optional(),
});

export const maddeGuncelleSemasi = z.object({
  id: z.string().uuid(),
  metin: z.string().trim().min(1).max(500).optional(),
  tamamlandi_mi: z.boolean().optional(),
  atanan_id: z.string().uuid().nullable().optional(),
  bitis: z.coerce.date().nullable().optional(),
});

export const maddeSilSemasi = z.object({
  id: z.string().uuid(),
});

export type KontrolListesiOlustur = z.infer<typeof kontrolListesiOlusturSemasi>;
export type KontrolListesiGuncelle = z.infer<typeof kontrolListesiGuncelleSemasi>;
export type KontrolListesiSil = z.infer<typeof kontrolListesiSilSemasi>;
export type KontrolListeleriListele = z.infer<typeof kontrolListeleriListeleSemasi>;
export type MaddeOlustur = z.infer<typeof maddeOlusturSemasi>;
export type MaddeGuncelle = z.infer<typeof maddeGuncelleSemasi>;
export type MaddeSil = z.infer<typeof maddeSilSemasi>;
