/**
 * Pusula — Türkçe metin sözlüğü.
 * Plan Bölüm 7/Kontrol Kuralı 7: i18n hazırlığı — string'ler component içinde
 * hard-code edilmez, buradan gelir. v2'de i18next/next-intl üzerine taşınabilir.
 */

export const tr = {
  kurum: {
    secinizPlaceholder: "Kurum seçin",
    kategoriHepsi: "Tüm kategoriler",
    tekilEkAd: "(opsiyonel)",
    tipTekilNot: "Tekil tip — ad opsiyoneldir.",
    tipCokluNot: "Çoklu tip — ad zorunludur.",
  },
  rol: {
    secinizPlaceholder: "Rol seçin",
    yok: "Rol yok",
  },
  onay: {
    bekliyor: "Onay bekliyor",
    onaylandi: "Onaylandı",
    reddedildi: "Reddedildi",
  },
  ortak: {
    bos: "—",
    yukleniyor: "Yükleniyor...",
    kaydet: "Kaydet",
    vazgec: "Vazgeç",
    sil: "Sil",
    duzenle: "Düzenle",
    geriYukle: "Geri Yükle",
    onayla: "Onayla",
    reddet: "Reddet",
  },
} as const;

/**
 * Makam katmanında olan rol kodları.
 * Bu rollere sahip kullanıcılar tüm kurumların verisine erişebilir.
 *
 * ADR-0001 (Kurum-Birim birleştirme) sonrası: Kural 50a artık birim filtresi
 * yerine kurum filtresinin bypass edilmesini ifade eder. Bu sabit yetki
 * katmanında "tüm kurumlara erişim" rolünü tespit etmek için kullanılır.
 */
export const MAKAM_ROL_KODLARI = ["SUPER_ADMIN", "KAYMAKAM"] as const;

export type MakamRolKodu = (typeof MAKAM_ROL_KODLARI)[number];

export function makamRolMu(rolKodu: string): rolKodu is MakamRolKodu {
  return (MAKAM_ROL_KODLARI as readonly string[]).includes(rolKodu);
}

export function herhangiBiriMakamRolu(rolKodlari: readonly string[]): boolean {
  return rolKodlari.some((k) => makamRolMu(k));
}
