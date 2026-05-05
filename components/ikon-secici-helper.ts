/**
 * IkonSecici saf yardımcı fonksiyonları — UI'dan ayrı, test edilebilir.
 * Plan: SKILL.md Kural 131, 139.
 */

import type { KapakIkonu } from "@/lib/kapak-ikon";

/**
 * Sorgu (substring eşleşme, case-insensitive) ile ikon listesini filtreler.
 * Boş sorgu → tüm liste (referans korunur).
 */
export function ikonlariFiltrele(
  sorgu: string,
  tum: readonly KapakIkonu[],
): readonly KapakIkonu[] {
  const q = sorgu.trim().toLowerCase();
  if (!q) return tum;
  return tum.filter((n) => n.toLowerCase().includes(q));
}

/**
 * İkon listesini grid satırlarına böler. `kolonSayisi` 1+, aksi halde tek satır.
 */
export function satirlaraBol<T>(
  isimler: readonly T[],
  kolonSayisi: number,
): T[][] {
  if (kolonSayisi < 1) return [Array.from(isimler)];
  const sonuc: T[][] = [];
  for (let i = 0; i < isimler.length; i += kolonSayisi) {
    sonuc.push(Array.from(isimler.slice(i, i + kolonSayisi)));
  }
  return sonuc;
}
