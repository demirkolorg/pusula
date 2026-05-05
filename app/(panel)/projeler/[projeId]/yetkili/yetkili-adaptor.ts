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
  projeDavetYenidenGonderEylem,
  projeYetkilileriniListeleEylem,
  projeyeDavetGonderEylem,
  projeyeYetkiliEkleEylem,
  projeyeYetkiliKaldirEylem,
} from "./actions";
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
// Kişi adaptörü (ADR-0012: seviye yok, tek tip yetkili)
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
    ): Promise<{ kullanici_id: string; ozet?: YetkiliKisiOzeti }> => {
      switch (kaynak.tip) {
        case "proje":
          return paket(
            projeyeYetkiliEkleEylem({
              proje_id: kaynak.projeId,
              kullanici_id,
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
  eklenme_zamani: Date | string;
}): YetkiliKisiOzeti {
  return {
    kullanici_id: ozet.kullanici_id,
    ad: ozet.ad,
    soyad: ozet.soyad,
    email: ozet.email,
    birim_ad: null,
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
    eklenme_zamani: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Davet adaptörü (ADR-0010)
//
// Davet her zaman PROJE seviyesinde yetki verir — saf paylaşım modeli (ADR-0008)
// gereği proje yetkilisi olan kullanıcı alt liste/kart'lara da erişir. Bu yüzden
// kart ve liste yetkili paneli'nden açılan davet de kaynağın projesine yetkili
// olarak ekler. Server projeId'yi kart_id/liste_id'den türetir.
// ---------------------------------------------------------------------------

export type DavetAdaptor = {
  bekleyenleriQueryKey: QueryKey;
  bekleyenler: () => Promise<BekleyenDavetOzeti[]>;
  davetGonder: (girdi: {
    email: string;
    birim_id: string | null;
    rol_id: string;
  }) => Promise<{ davet_id: string; email: string }>;
  davetIptal: (davet_id: string) => Promise<{ davet_id: string }>;
  davetYenidenGonder: (
    davet_id: string,
  ) => Promise<{ davet_id: string; email: string }>;
};

type DavetKaynakArgs =
  | { proje_id: string }
  | { liste_id: string }
  | { kart_id: string };

function kaynakArgs(kaynak: YetkiliKaynagi): DavetKaynakArgs {
  switch (kaynak.tip) {
    case "proje":
      return { proje_id: kaynak.projeId };
    case "liste":
      return { liste_id: kaynak.listeId };
    case "kart":
      return { kart_id: kaynak.kartId };
  }
}

function bekleyenlerKey(kaynak: YetkiliKaynagi): QueryKey {
  switch (kaynak.tip) {
    case "proje":
      return ["proje-bekleyen-davetler", "proje", kaynak.projeId] as const;
    case "liste":
      return ["proje-bekleyen-davetler", "liste", kaynak.listeId] as const;
    case "kart":
      return ["proje-bekleyen-davetler", "kart", kaynak.kartId] as const;
  }
}

export function davetAdaptor(kaynak: YetkiliKaynagi): DavetAdaptor {
  const args = kaynakArgs(kaynak);
  return {
    bekleyenleriQueryKey: bekleyenlerKey(kaynak),
    bekleyenler: () =>
      paket(projeBekleyenDavetleriEylem(args)).then((veri) =>
        veri.map((d) => ({
          davet_id: d.davet_id,
          email: d.email,
          son_kullanma: d.son_kullanma,
          olusturma_zamani: d.olusturma_zamani,
        })),
      ),
    davetGonder: ({ email, birim_id, rol_id }) =>
      paket(
        projeyeDavetGonderEylem({
          ...args,
          email,
          birim_id,
          rol_id,
        }),
      ).then((s) => ({ davet_id: s.davet_id, email: s.email })),
    davetIptal: (davet_id) =>
      paket(projeDavetIptalEylem({ ...args, davet_id })).then(() => ({
        davet_id,
      })),
    davetYenidenGonder: (davet_id) =>
      paket(projeDavetYenidenGonderEylem({ ...args, davet_id })),
  };
}

// Saf optimistic helper'lar ayrı modülde — test edilebilirlik için.
export {
  optimistikBirimEkle,
  optimistikBirimKaldir,
  optimistikKisiEkle,
  optimistikKisiKaldir,
} from "./yetkili-optimistic";
