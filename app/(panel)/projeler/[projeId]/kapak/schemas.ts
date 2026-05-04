import { z } from "zod";

export const kapagiAyarlaSemasi = z.object({
  kart_id: z.string().uuid(),
  eklenti_id: z.string().uuid(),
});

export const kapagiKaldirSemasi = z.object({
  kart_id: z.string().uuid(),
});

export type KapagiAyarla = z.infer<typeof kapagiAyarlaSemasi>;
export type KapagiKaldir = z.infer<typeof kapagiKaldirSemasi>;
