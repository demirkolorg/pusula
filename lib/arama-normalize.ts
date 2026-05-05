/**
 * Türkçe karakterleri ASCII'ye indirip lower-case yapar.
 * Aranan kelime ile DB'deki `pusula_norm()` çıktısı aynı kurala göre üretildiği
 * için iki taraf birebir karşılaştırılabilir hâle gelir.
 *
 * Why: Pure (DB-bağımsız) bir yardımcı; client component'lerden de import
 * edilebilsin diye `lib/arama.ts`'ten ayrıldı. `lib/arama.ts` `db` üzerinden
 * `node:async_hooks` zincirini çekiyor ve client bundle'a sızdırıyor.
 */
export function turkceNormalize(deger: string | null | undefined): string {
  if (!deger) return "";
  return deger
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .toLowerCase()
    .trim();
}
