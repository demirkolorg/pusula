import { z } from "zod";

export const kartAktiviteleriListeleSemasi = z.object({
  kart_id: z.string().uuid(),
  // Daha eski sayfa için cursor — son aktivite id'si (BigInt -> string)
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type KartAktiviteleriListele = z.infer<typeof kartAktiviteleriListeleSemasi>;
