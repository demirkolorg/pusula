// Faz 3.1 — Bildirim tercih lookup helper.
//
// `BildirimTercih` modeli: kullanıcı × tip × kanal (in_app, email).
// Kayıt yoksa default açık (kullanıcı vizyonu — opt-out). UI tercih
// sayfası kayıt olmayan tipleri gerektiğinde lazy oluşturur.
//
// `tetikleyiciler.ts` aliciIdler'ı `bildirimUret`'e iletir; orada
// tercihAliciFiltresi kanal bazlı süzme yapar. Üretim sırası:
// alıcı listesi → benzersiz → ureten ele → tercih süzme → DB insert.

import { db } from "./db";
import type { BildirimTipi } from "@prisma/client";

export type BildirimKanali = "in_app" | "email";

const VARSAYILAN_AKIK = true;

/**
 * Verilen alıcı listesi içinden, ilgili tip ve kanalda tercihi açık
 * olanları döndür. Saf veri sorgusu — side-effect yok.
 *
 * - Tek DB sorgusu (`findMany` with `in:` filter)
 * - Kayıt olmayan kullanıcılar default = açık kabul edilir
 *
 * @returns Süzülmüş alıcı id listesi (orijinal sırasını korur)
 */
export async function tercihAliciFiltresi(
  aliciIdler: readonly string[],
  tip: BildirimTipi,
  kanal: BildirimKanali,
): Promise<string[]> {
  if (aliciIdler.length === 0) return [];
  const tercihler = await db.bildirimTercih.findMany({
    where: { kullanici_id: { in: [...aliciIdler] }, tip },
    select: {
      kullanici_id: true,
      in_app_acik: true,
      email_acik: true,
    },
  });
  const tercihMap = new Map<
    string,
    { in_app_acik: boolean; email_acik: boolean }
  >();
  for (const t of tercihler) {
    tercihMap.set(t.kullanici_id, {
      in_app_acik: t.in_app_acik,
      email_acik: t.email_acik,
    });
  }
  return aliciIdler.filter((id) => {
    const t = tercihMap.get(id);
    if (!t) return VARSAYILAN_AKIK;
    return kanal === "in_app" ? t.in_app_acik : t.email_acik;
  });
}
