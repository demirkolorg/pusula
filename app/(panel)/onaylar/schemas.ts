import { z } from "zod";

// ADR-0019/PR-3 — Bekleyen tamamlama önerileri listesi sorgu şemaları.
// Cursor pagination: server-side `oneri_zamani DESC` sırasında son
// öğenin zaman+id'sini cursor olarak kullanırız (Kural 97).

export const bekleyenOnerileriListelemeSemasi = z.object({
  // Cursor: son alınan öğenin oneri_zamani (ISO string) + id; null ise
  // ilk sayfa.
  cursorZaman: z.coerce.date().nullable().optional(),
  cursorId: z.string().uuid().nullable().optional(),
  // Sayfa boyutu — DEFAULT 50, MAX 100 (Kural 97).
  limit: z.number().int().min(1).max(100).optional(),
  // Opsiyonel proje filtresi (UI'daki multiselect; tek değerle başla).
  projeId: z.string().uuid().nullable().optional(),
});

export type BekleyenOnerileriListele = z.infer<
  typeof bekleyenOnerileriListelemeSemasi
>;
