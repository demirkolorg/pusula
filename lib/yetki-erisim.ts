// Sprint 3 / S3-13 — Kullanıcının erişebileceği proje/liste/kart kümesini
// Prisma where koşulu olarak üreten ortak helper.
//
// dosyalar/services.ts'in `kullaniciKaynakKapsami`'sı buradan delege eder.
// Aynı pattern (proje yetkilisi VEYA proje birim üyesi VEYA liste yetkilisi
// VEYA liste birim üyesi VEYA kart yetkilisi) plan'a göre 7 farklı yerde
// nested OR/EXISTS olarak tekrar ediyordu — tek noktaya toplandı.

import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { kullaniciErisimBilgisi } from "./yetki";

/**
 * Kullanıcının erişebildiği projelerin id listesini döner.
 * Erişim kuralı (proje yetkili VEYA aynı birim VEYA üye listesi/kartı):
 *   - kullanıcı doğrudan ProjeYetkilisi
 *   - aynı birim ProjeBirimi üzerinden
 *   - alt seviyede ListeYetkilisi/KartYetkilisi/ListeBirimi var
 */
export async function kullaniciErisilebilirProjeIdleri(
  kullaniciId: string,
): Promise<string[]> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (erisim.makam) {
    // Makam tüm projelere erişir; çağıran tarafın kapsamı geniş tutması yeter.
    const tum = await db.proje.findMany({
      where: { silindi_mi: false },
      select: { id: true },
    });
    return tum.map((p) => p.id);
  }
  const projeler = await db.proje.findMany({
    where: {
      silindi_mi: false,
      OR: [
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        erisim.birimId
          ? { birimler: { some: { birim_id: erisim.birimId } } }
          : { id: { in: [] } },
        {
          listeler: {
            some: {
              OR: [
                { yetkililer: { some: { kullanici_id: kullaniciId } } },
                erisim.birimId
                  ? { birimler: { some: { birim_id: erisim.birimId } } }
                  : { id: { in: [] } },
                {
                  kartlar: {
                    some: {
                      yetkililer: { some: { kullanici_id: kullaniciId } },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  return projeler.map((p) => p.id);
}

/**
 * Kullanıcının erişebildiği DosyaBaglantisi where koşulu.
 * Kapsamın dışındaki bağlantılar (başka birim/projedeki) sızmaz.
 */
export async function kullaniciDosyaBaglantiKapsami(
  kullaniciId: string,
): Promise<Prisma.DosyaBaglantisiWhereInput> {
  const projeIdleri = await kullaniciErisilebilirProjeIdleri(kullaniciId);
  return {
    OR: [
      { proje_id: { in: projeIdleri } },
      { liste_id: { not: null }, proje_id: { in: projeIdleri } },
      { kart_id: { not: null }, proje_id: { in: projeIdleri } },
    ],
  };
}
