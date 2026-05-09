// Sprint 3 / S3-4 — Kontrol listesi (madde) bildirim tetikleyicileri.
// Madde atama + ADR-0019 madde tamamlama öneri akışı (3 olay).

import { db } from "@/lib/db";
import { kisalt } from "@/lib/metin-helpers";
import { bildirimUret } from "../services";
import {
  adSoyad,
  kartBaglami,
  kartTamamlamaYetkilileriniBul,
  kartUyeleriniToplaHaricli,
  maddeBaglami,
} from "./_ortak";

// =====================================================================
// Kontrol maddesi atama — atanan kullanıcıya bildirim
// =====================================================================

export async function tetikleMaddeAtama(opt: {
  maddeId: string;
  metin: string;
  atananId: string;
  atayanId: string;
}): Promise<void> {
  if (opt.atananId === opt.atayanId) return;
  // Madde bağlamından kart bul
  const m = await db.kontrolMaddesi.findUnique({
    where: { id: opt.maddeId },
    select: {
      kontrol_listesi: {
        select: { kart_id: true },
      },
    },
  });
  if (!m) return;
  const kart = await kartBaglami(m.kontrol_listesi.kart_id);
  if (!kart) return;
  const atayanAdi = await adSoyad(opt.atayanId);
  await bildirimUret({
    alici_idler: [opt.atananId],
    ureten_id: opt.atayanId,
    tip: "MADDE_ATAMA",
    baslik: `${atayanAdi} size bir madde atadı`,
    ozet: `${kart.baslik}: ${kisalt(opt.metin, 80)}`,
    kart_id: m.kontrol_listesi.kart_id,
    proje_id: kart.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

// =====================================================================
// ADR-0019 — Madde tamamlama öneri akışı (3 olay)
// =====================================================================

export async function tetikleMaddeTamamlamaOnerildi(opt: {
  maddeId: string;
  onerenId: string;
}): Promise<void> {
  const ctx = await maddeBaglami(opt.maddeId);
  if (!ctx) return;
  const aliciIdler = await kartTamamlamaYetkilileriniBul(ctx.kart_id, [
    opt.onerenId,
  ]);
  if (aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.onerenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.onerenId,
    tip: "MADDE_TAMAMLAMA_ONERILDI",
    baslik: `${adi} bir maddenin tamamlandığını bildirdi`,
    ozet: `${ctx.kart_baslik} → ${kisalt(ctx.metin, 80)}`,
    kart_id: ctx.kart_id,
    proje_id: ctx.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

export async function tetikleMaddeTamamlamaOnaylandi(opt: {
  maddeId: string;
  onayliyenId: string;
  onerenId: string;
}): Promise<void> {
  const ctx = await maddeBaglami(opt.maddeId);
  if (!ctx) return;
  if (opt.onayliyenId === opt.onerenId) return;
  const adi = await adSoyad(opt.onayliyenId);
  await bildirimUret({
    alici_idler: [opt.onerenId],
    ureten_id: opt.onayliyenId,
    tip: "MADDE_TAMAMLAMA_ONAYLANDI",
    baslik: `${adi} madde tamamlama önerinizi onayladı`,
    ozet: `${ctx.kart_baslik} → ${kisalt(ctx.metin, 80)}`,
    kart_id: ctx.kart_id,
    proje_id: ctx.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

export async function tetikleMaddeTamamlamaReddedildi(opt: {
  maddeId: string;
  reddedenId: string;
  onerenId: string;
  sebep: string | null;
}): Promise<void> {
  const ctx = await maddeBaglami(opt.maddeId);
  if (!ctx) return;
  if (opt.reddedenId === opt.onerenId) return;
  const adi = await adSoyad(opt.reddedenId);
  const ozetBase = `${ctx.kart_baslik} → ${kisalt(ctx.metin, 80)}`;
  const ozet = opt.sebep
    ? `${ozetBase} — Sebep: ${kisalt(opt.sebep, 120)}`
    : ozetBase;
  await bildirimUret({
    alici_idler: [opt.onerenId],
    ureten_id: opt.reddedenId,
    tip: "MADDE_TAMAMLAMA_REDDEDILDI",
    baslik: `${adi} madde tamamlama önerinizi reddetti`,
    ozet,
    kart_id: ctx.kart_id,
    proje_id: ctx.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

// =====================================================================
// Kontrol listesi yaşam döngüsü — kart üyelerine bildirim
// =====================================================================

async function listeKartBaglami(kontrolListeId: string): Promise<{
  kartId: string;
  baslik: string;
  proje_id: string;
} | null> {
  const kl = await db.kontrolListesi.findUnique({
    where: { id: kontrolListeId },
    select: {
      baslik: true,
      kart: {
        select: {
          id: true,
          baslik: true,
          liste: { select: { proje_id: true } },
        },
      },
    },
  });
  if (!kl) return null;
  return {
    kartId: kl.kart.id,
    baslik: kl.baslik,
    proje_id: kl.kart.liste.proje_id,
  };
}

export async function tetikleKontrolListesiOlusturuldu(opt: {
  kontrolListeId: string;
  olusturanId: string;
}): Promise<void> {
  const meta = await listeKartBaglami(opt.kontrolListeId);
  if (!meta) return;
  const ctx = await kartUyeleriniToplaHaricli(meta.kartId, opt.olusturanId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.olusturanId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.olusturanId,
    tip: "KONTROL_LISTESI_OLUSTURULDU",
    baslik: `${adi} bir karta kontrol listesi ekledi`,
    ozet: `${ctx.baslik} → ${meta.baslik}`,
    kart_id: meta.kartId,
    proje_id: meta.proje_id,
    kaynak_tip: "KontrolListesi",
    kaynak_id: opt.kontrolListeId,
  });
}

export async function tetikleKontrolListesiGuncellendi(opt: {
  kontrolListeId: string;
  degistirenId: string;
}): Promise<void> {
  const meta = await listeKartBaglami(opt.kontrolListeId);
  if (!meta) return;
  const ctx = await kartUyeleriniToplaHaricli(meta.kartId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "KONTROL_LISTESI_GUNCELLENDI",
    baslik: `${adi} bir kontrol listesini güncelledi`,
    ozet: `${ctx.baslik} → ${meta.baslik}`,
    kart_id: meta.kartId,
    proje_id: meta.proje_id,
    kaynak_tip: "KontrolListesi",
    kaynak_id: opt.kontrolListeId,
  });
}

// Silinmeden ÖNCE çağrılmalı — silindikten sonra liste yok olur, baglam null.
export async function tetikleKontrolListesiSilindi(opt: {
  kontrolListeId: string;
  silenId: string;
}): Promise<void> {
  const meta = await listeKartBaglami(opt.kontrolListeId);
  if (!meta) return;
  const ctx = await kartUyeleriniToplaHaricli(meta.kartId, opt.silenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.silenId,
    tip: "KONTROL_LISTESI_SILINDI",
    baslik: `${adi} bir kontrol listesini sildi`,
    ozet: `${ctx.baslik} → ${meta.baslik}`,
    kart_id: meta.kartId,
    proje_id: meta.proje_id,
    kaynak_tip: "KontrolListesi",
    kaynak_id: opt.kontrolListeId,
  });
}

// =====================================================================
// Madde temel CRUD — atama dışında olan değişiklikler
// =====================================================================

export async function tetikleMaddeEklendi(opt: {
  maddeId: string;
  metin: string;
  ekleyenId: string;
}): Promise<void> {
  const ctx2 = await maddeBaglami(opt.maddeId);
  if (!ctx2) return;
  const ctx = await kartUyeleriniToplaHaricli(ctx2.kart_id, opt.ekleyenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.ekleyenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.ekleyenId,
    tip: "KART_KONTROL_MADDE_EKLENDI",
    baslik: `${adi} bir karta yeni madde ekledi`,
    ozet: `${ctx.baslik}: ${kisalt(opt.metin, 80)}`,
    kart_id: ctx2.kart_id,
    proje_id: ctx2.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

export async function tetikleMaddeGuncellendi(opt: {
  maddeId: string;
  degistirenId: string;
}): Promise<void> {
  const ctx2 = await maddeBaglami(opt.maddeId);
  if (!ctx2) return;
  const ctx = await kartUyeleriniToplaHaricli(ctx2.kart_id, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "KART_KONTROL_MADDE_GUNCELLENDI",
    baslik: `${adi} bir maddeyi güncelledi`,
    ozet: `${ctx.baslik}: ${kisalt(ctx2.metin, 80)}`,
    kart_id: ctx2.kart_id,
    proje_id: ctx2.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

// Silinmeden ÖNCE çağrılmalı.
export async function tetikleMaddeSilindi(opt: {
  maddeId: string;
  silenId: string;
}): Promise<void> {
  const ctx2 = await maddeBaglami(opt.maddeId);
  if (!ctx2) return;
  const ctx = await kartUyeleriniToplaHaricli(ctx2.kart_id, opt.silenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.silenId,
    tip: "KART_KONTROL_MADDE_SILINDI",
    baslik: `${adi} bir maddeyi sildi`,
    ozet: `${ctx.baslik}: ${kisalt(ctx2.metin, 80)}`,
    kart_id: ctx2.kart_id,
    proje_id: ctx2.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}
