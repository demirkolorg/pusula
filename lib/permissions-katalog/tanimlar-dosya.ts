// ADR-0014 / Sprint 3 S3-5 — IZIN_TANIMLARI: DOSYA kategorisi (ADR-0028).

import { IZIN_KODLARI, type IzinKodu } from "./kodlar";

export const TANIMLAR_DOSYA: Partial<
  Record<IzinKodu, { ad: string; aciklama: string }>
> = {
  // ─────────── DOSYA / temel ───────────
  [IZIN_KODLARI.DOSYA_OKU]: {
    ad: "Dosyaları Görüntüle",
    aciklama: "Erişebildiği dosyaların listesini ve metadata'sını görme",
  },
  [IZIN_KODLARI.DOSYA_YUKLE]: {
    ad: "Dosya Yükle",
    aciklama: "Bir karta, projeye veya listeye yeni dosya yükleme",
  },
  [IZIN_KODLARI.DOSYA_INDIR]: {
    ad: "Dosyayı İndir",
    aciklama: "Erişebildiği dosyanın binary içeriğini indirme",
  },
  [IZIN_KODLARI.DOSYA_ONIZLE]: {
    ad: "Dosyayı Önizle",
    aciklama: "Görsel/PDF/metin dosyalarını tarayıcı içinde açma",
  },

  // ─────────── DOSYA / düzenle ───────────
  [IZIN_KODLARI.DOSYA_AD_DUZENLE]: {
    ad: "Dosya Adını Düzenle",
    aciklama: "Yüklenmiş bir dosyanın görünen adını değiştirme",
  },
  [IZIN_KODLARI.DOSYA_ACIKLAMA_DUZENLE]: {
    ad: "Dosya Açıklamasını Düzenle",
    aciklama: "Dosyaya açıklama ekleme veya değiştirme",
  },
  [IZIN_KODLARI.DOSYA_GIZLILIK_DUZENLE]: {
    ad: "Dosya Gizliliğini Düzenle",
    aciklama: "Dosyayı NORMAL/HASSAS/GIZLI olarak işaretleme",
  },

  // ─────────── DOSYA / etiket ───────────
  [IZIN_KODLARI.DOSYA_ETIKET_ATA]: {
    ad: "Dosyaya Etiket Ata",
    aciklama: "Var olan dosya etiketlerini bir dosyaya ekleme/çıkarma",
  },
  [IZIN_KODLARI.DOSYA_ETIKET_YONET]: {
    ad: "Dosya Etiketlerini Yönet",
    aciklama: "Dosya etiketi oluşturma, düzenleme ve silme",
  },

  // ─────────── DOSYA / bağlantı ───────────
  [IZIN_KODLARI.DOSYA_BAGLANTI_EKLE]: {
    ad: "Dosyayı Bir Kaynağa Bağla",
    aciklama: "Bir dosyayı karta, projeye veya listeye bağlama",
  },
  [IZIN_KODLARI.DOSYA_BAGLANTI_KALDIR]: {
    ad: "Dosya Bağlantısını Kaldır",
    aciklama: "Bir dosyanın bir kaynaktan bağlantısını çıkarma (dosya kalır)",
  },

  // ─────────── DOSYA / sürüm ───────────
  [IZIN_KODLARI.DOSYA_SURUM_YUKLE]: {
    ad: "Yeni Dosya Sürümü Yükle",
    aciklama: "Var olan dosyanın üzerine yeni sürüm yükleme",
  },

  // ─────────── DOSYA / silme ───────────
  [IZIN_KODLARI.DOSYA_KENDI_SIL]: {
    ad: "Kendi Dosyanı Sil",
    aciklama: "Kullanıcının kendisinin yüklediği dosyayı çöp kutusuna gönderme",
  },
  [IZIN_KODLARI.DOSYA_BASKA_SIL]: {
    ad: "Başkasının Dosyasını Sil",
    aciklama: "Başka bir kullanıcının yüklediği dosyayı silme (moderasyon)",
  },
  [IZIN_KODLARI.DOSYA_GERI_YUKLE]: {
    ad: "Silinmiş Dosyayı Geri Yükle",
    aciklama: "Çöp kutusundaki dosyayı geri getirme",
  },
  [IZIN_KODLARI.DOSYA_KALICI_SIL]: {
    ad: "Dosyayı Kalıcı Olarak Sil",
    aciklama: "Storage'dan ve veritabanından geri dönüşsüz silme (yalnız makam)",
  },

  // ─────────── DOSYA / toplu & güvenlik ───────────
  [IZIN_KODLARI.DOSYA_TOPLU_ISLEM]: {
    ad: "Dosyalarda Toplu İşlem",
    aciklama: "Birden fazla dosyada toplu silme/etiketleme/indirme",
  },
  [IZIN_KODLARI.DOSYA_GUVENLIK_YONET]: {
    ad: "Dosya Güvenlik Yönetimi",
    aciklama: "Karantina/HASSAS/GIZLI dosyaları görme, virüs tarama akışını yönetme",
  },
  [IZIN_KODLARI.DOSYA_DISA_AKTAR]: {
    ad: "Dosya Listesini Dışa Aktar",
    aciklama: "Filtreye uyan dosya metadata'sını CSV olarak dışa aktarma",
  },
};
