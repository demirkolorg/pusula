// One-shot script: tüm Proje/Liste/Kart sira değerlerini yeni LexoRank alfabesine
// (`0-9` + `A-Z`, lib/sira.ts) yeniden atar. Eski algoritma küçük harf üretiyordu;
// yeni algoritma sadece büyük harf kabul ediyor → DB'deki kayıtlar uyumsuz.
//
// Çalıştır: bun run prisma/scripts/sira-yeniden-hesapla.ts
//
// Algoritma:
//   1. Mevcut sıralamayı (eski sira string'iyle) koru — basit string compare ile sırala.
//   2. Yeni LexoRank string'leri üret: SIRA_BAS'tan başlayıp her elemana siraSonuna ekle.
//   3. Tek transaction içinde update et.
import { PrismaClient } from "@prisma/client";
import { siraSonuna } from "../../lib/sira";
import { auditContext } from "../../lib/audit-context";

// Bu script app/lib/db.ts'ten geçmediği için audit middleware doğrudan
// devrede değil — yine de güvenlik için bypass flag'iyle sarmalıyoruz.
const db = new PrismaClient();

function yeniSiralar(adet: number): string[] {
  const sonuc: string[] = [];
  let son: string | null = null;
  for (let i = 0; i < adet; i++) {
    const yeni = siraSonuna(son);
    sonuc.push(yeni);
    son = yeni;
  }
  return sonuc;
}

async function islem() {
  console.log("Sıra yeniden hesaplama başladı...");

  // Projeler — kurum bazında grupla
  const kurumlar = await db.kurum.findMany({ select: { id: true, ad: true } });
  for (const k of kurumlar) {
    const projeler = await db.proje.findMany({
      where: { kurum_id: k.id },
      orderBy: [{ sira: "asc" }, { olusturma_zamani: "asc" }],
      select: { id: true, sira: true },
    });
    if (projeler.length === 0) continue;
    const yeni = yeniSiralar(projeler.length);
    await db.$transaction(
      projeler.map((p, i) =>
        db.proje.update({ where: { id: p.id }, data: { sira: yeni[i] } }),
      ),
    );
    console.log(`  ✓ Kurum "${k.ad}": ${projeler.length} proje sırası güncellendi`);
  }

  // Listeler — proje bazında grupla
  const projeIdleri = await db.proje.findMany({ select: { id: true, ad: true } });
  for (const p of projeIdleri) {
    const listeler = await db.liste.findMany({
      where: { proje_id: p.id },
      orderBy: [{ sira: "asc" }, { olusturma_zamani: "asc" }],
      select: { id: true, sira: true },
    });
    if (listeler.length === 0) continue;
    const yeni = yeniSiralar(listeler.length);
    await db.$transaction(
      listeler.map((l, i) =>
        db.liste.update({ where: { id: l.id }, data: { sira: yeni[i] } }),
      ),
    );
    console.log(`  ✓ Proje "${p.ad}": ${listeler.length} liste sırası güncellendi`);
  }

  // Kartlar — liste bazında grupla
  const listeIdleri = await db.liste.findMany({ select: { id: true, ad: true } });
  for (const l of listeIdleri) {
    const kartlar = await db.kart.findMany({
      where: { liste_id: l.id },
      orderBy: [{ sira: "asc" }, { olusturma_zamani: "asc" }],
      select: { id: true, sira: true },
    });
    if (kartlar.length === 0) continue;
    const yeni = yeniSiralar(kartlar.length);
    await db.$transaction(
      kartlar.map((k, i) =>
        db.kart.update({ where: { id: k.id }, data: { sira: yeni[i] } }),
      ),
    );
    console.log(`  ✓ Liste "${l.ad}": ${kartlar.length} kart sırası güncellendi`);
  }

  console.log("Bitti.");
}

async function main() {
  await auditContext.run({ bypass: true }, islem);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
