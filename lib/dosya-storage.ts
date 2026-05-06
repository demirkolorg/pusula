// ADR-0028 — Dosya yönetimi çekirdek storage altyapısı.
//
// `lib/storage.ts` (kart-eki Eklenti modeli için yazılmış MinIO istemcisi)
// F4 sonrası kaldırılacak; bu modül yeni `Dosya` modeli için bağımsız bucket
// + yol şeması + presigned URL üretimini sağlar.
//
// Plan: docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md (Bölüm 7, 10).
// Yol formatı: `dosyalar/<yyyy>/<mm>/<dosyaId>/<surumNo>/<rastgele>.<ext>`
//   - Yıl/ay segmentasyonu: object listing'leri lokalize tutar (cleanup
//     ve audit kolaylaşır).
//   - dosyaId klasörü: aynı dosyanın tüm sürümleri tek dizin altında.
//   - surumNo segmenti: sürüm immutable; aynı yola tekrar yazma yok.
//
// .env değişkenleri:
//   MINIO_DOSYA_BUCKET = "pusula-dosyalar" (default — Eklenti bucket'ından ayrı)
//   diğer MINIO_* değişkenleri lib/storage.ts ile paylaşılır.

import { storageIstemci } from "./storage";

export const DOSYA_BUCKET =
  process.env.MINIO_DOSYA_BUCKET ?? "pusula-dosyalar";

const UPLOAD_TTL_SN = 5 * 60;
const DOWNLOAD_TTL_SN = 10 * 60;

let _bucketHazir = false;

export async function dosyaBucketHazirla(): Promise<void> {
  if (_bucketHazir) return;
  const c = storageIstemci();
  const var_mi = await c.bucketExists(DOSYA_BUCKET);
  if (!var_mi) {
    await c.makeBucket(DOSYA_BUCKET);
  }
  _bucketHazir = true;
}

/**
 * Saf yol üreteci. Test edilebilir — DOM/Storage import yok.
 *
 * @param dosyaId Dosya UUID'si (sürümlerin ortak prefix'i)
 * @param surumNo 1'den başlayan sürüm numarası
 * @param dosyaAdi Orijinal dosya adı (uzantı çıkarılır)
 * @param rastgele Çakışmasız rastgele segment (ör. nanoid çıktısı)
 * @param tarih Yıl/ay'ı belirleyen referans tarih (default: now)
 */
export function dosyaYoluUret(
  dosyaId: string,
  surumNo: number,
  dosyaAdi: string,
  rastgele: string,
  tarih: Date = new Date(),
): string {
  const yil = tarih.getUTCFullYear();
  const ay = String(tarih.getUTCMonth() + 1).padStart(2, "0");

  const noktaIdx = dosyaAdi.lastIndexOf(".");
  const uzanti =
    noktaIdx > 0 && noktaIdx < dosyaAdi.length - 1
      ? dosyaAdi
          .slice(noktaIdx + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 8)
      : "";

  const son = uzanti ? `${rastgele}.${uzanti}` : rastgele;
  return `dosyalar/${yil}/${ay}/${dosyaId}/${surumNo}/${son}`;
}

/**
 * Path traversal koruması. Yol içinde `..`, başında `/`, kontrol karakteri
 * varsa false döner. Storage anahtarına yazmadan önce çağrılır.
 */
export function dosyaYoluGuvenliMi(yol: string): boolean {
  if (yol.length === 0 || yol.length > 1024) return false;
  if (yol.startsWith("/") || yol.startsWith("\\")) return false;
  if (yol.includes("..")) return false;
  // ASCII control karakterleri ve null byte
  if (/[\x00-\x1f\x7f]/.test(yol)) return false;
  // Yalnız "dosyalar/" prefix'i kabul (hatalı bucket karışmasını önler)
  if (!yol.startsWith("dosyalar/")) return false;
  return true;
}

export async function presignedDosyaUpload(
  yol: string,
  mime: string,
): Promise<string> {
  if (!dosyaYoluGuvenliMi(yol)) {
    throw new Error(`Güvensiz storage yolu: ${yol}`);
  }
  await dosyaBucketHazirla();
  const c = storageIstemci();
  // Mime, client PUT'ta Content-Type header'ı olarak gider; presigned URL
  // sadece PUT'u imzalar (minio-js sınırı). Server-side mime doğrulaması
  // dosyaYuklemeOnaylaEylem'de yapılır.
  void mime;
  return await c.presignedPutObject(DOSYA_BUCKET, yol, UPLOAD_TTL_SN);
}

export async function presignedDosyaDownload(yol: string): Promise<string> {
  if (!dosyaYoluGuvenliMi(yol)) {
    throw new Error(`Güvensiz storage yolu: ${yol}`);
  }
  await dosyaBucketHazirla();
  const c = storageIstemci();
  return await c.presignedGetObject(DOSYA_BUCKET, yol, DOWNLOAD_TTL_SN);
}

/**
 * Storage objesini siler. Kalıcı silme akışında ve orphan cleanup'ta
 * kullanılır. Obje yoksa hata fırlatmaz (idempotent).
 */
export async function dosyaObjesiniSil(yol: string): Promise<void> {
  if (!dosyaYoluGuvenliMi(yol)) {
    throw new Error(`Güvensiz storage yolu: ${yol}`);
  }
  await dosyaBucketHazirla();
  const c = storageIstemci();
  await c.removeObject(DOSYA_BUCKET, yol);
}

/**
 * Upload onaylama akışında object stat ile gerçek boyutu döner. Kullanıcının
 * bildirdiği boyut bu değerle karşılaştırılır (Kural 49 — server tarafı
 * doğrulama).
 */
export async function dosyaObjesiBoyutuAl(yol: string): Promise<number> {
  if (!dosyaYoluGuvenliMi(yol)) {
    throw new Error(`Güvensiz storage yolu: ${yol}`);
  }
  await dosyaBucketHazirla();
  const c = storageIstemci();
  const stat = await c.statObject(DOSYA_BUCKET, yol);
  return stat.size;
}

/**
 * Orphan check — DB'de Dosya kaydı yokken storage'da obje varsa cleanup
 * için döner.
 */
export async function dosyaObjesiVarMi(yol: string): Promise<boolean> {
  if (!dosyaYoluGuvenliMi(yol)) return false;
  try {
    await dosyaBucketHazirla();
    const c = storageIstemci();
    await c.statObject(DOSYA_BUCKET, yol);
    return true;
  } catch {
    return false;
  }
}
