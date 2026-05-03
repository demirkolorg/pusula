export type Sonuc<T> =
  | { basarili: true; veri: T }
  | {
      basarili: false;
      hata: string;
      kod: string;
      alanlar?: Record<string, string>;
    };

export const ok = <T>(veri: T): Sonuc<T> => ({ basarili: true, veri });

export const hata = <T = never>(
  mesaj: string,
  kod: string,
  alanlar?: Record<string, string>,
): Sonuc<T> => ({ basarili: false, hata: mesaj, kod, alanlar });

export const HATA_KODU = {
  YETKISIZ: "YETKISIZ",
  GIRIS_YOK: "GIRIS_YOK",
  GECERSIZ_GIRDI: "GECERSIZ_GIRDI",
  BULUNAMADI: "BULUNAMADI",
  CAKISMA: "CAKISMA",
  RATE_LIMIT: "RATE_LIMIT",
  IC_HATA: "IC_HATA",
} as const;

export type HataKodu = (typeof HATA_KODU)[keyof typeof HATA_KODU];
