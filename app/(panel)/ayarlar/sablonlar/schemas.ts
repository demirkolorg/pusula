// Proje Şablonları Zod şemaları (ADR-0021).
// Kontrol Kural 49 (server tarafı validation).

import { z } from "zod";

export const sablonOlusturSemasi = z.object({
  ad: z.string().trim().min(2, "En az 2 karakter").max(80, "En fazla 80 karakter"),
  aciklama: z.string().trim().max(500).nullable().optional(),
  kapak_renk: z.string().nullable().optional(),
  kapak_ikon: z.string().nullable().optional(),
  listeler: z
    .array(
      z.object({
        ad: z.string().trim().min(1, "Liste adı boş olamaz").max(60),
        wip_limit: z.number().int().min(1).max(999).nullable().optional(),
      }),
    )
    .max(20, "En fazla 20 liste"),
});
export type SablonOlustur = z.infer<typeof sablonOlusturSemasi>;

export const sablonGuncelleSemasi = sablonOlusturSemasi.extend({
  id: z.string().uuid(),
});
export type SablonGuncelle = z.infer<typeof sablonGuncelleSemasi>;

export const sablonSilSemasi = z.object({
  id: z.string().uuid(),
});
export type SablonSil = z.infer<typeof sablonSilSemasi>;
