// Sprint 3 / S3-8 — Türkçe tarih/saat biçimleyicileri.
//
// Kontrol Kural 8: `Intl.DateTimeFormat('tr-TR')`, Europe/Istanbul.
// Pusula uygulamasında 30+ dosya kendi `new Intl.DateTimeFormat(...)`
// instance'ını oluşturuyordu; her render'da yeni objeler ve farklı
// option set'leri yaratıyordu. Bu modül tek formatter koleksiyonu sunar.

const TZ = "Europe/Istanbul";

// Modül seviyesi sabit instance'lar — her çağrıda yeniden yaratma yok.
export const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

export const TARIH_TAM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export const TARIH_SAAT = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export const SAAT = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export const GUN_AY = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: TZ,
});

// =====================================================================
// Helper fonksiyonlar
// =====================================================================

const tarihliMi = (d: Date | string | null | undefined): d is Date | string =>
  d !== null && d !== undefined;

function dateGetir(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

export function tarihKisa(d: Date | string | null | undefined): string {
  if (!tarihliMi(d)) return "—";
  return TARIH_KISA.format(dateGetir(d));
}

export function tarihTam(d: Date | string | null | undefined): string {
  if (!tarihliMi(d)) return "—";
  return TARIH_TAM.format(dateGetir(d));
}

export function tarihSaat(d: Date | string | null | undefined): string {
  if (!tarihliMi(d)) return "—";
  return TARIH_SAAT.format(dateGetir(d));
}

export function saat(d: Date | string | null | undefined): string {
  if (!tarihliMi(d)) return "—";
  return SAAT.format(dateGetir(d));
}

// "5 dakika önce", "2 saat önce", "3 gün önce" — basit bağıl format.
// Daha karmaşık (haftalar, aylar) için Intl.RelativeTimeFormat ile genişletilebilir.
const RELATIVE = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

const ESIK_SN = 60;
const ESIK_DK = 60 * 60;
const ESIK_SAAT = 24 * 60 * 60;
const ESIK_GUN = 30 * 24 * 60 * 60;

export function rolatif(d: Date | string | null | undefined): string {
  if (!tarihliMi(d)) return "—";
  const tarih = dateGetir(d);
  const fark = (tarih.getTime() - Date.now()) / 1000; // saniye
  const mutlak = Math.abs(fark);
  if (mutlak < ESIK_SN) return "az önce";
  if (mutlak < ESIK_DK) return RELATIVE.format(Math.round(fark / 60), "minute");
  if (mutlak < ESIK_SAAT) {
    return RELATIVE.format(Math.round(fark / 3600), "hour");
  }
  if (mutlak < ESIK_GUN) {
    return RELATIVE.format(Math.round(fark / 86400), "day");
  }
  // 30+ gün için tam tarih
  return tarihKisa(tarih);
}
