import { z } from "zod";

export const hataListeSemasi = z.object({
  sayfa: z.number().int().min(1).default(1),
  sayfaBoyutu: z.number().int().min(1).max(100).default(30),
  arama: z.string().optional(),
  seviye: z.enum(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]).optional(),
  taraf: z.enum(["BACKEND", "FRONTEND"]).optional(),
  cozuldu_mu: z.boolean().optional(),
});

export const hataCozumSemasi = z.object({
  id: z.string(),
  cozum_notu: z.string().max(2000).optional(),
});

export type HataListe = z.infer<typeof hataListeSemasi>;
export type HataCozum = z.infer<typeof hataCozumSemasi>;
