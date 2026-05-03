import { z } from "zod";

export const YORUM_MAX = 5000;

export const yorumOlusturSemasi = z.object({
  id_taslak: z.string().optional(),
  kart_id: z.string().uuid(),
  icerik: z.string().trim().min(1, "Yorum boş olamaz").max(YORUM_MAX),
  yanit_yorum_id: z.string().uuid().nullable().optional(),
});

export const yorumGuncelleSemasi = z.object({
  id: z.string().uuid(),
  icerik: z.string().trim().min(1).max(YORUM_MAX),
});

export const yorumSilSemasi = z.object({
  id: z.string().uuid(),
});

export const yorumlariListeleSemasi = z.object({
  kart_id: z.string().uuid(),
});

export type YorumOlustur = z.infer<typeof yorumOlusturSemasi>;
export type YorumGuncelle = z.infer<typeof yorumGuncelleSemasi>;
export type YorumSil = z.infer<typeof yorumSilSemasi>;
export type YorumlariListele = z.infer<typeof yorumlariListeleSemasi>;
