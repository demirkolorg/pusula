/**
 * Sistem renk token'ları — inline CSS yazılmaz, helper className üretir.
 *
 * SİSTEM RENKLERİ (3):
 *   primary   → lacivert (BAKANLIK paneli)
 *   secondary → kahve/turuncu (BAKANLIK butonu)
 *   tertiary  → kırmızı (üst şerit)
 *
 * PALET RENKLERİ (12) — etiket / kart kapağı / kategori için:
 *   kirmizi, turuncu, amber, sari, yesil, zumrut,
 *   camgobegi, mavi, lacivert, mor, pembe, kahve
 */

const SISTEM_TOKENLERI = ["primary", "secondary", "tertiary"] as const;

const PALET_TOKENLERI = [
  "kirmizi",
  "turuncu",
  "amber",
  "sari",
  "yesil",
  "zumrut",
  "camgobegi",
  "mavi",
  "lacivert",
  "mor",
  "pembe",
  "kahve",
] as const;

export const KAPAK_RENK_TOKENLERI = [
  ...SISTEM_TOKENLERI,
  ...PALET_TOKENLERI,
] as const;

export type SistemRengi = (typeof SISTEM_TOKENLERI)[number];
export type PaletRengi = (typeof PALET_TOKENLERI)[number];
export type KapakRenk = (typeof KAPAK_RENK_TOKENLERI)[number];

const ETIKETLER: Record<KapakRenk, string> = {
  primary: "Birincil",
  secondary: "İkincil",
  tertiary: "Üçüncül",
  kirmizi: "Kırmızı",
  turuncu: "Turuncu",
  amber: "Amber",
  sari: "Sarı",
  yesil: "Yeşil",
  zumrut: "Zümrüt",
  camgobegi: "Camgöbeği",
  mavi: "Mavi",
  lacivert: "Lacivert",
  mor: "Mor",
  pembe: "Pembe",
  kahve: "Kahve",
};

const ARKAPLAN_SINIFLARI: Record<KapakRenk, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  tertiary: "bg-tertiary",
  kirmizi: "bg-palet-kirmizi",
  turuncu: "bg-palet-turuncu",
  amber: "bg-palet-amber",
  sari: "bg-palet-sari",
  yesil: "bg-palet-yesil",
  zumrut: "bg-palet-zumrut",
  camgobegi: "bg-palet-camgobegi",
  mavi: "bg-palet-mavi",
  lacivert: "bg-palet-lacivert",
  mor: "bg-palet-mor",
  pembe: "bg-palet-pembe",
  kahve: "bg-palet-kahve",
};

const METIN_SINIFLARI: Record<KapakRenk, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  kirmizi: "text-palet-kirmizi",
  turuncu: "text-palet-turuncu",
  amber: "text-palet-amber",
  sari: "text-palet-sari",
  yesil: "text-palet-yesil",
  zumrut: "text-palet-zumrut",
  camgobegi: "text-palet-camgobegi",
  mavi: "text-palet-mavi",
  lacivert: "text-palet-lacivert",
  mor: "text-palet-mor",
  pembe: "text-palet-pembe",
  kahve: "text-palet-kahve",
};

const KENAR_SINIFLARI: Record<KapakRenk, string> = {
  primary: "border-primary",
  secondary: "border-secondary",
  tertiary: "border-tertiary",
  kirmizi: "border-palet-kirmizi",
  turuncu: "border-palet-turuncu",
  amber: "border-palet-amber",
  sari: "border-palet-sari",
  yesil: "border-palet-yesil",
  zumrut: "border-palet-zumrut",
  camgobegi: "border-palet-camgobegi",
  mavi: "border-palet-mavi",
  lacivert: "border-palet-lacivert",
  mor: "border-palet-mor",
  pembe: "border-palet-pembe",
  kahve: "border-palet-kahve",
};

const TUM_TOKENLER: ReadonlySet<string> = new Set(KAPAK_RENK_TOKENLERI);

/** Verilen değer geçerli bir token mı? */
export function tokenMi(deger: string | null | undefined): deger is KapakRenk {
  return typeof deger === "string" && TUM_TOKENLER.has(deger);
}

/** Token'dan `bg-...` className üretir. Token değilse `null`. Hata fırlatmaz. */
export function kapakArkaplanSinifi(
  deger: string | null | undefined,
): string | null {
  return tokenMi(deger) ? ARKAPLAN_SINIFLARI[deger] : null;
}

/** Token'dan `text-...` className üretir. Token değilse `null`. */
export function kapakMetinSinifi(
  deger: string | null | undefined,
): string | null {
  return tokenMi(deger) ? METIN_SINIFLARI[deger] : null;
}

/** Token'dan `border-...` className üretir. Token değilse `null`. */
export function kapakKenarSinifi(
  deger: string | null | undefined,
): string | null {
  return tokenMi(deger) ? KENAR_SINIFLARI[deger] : null;
}

/** Token için Türkçe etiket. Bilinmeyen değerlerde `null`. */
export function kapakEtiketi(deger: string | null | undefined): string | null {
  return tokenMi(deger) ? ETIKETLER[deger] : null;
}

/** Sadece sistem renkleri (eski form için kısa palet). */
export const SISTEM_RENKLERI: readonly SistemRengi[] = SISTEM_TOKENLERI;

/** Sadece 12 paletteki renk (etiket vb. için). */
export const PALET_RENKLERI: readonly PaletRengi[] = PALET_TOKENLERI;
