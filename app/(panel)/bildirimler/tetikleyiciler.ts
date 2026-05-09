// Sprint 3 / S3-4 — Bildirim tetikleyicileri barrel.
//
// Bu dosya ADR-0032 planına göre kategori bazlı parça dosyalara bölündü:
//   tetikleyiciler/
//     _ortak.ts          — yardımcılar (kart bağlamı, alıcı haritası,
//                           tamamlama yetkilileri, mention parse, vb.)
//     kart.ts            — yorum, eklenti, durum, bitiş, silme, tamamlama,
//                           kapak, bitiş cron'u (12 trigger)
//     liste.ts           — listeSilindi
//     proje.ts           — projeUyeEklendi/Cikarildi
//     davet.ts           — davetKabulEdildi
//     kontrol-listesi.ts — maddeAtama, madde tamamlama 3 olay
//     etiket.ts          — etiketDegisti
//     dosya.ts           — ADR-0028 yeni Dosya akışı (yuklendi/silindi/baglandi)
//
// Çağıran kod `from "@/app/(panel)/bildirimler/tetikleyiciler"` import'u
// aynı kalır — bu barrel public API'yi korur.

export {
  tetikleYorumMention,
  tetikleKartYetkiliAtama,
  tetikleYorumEklendi,
  tetikleYorumGuncellendi,
  tetikleYorumSilindi,
  tetikleEklentiYuklendi,
  tetikleKartDurumDegisti,
  tetikleKartBitisDegisti,
  tetikleKartSilindi,
  tetikleKartTamamlandi,
  tetikleKartTamamlamaOnerildi,
  tetikleKartTamamlamaOnaylandi,
  tetikleKartTamamlamaReddedildi,
  tetikleKapakDegisti,
  tetikleBitisYaklasiyor,
  tetikleBitisGecti,
  tetikleKartOlusturuldu,
  tetikleKartBaslikDegisti,
  tetikleKartAciklamaDegisti,
  tetikleKartYetkiliCikarildi,
  tetikleKartArsivlendi,
  tetikleKartGeriYuklendi,
} from "./tetikleyiciler/kart";

export {
  tetikleListeSilindi,
  tetikleListeUyeEklendi,
  tetikleListeUyeCikarildi,
  tetikleListeOlusturuldu,
  tetikleListeGuncellendi,
} from "./tetikleyiciler/liste";

export {
  tetikleProjeUyeEklendi,
  tetikleProjeUyeCikarildi,
  tetikleProjeOlusturuldu,
  tetikleProjeGuncellendi,
  tetikleProjeArsivlendi,
  tetikleProjeGeriYuklendi,
  tetikleProjeSilindi,
} from "./tetikleyiciler/proje";

export { tetikleDavetKabulEdildi } from "./tetikleyiciler/davet";

export {
  tetikleMaddeAtama,
  tetikleMaddeTamamlamaOnerildi,
  tetikleMaddeTamamlamaOnaylandi,
  tetikleMaddeTamamlamaReddedildi,
  tetikleKontrolListesiOlusturuldu,
  tetikleKontrolListesiGuncellendi,
  tetikleKontrolListesiSilindi,
  tetikleMaddeEklendi,
  tetikleMaddeGuncellendi,
  tetikleMaddeSilindi,
} from "./tetikleyiciler/kontrol-listesi";

export { tetikleEtiketDegisti } from "./tetikleyiciler/etiket";

export {
  tetikleDosyaYuklendi,
  tetikleDosyaSilindi,
  tetikleDosyaBaglandi,
} from "./tetikleyiciler/dosya";

// Yardımcı public export — bazı yerler mention parse için kullanıyor.
export { mentionParse } from "./tetikleyiciler/_ortak";
