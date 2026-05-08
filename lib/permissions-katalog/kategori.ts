// ADR-0014 / Sprint 3 S3-5 — Kategori ve alt-kategori map'leri.
//
// `IZIN_KATEGORI`: izin → DB enum (UI üst-seviye accordion grup).
// `IZIN_ALT_KATEGORI`: izin → string (UI accordion alt-grup).
// Başlık map'leri Türkçe display için.

import { IzinKategorisi } from "@prisma/client";
import { IZIN_KODLARI, type IzinKodu } from "./kodlar";

// ============================================================
// Kategori → izin (DB enum) — UI üst-seviye accordion grup
// ============================================================

// Not: alias'lar (proje:edit vb.) bu haritada yok — sadece yeni granüler kodlar.
// `TUM_IZIN_KODLARI` üzerinden iterasyon yapan kodlar güvenli; alias kodları
// `izinKoduGenislet` ile granülere açıldığı için doğrudan kategori sorgusuna
// girmez.
export const IZIN_KATEGORI: Partial<Record<IzinKodu, IzinKategorisi>> = {
  // PROJE
  [IZIN_KODLARI.PROJE_OLUSTUR]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_AD_DUZENLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_KAPAK_RENK]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_KAPAK_IKON]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YILDIZLA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_ARSIVLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_SIL]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_GERI_YUKLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_SIRALA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_LISTELE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_KISI_ATA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER]: IzinKategorisi.PROJE,

  // LISTE
  [IZIN_KODLARI.LISTE_OLUSTUR]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_AD_DUZENLE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_SIRALA]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_ARSIVLE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_SIL]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_GERI_YUKLE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_LISTELE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_KISI_ATA]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR]: IzinKategorisi.LISTE,

  // KART (tüm alt-kategoriler)
  [IZIN_KODLARI.KART_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_BASLIK_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ACIKLAMA_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TASI]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KOPYALA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ARSIVLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_GERI_YUKLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TAMAMLA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KAPAK_RENK]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KAPAK_GORSEL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TARIH_BASLANGIC]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TARIH_BITIS]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_ATA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_CIKAR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_OKU]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_YAZ]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_KENDI_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_BASKA_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_OKU]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_YUKLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_INDIR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_KENDI_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_BASKA_SIL]: IzinKategorisi.KART,
  // DOSYA — ADR-0028 çekirdek dosya yönetimi
  [IZIN_KODLARI.DOSYA_OKU]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_YUKLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_INDIR]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_ONIZLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_AD_DUZENLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_ACIKLAMA_DUZENLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_GIZLILIK_DUZENLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_ETIKET_ATA]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_ETIKET_YONET]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_BAGLANTI_EKLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_BAGLANTI_KALDIR]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_SURUM_YUKLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_KENDI_SIL]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_BASKA_SIL]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_GERI_YUKLE]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_KALICI_SIL]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_TOPLU_ISLEM]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_GUVENLIK_YONET]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.DOSYA_DISA_AKTAR]: IzinKategorisi.DOSYA,
  [IZIN_KODLARI.KART_KONTROL_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ILISKI_KUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ILISKI_KALDIR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_LISTELE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_KISI_ATA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_KISI_CIKAR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_BIRIM_ATA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR]: IzinKategorisi.KART,

  // KULLANICI
  [IZIN_KODLARI.KULLANICI_DAVET_GONDER]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_DAVET_IPTAL]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_DAVET_YENIDEN]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_ONAYLA]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_REDDET]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_DUZENLE]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_SIL]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_GERI_YUKLE]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA]: IzinKategorisi.KULLANICI,

  // BIRIM
  [IZIN_KODLARI.BIRIM_OLUSTUR]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_DUZENLE]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_HIYERARSI]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_SIL]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_GERI_YUKLE]: IzinKategorisi.BIRIM,

  // ROL
  [IZIN_KODLARI.ROL_OLUSTUR]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_DUZENLE]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_IZIN_ATA]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_COGALT]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_SIL]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_KULLANICIYA_ATA]: IzinKategorisi.ROL,

  // AUDIT
  [IZIN_KODLARI.AKTIVITE_OKU]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.AKTIVITE_DISA_AKTAR]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.DENETIM_OKU]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.DENETIM_DISA_AKTAR]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.HATA_LOGU_OKU]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE]: IzinKategorisi.AUDIT,

  // AYAR
  [IZIN_KODLARI.AYAR_KURUM_DUZENLE]: IzinKategorisi.AYAR,
  [IZIN_KODLARI.AYAR_SISTEM_DUZENLE]: IzinKategorisi.AYAR,
};

// ============================================================
// Alt-kategori (string) — UI accordion alt-grup başlığı
// ============================================================

