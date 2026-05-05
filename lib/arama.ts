import { Prisma } from "@prisma/client";
import { db } from "./db";
import { turkceNormalize } from "./arama-normalize";

export { turkceNormalize };

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
