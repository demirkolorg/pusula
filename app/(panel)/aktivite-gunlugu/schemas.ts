import { z } from "zod";

export const aktiviteGunluguFiltreSemasi = z.object({
  limit: z.number().int().min(1).max(50).default(50),
  cursor: z.string().regex(/^\d+$/).optional(),
  kapsam: z.enum(["tum", "benim"]).default("tum"),
  arama: z.string().trim().min(1).max(120).optional(),
  islem: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  kaynak_tip: z.string().trim().min(1).max(80).optional(),
  baslangic: z.string().datetime().optional(),
  bitis: z.string().datetime().optional(),
});

export type AktiviteGunluguFiltre = z.infer<
  typeof aktiviteGunluguFiltreSemasi
>;

export const AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE: AktiviteGunluguFiltre = {
  limit: 50,
  kapsam: "tum",
};
