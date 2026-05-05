// Genel arama sonuç tipleri.
// Her tip ayrı domain alanları içerir; UI gruplandırma + ikon seçimi için
// `tip` ayrımı kullanılır.

import type { AramaTipi } from "./schemas";

type Temel = {
  /** Kaynak ID (uuid) — tıklanınca yönlendirme için. */
  id: string;
  /** İlk vurgulanacak metin (tsvector A ağırlığı). */
  baslik: string;
  /** İkincil metin — kart için aciklama, yorum için kısaltılmış icerik vs. */
  detay: string | null;
  /** ts_rank skoru — sıralama için. */
  rank: number;
};

export type AramaSonucu =
  | (Temel & { tip: "kart"; proje_id: string; liste_id: string })
  | (Temel & { tip: "yorum"; kart_id: string })
  | (Temel & { tip: "madde"; kontrol_listesi_id: string; kart_id: string })
  | (Temel & { tip: "eklenti"; kart_id: string })
  | (Temel & { tip: "kullanici"; soyad: string; email: string })
  | (Temel & { tip: "birim" })
  | (Temel & { tip: "etiket"; proje_id: string; renk: string })
  | (Temel & { tip: "proje" })
  | (Temel & { tip: "liste"; proje_id: string });

/** UI grup başlığı — Türkçe + çoğul. */
export const TIP_BASLIK: Record<AramaTipi, string> = {
  kart: "Kartlar",
  yorum: "Yorumlar",
  madde: "Kontrol Maddeleri",
  eklenti: "Eklentiler",
  kullanici: "Kullanıcılar",
  birim: "Birimler",
  etiket: "Etiketler",
  proje: "Projeler",
  liste: "Listeler",
};

/** Service çıktı paketi: sonuçlar + sorgu süresi (ms). UI'da göstermek için. */
export type AramaCikti = {
  sonuclar: AramaSonucu[];
  sureMs: number;
};
