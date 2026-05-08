// Sprint 3 / S3-4 — Kontrol listesi (madde) bildirim tetikleyicileri.
// Madde atama + ADR-0019 madde tamamlama öneri akışı (3 olay).

import { db } from "@/lib/db";
import { kisalt } from "@/lib/metin-helpers";
import { bildirimUret } from "../services";
import {
  adSoyad,
  kartBaglami,
  kartTamamlamaYetkilileriniBul,
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
