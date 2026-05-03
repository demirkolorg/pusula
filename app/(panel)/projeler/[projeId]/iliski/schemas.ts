import { z } from "zod";

// Prisma KartIliskiTipi mirror
export const KART_ILISKI_TIPLERI = ["BLOCKS", "RELATES", "DUPLICATES"] as const;
export const kartIliskiTipiSemasi = z.enum(KART_ILISKI_TIPLERI);
export type KartIliskiTipi = z.infer<typeof kartIliskiTipiSemasi>;

// İlişki tip etiketleri (UI gösterim).
export const ILISKI_TIP_ETIKETI: Record<KartIliskiTipi, string> = {
  BLOCKS: "Engelliyor",
  RELATES: "İlişkili",
  DUPLICATES: "Tekrarı",
};

export const iliskiOlusturSemasi = z.object({
  id_taslak: z.string().optional(),
  kart_a_id: z.string().uuid(),
  kart_b_id: z.string().uuid(),
  tip: kartIliskiTipiSemasi,
});

export const iliskiSilSemasi = z.object({
  id: z.string().uuid(),
});

export const kartIliskileriListeleSemasi = z.object({
  kart_id: z.string().uuid(),
});

// Aynı projede ilişki kurulacak kart ararken
export const projeKartiAraSemasi = z.object({
  proje_id: z.string().uuid(),
  haric_kart_id: z.string().uuid().optional(),
  q: z.string().trim().max(100).optional(),
});

export type IliskiOlustur = z.infer<typeof iliskiOlusturSemasi>;
export type IliskiSil = z.infer<typeof iliskiSilSemasi>;
export type KartIliskileriListele = z.infer<typeof kartIliskileriListeleSemasi>;
export type ProjeKartiAra = z.infer<typeof projeKartiAraSemasi>;
