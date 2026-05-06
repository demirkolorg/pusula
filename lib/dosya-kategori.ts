// ADR-0028 — Dosya yönetimi çekirdek modeli
// MIME ve dosya adı uzantısından `DosyaKategori` enum değeri belirleme.
// Saf TypeScript — DOM/Prisma/Node import yok; client + server + test ortak.

import { DosyaKategori } from "@prisma/client";

// MIME → kategori sözlüğü. F1 schema'sındaki 8 kategoriye eşler.
const MIME_KATEGORI: Record<string, DosyaKategori> = {
  // Görsel
  "image/png": DosyaKategori.GORSEL,
  "image/jpeg": DosyaKategori.GORSEL,
  "image/jpg": DosyaKategori.GORSEL,
  "image/gif": DosyaKategori.GORSEL,
  "image/webp": DosyaKategori.GORSEL,
  "image/svg+xml": DosyaKategori.GORSEL,
  "image/bmp": DosyaKategori.GORSEL,
  "image/tiff": DosyaKategori.GORSEL,

  // PDF
  "application/pdf": DosyaKategori.PDF,

  // Word (OFIS_BELGESI)
  "application/msword": DosyaKategori.OFIS_BELGESI,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    DosyaKategori.OFIS_BELGESI,
  "application/rtf": DosyaKategori.OFIS_BELGESI,
  "application/vnd.oasis.opendocument.text": DosyaKategori.OFIS_BELGESI,

  // Excel (TABLO)
  "application/vnd.ms-excel": DosyaKategori.TABLO,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    DosyaKategori.TABLO,
  "application/vnd.oasis.opendocument.spreadsheet": DosyaKategori.TABLO,

  // PowerPoint (SUNUM)
  "application/vnd.ms-powerpoint": DosyaKategori.SUNUM,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    DosyaKategori.SUNUM,
  "application/vnd.oasis.opendocument.presentation": DosyaKategori.SUNUM,

  // Metin
  "text/plain": DosyaKategori.METIN,
  "text/csv": DosyaKategori.METIN,
  "text/markdown": DosyaKategori.METIN,
  "text/html": DosyaKategori.METIN,
  "application/json": DosyaKategori.METIN,
  "application/xml": DosyaKategori.METIN,
  "text/xml": DosyaKategori.METIN,

  // Arşiv
  "application/zip": DosyaKategori.ARSIV,
  "application/x-7z-compressed": DosyaKategori.ARSIV,
  "application/x-tar": DosyaKategori.ARSIV,
  "application/gzip": DosyaKategori.ARSIV,
  "application/x-rar-compressed": DosyaKategori.ARSIV,
  "application/x-bzip2": DosyaKategori.ARSIV,
};

// Uzantı → kategori — MIME tanınamadığında fallback.
const UZANTI_KATEGORI: Record<string, DosyaKategori> = {
  // Görsel
  png: DosyaKategori.GORSEL,
  jpg: DosyaKategori.GORSEL,
  jpeg: DosyaKategori.GORSEL,
  gif: DosyaKategori.GORSEL,
  webp: DosyaKategori.GORSEL,
  svg: DosyaKategori.GORSEL,
  bmp: DosyaKategori.GORSEL,
  tiff: DosyaKategori.GORSEL,
  tif: DosyaKategori.GORSEL,

  // PDF
  pdf: DosyaKategori.PDF,

  // Word
  doc: DosyaKategori.OFIS_BELGESI,
  docx: DosyaKategori.OFIS_BELGESI,
  rtf: DosyaKategori.OFIS_BELGESI,
  odt: DosyaKategori.OFIS_BELGESI,

  // Excel
  xls: DosyaKategori.TABLO,
  xlsx: DosyaKategori.TABLO,
  ods: DosyaKategori.TABLO,

  // PowerPoint
  ppt: DosyaKategori.SUNUM,
  pptx: DosyaKategori.SUNUM,
  odp: DosyaKategori.SUNUM,

  // Metin
  txt: DosyaKategori.METIN,
  csv: DosyaKategori.METIN,
  md: DosyaKategori.METIN,
  markdown: DosyaKategori.METIN,
  html: DosyaKategori.METIN,
  htm: DosyaKategori.METIN,
  json: DosyaKategori.METIN,
  xml: DosyaKategori.METIN,
  log: DosyaKategori.METIN,

  // Arşiv
  zip: DosyaKategori.ARSIV,
  "7z": DosyaKategori.ARSIV,
  tar: DosyaKategori.ARSIV,
  gz: DosyaKategori.ARSIV,
  tgz: DosyaKategori.ARSIV,
  rar: DosyaKategori.ARSIV,
  bz2: DosyaKategori.ARSIV,
};

/**
 * Dosya adından uzantıyı çıkarır (lower-case, nokta hariç).
 * "Belge.PDF" → "pdf"; "arşiv.tar.gz" → "gz"; "noisy" → null.
 */
export function dosyaUzantisi(ad: string): string | null {
  const noktaIdx = ad.lastIndexOf(".");
  if (noktaIdx <= 0 || noktaIdx >= ad.length - 1) return null;
  const ham = ad.slice(noktaIdx + 1).toLowerCase();
  const temiz = ham.replace(/[^a-z0-9]/g, "");
  return temiz.length > 0 ? temiz : null;
}

/**
 * MIME ve uzantıdan `DosyaKategori` belirler. MIME bilinmiyorsa uzantıya
 * düşer; o da bilinmiyorsa `DIGER` döner. Backfill ve upload akışları
 * bu fonksiyonu kullanır.
 */
export function dosyaKategorisi(mime: string, ad: string): DosyaKategori {
  const mimeNormal = mime.toLowerCase().trim();
  const mimeKategori = MIME_KATEGORI[mimeNormal];
  if (mimeKategori) return mimeKategori;

  const uzanti = dosyaUzantisi(ad);
  if (uzanti) {
    const uzantiKategori = UZANTI_KATEGORI[uzanti];
    if (uzantiKategori) return uzantiKategori;
  }

  return DosyaKategori.DIGER;
}

/**
 * Kullanıcıya gösterilecek Türkçe kategori etiketi — UI filtreleri ve
 * dropdown'lar için.
 */
export const DOSYA_KATEGORI_ETIKETI: Record<DosyaKategori, string> = {
  [DosyaKategori.GORSEL]: "Görsel",
  [DosyaKategori.PDF]: "PDF",
  [DosyaKategori.OFIS_BELGESI]: "Word",
  [DosyaKategori.TABLO]: "Excel",
  [DosyaKategori.SUNUM]: "PowerPoint",
  [DosyaKategori.METIN]: "Metin",
  [DosyaKategori.ARSIV]: "Arşiv",
  [DosyaKategori.DIGER]: "Diğer",
};
