// Kullanıcı listesinde gösterilecek tek bir görsel "durum" hesabı.
// Saf modül (Kural U.1): React/JSX yok, deterministik. Test edilebilirlik için
// `aktif` + `onay_durumu` çiftinden tek bir state türetilir; UI burada üretilen
// state'e göre badge/aksiyon kararını verir.

import type { KullaniciOnayDurumu } from "@prisma/client";

export type KullaniciDurumu = "AKTIF" | "BEKLIYOR" | "REDDEDILDI" | "PASIF";

export type DurumGirisi = {
  aktif: boolean;
  onay_durumu: KullaniciOnayDurumu | null;
};

// Why: BEKLIYOR ve REDDEDILDI öncelikli — `aktif` flag'inden bağımsız olarak
// kullanıcıya net mesaj vermek istiyoruz. `aktif=false` + ONAYLANDI kombinasyonu
// "manuel pasif" kullanıcı (onaylı ama operatör tarafından devre dışı).
export function kullaniciDurumu(g: DurumGirisi): KullaniciDurumu {
  if (g.onay_durumu === "BEKLIYOR") return "BEKLIYOR";
  if (g.onay_durumu === "REDDEDILDI") return "REDDEDILDI";
  if (g.aktif) return "AKTIF";
  return "PASIF";
}

export const DURUM_LABEL: Record<KullaniciDurumu, string> = {
  AKTIF: "Aktif",
  BEKLIYOR: "Onay Bekliyor",
  REDDEDILDI: "Reddedildi",
  PASIF: "Pasif",
};
