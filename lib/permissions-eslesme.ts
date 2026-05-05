// ADR-0014: Eski geniş izin kodu → yeni granüler izin kodları eşlemesi.
// Mevcut server action'lar `izinVarMi(uid, "kart:edit")` gibi çatı izin
// çağırıyor. Bu eşleme katmanı `izinVarMi`'nin eski kodu otomatik olarak
// yeni granüler kümeye dağıtmasını sağlar — kullanıcının kümedeki
// HERHANGİ BİR izine sahip olması yeterli sayılır (en azından bir alanı
// düzenleyebiliyor demek).

import { IZIN_KODLARI, type IzinKodu } from "./permissions-katalog";

export const ESKI_YENI_ESLEME: Record<string, IzinKodu[]> = {
  // ─────────── PROJE ───────────
  "proje:create": [IZIN_KODLARI.PROJE_OLUSTUR],
  "proje:edit": [
    IZIN_KODLARI.PROJE_AD_DUZENLE,
    IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE,
    IZIN_KODLARI.PROJE_KAPAK_RENK,
    IZIN_KODLARI.PROJE_KAPAK_IKON,
    IZIN_KODLARI.PROJE_YILDIZLA,
    IZIN_KODLARI.PROJE_ARSIVLE,
    IZIN_KODLARI.PROJE_SIRALA,
  ],
  "proje:delete": [IZIN_KODLARI.PROJE_SIL, IZIN_KODLARI.PROJE_GERI_YUKLE],
  "proje:authorize": [
    IZIN_KODLARI.PROJE_YETKILI_LISTELE,
    IZIN_KODLARI.PROJE_YETKILI_KISI_ATA,
    IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR,
    IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA,
    IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR,
    IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER,
  ],

  // ─────────── LİSTE ───────────
  "liste:create": [IZIN_KODLARI.LISTE_OLUSTUR],
  "liste:edit": [
    IZIN_KODLARI.LISTE_AD_DUZENLE,
    IZIN_KODLARI.LISTE_SIRALA,
    IZIN_KODLARI.LISTE_ARSIVLE,
  ],
  "liste:delete": [
    IZIN_KODLARI.LISTE_SIL,
    IZIN_KODLARI.LISTE_GERI_YUKLE,
  ],
  // (Yeni — eskide yoktu, ileride server action'lar bunu çağırırsa hazır)
  "liste:authorize": [
    IZIN_KODLARI.LISTE_YETKILI_LISTELE,
    IZIN_KODLARI.LISTE_YETKILI_KISI_ATA,
    IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR,
    IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA,
    IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR,
  ],

  // ─────────── KART ───────────
  "kart:create": [IZIN_KODLARI.KART_OLUSTUR],
  "kart:edit": [
    IZIN_KODLARI.KART_BASLIK_DUZENLE,
    IZIN_KODLARI.KART_ACIKLAMA_DUZENLE,
    IZIN_KODLARI.KART_KAPAK_RENK,
    IZIN_KODLARI.KART_KAPAK_GORSEL,
    IZIN_KODLARI.KART_TARIH_BASLANGIC,
    IZIN_KODLARI.KART_TARIH_BITIS,
    IZIN_KODLARI.KART_TARIH_TAMAMLANDI,
    IZIN_KODLARI.KART_ETIKET_ATA,
    IZIN_KODLARI.KART_ETIKET_CIKAR,
    IZIN_KODLARI.KART_KOPYALA,
    IZIN_KODLARI.KART_ARSIVLE,
    IZIN_KODLARI.KART_YORUM_YAZ,
    IZIN_KODLARI.KART_EKLENTI_YUKLE,
    IZIN_KODLARI.KART_KONTROL_OLUSTUR,
    IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR,
    IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE,
    IZIN_KODLARI.KART_ILISKI_KUR,
    IZIN_KODLARI.KART_YETKILI_KISI_ATA,
    IZIN_KODLARI.KART_YETKILI_BIRIM_ATA,
  ],
  "kart:delete": [IZIN_KODLARI.KART_SIL, IZIN_KODLARI.KART_GERI_YUKLE],
  "kart:move": [IZIN_KODLARI.KART_TASI],
  "kart:authorize": [
    IZIN_KODLARI.KART_YETKILI_LISTELE,
    IZIN_KODLARI.KART_YETKILI_KISI_ATA,
    IZIN_KODLARI.KART_YETKILI_KISI_CIKAR,
    IZIN_KODLARI.KART_YETKILI_BIRIM_ATA,
    IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR,
  ],

  // ─────────── KULLANICI ───────────
  "user:invite": [
    IZIN_KODLARI.KULLANICI_DAVET_GONDER,
    IZIN_KODLARI.KULLANICI_DAVET_IPTAL,
    IZIN_KODLARI.KULLANICI_DAVET_YENIDEN,
  ],
  "user:edit": [
    IZIN_KODLARI.KULLANICI_DUZENLE,
    IZIN_KODLARI.KULLANICI_GERI_YUKLE,
    IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA,
  ],
  "user:delete": [IZIN_KODLARI.KULLANICI_SIL],
  "user:approve": [IZIN_KODLARI.KULLANICI_ONAYLA, IZIN_KODLARI.KULLANICI_REDDET],

  // ─────────── DENETİM ───────────
  "audit:read": [
    IZIN_KODLARI.DENETIM_OKU,
    IZIN_KODLARI.DENETIM_DISA_AKTAR,
  ],
  "errorlog:read": [
    IZIN_KODLARI.HATA_LOGU_OKU,
    IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE,
  ],

  // ─────────── AYAR ───────────
  "settings:edit": [
    IZIN_KODLARI.AYAR_KURUM_DUZENLE,
    IZIN_KODLARI.AYAR_SISTEM_DUZENLE,
  ],

  // ─────────── BİRİM ───────────
  "birim:manage": [
    IZIN_KODLARI.BIRIM_OLUSTUR,
    IZIN_KODLARI.BIRIM_DUZENLE,
    IZIN_KODLARI.BIRIM_HIYERARSI,
    IZIN_KODLARI.BIRIM_SIL,
    IZIN_KODLARI.BIRIM_GERI_YUKLE,
  ],

  // ─────────── ROL ───────────
  "rol:manage": [
    IZIN_KODLARI.ROL_OLUSTUR,
    IZIN_KODLARI.ROL_DUZENLE,
    IZIN_KODLARI.ROL_IZIN_ATA,
    IZIN_KODLARI.ROL_COGALT,
    IZIN_KODLARI.ROL_SIL,
    IZIN_KODLARI.ROL_KULLANICIYA_ATA,
  ],
};

/**
 * Verilen kodu (eski veya yeni) yeni granüler izin kümesine genişletir.
 * - Eski geniş kodsa ESKI_YENI_ESLEME üzerinden expansion
 * - Yeni granüler kodsa olduğu gibi tek elemanlı dizi
 */
export function izinKoduGenislet(kod: string): string[] {
  const yeni = ESKI_YENI_ESLEME[kod];
  if (yeni && yeni.length > 0) return yeni;
  return [kod];
}
