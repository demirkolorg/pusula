// Sprint 3 / S3-4 — Proje üye değişim tetikleyicileri.

import { bildirimUret } from "../services";
import { adSoyad, projeAdiniGetir } from "./_ortak";

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
