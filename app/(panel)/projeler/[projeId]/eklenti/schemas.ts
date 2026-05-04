import { z } from "zod";
import { MAKS_BOYUT } from "@/lib/storage";

// 1. Adım: Upload başlatma — istemci dosya bilgilerini gönderir, server
//    presigned PUT URL döner.
export const yuklemeBaslatSemasi = z.object({
  kart_id: z.string().uuid(),
  ad: z.string().trim().min(1).max(255),
  mime: z.string().min(1).max(200),
  boyut: z.number().int().positive().max(MAKS_BOYUT),
});

// 2. Adım: PUT tamamlanınca metadata DB'ye yazılır.
export const yuklemeOnaylaSemasi = z.object({
  id_taslak: z.string().optional(),
  kart_id: z.string().uuid(),
  ad: z.string().trim().min(1).max(255),
  mime: z.string().min(1).max(200),
  boyut: z.number().int().positive().max(MAKS_BOYUT),
  depolama_yolu: z.string().min(1).max(500),
});

export const eklentiSilSemasi = z.object({
  id: z.string().uuid(),
});

export const eklentiIndirSemasi = z.object({
  id: z.string().uuid(),
});

export const kartEklentileriListeleSemasi = z.object({
  kart_id: z.string().uuid(),
});

export type YuklemeBaslat = z.infer<typeof yuklemeBaslatSemasi>;
export type YuklemeOnayla = z.infer<typeof yuklemeOnaylaSemasi>;
export type EklentiSil = z.infer<typeof eklentiSilSemasi>;
export type EklentiIndir = z.infer<typeof eklentiIndirSemasi>;
export type KartEklentileriListele = z.infer<typeof kartEklentileriListeleSemasi>;
