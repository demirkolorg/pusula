// Sprint 3 / S3-4 — Liste bildirim tetikleyicileri.

import { db } from "@/lib/db";
import { bildirimUret } from "../services";
import { adSoyad } from "./_ortak";

async function listeBaglami(
  listeId: string,
): Promise<{ ad: string; proje_id: string } | null> {
  return db.liste.findUnique({
    where: { id: listeId },
    select: { ad: true, proje_id: true },
  });
}

// Listenin tüm kullanıcılarını topla — liste yetkilileri + proje yetkilileri.
// Yeni liste oluşturma / güncelleme bildirimleri için.
async function listeAliciIdleri(
  listeId: string,
  haricId: string | null,
): Promise<{
  aliciIdler: string[];
  ad: string;
  projeId: string;
} | null> {
  const liste = await db.liste.findUnique({
    where: { id: listeId },
    select: {
      ad: true,
      proje_id: true,
      yetkililer: { select: { kullanici_id: true } },
      proje: {
        select: {
          yetkililer: { select: { kullanici_id: true } },
        },
      },
    },
  });
  if (!liste) return null;
  const idler = new Set<string>();
  for (const y of liste.yetkililer) idler.add(y.kullanici_id);
  for (const y of liste.proje.yetkililer) idler.add(y.kullanici_id);
  if (haricId) idler.delete(haricId);
  return {
    aliciIdler: Array.from(idler),
    ad: liste.ad,
    projeId: liste.proje_id,
  };
}

export async function tetikleListeOlusturuldu(opt: {
  listeId: string;
  olusturanId: string;
}): Promise<void> {
  const ctx = await listeAliciIdleri(opt.listeId, opt.olusturanId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.olusturanId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.olusturanId,
    tip: "LISTE_OLUSTURULDU",
    baslik: `${adi} yeni bir liste oluşturdu`,
    ozet: ctx.ad,
    proje_id: ctx.projeId,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}

export async function tetikleListeGuncellendi(opt: {
  listeId: string;
  degistirenId: string;
}): Promise<void> {
  const ctx = await listeAliciIdleri(opt.listeId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "LISTE_GUNCELLENDI",
    baslik: `${adi} bir liste bilgilerini güncelledi`,
    ozet: ctx.ad,
    proje_id: ctx.projeId,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}

export async function tetikleListeUyeEklendi(opt: {
  listeId: string;
  eklenenId: string;
  ekleyenId: string;
}): Promise<void> {
  if (opt.eklenenId === opt.ekleyenId) return;
  const liste = await listeBaglami(opt.listeId);
  if (!liste) return;
  const ekleyenAdi = await adSoyad(opt.ekleyenId);
  await bildirimUret({
    alici_idler: [opt.eklenenId],
    ureten_id: opt.ekleyenId,
    tip: "LISTE_UYE_EKLENDI",
    baslik: `${ekleyenAdi} sizi bir liste yetkilisi olarak ekledi`,
    ozet: liste.ad,
    proje_id: liste.proje_id,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}

export async function tetikleListeUyeCikarildi(opt: {
  listeId: string;
  cikarilanId: string;
  cikaranId: string;
}): Promise<void> {
  if (opt.cikarilanId === opt.cikaranId) return;
  const liste = await listeBaglami(opt.listeId);
  if (!liste) return;
  const cikaranAdi = await adSoyad(opt.cikaranId);
  await bildirimUret({
    alici_idler: [opt.cikarilanId],
    ureten_id: opt.cikaranId,
    tip: "LISTE_UYE_CIKARILDI",
    baslik: `${cikaranAdi} sizi bir liste yetkililiğinden çıkardı`,
    ozet: liste.ad,
    proje_id: liste.proje_id,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}

// Liste silinmeden ÖNCE çağrılmalı: silindikten sonra ListeYetkilisi cascade
// ile temizlenir, alıcı listesi boşalır. Action'da sıralama: önce tetikle,
// sonra delete.
export async function tetikleListeSilindi(opt: {
  listeId: string;
  silenId: string;
}): Promise<void> {
  const liste = await db.liste.findUnique({
    where: { id: opt.listeId },
    select: {
      ad: true,
      proje_id: true,
      yetkililer: { select: { kullanici_id: true } },
    },
  });
  if (!liste) return;
  const aliciIdler = liste.yetkililer
    .map((y) => y.kullanici_id)
    .filter((id) => id !== opt.silenId);
  if (aliciIdler.length === 0) return;
  const silenAdi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.silenId,
    tip: "LISTE_SILINDI",
    baslik: `${silenAdi} yetkili olduğunuz bir listeyi sildi`,
    ozet: liste.ad,
    proje_id: liste.proje_id,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}