export const IZIN_ALT_KATEGORI: Partial<Record<IzinKodu, string>> = {
  // PROJE / yetkili
  [IZIN_KODLARI.PROJE_YETKILI_LISTELE]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_KISI_ATA]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER]: "yetkili",

  // LISTE / yetkili
  [IZIN_KODLARI.LISTE_YETKILI_LISTELE]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_KISI_ATA]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR]: "yetkili",

  // KART / kapak
  [IZIN_KODLARI.KART_KAPAK_RENK]: "kapak",
  [IZIN_KODLARI.KART_KAPAK_GORSEL]: "kapak",

  // KART / tarih
  [IZIN_KODLARI.KART_TARIH_BASLANGIC]: "tarih",
  [IZIN_KODLARI.KART_TARIH_BITIS]: "tarih",
  // KART_TAMAMLA temel kategoride — alt-kategori yok (ADR-0018).

  // KART / etiket
  [IZIN_KODLARI.KART_ETIKET_OLUSTUR]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_DUZENLE]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_SIL]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_ATA]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_CIKAR]: "etiket",

  // KART / yorum
  [IZIN_KODLARI.KART_YORUM_OKU]: "yorum",
  [IZIN_KODLARI.KART_YORUM_YAZ]: "yorum",
  [IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE]: "yorum",
  [IZIN_KODLARI.KART_YORUM_KENDI_SIL]: "yorum",
  [IZIN_KODLARI.KART_YORUM_BASKA_SIL]: "yorum",

  // KART / eklenti
  [IZIN_KODLARI.KART_EKLENTI_OKU]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_YUKLE]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_INDIR]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_KENDI_SIL]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_BASKA_SIL]: "eklenti",

  // DOSYA — ADR-0028 (alt-kategoriler accordion grupları için)
  [IZIN_KODLARI.DOSYA_AD_DUZENLE]: "duzenle",
  [IZIN_KODLARI.DOSYA_ACIKLAMA_DUZENLE]: "duzenle",
  [IZIN_KODLARI.DOSYA_GIZLILIK_DUZENLE]: "duzenle",
  [IZIN_KODLARI.DOSYA_ETIKET_ATA]: "etiket",
  [IZIN_KODLARI.DOSYA_ETIKET_YONET]: "etiket",
  [IZIN_KODLARI.DOSYA_BAGLANTI_EKLE]: "baglanti",
  [IZIN_KODLARI.DOSYA_BAGLANTI_KALDIR]: "baglanti",
  [IZIN_KODLARI.DOSYA_SURUM_YUKLE]: "surum",
  [IZIN_KODLARI.DOSYA_KENDI_SIL]: "silme",
  [IZIN_KODLARI.DOSYA_BASKA_SIL]: "silme",
  [IZIN_KODLARI.DOSYA_GERI_YUKLE]: "silme",
  [IZIN_KODLARI.DOSYA_KALICI_SIL]: "silme",
  [IZIN_KODLARI.DOSYA_TOPLU_ISLEM]: "toplu",
  [IZIN_KODLARI.DOSYA_DISA_AKTAR]: "toplu",
  [IZIN_KODLARI.DOSYA_GUVENLIK_YONET]: "guvenlik",
  // DOSYA_OKU/YUKLE/INDIR/ONIZLE — alt-kategori yok (temel)

  // KART / kontrol-listesi
  [IZIN_KODLARI.KART_KONTROL_OLUSTUR]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_DUZENLE]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_SIL]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_SIL]: "kontrol-listesi",

  // KART / iliski
  [IZIN_KODLARI.KART_ILISKI_KUR]: "iliski",
  [IZIN_KODLARI.KART_ILISKI_KALDIR]: "iliski",

  // KART / yetkili
  [IZIN_KODLARI.KART_YETKILI_LISTELE]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_KISI_ATA]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_KISI_CIKAR]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_BIRIM_ATA]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR]: "yetkili",

  // KULLANICI
  [IZIN_KODLARI.KULLANICI_DAVET_GONDER]: "davet",
  [IZIN_KODLARI.KULLANICI_DAVET_IPTAL]: "davet",
  [IZIN_KODLARI.KULLANICI_DAVET_YENIDEN]: "davet",
  [IZIN_KODLARI.KULLANICI_ONAYLA]: "onay",
  [IZIN_KODLARI.KULLANICI_REDDET]: "onay",
  [IZIN_KODLARI.KULLANICI_DUZENLE]: "yonetim",
  [IZIN_KODLARI.KULLANICI_SIL]: "yonetim",
  [IZIN_KODLARI.KULLANICI_GERI_YUKLE]: "yonetim",
  [IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA]: "yonetim",

  // AUDIT
  [IZIN_KODLARI.HATA_LOGU_OKU]: "hata",
  [IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE]: "hata",
};

// ============================================================
// UI başlıkları
// ============================================================

export const KATEGORI_BASLIKLARI: Record<IzinKategorisi, string> = {
  [IzinKategorisi.PROJE]: "Proje",
  [IzinKategorisi.LISTE]: "Liste",
  [IzinKategorisi.KART]: "Kart",
  [IzinKategorisi.KULLANICI]: "Kullanıcı",
  [IzinKategorisi.BIRIM]: "Birim",
  [IzinKategorisi.ROL]: "Rol & Yetki",
  [IzinKategorisi.AUDIT]: "Denetim",
  [IzinKategorisi.AYAR]: "Sistem Ayarları",
  [IzinKategorisi.DOSYA]: "Dosya",
};

export const ALT_KATEGORI_BASLIKLARI: Record<string, string> = {
  yetkili: "Yetkili Kişi & Birim",
  kapak: "Kapak",
  tarih: "Tarih",
  etiket: "Etiket",
  yorum: "Yorum",
  eklenti: "Eklenti",
  "kontrol-listesi": "Kontrol Listesi",
  iliski: "Bağlantı / İlişki",
  davet: "Davet",
  onay: "Onay",
  yonetim: "Yönetim",
  hata: "Hata Logu",
  // ADR-0028 — Dosya alt-kategorileri
  duzenle: "Düzenle",
  baglanti: "Bağlantı",
  surum: "Sürüm",
  silme: "Silme",
  toplu: "Toplu & Dışa Aktarma",
  guvenlik: "Güvenlik",
};
