import {
  kartBirimEkleEylem,
  kartBirimKaldirEylem,
  kartBirimleriEylem,
  listeAdayKisilerEylem,
  listeBirimEkleEylem,
  listeBirimKaldirEylem,
  listeBirimleriEylem,
  listeYetkiliEkleEylem,
  listeYetkiliKaldirEylem,
  listeYetkilileriEylem,
  projeBirimEkleEylem,
  projeBirimKaldirEylem,
  projeBirimleriEylem,
} from "../actions";
import {
  kartAdayKullanicilarEylem,
  kartaYetkiliEkleEylem,
  kartaYetkiliKaldirEylem,
  kartinYetkilileriEylem,
  projeAdayKullanicilarEylem,
  projeBekleyenDavetleriEylem,
  projeDavetIptalEylem,
  projeYetkilileriniListeleEylem,
  projeYetkilisiSeviyeGuncelleEylem,
  projeyeDavetGonderEylem,
  projeyeYetkiliEkleEylem,
  projeyeYetkiliKaldirEylem,
} from "./actions";
import type { ProjeYetkiSeviyesi } from "./schemas";
import type {
  BekleyenDavetOzeti,
  YetkiliBirimOzeti,
  YetkiliKaynagi,
  YetkiliKisiAdayi,
  YetkiliKisiOzeti,
} from "./yetkili-tipler";

type Sonuc<T> =
  | { basarili: true; veri: T }
  | { basarili: false; hata: string; kod: string };

async function paket<T>(
  vaad: Promise<Sonuc<T>>,
): Promise<T> {
  const sonuc = await vaad;
  if (!sonuc.basarili) throw new Error(sonuc.hata);
  return sonuc.veri;
}

// ---------------------------------------------------------------------------
// Query key üretimi — kart için mevcut hook'lar ile uyumlu, proje/liste
// için ortak şema. Chip-bağlantı ve panel aynı cache'i paylaşır.
// ---------------------------------------------------------------------------

type QueryKey = readonly unknown[];

export function birimQueryKey(kaynak: YetkiliKaynagi): QueryKey {
  switch (kaynak.tip) {
    case "kart":
      return ["kart-birimler", kaynak.kartId] as const;
    case "proje":
      return ["yetkili-birimleri", "proje", kaynak.projeId] as const;
    case "liste":
      return ["yetkili-birimleri", "liste", kaynak.listeId] as const;
  }
}

export function kisiQueryKey(kaynak: YetkiliKaynagi): QueryKey {
  switch (kaynak.tip) {
    case "kart":
      return ["kart-yetkilileri", kaynak.kartId] as const;
    case "proje":
      return ["proje-yetkilileri", kaynak.projeId] as const;
    case "liste":
      return ["liste-yetkilileri", kaynak.listeId] as const;
  }
}

export function kisiAdayQueryKey(kaynak: YetkiliKaynagi, q: string): QueryKey {
  switch (kaynak.tip) {
    case "kart":
      return ["kart-aday-kullanicilar", kaynak.kartId, q] as const;
    case "proje":
      return ["proje-aday-kullanicilar", kaynak.projeId, q] as const;
    case "liste":
      return ["liste-aday-kisiler", kaynak.listeId, q] as const;
  }
}

// Why ek invalidate: kart yetkili/birim mutation'ı `proje-detay` cache'indeki
// `yetkili_sayisi`'nı eskime tehlikesine sokar (kanban kart rozeti). Aynı
// şekilde kart aktivite listesi de değişir. Bu yardımcılar mutation'a
// `ekInvalidate: extra*Keys(kaynak)` olarak verilir.
export function extraKisiKeys(kaynak: YetkiliKaynagi): QueryKey[] {
  if (kaynak.tip !== "kart") return [];
  return [
    ["proje-detay", kaynak.projeId] as const,
    ["kart-aktiviteleri", kaynak.kartId] as const,
  ];
}

export function extraBirimKeys(kaynak: YetkiliKaynagi): QueryKey[] {
  if (kaynak.tip !== "kart") return [];
  return [["kart-aktiviteleri", kaynak.kartId] as const];
}

// ---------------------------------------------------------------------------
// Birim adaptörü
// ---------------------------------------------------------------------------

