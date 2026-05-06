// ADR-0028 / F2 — Mevcut `Eklenti` kayıtlarını yeni `Dosya` çekirdek modeline
// taşıyan idempotent backfill script'i.
//
// Çalıştır:
//   bun run prisma/scripts/backfill-eklenti-dosya.ts
//
// Tasarım kararları:
//   - Idempotency: `Dosya.id = Eklenti.id` (aynı UUID). Tekrar çalıştırılırsa
//     `WHERE NOT EXISTS` ile mevcut Dosya kayıtları atlanır → duplicate yok.
//   - Atomik: her Eklenti için Dosya + DosyaSurumu(surum_no=1) + DosyaBaglantisi(KART)
//     üçlüsü tek transaction içinde yazılır. Yarım state oluşmaz.
//   - Storage path korunur: `Dosya.depolama_yolu = Eklenti.depolama_yolu`. Bucket
//     `lib/storage.ts`'in BUCKET sabitinden okunur.
//   - silindi_mi/silinme_zamani/olusturma_zamani Eklenti'den kopyalanır
//     (tarihçe bütünlüğü).
//   - Audit middleware bu script'te DEVREDE DEĞİL (PrismaClient doğrudan
//     kullanılıyor, app/lib/db.ts üzerinden geçilmiyor). Bu kasıtlı: backfill
//     gerçek CREATE değil, taşıma; eski Eklenti audit'i zaten kayıtlı.
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { dosyaKategorisi, dosyaUzantisi } from "../../lib/dosya-kategori";
import { BUCKET } from "../../lib/storage";

export interface BackfillSayilari {
  toplam: number;
  yenilenen: number;
  atlanan: number;
  hata: number;
  hataDetaylari: Array<{ eklentiId: string; mesaj: string }>;
}

/**
 * Eklenti tablosundaki TÜM kayıtları (silinmiş dahil) yeni Dosya modeline
 * taşır. Idempotent — birden fazla çalıştırılabilir.
 */
export async function eklentileriBackfillEt(
  db: PrismaClient,
): Promise<BackfillSayilari> {
  const sayilar: BackfillSayilari = {
    toplam: 0,
    yenilenen: 0,
    atlanan: 0,
    hata: 0,
    hataDetaylari: [],
  };

  const eklentiler = await db.eklenti.findMany({
    select: {
      id: true,
      kart_id: true,
      yukleyen_id: true,
      ad: true,
      mime: true,
      boyut: true,
      depolama_yolu: true,
      silindi_mi: true,
      silinme_zamani: true,
      olusturma_zamani: true,
      kart: {
        select: {
          id: true,
          liste: { select: { id: true, proje_id: true } },
        },
      },
    },
  });

  sayilar.toplam = eklentiler.length;

  for (const e of eklentiler) {
    try {
      const mevcut = await db.dosya.findUnique({
        where: { id: e.id },
        select: { id: true },
      });
      if (mevcut) {
        sayilar.atlanan++;
        continue;
      }

      const uzanti = dosyaUzantisi(e.ad);
      const kategori = dosyaKategorisi(e.mime, e.ad);

      await db.$transaction(async (tx) => {
        await tx.dosya.create({
          data: {
            id: e.id,
            yukleyen_id: e.yukleyen_id,
            ad: e.ad,
            mime: e.mime,
            uzanti,
            kategori,
            boyut: e.boyut,
            bucket: BUCKET,
            depolama_yolu: e.depolama_yolu,
            durum: "HAZIR",
            silindi_mi: e.silindi_mi,
            silinme_zamani: e.silinme_zamani,
            olusturma_zamani: e.olusturma_zamani,
          },
        });

        await tx.dosyaSurumu.create({
          data: {
            dosya_id: e.id,
            surum_no: 1,
            yukleyen_id: e.yukleyen_id,
            ad: e.ad,
            mime: e.mime,
            boyut: e.boyut,
            bucket: BUCKET,
            depolama_yolu: e.depolama_yolu,
            olusturma_zamani: e.olusturma_zamani,
          },
        });

        await tx.dosyaBaglantisi.create({
          data: {
            dosya_id: e.id,
            kaynak_tip: "KART",
            kaynak_id: e.kart_id,
            proje_id: e.kart.liste.proje_id,
            liste_id: e.kart.liste.id,
            kart_id: e.kart_id,
            ekleyen_id: e.yukleyen_id,
            birincil_mi: true,
            olusturma_zamani: e.olusturma_zamani,
          },
        });
      });

      sayilar.yenilenen++;
    } catch (err) {
      sayilar.hata++;
      const mesaj = err instanceof Error ? err.message : String(err);
      sayilar.hataDetaylari.push({ eklentiId: e.id, mesaj });
      console.error(`[backfill] Eklenti ${e.id} hatası: ${mesaj}`);
    }
  }

  return sayilar;
}

async function ana(): Promise<void> {
  const db = new PrismaClient();
  try {
    console.log("ADR-0028 / F2 — Eklenti → Dosya backfill başlatıldı");
    console.log("");

    const sayilar = await eklentileriBackfillEt(db);

    console.log("");
    console.log("Sonuç:");
    console.log(`  Toplam Eklenti          : ${sayilar.toplam}`);
    console.log(`  Yeni Dosya yazıldı      : ${sayilar.yenilenen}`);
    console.log(`  Zaten var, atlandı      : ${sayilar.atlanan}`);
    console.log(`  Hata                    : ${sayilar.hata}`);

    if (sayilar.hata > 0) {
      console.log("");
      console.log("Hatalı kayıtlar:");
      for (const h of sayilar.hataDetaylari) {
        console.log(`  - ${h.eklentiId}: ${h.mesaj}`);
      }
      process.exit(1);
    }
  } finally {
    await db.$disconnect();
  }
}

// Bu script direkt çalıştırılırsa (script olarak), `ana()`'yı tetikle.
// Test'te ise sadece `eklentileriBackfillEt` import edilir; `ana()` çağrılmaz.
// Node + Bun uyumlu kontrol: argv[1] modül URL'iyle eşleşiyor mu?
function direktCalistirilanScriptMi(): boolean {
  try {
    return process.argv[1] === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (direktCalistirilanScriptMi()) {
  ana().catch((e: unknown) => {
    console.error("Backfill beklenmedik hata:", e);
    process.exit(1);
  });
}
