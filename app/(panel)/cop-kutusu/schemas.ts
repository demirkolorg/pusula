// Çöp Kutusu Zod şemaları (ADR-0018).
// Kontrol Kural 49 (server tarafı validation).

import { z } from "zod";

export const COP_TIPLERI = ["proje", "kart", "yorum", "eklenti"] as const;
export type CopTipi = (typeof COP_TIPLERI)[number];

export const copKutusuListeleSemasi = z.object({
  tip: z.enum(COP_TIPLERI),
  // Cursor sayfalama: silinme_zamani DESC, ID tie-break.
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export type CopKutusuListele = z.infer<typeof copKutusuListeleSemasi>;

export const copGeriYukleSemasi = z.object({
  tip: z.enum(COP_TIPLERI),
  id: z.string().uuid(),
});
export type CopGeriYukle = z.infer<typeof copGeriYukleSemasi>;

export const copKaliciSilSemasi = z.object({
  tip: z.enum(COP_TIPLERI),
  id: z.string().uuid(),
  // Onay metni — kullanıcı kayıt başlığını yazınca aktif olur (UI tarafında
  // doğrulanır; server bu alanı sadece "boş değil" olarak kontrol eder).
  onay: z.literal("KALICI_SIL_ONAYLA"),
});
export type CopKaliciSil = z.infer<typeof copKaliciSilSemasi>;
