import { z } from "zod";

export const kartAktiviteleriListeleSemasi = z.object({
  kart_id: z.string().uuid(),
  // Daha eski sayfa için cursor — son aktivite id'si (BigInt -> string)
  cursor: z.string().optional(),
  // Opsiyonel — verilmezse karta bağlı tüm aktiviteler getirilir.
  // Yan panel sekmelerinde gerçek sayım için limitsiz çağrı yapılır.
  limit: z.number().int().min(1).optional(),
});

export type KartAktiviteleriListele = z.infer<typeof kartAktiviteleriListeleSemasi>;

export const projeAktiviteleriListeleSemasi = z.object({
  proje_id: z.string().uuid(),
  // Daha eski sayfa için cursor — son aktivite id'si (BigInt -> string)
  cursor: z.string().optional(),
  // Default 200 — proje aktivite modalında ilk açılışta tek seferde göster.
  // Daha fazlasını cursor ile sayfalama (UI'da "daha fazla yükle" butonu).
  limit: z.number().int().min(1).max(500).optional(),
});

export type ProjeAktiviteleriListele = z.infer<typeof projeAktiviteleriListeleSemasi>;
