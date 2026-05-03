import { z } from "zod";

export const denetimListeSemasi = z.object({
  sayfa: z.number().int().min(1).default(1),
  sayfaBoyutu: z.number().int().min(1).max(100).default(30),
  arama: z.string().optional(),
  islem: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  kaynak_tip: z.string().optional(),
  kullanici_id: z.string().uuid().optional().nullable(),
  baslangic: z.string().datetime().optional(),
  bitis: z.string().datetime().optional(),
});

export type DenetimListe = z.infer<typeof denetimListeSemasi>;
