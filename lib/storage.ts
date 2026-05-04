import { Client as MinioClient } from "minio";

// MinIO storage istemcisi — Eklenti modülü (S4) tarafından kullanılır.
//
// .env değişkenleri (mevcut docker-compose.yml ile uyumlu, defaults ile çalışır):
//   MINIO_ENDPOINT      = "localhost"          (default)
//   MINIO_PORT          = "9000"               (default)
//   MINIO_USE_SSL       = "false"              (dev, prod'da "true")
//   MINIO_ACCESS_KEY    = "pusula_minio"       (default — root user)
//   MINIO_SECRET_KEY    = "pusula_minio_dev_password" (default — root password)
//   MINIO_BUCKET        = "pusula-eklentiler"  (default)
//   MINIO_PUBLIC_HOST   = (opsiyonel) presigned URL'lerde kullanılacak host —
//                         Docker network içinde "minio:9000" → tarayıcıya
//                         "localhost:9000" döndürmek için override
//
// Plan: docs/plan.md Bölüm 5 · Kontrol Kural 72 (mime/boyut whitelist),
// Kural 73 (rate limit), Kural 75 (CSP MinIO origin).

const ENDPOINT = process.env.MINIO_ENDPOINT ?? "localhost";
const PORT = Number(process.env.MINIO_PORT ?? 9000);
const USE_SSL = process.env.MINIO_USE_SSL === "true";
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? "pusula_minio";
const SECRET_KEY = process.env.MINIO_SECRET_KEY ?? "pusula_minio_dev_password";
export const BUCKET = process.env.MINIO_BUCKET ?? "pusula-eklentiler";

let _client: MinioClient | null = null;

export function storageIstemci(): MinioClient {
  if (_client) return _client;
  _client = new MinioClient({
    endPoint: ENDPOINT,
    port: PORT,
    useSSL: USE_SSL,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
  });
  return _client;
}

let _bucketHazir = false;

export async function bucketHazirla(): Promise<void> {
  if (_bucketHazir) return;
  const c = storageIstemci();
  const var_mi = await c.bucketExists(BUCKET);
  if (!var_mi) {
    await c.makeBucket(BUCKET);
  }
  _bucketHazir = true;
}

// =====================================================================
// Mime + boyut beyaz listesi (Kontrol Kural 72)
// =====================================================================

// MVP: ofis dökümanları + yaygın görseller + arşiv. Yürütülebilir + script
// MIME'ler yasak (XSS / dropper ihtimali).
export const IZINLI_MIME = new Set<string>([
  // Görsel
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // PDF
  "application/pdf",
  // Office
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Düz metin
  "text/plain",
  "text/csv",
  "text/markdown",
  // Arşiv
  "application/zip",
  "application/x-7z-compressed",
  "application/x-tar",
  "application/gzip",
]);

// Maks. tek dosya boyutu — 25 MB MVP. Plan'a göre v2'de eklenti tipine göre
// limit ayarlanır.
export const MAKS_BOYUT = 25 * 1024 * 1024;

export function mimeIzinliMi(mime: string): boolean {
  return IZINLI_MIME.has(mime);
}

export function boyutIzinliMi(byte: number): boolean {
  return byte > 0 && byte <= MAKS_BOYUT;
}

// =====================================================================
// Presigned URL helper'ları
// =====================================================================

// 5 dakika geçerli upload URL — istemci doğrudan PUT ile dosyayı yükler.
// Server bu sayede dosya stream'ini taşımaz (Kural 96 ile uyumlu, Node
// memory baskısı yok).
const UPLOAD_TTL = 5 * 60;
const DOWNLOAD_TTL = 10 * 60;

function publicHostuyla(url: string): string {
  const host = process.env.MINIO_PUBLIC_HOST;
  if (!host) return url;
  // "http://minio:9000/..." → "http://localhost:9000/..."
  return url.replace(`${ENDPOINT}:${PORT}`, host);
}

export async function presignedUpload(
  yol: string,
  mime: string,
): Promise<string> {
  await bucketHazirla();
  const c = storageIstemci();
  const url = await c.presignedPutObject(BUCKET, yol, UPLOAD_TTL);
  // Client tarafı PUT'ta Content-Type header'ı zorlamak için signed URL'in
  // verilirken policy bazlı olması gerek; minio-js presignedPutObject sadece
  // PUT'u imzalar. Mime kontrolü server-side metadata kayıt anında yapılır
  // (kullanıcı yanıltıcı mime gönderse bile bizde mime field validate edilmiş).
  void mime; // çağıran tarafından PUT'da Content-Type olarak gönderilir
  return publicHostuyla(url);
}

export async function presignedDownload(yol: string): Promise<string> {
  await bucketHazirla();
  const c = storageIstemci();
  const url = await c.presignedGetObject(BUCKET, yol, DOWNLOAD_TTL);
  return publicHostuyla(url);
}

export async function objeyiSil(yol: string): Promise<void> {
  await bucketHazirla();
  const c = storageIstemci();
  await c.removeObject(BUCKET, yol);
}

// =====================================================================
// Yol üretici — kart_id + nanoid + uzantı, çakışma riski sıfır
// =====================================================================

export function eklentiYoluUret(
  kartId: string,
  dosyaAdi: string,
  rastgele: string,
): string {
  // dosyaAdi'ndan uzantı çek (yoksa boş)
  const noktaIdx = dosyaAdi.lastIndexOf(".");
  const uzanti =
    noktaIdx > 0 && noktaIdx < dosyaAdi.length - 1
      ? dosyaAdi
          .slice(noktaIdx + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 8)
      : "";
  return `kartlar/${kartId}/${rastgele}${uzanti ? "." + uzanti : ""}`;
}
