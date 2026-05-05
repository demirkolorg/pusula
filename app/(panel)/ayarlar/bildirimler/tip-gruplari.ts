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
};

export const TERCIH_GRUPLARI: ReadonlyArray<TercihGrubu> = [
  {
    baslik: "Mention & Atama",
    aciklama: "Doğrudan size atfedilen olaylar",
    tipler: ["YORUM_MENTION", "KART_YETKILI_ATAMA", "MADDE_ATAMA"],
  },
  {
    baslik: "Yorum & Eklenti",
    aciklama: "Yetkili olduğunuz kartlardaki etkileşim",
    tipler: ["YORUM_EKLENDI", "EKLENTI_YUKLENDI"],
  },
  {
    baslik: "Bitiş tarihi",
    aciklama: "Bitiş tarihi yaklaşıyor / geçti / değişti",
    tipler: ["BITIS_YAKLASIYOR", "BITIS_GECTI", "KART_BITIS_DEGISTI"],
  },
  {
    baslik: "Kart yaşam döngüsü",
    aciklama: "Kart taşındı / silindi / tamamlandı",
    tipler: ["KART_DURUM_DEGISTI", "KART_SILINDI", "KART_TAMAMLANDI"],
  },
  {
    baslik: "Proje yönetimi",
    aciklama: "Proje üyeliği değişiklikleri",
    tipler: ["PROJE_UYE_EKLENDI", "PROJE_UYE_CIKARILDI"],
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
    baslik: "Diğer",
    aciklama: "Düşük öncelikli olaylar",
    tipler: [
      "LISTE_SILINDI",
      "DAVET_KABUL_EDILDI",
      "ETIKET_DEGISTI",
      "KAPAK_DEGISTI",
    ],
  },
];
