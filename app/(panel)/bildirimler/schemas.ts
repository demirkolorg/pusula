import { z } from "zod";

export const BILDIRIM_TIPLERI = [
  "YORUM_MENTION",
  "KART_YETKILI_ATAMA",
  "MADDE_ATAMA",
  "BITIS_YAKLASIYOR",
  "BITIS_GECTI",
  "YORUM_EKLENDI",
  "EKLENTI_YUKLENDI",
  "PROJE_UYE_EKLENDI",
  "PROJE_UYE_CIKARILDI",
  "KART_DURUM_DEGISTI",
  "KART_BITIS_DEGISTI",
  "KART_SILINDI",
  "KART_TAMAMLANDI",
  // ADR-0019 — Kart/madde tamamlama öneri akışı
  "KART_TAMAMLAMA_ONERILDI",
  "KART_TAMAMLAMA_ONAYLANDI",
  "KART_TAMAMLAMA_REDDEDILDI",
  "MADDE_TAMAMLAMA_ONERILDI",
  "MADDE_TAMAMLAMA_ONAYLANDI",
  "MADDE_TAMAMLAMA_REDDEDILDI",
  "LISTE_SILINDI",
  "DAVET_KABUL_EDILDI",
  "ETIKET_DEGISTI",
  "KAPAK_DEGISTI",
  // ADR-0028 — yeni dosya yönetimi bildirim tipleri (tetikleyiciler F9'da)
  "DOSYA_YUKLENDI",
  "DOSYA_SILINDI",
  "DOSYA_BAGLANDI",
  "DOSYA_ONIZLEME_HAZIR",
  // Kullanıcı isteği — kart yaşam döngüsü düşük öncelikli eventleri.
  "KART_OLUSTURULDU",
  "KART_BASLIK_DEGISTI",
  "KART_ACIKLAMA_DEGISTI",
] as const;

export const bildirimTipiSemasi = z.enum(BILDIRIM_TIPLERI);
export type BildirimTipi = z.infer<typeof bildirimTipiSemasi>;

export const bildirimleriListeleSemasi = z.object({
  // Sadece okunmamışları, sadece okunmuşları, ya da hepsi
  filtre: z.enum(["hepsi", "okunmamis", "okunmus"]).default("hepsi"),
  // Sayfalama: cursor BigInt id (string)
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const bildirimOkuduIsaretleSemasi = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

export const tumunuOkuduIsaretleSemasi = z.object({});

// Faz 5.1 — Kart açılışı sırasında o kartla ilgili okunmamış bildirimler
// otomatik okundu olur. Tek girdi: kart_id (alıcı ctx'ten gelir).
export const bildirimKartaGoreOkuduSemasi = z.object({
  kart_id: z.string().uuid(),
});

export type BildirimleriListele = z.infer<typeof bildirimleriListeleSemasi>;
export type BildirimOkuduIsaretle = z.infer<typeof bildirimOkuduIsaretleSemasi>;
