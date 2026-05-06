// ADR-0020 — Sidebar (yan menü) görünürlük filtresi.
//
// Sayfa erişim koruması zaten her sayfanın kendisinde `izinVarMi` + redirect
// ile sağlanıyor (kaynak güvenliği değişmedi). Bu modül sadece menü
// görünürlüğünü kullanıcının izinleriyle hizalar: yetkisi olmayan kullanıcı
// admin sayfalarının başlığını dahi görmez (UX + minor info disclosure).
//
// Saf modül (Kural 131): React/JSX bağımlılığı yok, deterministik fonksiyonlar.
// `lib/sidebar-yetki.test.ts` üzerinden unit test edilir (Kural 139).
//
// Eşleme prensibi: her menü öğesinin gerekli izinleri = ilgili sayfanın
// `page.tsx` içindeki `izinVarMi` çağrısıyla 1:1 hizalı. Sayfa erişim
// kuralı değişirse buradaki harita da güncellenir.

import { IZIN_KODLARI } from "./permissions-katalog";
import { izinKoduGenislet } from "./permissions-eslesme";

export const MENU_KODLARI = {
  PROJELER: "projeler",
  ONAYLAR: "onaylar",
  COP_KUTUSU: "cop-kutusu",
  AYAR_GENEL: "ayar.genel",
  AYAR_BILDIRIMLER: "ayar.bildirimler",
  AYAR_BIRIMLER: "ayar.birimler",
  AYAR_KULLANICILAR: "ayar.kullanicilar",
  AYAR_ONAY_BEKLEYENLER: "ayar.onay-bekleyenler",
  AYAR_ROLLER: "ayar.roller",
  AYAR_SABLONLAR: "ayar.sablonlar",
  AYAR_DENETIM: "ayar.denetim",
  AYAR_HATA_LOGLARI: "ayar.hata-loglari",
} as const;

export type MenuKodu = (typeof MENU_KODLARI)[keyof typeof MENU_KODLARI];

// `null` = giriş yapmış her kullanıcıya açık (auth-only)
// `string[]` = OR semantik — kullanıcı listedeki HERHANGİ BİR izne sahipse
// menü görünür (eski alias'lar `izinKoduGenislet` ile granüler kümeye açılır).
type IzinGereksinimi = readonly string[] | null;

export const MENU_IZIN_HARITASI: Readonly<Record<MenuKodu, IzinGereksinimi>> = {
  [MENU_KODLARI.PROJELER]: null,
  [MENU_KODLARI.ONAYLAR]: [IZIN_KODLARI.KART_TAMAMLA],
  [MENU_KODLARI.COP_KUTUSU]: null,
  [MENU_KODLARI.AYAR_GENEL]: [IZIN_KODLARI.AYAR_KURUM_DUZENLE],
  [MENU_KODLARI.AYAR_BILDIRIMLER]: null,
  [MENU_KODLARI.AYAR_BIRIMLER]: [IZIN_KODLARI.BIRIM_YONET],
  [MENU_KODLARI.AYAR_KULLANICILAR]: [
    IZIN_KODLARI.KULLANICI_DUZENLE,
    IZIN_KODLARI.KULLANICI_DAVET,
    IZIN_KODLARI.KULLANICI_SIL,
  ],
  [MENU_KODLARI.AYAR_ONAY_BEKLEYENLER]: [IZIN_KODLARI.KULLANICI_ONAYLA],
  [MENU_KODLARI.AYAR_ROLLER]: [IZIN_KODLARI.ROL_YONET],
  [MENU_KODLARI.AYAR_SABLONLAR]: null,
  [MENU_KODLARI.AYAR_DENETIM]: [IZIN_KODLARI.DENETIM_OKU],
  [MENU_KODLARI.AYAR_HATA_LOGLARI]: [IZIN_KODLARI.HATA_LOGU_OKU],
} as const;

/**
 * Tek bir menü öğesi verilen izin set'iyle görünür mü?
 *
 * - Makam (`*`) her şeyi görür (Kural 50a).
 * - `null` gereksinim → auth yeterli (her oturumlu kullanıcı görür).
 * - Aksi halde OR semantik: gereksinim listesindeki en az bir kodun
 *   genişletilmiş kümesi izin set'iyle kesişiyorsa görünür.
 */
export function menuGorunurMu(
  kod: MenuKodu,
  izinSeti: ReadonlySet<string>,
): boolean {
  if (izinSeti.has("*")) return true;
  const gereksinim = MENU_IZIN_HARITASI[kod];
  if (gereksinim === null) return true;
  return gereksinim.some((izinKodu) => {
    const genis = izinKoduGenislet(izinKodu);
    return genis.some((g) => izinSeti.has(g));
  });
}

/**
 * Tüm menü kodlarından kullanıcının görebileceklerini döndürür.
 * Server-side'da bir kez çağrılıp client component'e prop olarak geçirilir
 * (Set serializable değil, dizi serializable).
 */
export function gorunurMenuKodlari(
  izinSeti: ReadonlySet<string>,
): MenuKodu[] {
  return Object.values(MENU_KODLARI).filter((kod) =>
    menuGorunurMu(kod, izinSeti),
  );
}
