// Pusula — Genel Arama (Cmd/Ctrl+K + Cmd/Ctrl+Space) Zod şemaları.
// ADR-0017 + Kontrol Kural 49 (server tarafı validation zorunlu).

import { z } from "zod";

/**
 * Aranabilir kaynak tipleri. v1 kapsamı: 9 tablo (audit log v2'ye ertelendi).
 * Kullanıcı UI'da tip filtresi seçebilir; varsayılan = "hepsi".
 */
export const ARAMA_TIPLERI = [
  "kart",
  "yorum",
  "madde",
  "eklenti",
  "kullanici",
  "birim",
  "etiket",
  "proje",
  "liste",
] as const;

export type AramaTipi = (typeof ARAMA_TIPLERI)[number];

export const aramaSorgusuSemasi = z.object({
  // Boş sorgu istemci tarafından gönderilmemeli; server boş gelirse boş sonuç döner.
  // Min 2 karakter — tek harf çoğu kez yanıltıcı olur (rank düşük, çok sonuç).
  sorgu: z
    .string()
    .trim()
    .min(2, "Arama sorgusu en az 2 karakter olmalı.")
    .max(120, "Arama sorgusu 120 karakteri geçemez."),
  tipler: z
    .array(z.enum(ARAMA_TIPLERI))
    .nonempty()
    .optional(),
  // Toplam sonuç limiti. UI 5'erli grup gösterse de ham sonucun üst sınırı.
  limit: z.number().int().min(1).max(100).default(50),
});

export type AramaSorgusu = z.infer<typeof aramaSorgusuSemasi>;
