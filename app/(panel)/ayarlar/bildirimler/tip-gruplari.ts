// Saf veri — tercih sayfası UI'ı için tip → grup eşlemesi ve TR metinler.
// Test edilebilir, UI'dan ayrı (Kural 131).

import type { BildirimTipi } from "@/app/(panel)/bildirimler/schemas";

export type TipMetni = {
  baslik: string;
  aciklama: string;
};

export type TercihGrubu = {
  baslik: string;
  aciklama: string;
  tipler: ReadonlyArray<BildirimTipi>;
};

export const TIP_METNI: Record<BildirimTipi, TipMetni> = {
  YORUM_MENTION: {
    baslik: "Yorumda mention",
    aciklama: "Bir yorum içinde @ ile etiketlendiğinizde",
  },
  KART_YETKILI_ATAMA: {
    baslik: "Karta atandım",
    aciklama: "Bir karta yetkili olarak eklendiğinizde",
  },
  MADDE_ATAMA: {
    baslik: "Kontrol maddesine atandım",
    aciklama: "Bir kontrol maddesine sorumlu olarak atandığınızda",
  },
  YORUM_EKLENDI: {
    baslik: "Yorum eklendi",
    aciklama: "Yetkili olduğunuz bir karta yorum yazıldığında (mention hariç)",
  },
  EKLENTI_YUKLENDI: {
    baslik: "Dosya yüklendi",
    aciklama: "Yetkili olduğunuz bir karta dosya yüklendiğinde",
  },
  BITIS_YAKLASIYOR: {
    baslik: "Bitiş tarihi yaklaşıyor",
    aciklama: "Yetkili olduğunuz kartın bitişine 24 saat kala",
  },
  BITIS_GECTI: {
    baslik: "Bitiş tarihi geçti",
    aciklama: "Yetkili olduğunuz bir kartın bitiş tarihi geçtiğinde",
  },
  KART_BITIS_DEGISTI: {
    baslik: "Bitiş tarihi değişti",
    aciklama: "Yetkili olduğunuz bir kartın bitiş tarihi güncellendiğinde",
  },
  KART_DURUM_DEGISTI: {
    baslik: "Kart taşındı",
    aciklama: "Yetkili olduğunuz bir kart başka listeye taşındığında",
  },
  KART_SILINDI: {
    baslik: "Kart silindi",
    aciklama: "Yetkili olduğunuz bir kart silindiğinde",
  },
  KART_TAMAMLANDI: {
    baslik: "Kart tamamlandı",
    aciklama: "Yetkili olduğunuz bir kart tamamlandı işaretlendiğinde",
  },
  PROJE_UYE_EKLENDI: {
    baslik: "Projeye eklendim",
    aciklama: "Bir projeye yetkili olarak eklendiğinizde",
  },
  PROJE_UYE_CIKARILDI: {
    baslik: "Projeden çıkarıldım",
    aciklama: "Bir projeden yetkili olarak çıkarıldığınızda",
  },
  LISTE_SILINDI: {
    baslik: "Liste silindi",
    aciklama: "Yetkili olduğunuz bir liste silindiğinde",
  },
  DAVET_KABUL_EDILDI: {
    baslik: "Davet kabul edildi",
    aciklama: "Gönderdiğiniz davet kabul edildiğinde",
  },
  KART_TAMAMLAMA_ONERILDI: {
    baslik: "Kart tamamlama önerildi",
    aciklama: "Birisi yetkili olduğunuz bir kartı tamamlandı önerdiğinde",
  },
  KART_TAMAMLAMA_ONAYLANDI: {
    baslik: "Kart tamamlama onaylandı",
    aciklama: "Önerdiğiniz kart tamamlama onaylandığında",
  },
  KART_TAMAMLAMA_REDDEDILDI: {
    baslik: "Kart tamamlama reddedildi",
    aciklama: "Önerdiğiniz kart tamamlama reddedildiğinde",
  },
  MADDE_TAMAMLAMA_ONERILDI: {
    baslik: "Madde tamamlama önerildi",
    aciklama: "Birisi sizin sorumlu olduğunuz maddeyi tamamlandı önerdiğinde",
  },
  MADDE_TAMAMLAMA_ONAYLANDI: {
    baslik: "Madde tamamlama onaylandı",
    aciklama: "Önerdiğiniz madde tamamlama onaylandığında",
  },
  MADDE_TAMAMLAMA_REDDEDILDI: {
    baslik: "Madde tamamlama reddedildi",
    aciklama: "Önerdiğiniz madde tamamlama reddedildiğinde",
  },
  ETIKET_DEGISTI: {
    baslik: "Etiket eklendi/kaldırıldı",
    aciklama: "Yetkili olduğunuz bir karta etiket eklendiğinde/kaldırıldığında",
  },
  KAPAK_DEGISTI: {
    baslik: "Kapak/renk değişti",
    aciklama: "Yetkili olduğunuz bir kartın kapağı veya rengi güncellendiğinde",
  },
  // ADR-0028 — yeni dosya yönetimi bildirimleri (tetikleyiciler F9'da)
  DOSYA_YUKLENDI: {
    baslik: "Dosya yüklendi",
    aciklama: "Yetkili olduğunuz bir kaynağa yeni dosya yüklendiğinde",
  },
  DOSYA_SILINDI: {
    baslik: "Dosya silindi",
    aciklama: "Yetkili olduğunuz bir kaynaktaki dosya silindiğinde",
  },
  DOSYA_BAGLANDI: {
    baslik: "Dosya bağlandı",
    aciklama: "Mevcut bir dosya yetkili olduğunuz kaynağa bağlandığında",
  },
  DOSYA_ONIZLEME_HAZIR: {
    baslik: "Dosya önizleme hazır",
    aciklama: "Yüklediğiniz büyük dosyanın önizleme/thumbnail'i tamamlandığında",
  },
  // Yetki çıkarma kanalları
  KART_YETKILI_CIKARILDI: {
    baslik: "Karttan çıkarıldım",
    aciklama: "Bir karttan yetkili olarak çıkarıldığınızda",
  },
  LISTE_UYE_EKLENDI: {
    baslik: "Listeye eklendim",
    aciklama: "Bir listeye yetkili olarak eklendiğinizde",
  },
  LISTE_UYE_CIKARILDI: {
    baslik: "Listeden çıkarıldım",
    aciklama: "Bir listeden yetkili olarak çıkarıldığınızda",
  },
  // Tam kapsamlı yaşam döngüsü
  PROJE_OLUSTURULDU: {
    baslik: "Proje oluşturuldu",
    aciklama: "Yetkili olduğunuz yeni bir proje oluşturulduğunda",
  },
  PROJE_GUNCELLENDI: {
    baslik: "Proje bilgileri güncellendi",
    aciklama: "Yetkili olduğunuz bir projenin bilgileri değiştiğinde",
  },
  PROJE_ARSIVLENDI: {
    baslik: "Proje arşivlendi",
    aciklama: "Yetkili olduğunuz bir proje arşivlendiğinde",
  },
  PROJE_GERI_YUKLENDI: {
    baslik: "Proje geri yüklendi",
    aciklama: "Yetkili olduğunuz bir proje arşivden çıkarıldığında",
  },
  PROJE_SILINDI: {
    baslik: "Proje silindi",
    aciklama: "Yetkili olduğunuz bir proje silindiğinde",
  },
  LISTE_OLUSTURULDU: {
    baslik: "Liste oluşturuldu",
    aciklama: "Yetkili olduğunuz bir projede yeni liste oluşturulduğunda",
  },
  LISTE_GUNCELLENDI: {
    baslik: "Liste güncellendi",
    aciklama: "Yetkili olduğunuz bir listenin bilgileri değiştiğinde",
  },
  KART_OLUSTURULDU: {
    baslik: "Kart oluşturuldu",
    aciklama: "Yetkili olduğunuz bir listede yeni kart oluşturulduğunda",
  },
  KART_BASLIK_DEGISTI: {
    baslik: "Kart başlığı değişti",
    aciklama: "Yetkili olduğunuz bir kartın başlığı güncellendiğinde",
  },
  KART_ACIKLAMA_DEGISTI: {
    baslik: "Kart açıklaması değişti",
    aciklama: "Yetkili olduğunuz bir kartın açıklaması düzenlendiğinde",
  },
  KART_ARSIVLENDI: {
    baslik: "Kart arşivlendi",
    aciklama: "Yetkili olduğunuz bir kart arşivlendiğinde",
  },
  KART_GERI_YUKLENDI: {
    baslik: "Kart geri yüklendi",
    aciklama: "Yetkili olduğunuz bir kart arşivden çıkarıldığında",
  },
  YORUM_GUNCELLENDI: {
    baslik: "Yorum güncellendi",
    aciklama: "Yetkili olduğunuz bir karttaki yorum düzenlendiğinde",
  },
  YORUM_SILINDI: {
    baslik: "Yorum silindi",
    aciklama: "Yetkili olduğunuz bir karttaki yorum silindiğinde",
  },
  KONTROL_LISTESI_OLUSTURULDU: {
    baslik: "Kontrol listesi oluşturuldu",
    aciklama: "Yetkili olduğunuz bir karta kontrol listesi eklendiğinde",
  },
  KONTROL_LISTESI_GUNCELLENDI: {
    baslik: "Kontrol listesi güncellendi",
    aciklama: "Yetkili olduğunuz bir kartın kontrol listesi değiştiğinde",
  },
  KONTROL_LISTESI_SILINDI: {
    baslik: "Kontrol listesi silindi",
    aciklama: "Yetkili olduğunuz bir karttaki kontrol listesi silindiğinde",
  },
  KART_KONTROL_MADDE_EKLENDI: {
    baslik: "Madde eklendi",
    aciklama: "Yetkili olduğunuz bir karta yeni kontrol maddesi eklendiğinde",
  },
  KART_KONTROL_MADDE_GUNCELLENDI: {
    baslik: "Madde güncellendi",
    aciklama: "Yetkili olduğunuz bir karttaki madde değiştirildiğinde",
  },
  KART_KONTROL_MADDE_SILINDI: {
    baslik: "Madde silindi",
    aciklama: "Yetkili olduğunuz bir karttaki madde silindiğinde",
  },
};

