// Sprint 3 / S3-7 — Sık kullanılan Zod tipleri için ortak nokta.
//
// Mevcut 129+ occurrence (20 dosyada `z.string().uuid()`, `z.string().email()`)
// adım adım bu dosyaya migrate edilecek. Yeni kodlar bu modülü kullanır.

import { z } from "zod";

// =====================================================================
// Temel tipler
// =====================================================================

export const uuid = z.string().uuid({ message: "Geçersiz kimlik." });

export const eposta = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Geçersiz e-posta adresi." })
  .max(254);

// TC Kimlik No: 11 hane, ilk hane 0 değil.
// Asıl kontrol algoritması (Luhn benzeri) ayrı bir validator'da yapılır.
export const tcKimlik = z
  .string()
  .trim()
  .regex(/^[1-9]\d{10}$/, { message: "Geçersiz TC kimlik no." });

// E.164 + Türkiye yerel formatı (+90 prefix opsiyonel, 10 hane).
export const telefon = z
  .string()
  .trim()
  .regex(/^(?:\+?90)?\d{10}$/, { message: "Geçersiz telefon numarası." });

// =====================================================================
// Şema bileşenleri
// =====================================================================

// Tek id ile çağrılan eylemler için yaygın şema.
export const idSemasi = z.object({ id: uuid });

// LexoRank tabanlı sıralama için "önceki + sonraki" referans.
export const siralamaSemasi = z.object({
  onceki: z.string().nullable(),
  sonraki: z.string().nullable(),
});

// =====================================================================
// Tip türetmeleri (Strangler Fig migrasyonunda kullanılabilir)
// =====================================================================

export type UuidGirdi = z.infer<typeof uuid>;
export type EpostaGirdi = z.infer<typeof eposta>;
export type IdGirdi = z.infer<typeof idSemasi>;
export type Siralama = z.infer<typeof siralamaSemasi>;
