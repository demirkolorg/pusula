// Faz 5.3 — Per-resource mute (bildirim susturma) helper'ı.
//
// Kullanıcı bir karta yönelik tüm bildirimleri durdurmak istediğinde
// `KartSusturma` tablosuna kayıt yazılır. `bildirimUret` alıcı listesini
// bu süzgeçten geçirir; susturulanlar hem in-app hem email kanalından
// çıkarılır.
//
// Tasarım: tercih (BildirimTercih, lib/bildirim-tercih.ts) tip-bazlı
// kapatmadır; susturma kaynak-bazlı kapatma. İki katman bağımsız çalışır:
// önce susturma süzgeci (varsa atla), sonra tercih süzgeci (kanal kapalıysa
// atla). Sıra önemsiz; sonuç AND mantığı.

import { db } from "./db";

/**
 * Bir kart için verilen alıcı listesinden, susturma kaydı olanları çıkar.
 * Saf süzgeç — kart_id null ise (kart bağlamı yok) tüm alıcılar geçer.
 *
 * Tek DB sorgusu: alıcı listesi içinden susturulanlar (`kart_id` eşleşen
 * `kullanici_id IN ...`). İndeks: composite PK + kart_id index var.
 */
export async function susturmaSuzgeci(
  aliciIdler: readonly string[],
  kartId: string | null | undefined,
): Promise<string[]> {
  if (aliciIdler.length === 0) return [];
  if (!kartId) return [...aliciIdler];
  const susturanlar = await db.kartSusturma.findMany({
    where: {
      kart_id: kartId,
      kullanici_id: { in: [...aliciIdler] },
    },
    select: { kullanici_id: true },
  });
  if (susturanlar.length === 0) return [...aliciIdler];
  const susturulan = new Set(susturanlar.map((s) => s.kullanici_id));
  return aliciIdler.filter((id) => !susturulan.has(id));
}

/**
 * Kullanıcının bu kartı susturup susturmadığını döndür. Tek satırlık
 * lookup — UI'da toggle butonunun durumu için kullanılır.
 */
export async function kartSusturuluyorMu(
  kullaniciId: string,
  kartId: string,
): Promise<boolean> {
  const kayit = await db.kartSusturma.findUnique({
    where: {
      kullanici_id_kart_id: {
        kullanici_id: kullaniciId,
        kart_id: kartId,
      },
    },
    select: { kullanici_id: true },
  });
  return !!kayit;
}

/**
 * Kart susturmayı aç — idempotent. Zaten susturulmuşsa no-op.
 */
export async function kartSustur(
  kullaniciId: string,
  kartId: string,
): Promise<void> {
  await db.kartSusturma.upsert({
    where: {
      kullanici_id_kart_id: {
        kullanici_id: kullaniciId,
        kart_id: kartId,
      },
    },
    create: { kullanici_id: kullaniciId, kart_id: kartId },
    update: {},
  });
}

/**
 * Kart susturmayı kaldır — idempotent. Yoksa no-op.
 */
export async function kartSusturmayiKaldir(
  kullaniciId: string,
  kartId: string,
): Promise<void> {
  await db.kartSusturma
    .delete({
      where: {
        kullanici_id_kart_id: {
          kullanici_id: kullaniciId,
          kart_id: kartId,
        },
      },
    })
    .catch(() => {
      // Kayıt yoksa Prisma P2025 — idempotent davranış için yutuluyor.
    });
}
