/**
 * Proje kapak ikonu — lucide-react ikon ismini saklayan token modeli.
 *
 * Plan: docs/adr/0010-proje-kapak-ikonu.md
 * Kontrol: SKILL.md Kural 26 (lucide-react tek kütüphane), Kural 49 (Zod whitelist).
 *
 * İkon isimleri kebab-case lucide ID'leri (örn "star", "heart-pulse", "building-2").
 * `iconNames` lucide-react/dynamic alt entry'sinden gelir; runtime tarafında
 * `<DynamicIcon name=...>` lazy fetch eder. Statik `import { Star }` yapmaz.
 */
import { iconNames } from "lucide-react/dynamic";

const GECERLI_IKONLAR: ReadonlySet<string> = new Set(iconNames);

export type KapakIkonu = string;

/** Verilen değer geçerli bir lucide ikon ismi mi? */
export function ikonMu(deger: unknown): deger is KapakIkonu {
  return typeof deger === "string" && GECERLI_IKONLAR.has(deger);
}

/**
 * Serbest girdiyi token'a normalize eder. String + whitelist'te değilse `null`.
 * Hata fırlatmaz; null'a düşürür.
 */
export function ikonNormalize(deger: unknown): KapakIkonu | null {
  return ikonMu(deger) ? deger : null;
}

/** Whitelist setinin boyutu — UI debug ve test için. */
export const IKON_SAYISI = GECERLI_IKONLAR.size;

/** Tüm geçerli ikon isimleri (sıralanmış). UI picker için. */
export const TUM_IKONLAR: readonly string[] = iconNames;
