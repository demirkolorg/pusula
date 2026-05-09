// Sprint 3 / S3-4 — Proje üye değişim tetikleyicileri.

import { db } from "@/lib/db";
import { bildirimUret } from "../services";
import { adSoyad, projeAdiniGetir } from "./_ortak";

// Yardımcı: bir projenin tüm aktif yetkililerini topla — ürünün yetkililerine
// bildirim göndermek için.
async function projeAliciIdleri(
  projeId: string,
  haricId: string | null,
): Promise<string[]> {
  const proje = await db.proje.findUnique({
    where: { id: projeId },
    select: { yetkililer: { select: { kullanici_id: true } } },
  });
  if (!proje) return [];
  const idler = new Set(proje.yetkililer.map((y) => y.kullanici_id));
  if (haricId) idler.delete(haricId);
  return Array.from(idler);
}

// Projeye yetkili eklendi — eklenen kullanıcıya bildirim
export async function tetikleProjeUyeEklendi(opt: {
  projeId: string;
  eklenenId: string;
  ekleyenId: string;
}): Promise<void> {
  if (opt.eklenenId === opt.ekleyenId) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const ekleyenAdi = await adSoyad(opt.ekleyenId);
  await bildirimUret({
    alici_idler: [opt.eklenenId],
    ureten_id: opt.ekleyenId,
    tip: "PROJE_UYE_EKLENDI",
    baslik: `${ekleyenAdi} sizi bir projeye ekledi`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

// Projeden yetkili çıkarıldı — çıkarılan kullanıcıya bildirim
export async function tetikleProjeUyeCikarildi(opt: {
  projeId: string;
  cikarilanId: string;
  cikaranId: string;
}): Promise<void> {
  if (opt.cikarilanId === opt.cikaranId) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const cikaranAdi = await adSoyad(opt.cikaranId);
  await bildirimUret({
    alici_idler: [opt.cikarilanId],
    ureten_id: opt.cikaranId,
    tip: "PROJE_UYE_CIKARILDI",
    baslik: `${cikaranAdi} sizi bir projeden çıkardı`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

// =====================================================================
// Proje yaşam döngüsü — kullanıcı isteği üzerine eklendi
// =====================================================================

export async function tetikleProjeOlusturuldu(opt: {
  projeId: string;
  olusturanId: string;
}): Promise<void> {
  const aliciIdler = await projeAliciIdleri(opt.projeId, opt.olusturanId);
  if (aliciIdler.length === 0) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const adi = await adSoyad(opt.olusturanId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.olusturanId,
    tip: "PROJE_OLUSTURULDU",
    baslik: `${adi} yeni bir proje oluşturdu`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

export async function tetikleProjeGuncellendi(opt: {
  projeId: string;
  degistirenId: string;
}): Promise<void> {
  const aliciIdler = await projeAliciIdleri(opt.projeId, opt.degistirenId);
  if (aliciIdler.length === 0) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const adi = await adSoyad(opt.degistirenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "PROJE_GUNCELLENDI",
    baslik: `${adi} bir proje bilgilerini güncelledi`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

export async function tetikleProjeArsivlendi(opt: {
  projeId: string;
  arsivleyenId: string;
}): Promise<void> {
  const aliciIdler = await projeAliciIdleri(opt.projeId, opt.arsivleyenId);
  if (aliciIdler.length === 0) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const adi = await adSoyad(opt.arsivleyenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.arsivleyenId,
    tip: "PROJE_ARSIVLENDI",
    baslik: `${adi} bir projeyi arşivledi`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

export async function tetikleProjeGeriYuklendi(opt: {
  projeId: string;
  geriYukleyenId: string;
}): Promise<void> {
  const aliciIdler = await projeAliciIdleri(opt.projeId, opt.geriYukleyenId);
  if (aliciIdler.length === 0) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const adi = await adSoyad(opt.geriYukleyenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.geriYukleyenId,
    tip: "PROJE_GERI_YUKLENDI",
    baslik: `${adi} bir projeyi geri yükledi`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

// Silinmeden ÖNCE çağrılmalı — silindikten sonra ilişkili yetkililer cascade
// silinir, alıcı listesi boşalır.
export async function tetikleProjeSilindi(opt: {
  projeId: string;
  silenId: string;
}): Promise<void> {
  const aliciIdler = await projeAliciIdleri(opt.projeId, opt.silenId);
  if (aliciIdler.length === 0) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const adi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.silenId,
    tip: "PROJE_SILINDI",
    baslik: `${adi} yetkili olduğunuz bir projeyi sildi`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}