export function birimAdaptor(kaynak: YetkiliKaynagi) {
  return {
    queryKey: birimQueryKey(kaynak),
    listele: (): Promise<YetkiliBirimOzeti[]> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeBirimleriEylem({ proje_id: kaynak.projeId }),
          ) as Promise<YetkiliBirimOzeti[]>;
        case "liste":
          return paket(
            listeBirimleriEylem({ liste_id: kaynak.listeId }),
          ) as Promise<YetkiliBirimOzeti[]>;
        case "kart":
          return paket(
            kartBirimleriEylem({ kart_id: kaynak.kartId }),
          ) as Promise<YetkiliBirimOzeti[]>;
      }
    },
    ekle: (birim_id: string): Promise<{ birim_id: string }> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeBirimEkleEylem({ proje_id: kaynak.projeId, birim_id }),
          ).then(() => ({ birim_id }));
        case "liste":
          return paket(
            listeBirimEkleEylem({ liste_id: kaynak.listeId, birim_id }),
          ).then(() => ({ birim_id }));
        case "kart":
          return paket(
            kartBirimEkleEylem({ kart_id: kaynak.kartId, birim_id }),
          ).then(() => ({ birim_id }));
      }
    },
    kaldir: (birim_id: string): Promise<{ birim_id: string }> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeBirimKaldirEylem({ proje_id: kaynak.projeId, birim_id }),
          ).then(() => ({ birim_id }));
        case "liste":
          return paket(
            listeBirimKaldirEylem({ liste_id: kaynak.listeId, birim_id }),
          ).then(() => ({ birim_id }));
        case "kart":
          return paket(
            kartBirimKaldirEylem({ kart_id: kaynak.kartId, birim_id }),
          ).then(() => ({ birim_id }));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Kişi adaptörü
//
// Why proje farkı: Proje yetkilisi seviye taşır (ADMIN/NORMAL/IZLEYICI),
// liste ve kart düz kişi listesi tutar. seviyeGuncelle yalnız proje için
// destekli; UI bu özelliği `seviyeDestekliMi()` ile koşullu render eder.
// ---------------------------------------------------------------------------

export function kisiAdaptor(kaynak: YetkiliKaynagi) {
  return {
    queryKey: kisiQueryKey(kaynak),
    adayQueryKey: (q: string) => kisiAdayQueryKey(kaynak, q),

    listele: (): Promise<YetkiliKisiOzeti[]> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeYetkilileriniListeleEylem({ proje_id: kaynak.projeId }),
          ).then((veri) => veri.map(projeyiKisiyeNormalize));
        case "liste":
          return paket(
            listeYetkilileriEylem({ liste_id: kaynak.listeId }),
          ).then((veri) => veri.map(listeyiKisiyeNormalize));
        case "kart":
          return paket(
            kartinYetkilileriEylem({ kart_id: kaynak.kartId }),
          ).then((veri) => veri.map(karttanKisiyeNormalize));
      }
    },

    adaylar: (q: string): Promise<YetkiliKisiAdayi[]> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeAdayKullanicilarEylem({ proje_id: kaynak.projeId, q }),
          ).then((veri) =>
            veri.map((aday) => ({
              id: aday.id,
              ad: aday.ad,
              soyad: aday.soyad,
              email: aday.email,
              birim_ad: aday.birim_ad,
            })),
          );
        case "liste":
          return paket(
            listeAdayKisilerEylem({ liste_id: kaynak.listeId, q }),
          );
        case "kart":
          return paket(
            kartAdayKullanicilarEylem({ kart_id: kaynak.kartId, q }),
          ).then((veri) =>
            veri.map((aday) => ({
              id: aday.id,
              ad: aday.ad,
              soyad: aday.soyad,
              email: aday.email,
              birim_ad: aday.birim_ad,
            })),
          );
      }
    },

    ekle: (
      kullanici_id: string,
      seviye: ProjeYetkiSeviyesi,
    ): Promise<{ kullanici_id: string; ozet?: YetkiliKisiOzeti }> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeyeYetkiliEkleEylem({
              proje_id: kaynak.projeId,
              kullanici_id,
              seviye,
            }),
          ).then((ozet) => ({
            kullanici_id,
            ozet: projeyiKisiyeNormalize(ozet),
          }));
        case "liste":
          return paket(
            listeYetkiliEkleEylem({
              liste_id: kaynak.listeId,
              kullanici_id,
            }),
          ).then((sonuc) => ({
            kullanici_id,
            ozet: listeyiKisiyeNormalize(sonuc.yetkili),
          }));
        case "kart":
          return paket(
            kartaYetkiliEkleEylem({ kart_id: kaynak.kartId, kullanici_id }),
          ).then(() => ({ kullanici_id }));
      }
    },

    kaldir: (kullanici_id: string): Promise<{ kullanici_id: string }> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeyeYetkiliKaldirEylem({
              proje_id: kaynak.projeId,
              kullanici_id,
            }),
          ).then(() => ({ kullanici_id }));
        case "liste":
          return paket(
            listeYetkiliKaldirEylem({
              liste_id: kaynak.listeId,
              kullanici_id,
            }),
          ).then(() => ({ kullanici_id }));
        case "kart":
          return paket(
            kartaYetkiliKaldirEylem({
              kart_id: kaynak.kartId,
              kullanici_id,
            }),
          ).then(() => ({ kullanici_id }));
      }
    },

    seviyeGuncelle: (
      kullanici_id: string,
      seviye: ProjeYetkiSeviyesi,
    ): Promise<{ kullanici_id: string; seviye: ProjeYetkiSeviyesi }> => {
      if (kaynak.tip !== "proje") {
        return Promise.reject(
          new Error("Seviye yalnızca proje yetkilileri için günceller."),
        );
      }
      return paket(
        projeYetkilisiSeviyeGuncelleEylem({
          proje_id: kaynak.projeId,
          kullanici_id,
          seviye,
        }),
      ).then(() => ({ kullanici_id, seviye }));
    },
  };
}

