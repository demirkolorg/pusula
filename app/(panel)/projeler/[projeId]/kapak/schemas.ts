import { z } from "zod";
import { KAPAK_RENK_TOKENLERI } from "@/lib/kapak-renk";

export const kapagiAyarlaSemasi = z.object({
  kart_id: z.string().uuid(),
  eklenti_id: z.string().uuid(),
});

export const kapagiKaldirSemasi = z.object({
  kart_id: z.string().uuid(),
});

// Kapak rengi: lib/kapak-renk.ts'teki 15 token'dan biri.
// renk=null gönderilirse mevcut renk kapağı kaldırılır.
export const kapakRenginiAyarlaSemasi = z.object({
  kart_id: z.string().uuid(),
  renk: z.enum(KAPAK_RENK_TOKENLERI),
});

export const kapakRenginiKaldirSemasi = z.object({
  kart_id: z.string().uuid(),
});

export type KapagiAyarla = z.infer<typeof kapagiAyarlaSemasi>;
export type KapagiKaldir = z.infer<typeof kapagiKaldirSemasi>;
export type KapakRenginiAyarla = z.infer<typeof kapakRenginiAyarlaSemasi>;
export type KapakRenginiKaldir = z.infer<typeof kapakRenginiKaldirSemasi>;
