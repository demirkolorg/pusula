// ADR-0014 / Sprint 3 S3-5 — IZIN_TANIMLARI: PROJE + LISTE kategorisi.

import { IZIN_KODLARI, type IzinKodu } from "./kodlar";

export const TANIMLAR_PROJE_LISTE: Partial<
  Record<IzinKodu, { ad: string; aciklama: string }>
> = {
  // ─────────── PROJE ───────────
  [IZIN_KODLARI.PROJE_OLUSTUR]: {
    ad: "Yeni Proje Aç",
    aciklama: "Sıfırdan yeni proje oluşturma",
  },
  [IZIN_KODLARI.PROJE_AD_DUZENLE]: {
    ad: "Proje Adı Düzenle",
    aciklama: "Mevcut projenin adını değiştirme",
  },
  [IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE]: {
    ad: "Proje Açıklaması Düzenle",
    aciklama: "Projenin açıklama metnini değiştirme",
  },
  [IZIN_KODLARI.PROJE_KAPAK_RENK]: {
    ad: "Proje Kapak Rengini Değiştir",
    aciklama: "Proje kartında görünen kapak rengini seçme/değiştirme",
  },
  [IZIN_KODLARI.PROJE_KAPAK_IKON]: {
    ad: "Proje Kapak İkonunu Değiştir",
    aciklama: "Proje kartında görünen ikonu seçme/değiştirme",
  },
  [IZIN_KODLARI.PROJE_YILDIZLA]: {
    ad: "Projeyi Favorile / Yıldızla",
    aciklama: "Projeyi kişisel yıldızlı listesine ekleme/çıkarma",
  },
  [IZIN_KODLARI.PROJE_ARSIVLE]: {
    ad: "Projeyi Arşivle",
    aciklama: "Projeyi arşive alma veya arşivden çıkarma",
  },
  [IZIN_KODLARI.PROJE_SIL]: {
    ad: "Projeyi Sil",
    aciklama: "Projeyi çöp kutusuna taşıma (geri yüklenebilir)",
  },
  [IZIN_KODLARI.PROJE_GERI_YUKLE]: {
    ad: "Silinmiş Projeyi Geri Yükle",
    aciklama: "Çöp kutusundaki projeyi geri yükleme",
  },
  [IZIN_KODLARI.PROJE_SIRALA]: {
    ad: "Proje Sırasını Değiştir",
    aciklama: "Proje listesinde sürükle-bırak ile sıralama",
  },

  // ─────────── PROJE / yetkili ───────────
  [IZIN_KODLARI.PROJE_YETKILI_LISTELE]: {
    ad: "Proje Yetkililerini Görüntüle",
    aciklama: "Projeye atanmış kişi ve birim listesini okuma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_KISI_ATA]: {
    ad: "Projeye Yetkili Kişi Ata",
    aciklama: "Projeye yeni yetkili kişi ekleme",
  },
  [IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR]: {
    ad: "Projeden Yetkili Kişi Çıkar",
    aciklama: "Projeden yetkili kişiyi kaldırma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA]: {
    ad: "Projeye Yetkili Birim Ekle",
    aciklama: "Projeye birim atayarak birim personelinin erişimini açma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR]: {
    ad: "Projeden Yetkili Birim Çıkar",
    aciklama: "Birimin proje erişimini kaldırma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER]: {
    ad: "Projeye Davet Gönder",
    aciklama:
      "Sisteme kayıtsız e-posta sahibine proje davetiyesi gönderme",
  },

  // ─────────── LİSTE ───────────
  [IZIN_KODLARI.LISTE_OLUSTUR]: {
    ad: "Liste / Sütun Oluştur",
    aciklama: "Proje içinde yeni liste (kanban sütunu) açma",
  },
  [IZIN_KODLARI.LISTE_AD_DUZENLE]: {
    ad: "Liste Adını Düzenle",
    aciklama: "Listenin başlığını değiştirme",
  },
  [IZIN_KODLARI.LISTE_SIRALA]: {
    ad: "Liste Sırasını Değiştir",
    aciklama: "Sürükle-bırak ile listeyi başka konuma taşıma",
  },
  [IZIN_KODLARI.LISTE_ARSIVLE]: {
    ad: "Listeyi Arşivle",
    aciklama: "Listeyi arşive alma veya arşivden çıkarma",
  },
  [IZIN_KODLARI.LISTE_SIL]: {
    ad: "Listeyi Sil",
    aciklama: "Listeyi çöp kutusuna taşıma (içindeki kartlarla birlikte)",
  },
  [IZIN_KODLARI.LISTE_GERI_YUKLE]: {
    ad: "Silinmiş Listeyi Geri Yükle",
    aciklama: "Çöp kutusundaki listeyi geri yükleme",
  },

  // ─────────── LİSTE / yetkili ───────────
  [IZIN_KODLARI.LISTE_YETKILI_LISTELE]: {
    ad: "Liste Yetkililerini Görüntüle",
    aciklama: "Listeye atanmış kişi ve birim listesini okuma",
  },
  [IZIN_KODLARI.LISTE_YETKILI_KISI_ATA]: {
    ad: "Listeye Yetkili Kişi Ata",
    aciklama: "Listeye yeni yetkili kişi ekleme",
  },
  [IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR]: {
    ad: "Listeden Yetkili Kişi Çıkar",
    aciklama: "Listeden yetkili kişiyi kaldırma",
  },
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA]: {
    ad: "Listeye Yetkili Birim Ekle",
    aciklama: "Listeye birim atayarak birim personelinin erişimini açma",
  },
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR]: {
    ad: "Listeden Yetkili Birim Çıkar",
    aciklama: "Birimin liste erişimini kaldırma",
  },
};