export const TERCIH_GRUPLARI: ReadonlyArray<TercihGrubu> = [
  {
    baslik: "Mention & Atama",
    aciklama: "Doğrudan size atfedilen olaylar",
    tipler: ["YORUM_MENTION", "KART_YETKILI_ATAMA", "MADDE_ATAMA"],
  },
  {
    baslik: "Yorum",
    aciklama: "Yetkili olduğunuz kartlardaki yorum etkileşimleri",
    tipler: ["YORUM_EKLENDI", "YORUM_GUNCELLENDI", "YORUM_SILINDI"],
  },
  {
    baslik: "Bitiş tarihi",
    aciklama: "Bitiş tarihi yaklaşıyor / geçti / değişti",
    tipler: ["BITIS_YAKLASIYOR", "BITIS_GECTI", "KART_BITIS_DEGISTI"],
  },
  {
    baslik: "Kart yaşam döngüsü",
    aciklama: "Kart oluşturma, başlık/açıklama değişimi, taşıma, arşiv, silme, tamamlama",
    tipler: [
      "KART_OLUSTURULDU",
      "KART_BASLIK_DEGISTI",
      "KART_ACIKLAMA_DEGISTI",
      "KART_DURUM_DEGISTI",
      "KART_ARSIVLENDI",
      "KART_GERI_YUKLENDI",
      "KART_SILINDI",
      "KART_TAMAMLANDI",
    ],
  },
  {
    baslik: "Kontrol listesi & Maddeler",
    aciklama: "Kontrol listesi ve madde CRUD olayları",
    tipler: [
      "KONTROL_LISTESI_OLUSTURULDU",
      "KONTROL_LISTESI_GUNCELLENDI",
      "KONTROL_LISTESI_SILINDI",
      "KART_KONTROL_MADDE_EKLENDI",
      "KART_KONTROL_MADDE_GUNCELLENDI",
      "KART_KONTROL_MADDE_SILINDI",
    ],
  },
  {
    baslik: "Liste yönetimi",
    aciklama: "Liste oluşturma, güncelleme, silme ve yetki yönetimi",
    tipler: [
      "LISTE_OLUSTURULDU",
      "LISTE_GUNCELLENDI",
      "LISTE_SILINDI",
      "LISTE_UYE_EKLENDI",
      "LISTE_UYE_CIKARILDI",
    ],
  },
  {
    baslik: "Proje yönetimi",
    aciklama: "Proje yaşam döngüsü ve yetki yönetimi",
    tipler: [
      "PROJE_OLUSTURULDU",
      "PROJE_GUNCELLENDI",
      "PROJE_ARSIVLENDI",
      "PROJE_GERI_YUKLENDI",
      "PROJE_SILINDI",
      "PROJE_UYE_EKLENDI",
      "PROJE_UYE_CIKARILDI",
    ],
  },
  {
    baslik: "Kart yetkili yönetimi",
    aciklama: "Kart yetkilisi ekleme/çıkarma",
    tipler: ["KART_YETKILI_CIKARILDI"],
  },
  {
    baslik: "Tamamlama önerileri (ADR-0019)",
    aciklama: "Yetkisiz kullanıcı tamamlandı önerileri ve onay/red sonuçları",
    tipler: [
      "KART_TAMAMLAMA_ONERILDI",
      "KART_TAMAMLAMA_ONAYLANDI",
      "KART_TAMAMLAMA_REDDEDILDI",
      "MADDE_TAMAMLAMA_ONERILDI",
      "MADDE_TAMAMLAMA_ONAYLANDI",
      "MADDE_TAMAMLAMA_REDDEDILDI",
    ],
  },
  {
    baslik: "Görsel & Etiket",
    aciklama: "Karttaki etiket ve kapak değişiklikleri",
    tipler: ["ETIKET_DEGISTI", "KAPAK_DEGISTI"],
  },
  {
    baslik: "Dosya (ADR-0028)",
    aciklama: "Dosya yükleme, silme, bağlama ve önizleme bildirimleri",
    tipler: [
      "DOSYA_YUKLENDI",
      "DOSYA_SILINDI",
      "DOSYA_BAGLANDI",
      "DOSYA_ONIZLEME_HAZIR",
      "EKLENTI_YUKLENDI",
    ],
  },
  {
    baslik: "Diğer",
    aciklama: "Davet ve sistem bildirimleri",
    tipler: ["DAVET_KABUL_EDILDI"],
  },
];
