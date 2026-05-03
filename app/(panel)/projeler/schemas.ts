import { z } from "zod";
import { KAPAK_RENK_TOKENLERI } from "@/lib/kapak-renk";

const KAPAK_RENK = z.enum(KAPAK_RENK_TOKENLERI);

export const projeOlusturSemasi = z.object({
  // Geçici ID (temp-...) ile gönderim — server kendi UUID'sini üretir.
  id_taslak: z.string().optional(),
  ad: z.string().min(2, "Ad en az 2 karakter").max(200),
  aciklama: z.string().max(2000).optional().nullable(),
  kapak_renk: KAPAK_RENK.optional().nullable(),
  sira_referansi: z
    .object({
      onceki: z.string().nullable(),
      sonraki: z.string().nullable(),
    })
    .optional(),
});

export const projeGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2).max(200).optional(),
  aciklama: z.string().max(2000).optional().nullable(),
  kapak_renk: KAPAK_RENK.optional().nullable(),
  yildizli_mi: z.boolean().optional(),
});

export const projeArsivSemasi = z.object({
  id: z.string().uuid(),
  arsiv_mi: z.boolean(),
});

export const projeSilSemasi = z.object({
  id: z.string().uuid(),
});

export const projeGeriYukleSemasi = z.object({
  id: z.string().uuid(),
});

export const projeListeSemasi = z.object({
  filtre: z.enum(["aktif", "yildizli", "arsiv", "silinmis"]).default("aktif"),
  arama: z.string().optional(),
});

export const projeSiraSemasi = z.object({
  id: z.string().uuid(),
  onceki_id: z.string().uuid().nullable(),
  sonraki_id: z.string().uuid().nullable(),
});

export type ProjeOlustur = z.infer<typeof projeOlusturSemasi>;
export type ProjeGuncelle = z.infer<typeof projeGuncelleSemasi>;
export type ProjeArsiv = z.infer<typeof projeArsivSemasi>;
export type ProjeSil = z.infer<typeof projeSilSemasi>;
export type ProjeGeriYukle = z.infer<typeof projeGeriYukleSemasi>;
export type ProjeListe = z.infer<typeof projeListeSemasi>;
export type ProjeSira = z.infer<typeof projeSiraSemasi>;
