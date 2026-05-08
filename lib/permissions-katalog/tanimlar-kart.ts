// ADR-0014 / Sprint 3 S3-5 — IZIN_TANIMLARI: KART kategorisi (tüm alt-grup'lar).

import { IZIN_KODLARI, type IzinKodu } from "./kodlar";

export const TANIMLAR_KART: Partial<
  Record<IzinKodu, { ad: string; aciklama: string }>
> = {
  // ─────────── KART (temel) ───────────
  [IZIN_KODLARI.KART_OLUSTUR]: {
    ad: "Yeni Kart / Görev Oluştur",
    aciklama: "Liste içinde yeni kart açma",
  },
  [IZIN_KODLARI.KART_BASLIK_DUZENLE]: {
    ad: "Kart Başlığını Düzenle",
    aciklama: "Kartın başlığını değiştirme",
  },
  [IZIN_KODLARI.KART_ACIKLAMA_DUZENLE]: {
    ad: "Kart Açıklamasını Düzenle",
    aciklama: "Kartın markdown destekli açıklama metnini değiştirme",
  },
  [IZIN_KODLARI.KART_TASI]: {
    ad: "Kartı Taşı",
    aciklama: "Kartı liste içinde veya başka listeye sürükle-bırak ile taşıma",
  },
  [IZIN_KODLARI.KART_KOPYALA]: {
    ad: "Kartı Kopyala",
    aciklama: "Kartı içerikleriyle birlikte çoğaltma",
  },
  [IZIN_KODLARI.KART_ARSIVLE]: {
    ad: "Kartı Arşivle",
    aciklama: "Kartı arşive alma veya arşivden çıkarma",
  },
  [IZIN_KODLARI.KART_SIL]: {
    ad: "Kartı Sil",
    aciklama: "Kartı çöp kutusuna taşıma (geri yüklenebilir)",
  },
  [IZIN_KODLARI.KART_GERI_YUKLE]: {
    ad: "Silinmiş Kartı Geri Yükle",
    aciklama: "Çöp kutusundaki kartı geri yükleme",
  },

  // ─────────── KART / kapak ───────────
  [IZIN_KODLARI.KART_KAPAK_RENK]: {
    ad: "Kart Kapak Rengi Seç",
    aciklama: "Kartın görsel kapak rengini ayarlama veya kaldırma",
  },
  [IZIN_KODLARI.KART_KAPAK_GORSEL]: {
    ad: "Kart Kapak Görseli Ata",
    aciklama:
      "Karta yüklenmiş eklentilerden bir görseli kapak olarak seçme/kaldırma",
  },

  // ─────────── KART / tarih ───────────
  [IZIN_KODLARI.KART_TARIH_BASLANGIC]: {
    ad: "Başlangıç Tarihi Belirle",
    aciklama: "Kartın başlangıç tarihini ekleme, değiştirme veya kaldırma",
  },
  [IZIN_KODLARI.KART_TARIH_BITIS]: {
    ad: "Bitiş Tarihi Belirle",
    aciklama:
      "Kartın bitiş (son) tarihini ekleme, değiştirme veya kaldırma",
  },
  [IZIN_KODLARI.KART_TAMAMLA]: {
    ad: "Kartı Tamamlandı İşaretle",
    aciklama:
      "Kartı tamamlandı/açık olarak işaretleme — kontrol listesi tamamen bitmeden kapatılamaz (ADR-0018).",
  },

  // ─────────── KART / etiket ───────────
  [IZIN_KODLARI.KART_ETIKET_OLUSTUR]: {
    ad: "Yeni Etiket Tanımla",
    aciklama: "Proje içinde yeni etiket (renk + ad) tanımlama",
  },
  [IZIN_KODLARI.KART_ETIKET_DUZENLE]: {
    ad: "Etiket Düzenle",
    aciklama: "Mevcut etiketin adını veya rengini değiştirme",
  },
  [IZIN_KODLARI.KART_ETIKET_SIL]: {
    ad: "Etiket Sil",
    aciklama: "Etiket tanımını projeden kaldırma",
  },
  [IZIN_KODLARI.KART_ETIKET_ATA]: {
    ad: "Karta Etiket Ata",
    aciklama: "Mevcut etiketi karta ekleme",
  },
  [IZIN_KODLARI.KART_ETIKET_CIKAR]: {
    ad: "Karttan Etiket Çıkar",
    aciklama: "Karta atanmış etiketi kaldırma",
  },

  // ─────────── KART / yorum ───────────
  [IZIN_KODLARI.KART_YORUM_OKU]: {
    ad: "Yorumları Görüntüle",
    aciklama: "Kart yorum akışını okuma",
  },
  [IZIN_KODLARI.KART_YORUM_YAZ]: {
    ad: "Yorum Yaz",
    aciklama: "Karta yeni yorum ekleme (mention dahil)",
  },
  [IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE]: {
    ad: "Kendi Yorumunu Düzenle",
    aciklama: "Kullanıcının kendi yorumunu düzenleyebilmesi",
  },
  [IZIN_KODLARI.KART_YORUM_KENDI_SIL]: {
    ad: "Kendi Yorumunu Sil",
    aciklama: "Kullanıcının kendi yorumunu silmesi",
  },
  [IZIN_KODLARI.KART_YORUM_BASKA_SIL]: {
    ad: "Başkasının Yorumunu Sil",
    aciklama: "Başka bir kullanıcının yazdığı yorumu silme (moderasyon)",
  },

  // ─────────── KART / eklenti ───────────
  [IZIN_KODLARI.KART_EKLENTI_OKU]: {
    ad: "Eklentileri Görüntüle",
    aciklama: "Karta yüklü dosya/görsel listesini görme",
  },
  [IZIN_KODLARI.KART_EKLENTI_YUKLE]: {
    ad: "Eklenti Yükle",
    aciklama: "Karta dosya veya görsel ekleme",
  },
  [IZIN_KODLARI.KART_EKLENTI_INDIR]: {
    ad: "Eklentiyi İndir",
    aciklama: "Karttaki dosya veya görseli indirme",
  },
  [IZIN_KODLARI.KART_EKLENTI_KENDI_SIL]: {
    ad: "Kendi Eklentini Sil",
    aciklama: "Kullanıcının kendisinin yüklediği eklentiyi silmesi",
  },
  [IZIN_KODLARI.KART_EKLENTI_BASKA_SIL]: {
    ad: "Başkasının Eklentisini Sil",
    aciklama: "Başka bir kullanıcının yüklediği eklentiyi silme (moderasyon)",
  },

  // ─────────── KART / kontrol-listesi ───────────
  [IZIN_KODLARI.KART_KONTROL_OLUSTUR]: {
    ad: "Kontrol Listesi Oluştur",
    aciklama: "Karta yeni kontrol listesi (checklist) ekleme",
  },
  [IZIN_KODLARI.KART_KONTROL_DUZENLE]: {
    ad: "Kontrol Listesini Düzenle",
    aciklama: "Kontrol listesinin başlığını değiştirme",
  },
  [IZIN_KODLARI.KART_KONTROL_SIL]: {
    ad: "Kontrol Listesini Sil",
    aciklama: "Kontrol listesini ve tüm maddelerini silme",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR]: {
    ad: "Kontrol Maddesi Ekle",
    aciklama: "Kontrol listesine yeni madde ekleme (atanan kişi dahil)",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE]: {
    ad: "Kontrol Maddesini Düzenle",
    aciklama: "Madde metnini, atananı veya son tarihi değiştirme",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE]: {
    ad: "Kontrol Maddesini Tikle / Aç",
    aciklama: "Maddeyi tamamlandı veya açık olarak işaretleme",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_SIL]: {
    ad: "Kontrol Maddesini Sil",
    aciklama: "Maddeyi kontrol listesinden çıkarma",
  },

  // ─────────── KART / iliski ───────────
  [IZIN_KODLARI.KART_ILISKI_KUR]: {
    ad: "Bağlantılı Kart Ekle",
    aciklama: "İki kart arasında ilişki (bağlı, engelliyor, kopya) tanımlama",
  },
  [IZIN_KODLARI.KART_ILISKI_KALDIR]: {
    ad: "Bağlantılı Kart Kaldır",
    aciklama: "Mevcut kart ilişkisini kaldırma",
  },

  // ─────────── KART / yetkili ───────────
  [IZIN_KODLARI.KART_YETKILI_LISTELE]: {
    ad: "Kart Yetkililerini Görüntüle",
    aciklama: "Karta atanmış kişi ve birim listesini okuma",
  },
  [IZIN_KODLARI.KART_YETKILI_KISI_ATA]: {
    ad: "Karta Yetkili Kişi Ata",
    aciklama: "Karta yeni yetkili kişi ekleme (otomatik bildirim gider)",
  },
  [IZIN_KODLARI.KART_YETKILI_KISI_CIKAR]: {
    ad: "Karttan Yetkili Kişi Çıkar",
    aciklama: "Karttan yetkili kişiyi kaldırma",
  },
  [IZIN_KODLARI.KART_YETKILI_BIRIM_ATA]: {
    ad: "Karta Yetkili Birim Ekle",
    aciklama: "Karta birim atayarak birim personelinin erişimini açma",
  },
  [IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR]: {
    ad: "Karttan Yetkili Birim Çıkar",
    aciklama: "Birimin kart erişimini kaldırma",
  },
};
