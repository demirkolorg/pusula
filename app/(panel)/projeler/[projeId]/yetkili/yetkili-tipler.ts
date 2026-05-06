import type { BirimTipi } from "@prisma/client";

// ---------------------------------------------------------------------------
// Polimorfik yetkili paneli — kaynak ve izin tipleri
// ---------------------------------------------------------------------------

export type YetkiliPaneliIzinleri = {
  birimYonet: boolean;
  kisiYonet: boolean;
};

export type YetkiliKaynagi =
  | { tip: "proje"; projeId: string; izinler: YetkiliPaneliIzinleri }
  | { tip: "liste"; listeId: string; izinler: YetkiliPaneliIzinleri }
  | {
      tip: "kart";
      kartId: string;
      projeId: string;
      izinler: YetkiliPaneliIzinleri;
    };

export type YetkiliBirimOzeti = {
  birim_id: string;
  ad: string | null;
  tip: BirimTipi;
  eklenme_zamani: Date | string;
};

export type YetkiliBirimSecenegi = {
  id: string;
  ad: string | null;
  tip: BirimTipi;
};

export type YetkiliKisiOzeti = {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_ad: string | null;
  eklenme_zamani: Date | string;
};

export type YetkiliKisiAdayi = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_ad: string | null;
  // Why birim_yetkili: kişinin birimi proje/liste/kart birim yetkilileri
  // arasındaysa zaten erişimi var; ekstra kişi yetkisi gereksiz. UI bu
  // flag'e göre rozet/uyarı gösterir, eklenmesini engeller.
  birim_yetkili: boolean;
};

export type BekleyenDavetOzeti = {
  davet_id: string;
  email: string;
  son_kullanma: Date | string;
  olusturma_zamani: Date | string;
};

// ---------------------------------------------------------------------------
// Saf yardımcılar — kaynak normalize eder
// ---------------------------------------------------------------------------

export function kaynakId(kaynak: YetkiliKaynagi): string {
  switch (kaynak.tip) {
    case "proje":
      return kaynak.projeId;
    case "liste":
      return kaynak.listeId;
    case "kart":
      return kaynak.kartId;
  }
}

export function kaynakAdi(kaynak: YetkiliKaynagi): "proje" | "liste" | "kart" {
  return kaynak.tip;
}

const BASLIK: Record<YetkiliKaynagi["tip"], string> = {
  proje: "Proje yetkilileri",
  liste: "Liste yetkilileri",
  kart: "Kart yetkilileri",
};

const BIRIM_ACIKLAMA: Record<YetkiliKaynagi["tip"], string> = {
  proje:
    "Eklenen birimlerin personeli projeyi ve altındaki tüm liste/kartları görebilir.",
  liste: "Eklenen birimlerin personeli sadece bu listeyi ve kartlarını görebilir.",
  kart: "Eklenen birimlerin personeli sadece bu kartı görebilir.",
};

const KISI_ACIKLAMA: Record<YetkiliKaynagi["tip"], string> = {
  proje: "Birim üyeliğinden bağımsız olarak kişi bazlı yetki verir.",
  liste:
    "Bu listeye özel kişi yetkisi; proje yetkilileri zaten erişir.",
  kart: "Bu karta özel kişi yetkisi; proje/liste yetkilileri zaten erişir.",
};

const PANEL_ACIKLAMA: Record<YetkiliKaynagi["tip"], string> = {
  proje: "Bu projeyi kimler görebilir ve düzenleyebilir?",
  liste:
    "Bu liste için ek yetki; proje yetkililerini kapsamaz, üzerine ekler.",
  kart: "Bu kart için ek yetki; proje/liste yetkililerini kapsamaz, üzerine ekler.",
};

export function panelBasligi(kaynak: YetkiliKaynagi): string {
  return BASLIK[kaynak.tip];
}

export function panelAciklamasi(kaynak: YetkiliKaynagi): string {
  return PANEL_ACIKLAMA[kaynak.tip];
}

export function birimAciklamasi(kaynak: YetkiliKaynagi): string {
  return BIRIM_ACIKLAMA[kaynak.tip];
}

export function kisiAciklamasi(kaynak: YetkiliKaynagi): string {
  return KISI_ACIKLAMA[kaynak.tip];
}
