import { z } from "zod";
import { KAPAK_RENK_TOKENLERI } from "@/lib/kapak-renk";

// ============================================================
// Liste (kolon) şemaları
// ============================================================

export const listeOlusturSemasi = z.object({
  id_taslak: z.string().optional(),
  proje_id: z.string().uuid(),
  ad: z.string().min(1, "Ad zorunlu").max(120),
});

export const listeGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: z.string().min(1).max(120).optional(),
  arsiv_mi: z.boolean().optional(),
  wip_limit: z.number().int().min(0).max(999).nullable().optional(),
});

export const listeSilSemasi = z.object({
  id: z.string().uuid(),
});

export const listeSiraSemasi = z.object({
  id: z.string().uuid(),
  proje_id: z.string().uuid(),
  onceki_id: z.string().uuid().nullable(),
  sonraki_id: z.string().uuid().nullable(),
});

export type ListeOlustur = z.infer<typeof listeOlusturSemasi>;
export type ListeGuncelle = z.infer<typeof listeGuncelleSemasi>;
export type ListeSil = z.infer<typeof listeSilSemasi>;
export type ListeSira = z.infer<typeof listeSiraSemasi>;

// ============================================================
// Kart şemaları
// ============================================================

export const kartOlusturSemasi = z.object({
  id_taslak: z.string().optional(),
  liste_id: z.string().uuid(),
  baslik: z.string().min(1, "Başlık zorunlu").max(300),
  aciklama: z.string().max(10000).optional().nullable(),
});

export const kartGuncelleSemasi = z.object({
  id: z.string().uuid(),
  baslik: z.string().min(1).max(300).optional(),
  aciklama: z.string().max(10000).nullable().optional(),
  kapak_renk: z.enum(KAPAK_RENK_TOKENLERI).nullable().optional(),
  baslangic: z.coerce.date().nullable().optional(),
  bitis: z.coerce.date().nullable().optional(),
  arsiv_mi: z.boolean().optional(),
});

export const kartSilSemasi = z.object({
  id: z.string().uuid(),
});

export const kartGeriYukleSemasi = z.object({
  id: z.string().uuid(),
});

// Drag-drop: kart taşı (aynı liste içinde veya başka listeye).
export const kartTasiSemasi = z.object({
  id: z.string().uuid(),
  hedef_liste_id: z.string().uuid(),
  onceki_id: z.string().uuid().nullable(),
  sonraki_id: z.string().uuid().nullable(),
});

export type KartOlustur = z.infer<typeof kartOlusturSemasi>;
export type KartGuncelle = z.infer<typeof kartGuncelleSemasi>;
export type KartSil = z.infer<typeof kartSilSemasi>;
export type KartGeriYukle = z.infer<typeof kartGeriYukleSemasi>;
export type KartTasi = z.infer<typeof kartTasiSemasi>;

// ============================================================
// Proje detayı şemaları
// ============================================================

export const projeDetaySemasi = z.object({
  proje_id: z.string().uuid(),
});

export type ProjeDetay = z.infer<typeof projeDetaySemasi>;
