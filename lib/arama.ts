import { Prisma } from "@prisma/client";
import { db } from "./db";

/**
 * Türkçe karakterleri ASCII'ye indirip lower-case yapar.
 * Aranan kelime ile DB'deki `pusula_norm()` çıktısı aynı kurala göre üretildiği
 * için iki taraf birebir karşılaştırılabilir hâle gelir.
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

function aramaSorgusu(opts: {
  tablo: string;
  sutunlar: string[];
  arama: string;
  idAlani?: string;
}) {
  const norm = turkceNormalize(opts.arama);
  if (!norm) return null;
  const pattern = `%${norm}%`;

  // Sütunu önce text'e cast eder (enum tipleri için zorunlu), sonra null-safe
  // birleştirir; "İlçe Milli Eğitim" araması "ILCE_MILLI_EGITIM_MUDURLUGU"
  // enum değerini de bulur.
  const sutunIfadesi = opts.sutunlar
    .map((s) => `pusula_norm(coalesce("${s}"::text, ''))`)
    .join(" || ' ' || ");

  const idAlani = opts.idAlani ?? "id";
  return Prisma.sql`SELECT ${Prisma.raw(`"${idAlani}"`)} AS id
    FROM ${Prisma.raw(`"${opts.tablo}"`)}
    WHERE ${Prisma.raw(sutunIfadesi)} LIKE ${pattern}`;
}

/**
 * UUID ID kullanan tablolar için Türkçe duyarsız arama. Eşleşen kayıtların
 * ID'lerini döner; arama boşsa `null` döner (filtre uygulanmasın).
 *
 * Tablo ve sütun adları kod içinden geldiği için Prisma.raw ile gömülür;
 * arama metni parametre olarak gönderildiğinden enjeksiyon riski yoktur.
 */
export async function aramaUuidIdleri(opts: {
  tablo: string;
  sutunlar: string[];
  arama: string;
  idAlani?: string;
}): Promise<string[] | null> {
  const sql = aramaSorgusu(opts);
  if (!sql) return null;
  const sonuc = await db.$queryRaw<{ id: string }[]>(sql);
  return sonuc.map((r) => r.id);
}

/**
 * BigInt ID kullanan tablolar için (ör. HataLogu, AktiviteLogu).
 */
export async function aramaBigIntIdleri(opts: {
  tablo: string;
  sutunlar: string[];
  arama: string;
  idAlani?: string;
}): Promise<bigint[] | null> {
  const sql = aramaSorgusu(opts);
  if (!sql) return null;
  const sonuc = await db.$queryRaw<{ id: bigint }[]>(sql);
  return sonuc.map((r) => r.id);
}