// ---------------------------------------------------------------------------
// Servis tipinden ortak kişi tipine normalize — sıfır iş kaybı
// ---------------------------------------------------------------------------

function projeyiKisiyeNormalize(ozet: {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
  seviye: ProjeYetkiSeviyesi;
  eklenme_zamani: Date | string;
}): YetkiliKisiOzeti {
  return {
    kullanici_id: ozet.kullanici_id,
    ad: ozet.ad,
    soyad: ozet.soyad,
    email: ozet.email,
    birim_ad: null,
    seviye: ozet.seviye,
    eklenme_zamani: ozet.eklenme_zamani,
  };
}

function listeyiKisiyeNormalize(ozet: {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_ad: string | null;
  eklenme_zamani: Date | string;
}): YetkiliKisiOzeti {
  return {
    kullanici_id: ozet.kullanici_id,
    ad: ozet.ad,
    soyad: ozet.soyad,
    email: ozet.email,
    birim_ad: ozet.birim_ad,
    seviye: null,
    eklenme_zamani: ozet.eklenme_zamani,
  };
}

function karttanKisiyeNormalize(ozet: {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
}): YetkiliKisiOzeti {
  return {
    kullanici_id: ozet.kullanici_id,
    ad: ozet.ad,
    soyad: ozet.soyad,
    email: ozet.email,
    birim_ad: null,
    seviye: null,
    eklenme_zamani: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Davet adaptörü — yalnız proje kaynağı için (ADR-0010)
// Why: kart/liste'de davet anlamsız; daveti kabul eden kullanıcı önce projeye
// yetkili olur, gerekirse sonradan liste/kart yetkisi verilir.
// ---------------------------------------------------------------------------

export type DavetAdaptor = {
  bekleyenleriQueryKey: QueryKey;
  bekleyenler: () => Promise<BekleyenDavetOzeti[]>;
  davetGonder: (girdi: {
    email: string;
    seviye: ProjeYetkiSeviyesi;
  }) => Promise<{ davet_id: string; email: string }>;
  davetIptal: (davet_id: string) => Promise<{ davet_id: string }>;
};

export function davetAdaptor(
  kaynak: YetkiliKaynagi,
): DavetAdaptor | null {
  if (kaynak.tip !== "proje") return null;
  const projeId = kaynak.projeId;
  return {
    bekleyenleriQueryKey: ["proje-bekleyen-davetler", projeId] as const,
    bekleyenler: () =>
      paket(projeBekleyenDavetleriEylem({ proje_id: projeId })).then((veri) =>
        veri.map((d) => ({
          davet_id: d.davet_id,
          email: d.email,
          seviye: d.seviye,
          son_kullanma: d.son_kullanma,
          olusturma_zamani: d.olusturma_zamani,
        })),
      ),
    davetGonder: ({ email, seviye }) =>
      paket(
        projeyeDavetGonderEylem({
          proje_id: projeId,
          email,
          seviye,
        }),
      ),
    davetIptal: (davet_id) =>
      paket(
        projeDavetIptalEylem({
          proje_id: projeId,
          davet_id,
        }),
      ).then(() => ({ davet_id })),
  };
}

// Saf optimistic helper'lar ayrı modülde — test edilebilirlik için.
export {
  optimistikBirimEkle,
  optimistikBirimKaldir,
  optimistikKisiEkle,
  optimistikKisiKaldir,
  optimistikSeviyeGuncelle,
} from "./yetkili-optimistic";
