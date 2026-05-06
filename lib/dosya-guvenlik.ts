// ADR-0028 — Dosya yönetimi güvenlik hattı.
//
// Saf doğrulama fonksiyonları. PrismaClient/Storage import yok;
// `dosyaYuklemeBaslatEylem` ve `dosyaYuklemeOnaylaEylem` server action'ları
// tarafından tüketilir.
//
// Plan: docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md (Bölüm 10).
// Kontrol: Kural 49 (Zod validate), 70 (XSS), 71 (SQL injection),
// 72 (mime/extension whitelist + boyut limit), 73 (rate limit).

import { DosyaKategori } from "@prisma/client";
import { dosyaKategorisi, dosyaUzantisi } from "./dosya-kategori";

// =====================================================================
// MIME whitelist — kategori bazlı
// =====================================================================

// İlk faz whitelist'i. Yürütülebilir/script MIME'ler dahil değil. SVG
// inline render edilmediği için (Plan 10.1) burada izin verilse de UI
// görüntüleme yerine indirme/sanitize akışına düşer.
const IZINLI_MIME_KATEGORI: Readonly<Record<string, DosyaKategori>> = {
  // GORSEL
  "image/png": DosyaKategori.GORSEL,
  "image/jpeg": DosyaKategori.GORSEL,
  "image/gif": DosyaKategori.GORSEL,
  "image/webp": DosyaKategori.GORSEL,
  "image/svg+xml": DosyaKategori.GORSEL,

  // PDF
  "application/pdf": DosyaKategori.PDF,

  // OFIS_BELGESI (Word)
  "application/msword": DosyaKategori.OFIS_BELGESI,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    DosyaKategori.OFIS_BELGESI,

  // TABLO (Excel)
  "application/vnd.ms-excel": DosyaKategori.TABLO,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    DosyaKategori.TABLO,

  // SUNUM (PowerPoint)
  "application/vnd.ms-powerpoint": DosyaKategori.SUNUM,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    DosyaKategori.SUNUM,

  // METIN
  "text/plain": DosyaKategori.METIN,
  "text/csv": DosyaKategori.METIN,
  "text/markdown": DosyaKategori.METIN,

  // ARSIV
  "application/zip": DosyaKategori.ARSIV,
  "application/x-7z-compressed": DosyaKategori.ARSIV,
  "application/x-tar": DosyaKategori.ARSIV,
  "application/gzip": DosyaKategori.ARSIV,
};

export function mimeIzinliMi(mime: string): boolean {
  return mime.toLowerCase() in IZINLI_MIME_KATEGORI;
}

// =====================================================================
// Boyut limitleri — kategori bazlı (Plan 10.1)
// =====================================================================

const MB = 1024 * 1024;

const KATEGORI_BOYUT_LIMITI: Record<DosyaKategori, number> = {
  [DosyaKategori.GORSEL]: 25 * MB,
  [DosyaKategori.PDF]: 50 * MB,
  [DosyaKategori.OFIS_BELGESI]: 50 * MB,
  [DosyaKategori.TABLO]: 50 * MB,
  [DosyaKategori.SUNUM]: 50 * MB,
  [DosyaKategori.METIN]: 10 * MB,
  [DosyaKategori.ARSIV]: 100 * MB,
  [DosyaKategori.DIGER]: 25 * MB,
};

export function kategoriBoyutLimiti(kategori: DosyaKategori): number {
  return KATEGORI_BOYUT_LIMITI[kategori];
}

export function boyutKategoriIcinIzinliMi(
  kategori: DosyaKategori,
  byte: number,
): boolean {
  return byte > 0 && byte <= KATEGORI_BOYUT_LIMITI[kategori];
}

// =====================================================================
// MIME ↔ uzantı tutarlılığı
// =====================================================================

// Uzantı → izinli MIME setleri. Aynı uzantı birden fazla MIME ile gelebilir
// (örn .docx hem msword hem openxml deklare edilebilir; pratikte sadece
// openxml geçerli ama yine de tek bir sözlükte tutuyoruz).
const UZANTI_MIME: Readonly<Record<string, ReadonlyArray<string>>> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xls: ["application/vnd.ms-excel"],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  txt: ["text/plain"],
  csv: ["text/csv", "text/plain"],
  md: ["text/markdown", "text/plain"],
  markdown: ["text/markdown", "text/plain"],
  zip: ["application/zip"],
  "7z": ["application/x-7z-compressed"],
  tar: ["application/x-tar"],
  gz: ["application/gzip"],
  tgz: ["application/gzip", "application/x-tar"],
};

/**
 * MIME ile uzantı tutarlı mı? Örn. `application/pdf` + `.docx` reddedilir.
 * Bilinmeyen uzantı veya bilinmeyen MIME → hızlı çıkış: false (whitelist
 * dışı kabul, çağıran tarafta zaten mimeIzinliMi reddeder).
 */
