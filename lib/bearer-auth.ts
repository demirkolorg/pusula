// Sprint 1 / S1-12 — sabit zamanlı (timing-safe) Bearer token doğrulaması.
//
// Cron endpoint'leri ve metrik endpoint'leri kısa secret'lerle korunuyor.
// Düz `===` karşılaştırma erken bail out ettiği için saldırgan ölçtüğü
// timing farklarıyla token'ı karakter karakter çıkarabilir. Node'un
// `crypto.timingSafeEqual` fonksiyonu sabit zamanda karşılaştırır.

import { timingSafeEqual } from "node:crypto";

export function bearerTokenEslesiyorMu(
  authHeader: string | null | undefined,
  beklenenSecret: string,
): boolean {
  if (!authHeader || !beklenenSecret) return false;
  const beklenen = `Bearer ${beklenenSecret}`;
  // timingSafeEqual eşit uzunluk zorunlu; uzunluk farklılığı saldırgana
  // direkt bilgi vermez (header arbitrary), o yüzden burada false dönebiliriz.
  if (authHeader.length !== beklenen.length) return false;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(beklenen);
  return timingSafeEqual(a, b);
}
