// ADR-0028 — Dosya türüne göre önizleme stratejisi.
//
// UI bileşeni dosyayı render etmeden önce bu helper'ı çağırır; sonuç
// stratejiye göre `<NextImage>`, `<iframe>`, `<DOMPurify>` veya
// "İndir" butonu gösterir.
//
// Plan: docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md (Bölüm 12).
// Saf TypeScript — DOM/storage/Prisma import yok; her ortamda kullanılabilir.

import { DosyaDurumu, DosyaKategori } from "@prisma/client";

/**
 * Önizleme yöneticisi tarafından seçilen render stratejisi.
 *
 * - GORSEL_VIEWER: <next/image> veya <img signed-url>; zoom + indir.
 * - PDF_IFRAME: sandbox'lı iframe; yeni sekme fallback.
 * - METIN_PLAIN: server'dan boyut limitli text — <pre> içinde gösterim.
 * - MARKDOWN_SANITIZE: server'dan markdown → HTML (DOMPurify zorunlu).
 * - OFIS_INDIR: Word/Excel/PowerPoint için indir + ikon. v2'de PDF
 *   conversion stratejisi açılır.
 * - ARSIV_INDIR: Zip/7z/tar için içerik listeleme yok, sadece indir.
 * - INDIR_FALLBACK: SVG, KARANTINA, bilinmeyen kategori — yalnız indir.
 */
export const ONIZLEME_STRATEJI = {
  GORSEL_VIEWER: "GORSEL_VIEWER",
  PDF_IFRAME: "PDF_IFRAME",
  METIN_PLAIN: "METIN_PLAIN",
  MARKDOWN_SANITIZE: "MARKDOWN_SANITIZE",
  OFIS_INDIR: "OFIS_INDIR",
  ARSIV_INDIR: "ARSIV_INDIR",
  INDIR_FALLBACK: "INDIR_FALLBACK",
} as const;

export type OnizlemeStrateji =
  (typeof ONIZLEME_STRATEJI)[keyof typeof ONIZLEME_STRATEJI];

const SVG_MIME = new Set(["image/svg+xml"]);
const MARKDOWN_MIME = new Set(["text/markdown"]);
const PLAIN_TEXT_MIME = new Set(["text/plain", "text/csv"]);

/**
 * Kategori + MIME + dosya durumuna göre önizleme stratejisi seçer.
 *
 * Güvenlik kuralları:
 *   - SVG inline render YASAK (Plan 10.1, Kural 70 XSS) → INDIR_FALLBACK.
 *   - KARANTINA durumdaki dosya hiçbir şekilde önizlenmez → INDIR_FALLBACK.
 *   - YUKLENIYOR durumdaki dosya henüz tamamlanmamış → INDIR_FALLBACK.
 *   - HATALI durumdaki dosya zaten erişilebilir değil → INDIR_FALLBACK.
 */
export function onizlemeStratejisi(
  kategori: DosyaKategori,
  mime: string,
  durum: DosyaDurumu,
): OnizlemeStrateji {
  // 1. Durum filtresi — KARANTINA/YUKLENIYOR/HATALI önizlenmez.
  if (durum !== DosyaDurumu.HAZIR) {
    return ONIZLEME_STRATEJI.INDIR_FALLBACK;
  }

  const mimeNormal = mime.toLowerCase();

  // 2. SVG XSS koruması — kategori GORSEL olsa bile inline render yok.
  if (SVG_MIME.has(mimeNormal)) {
    return ONIZLEME_STRATEJI.INDIR_FALLBACK;
  }

  // 3. Kategori bazlı karar
  switch (kategori) {
    case DosyaKategori.GORSEL:
      return ONIZLEME_STRATEJI.GORSEL_VIEWER;

    case DosyaKategori.PDF:
      return ONIZLEME_STRATEJI.PDF_IFRAME;

    case DosyaKategori.METIN:
      if (MARKDOWN_MIME.has(mimeNormal)) {
        return ONIZLEME_STRATEJI.MARKDOWN_SANITIZE;
      }
      if (PLAIN_TEXT_MIME.has(mimeNormal)) {
        return ONIZLEME_STRATEJI.METIN_PLAIN;
      }
      return ONIZLEME_STRATEJI.METIN_PLAIN;

    case DosyaKategori.OFIS_BELGESI:
    case DosyaKategori.TABLO:
    case DosyaKategori.SUNUM:
      return ONIZLEME_STRATEJI.OFIS_INDIR;

    case DosyaKategori.ARSIV:
      return ONIZLEME_STRATEJI.ARSIV_INDIR;

    case DosyaKategori.DIGER:
      return ONIZLEME_STRATEJI.INDIR_FALLBACK;
  }
}

/**
 * Önizleme stratejisinin tarayıcıda inline render olup olmadığını döner.
 * UI gerçek önizleme paneli mi gösterecek yoksa indirme prompt'u mu açacak
 * — bu fonksiyondan karar verir.
 */
export function inlineOnizlemeMi(strateji: OnizlemeStrateji): boolean {
  switch (strateji) {
    case ONIZLEME_STRATEJI.GORSEL_VIEWER:
    case ONIZLEME_STRATEJI.PDF_IFRAME:
    case ONIZLEME_STRATEJI.METIN_PLAIN:
    case ONIZLEME_STRATEJI.MARKDOWN_SANITIZE:
      return true;
    case ONIZLEME_STRATEJI.OFIS_INDIR:
    case ONIZLEME_STRATEJI.ARSIV_INDIR:
    case ONIZLEME_STRATEJI.INDIR_FALLBACK:
      return false;
  }
}

/**
 * Türkçe etiket — UI tooltip ve "Bu dosya nasıl açılır?" açıklamaları için.
 */
export const ONIZLEME_STRATEJI_ETIKETI: Record<OnizlemeStrateji, string> = {
  [ONIZLEME_STRATEJI.GORSEL_VIEWER]: "Görsel önizleme",
  [ONIZLEME_STRATEJI.PDF_IFRAME]: "PDF önizleme",
  [ONIZLEME_STRATEJI.METIN_PLAIN]: "Metin önizleme",
  [ONIZLEME_STRATEJI.MARKDOWN_SANITIZE]: "Markdown önizleme",
  [ONIZLEME_STRATEJI.OFIS_INDIR]: "Office dosyası — indir",
  [ONIZLEME_STRATEJI.ARSIV_INDIR]: "Arşiv — indir",
  [ONIZLEME_STRATEJI.INDIR_FALLBACK]: "Önizleme yok — indir",
};