export function mimeUzantiTutarliMi(mime: string, dosyaAdi: string): boolean {
  const mimeNormal = mime.toLowerCase();
  const uzanti = dosyaUzantisi(dosyaAdi);
  if (!uzanti) return false;
  const beklenen = UZANTI_MIME[uzanti];
  if (!beklenen) return false;
  return beklenen.includes(mimeNormal);
}

// =====================================================================
// Magic-byte signature kontrolü
// =====================================================================

// Yaygın binary formatların ilk byte imzaları. Buffer'ın başlangıcı bu
// imzayla eşleşmeli; eşleşmezse mime sahteciliği şüphesi.
//
// Office openxml ve zip aynı imzayı paylaşır (PK\x03\x04) — bu beklenen
// davranış (docx/xlsx/pptx birer zip arşivi).
const MIME_IMZA: Readonly<
  Record<string, ReadonlyArray<ReadonlyArray<number>>>
> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF; WEBP doğrulaması offset 8'de
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "application/zip": [[0x50, 0x4b, 0x03, 0x04]],
  "application/x-7z-compressed": [
    [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c],
  ],
  "application/gzip": [[0x1f, 0x8b]],
  // Office openxml zip-temelli; aynı imza
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    [[0x50, 0x4b, 0x03, 0x04]],
  // Eski Office (CFB/CDF compound document)
  "application/msword": [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  ],
  "application/vnd.ms-excel": [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  ],
  "application/vnd.ms-powerpoint": [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  ],
};

/**
 * Buffer'ın ilk byte'larının verilen MIME için beklenen imzayla eşleşip
 * eşleşmediğini döner. Tanımlanmamış MIME için `null` döner — çağıran
 * "kontrol uygulanamadı" davranışı seçer (text/* için tipik).
 */
export function magicByteEsleseMi(
  baytlar: Uint8Array,
  mime: string,
): boolean | null {
  const imzalar = MIME_IMZA[mime.toLowerCase()];
  if (!imzalar) return null;
  for (const imza of imzalar) {
    if (baytlar.length < imza.length) continue;
    let eslesti = true;
    for (let i = 0; i < imza.length; i++) {
      if (baytlar[i] !== imza[i]) {
        eslesti = false;
        break;
      }
    }
    if (eslesti) return true;
  }
  return false;
}

// =====================================================================
// Kategori-mime tutarlılığı
// =====================================================================

/**
 * Bildirilen MIME ile dosya adından çıkarılan kategori uyumlu mu?
 * `dosyaKategorisi(mime, ad)` ile hesaplanır; UI'da bildirilen kategoriyle
 * sunucu tarafı kategori farklıysa reddedilir.
 */
export function kategoriMimeIcinUygunMu(
  mime: string,
  dosyaAdi: string,
  beklenen: DosyaKategori,
): boolean {
  return dosyaKategorisi(mime, dosyaAdi) === beklenen;
}

// =====================================================================
// Tek noktadan upload doğrulama
// =====================================================================

export type UploadDogrulamaSonuc =
  | { gecerli: true; kategori: DosyaKategori }
  | { gecerli: false; sebep: string; alan: string };

export interface UploadDogrulamaGirdi {
  ad: string;
  mime: string;
  boyut: number;
}

/**
 * Upload başlatma akışında çağrılır: mime whitelist, mime/uzantı tutarlılık,
 * kategori bazlı boyut limiti tek seferde kontrol eder. Magic-byte gerçek
 * binary geldiğinde (`onayla` aşamasında) ayrı çağrılır.
 */
export function uploadGirdisiniDogrula(
  girdi: UploadDogrulamaGirdi,
): UploadDogrulamaSonuc {
  if (!girdi.ad || girdi.ad.length > 255) {
    return {
      gecerli: false,
      sebep: "Dosya adı boş veya çok uzun (max 255).",
      alan: "ad",
    };
  }
  if (!mimeIzinliMi(girdi.mime)) {
    return {
      gecerli: false,
      sebep: `MIME tipine izin verilmiyor: ${girdi.mime}`,
      alan: "mime",
    };
  }
  if (!mimeUzantiTutarliMi(girdi.mime, girdi.ad)) {
    return {
      gecerli: false,
      sebep: `Dosya uzantısı (${girdi.ad}) bildirilen MIME ile (${girdi.mime}) uyumlu değil.`,
      alan: "ad",
    };
  }
  const kategori = dosyaKategorisi(girdi.mime, girdi.ad);
  if (!boyutKategoriIcinIzinliMi(kategori, girdi.boyut)) {
    const limitMb = Math.round(KATEGORI_BOYUT_LIMITI[kategori] / MB);
    return {
      gecerli: false,
      sebep: `${kategori} dosyası ${limitMb}MB sınırını aşıyor.`,
      alan: "boyut",
    };
  }
  return { gecerli: true, kategori };
}
