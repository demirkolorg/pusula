// Sprint 3 / S3-4 — Davet kabul bildirim tetikleyicisi.

import { bildirimUret } from "../services";

// Davet kabul edildi — davet edene bildirim
export async function tetikleDavetKabulEdildi(opt: {
  davetEdenId: string;
  kabulEdenAd: string;
  kabulEdenSoyad: string;
  kabulEdenEmail: string;
}): Promise<void> {
  const adSoyadMetni = `${opt.kabulEdenAd} ${opt.kabulEdenSoyad}`.trim();
  await bildirimUret({
    alici_idler: [opt.davetEdenId],
    // Sistem tetikledi (davet eden kullanıcı zaten kendisi alıyor) — ureten=null
    // bildirimUret içinde ureten==alici elenmiyor; kabul eden ≠ davet eden
    // garanti.
    ureten_id: null,
    tip: "DAVET_KABUL_EDILDI",
    baslik: "Gönderdiğiniz davet kabul edildi",
    ozet: `${adSoyadMetni} (${opt.kabulEdenEmail})`,
    kaynak_tip: "Davet",
    kaynak_id: null,
    meta: { kabul_eden_email: opt.kabulEdenEmail },
  });
}
