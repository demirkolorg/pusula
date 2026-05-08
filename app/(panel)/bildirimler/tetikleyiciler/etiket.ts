// Sprint 3 / S3-4 — Karta etiket eklendi/kaldırıldı bildirim tetikleyicisi.

import { bildirimUret } from "../services";
import { adSoyad, kartUyeleriniToplaHaricli } from "./_ortak";

// Karta etiket eklendi/kaldırıldı — kart üyelerine düşük öncelik
export async function tetikleEtiketDegisti(opt: {
  kartId: string;
  degistirenId: string;
  etiketAd: string;
  eylem: "eklendi" | "kaldirildi";
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  const eylemMetni = opt.eylem === "eklendi" ? "ekledi" : "kaldırdı";
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "ETIKET_DEGISTI",
    baslik: `${adi} bir karta etiket ${eylemMetni}`,
    ozet: `${ctx.baslik}: ${opt.etiketAd}`,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Etiket",
    kaynak_id: opt.kartId,
    meta: { eylem: opt.eylem },
  });
}
