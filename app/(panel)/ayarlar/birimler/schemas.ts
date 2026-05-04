import { z } from "zod";
import { BirimKategorisi, BirimTipi } from "@prisma/client";
import { BIRIM_TIP_TEKIL } from "@/lib/constants/birim";

export const birimOlusturSemasi = z
  .object({
    kategori: z.nativeEnum(BirimKategorisi),
    tip: z.nativeEnum(BirimTipi),
    ad: z.string().trim().max(200).optional().nullable(),
    kisa_ad: z.string().trim().max(50).optional().nullable(),
    il: z.string().trim().max(100).optional().nullable(),
    ilce: z.string().trim().max(100).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    // Çoklu tip ise ad zorunlu (Eczane, Okul, Cami vb.)
    const tekil = BIRIM_TIP_TEKIL.has(d.tip);
    if (!tekil && (!d.ad || d.ad.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ad"],
        message: "Bu birim tipi için ad zorunlu (en az 2 karakter).",
      });
    }
  });

export const birimGuncelleSemasi = z
  .object({
    id: z.string().uuid(),
    kategori: z.nativeEnum(BirimKategorisi),
    tip: z.nativeEnum(BirimTipi),
    ad: z.string().trim().max(200).optional().nullable(),
    kisa_ad: z.string().trim().max(50).optional().nullable(),
    il: z.string().trim().max(100).optional().nullable(),
    ilce: z.string().trim().max(100).optional().nullable(),
    aktif: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    const tekil = BIRIM_TIP_TEKIL.has(d.tip);
    if (!tekil && (!d.ad || d.ad.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ad"],
        message: "Bu birim tipi için ad zorunlu (en az 2 karakter).",
      });
    }
  });

export const birimSilSemasi = z.object({ id: z.string().uuid() });

export const birimListeSemasi = z.object({
  sayfa: z.number().int().min(1).default(1),
  sayfaBoyutu: z.number().int().min(1).max(100).default(20),
  arama: z.string().optional(),
  kategori: z.nativeEnum(BirimKategorisi).optional(),
  tip: z.nativeEnum(BirimTipi).optional(),
});

export type BirimOlustur = z.infer<typeof birimOlusturSemasi>;
export type BirimGuncelle = z.infer<typeof birimGuncelleSemasi>;
export type BirimSil = z.infer<typeof birimSilSemasi>;
export type BirimListe = z.infer<typeof birimListeSemasi>;
