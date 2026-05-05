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
 * Bir kart/proje için verilen alıcı listesinden, susturma kaydı olanları
 * çıkar. İki bağımsız susturma katmanı kontrol edilir:
 *  1. Proje susturma — proje_id varsa, susturanlar tüm bildirim akışından
 *     hariç (kart susturmadan bağımsız, daha geniş kapsamlı)
 *  2. Kart susturma — kart_id varsa, kart-spesifik susturmalar
 *
 * Sıra önemsiz; AND mantığı (her ikisinden de geçmek lazım = bildirim
 * gelir).
 */
export async function susturmaSuzgeci(
  aliciIdler: readonly string[],
  kartId: string | null | undefined,
  projeId?: string | null,
): Promise<string[]> {
  if (aliciIdler.length === 0) return [];
  let mevcut: string[] = [...aliciIdler];

  // Proje susturma süzgeci — proje_id verilmişse
  if (projeId) {
    const projeSusturanlar = await db.projeSusturma.findMany({
      where: {
        proje_id: projeId,
        kullanici_id: { in: mevcut },
      },
      select: { kullanici_id: true },
    });
    if (projeSusturanlar.length > 0) {
      const susturulan = new Set(
        projeSusturanlar.map((s) => s.kullanici_id),
      );
      mevcut = mevcut.filter((id) => !susturulan.has(id));
      if (mevcut.length === 0) return [];
    }
  }

  // Kart susturma süzgeci — kart_id verilmişse
  if (kartId) {
    const kartSusturanlar = await db.kartSusturma.findMany({
      where: {
        kart_id: kartId,
        kullanici_id: { in: mevcut },
      },
      select: { kullanici_id: true },
    });
    if (kartSusturanlar.length > 0) {
      const susturulan = new Set(
        kartSusturanlar.map((s) => s.kullanici_id),
      );
      mevcut = mevcut.filter((id) => !susturulan.has(id));
    }
  }

  return mevcut;
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

// =====================================================================
// Proje susturma (KartSusturma'nın eşi, daha geniş kapsamlı)
// =====================================================================

export async function projeSusturuluyorMu(
  kullaniciId: string,
  projeId: string,
): Promise<boolean> {
  const kayit = await db.projeSusturma.findUnique({
    where: {
      kullanici_id_proje_id: {
        kullanici_id: kullaniciId,
        proje_id: projeId,
      },
    },
    select: { kullanici_id: true },
  });
  return !!kayit;
}

export async function projeSustur(
  kullaniciId: string,
  projeId: string,
): Promise<void> {
  await db.projeSusturma.upsert({
    where: {
      kullanici_id_proje_id: {
        kullanici_id: kullaniciId,
        proje_id: projeId,
      },
    },
    create: { kullanici_id: kullaniciId, proje_id: projeId },
    update: {},
  });
}

export async function projeSusturmayiKaldir(
  kullaniciId: string,
  projeId: string,
): Promise<void> {
  await db.projeSusturma
    .delete({
      where: {
        kullanici_id_proje_id: {
          kullanici_id: kullaniciId,
          proje_id: projeId,
        },
      },
    })
    .catch(() => {
      // Kayıt yoksa idempotent
    });
}
