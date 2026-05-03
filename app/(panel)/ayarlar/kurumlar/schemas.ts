import { z } from "zod";
import { KurumKategorisi, KurumTipi } from "@prisma/client";
import { KURUM_TIP_TEKIL } from "@/lib/constants/kurum";

export const kurumOlusturSemasi = z
  .object({
    kategori: z.nativeEnum(KurumKategorisi),
    tip: z.nativeEnum(KurumTipi),
    ad: z.string().trim().max(200).optional().nullable(),
    kisa_ad: z.string().trim().max(50).optional().nullable(),
    il: z.string().trim().max(100).optional().nullable(),
    ilce: z.string().trim().max(100).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    // Çoklu tip ise ad zorunlu (Eczane, Okul, Cami vb.)
    const tekil = KURUM_TIP_TEKIL.has(d.tip);
    if (!tekil && (!d.ad || d.ad.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ad"],
        message: "Bu kurum tipi için ad zorunlu (en az 2 karakter).",
      });
    }
  });

export const kurumGuncelleSemasi = z
  .object({
    id: z.string().uuid(),
    kategori: z.nativeEnum(KurumKategorisi),
    tip: z.nativeEnum(KurumTipi),
    ad: z.string().trim().max(200).optional().nullable(),
    kisa_ad: z.string().trim().max(50).optional().nullable(),
    il: z.string().trim().max(100).optional().nullable(),
    ilce: z.string().trim().max(100).optional().nullable(),
    aktif: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    const tekil = KURUM_TIP_TEKIL.has(d.tip);
    if (!tekil && (!d.ad || d.ad.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ad"],
        message: "Bu kurum tipi için ad zorunlu (en az 2 karakter).",
      });
    }
  });

export const kurumSilSemasi = z.object({ id: z.string().uuid() });

export const kurumListeSemasi = z.object({
  sayfa: z.number().int().min(1).default(1),
  sayfaBoyutu: z.number().int().min(1).max(100).default(20),
  arama: z.string().optional(),
  kategori: z.nativeEnum(KurumKategorisi).optional(),
  tip: z.nativeEnum(KurumTipi).optional(),
});

export type KurumOlustur = z.infer<typeof kurumOlusturSemasi>;
export type KurumGuncelle = z.infer<typeof kurumGuncelleSemasi>;
export type KurumSil = z.infer<typeof kurumSilSemasi>;
export type KurumListe = z.infer<typeof kurumListeSemasi>;
