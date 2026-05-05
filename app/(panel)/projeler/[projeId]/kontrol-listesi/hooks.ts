"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { siraSonuna } from "@/lib/sira";
import { tempId } from "@/lib/temp-id";
import { kartAktiviteleriKey } from "../aktivite/keys";
import {
  kontrolListeleriListeleEylem,
  kontrolListesiGuncelleEylem,
  kontrolListesiOlusturEylem,
  kontrolListesiSilEylem,
  maddeAdayKullanicilarEylem,
  maddeGuncelleEylem,
  maddeOlusturEylem,
  maddeSilEylem,
  maddeTamamlamaOneriEylem,
  maddeTamamlamaOnayEylem,
  maddeTamamlamaReddetEylem,
} from "./actions";
import type {
  KontrolListesiGuncelle,
  KontrolListesiOlustur,
  KontrolListesiSil,
  MaddeGuncelle,
  MaddeOlustur,
  MaddeSil,
  MaddeTamamlamaOneri,
  MaddeTamamlamaOnay,
  MaddeTamamlamaReddet,
} from "./schemas";
import type {
  KontrolListesiOzeti,
  MaddeAdayKullanici,
  MaddeOzeti,
} from "./services";

// Optimistic update için isim de geliyorsa nested `atanan` görsel olarak
// hemen güncellenir; aksi halde server cevabı dönene kadar boş görünürdü.
export type MaddeGuncelleOptimistic = MaddeGuncelle & {
  atanan_ozeti?: { ad: string; soyad: string } | null;
};

export const KART_KONTROL_KEY = "kart-kontrol-listeleri";
export const MADDE_ADAY_KEY = "kontrol-madde-aday-kullanicilar";

export function kartKontrolKey(kartId: string) {
  return [KART_KONTROL_KEY, kartId] as const;
}

export function maddeAdayKey(kartId: string, q: string) {
  return [MADDE_ADAY_KEY, kartId, q] as const;
}

// =====================================================================
// Query
// =====================================================================

export function useKartKontrolListeleri(kartId: string | null) {
  return useQuery({
    queryKey: kartKontrolKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kontrolListeleriListeleEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
}

// =====================================================================
// Kontrol Listesi mutations
// =====================================================================

export function useKontrolListesiOlustur(kartId: string) {
  return useOptimisticMutation<
    KontrolListesiOlustur & { id_taslak: string },
    KontrolListesiOzeti
  >({
    queryKey: kartKontrolKey(kartId),
    mutationFn: ({ id_taslak: _id, ...vars }) =>
      eylemMutasyonu(kontrolListesiOlusturEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      const sonSira = liste[liste.length - 1]?.sira ?? null;
      const taslak: KontrolListesiOzeti = {
        id: vars.id_taslak,
        kart_id: vars.kart_id,
        ad: vars.ad,
        sira: siraSonuna(sonSira),
        maddeler: [],
      };
      return [...liste, taslak];
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => (kl.id === vars.id_taslak ? yanit : kl));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Kontrol listesi eklenemedi",
  });
}

export function useKontrolListesiGuncelle(kartId: string) {
  return useOptimisticMutation<KontrolListesiGuncelle, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(kontrolListesiGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) =>
        kl.id === vars.id ? { ...kl, ad: vars.ad } : kl,
      );
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Kontrol listesi güncellenemedi",
  });
}

export function useKontrolListesiSil(kartId: string) {
  return useOptimisticMutation<KontrolListesiSil, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(kontrolListesiSilEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.filter((kl) => kl.id !== vars.id);
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Kontrol listesi silinemedi",
  });
}

// =====================================================================
// Madde mutations
// =====================================================================

export function useMaddeOlustur(kartId: string) {
  return useOptimisticMutation<
    MaddeOlustur & { id_taslak: string },
    MaddeOzeti
  >({
    queryKey: kartKontrolKey(kartId),
    mutationFn: ({ id_taslak: _id, ...vars }) =>
      eylemMutasyonu(maddeOlusturEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => {
        if (kl.id !== vars.kontrol_listesi_id) return kl;
        const sonSira = kl.maddeler[kl.maddeler.length - 1]?.sira ?? null;
        const taslak: MaddeOzeti = {
          id: vars.id_taslak,
          kontrol_listesi_id: vars.kontrol_listesi_id,
          metin: vars.metin,
          tamamlandi_mi: false,
          tamamlama_zamani: null,
          tamamlayan_id: null,
          tamamlanma_oneri_durumu: "YOK",
          tamamlanma_oneren_id: null,
          tamamlanma_oneren: null,
          tamamlanma_oneri_zamani: null,
          tamamlanma_red_sebebi: null,
          atanan_id: vars.atanan_id ?? null,
          atanan: null,
          bitis: vars.bitis ?? null,
          sira: siraSonuna(sonSira),
        };
        return { ...kl, maddeler: [...kl.maddeler, taslak] };
      });
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => {
        if (kl.id !== vars.kontrol_listesi_id) return kl;
        return {
          ...kl,
          maddeler: kl.maddeler.map((m) => (m.id === vars.id_taslak ? yanit : m)),
        };
      });
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Madde eklenemedi",
  });
}

export function useMaddeGuncelle(kartId: string) {
  return useOptimisticMutation<MaddeGuncelleOptimistic, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: ({ atanan_ozeti: _ozet, ...vars }) =>
      eylemMutasyonu(maddeGuncelleEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => ({
        ...kl,
        maddeler: kl.maddeler.map((m) =>
          m.id === vars.id
            ? {
                ...m,
                metin: vars.metin ?? m.metin,
                tamamlandi_mi:
                  vars.tamamlandi_mi !== undefined
                    ? vars.tamamlandi_mi
                    : m.tamamlandi_mi,
                tamamlama_zamani:
                  vars.tamamlandi_mi === true
                    ? new Date()
                    : vars.tamamlandi_mi === false
                      ? null
                      : m.tamamlama_zamani,
                atanan_id:
                  vars.atanan_id !== undefined ? vars.atanan_id : m.atanan_id,
                atanan:
                  vars.atanan_id === null
                    ? null
                    : vars.atanan_id !== undefined
                      ? (vars.atanan_ozeti ?? m.atanan)
                      : m.atanan,
                bitis: vars.bitis !== undefined ? (vars.bitis ?? null) : m.bitis,
              }
            : m,
        ),
      }));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Madde güncellenemedi",
  });
}

// ADR-0019 — Madde tamamlama öneri/onay/red hook'ları (kart ile aynı pattern).

export function useMaddeTamamlamaOner(kartId: string) {
  return useOptimisticMutation<MaddeTamamlamaOneri, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(maddeTamamlamaOneriEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => ({
        ...kl,
        maddeler: kl.maddeler.map((m) =>
          m.id === vars.id
            ? {
                ...m,
                tamamlanma_oneri_durumu: "BEKLIYOR" as const,
                tamamlanma_oneri_zamani: new Date(),
                tamamlanma_red_sebebi: null,
              }
            : m,
        ),
      }));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Tamamlanma önerisi gönderilemedi",
  });
}

export function useMaddeTamamlamaOnayla(kartId: string) {
  return useOptimisticMutation<MaddeTamamlamaOnay, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(maddeTamamlamaOnayEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => ({
        ...kl,
        maddeler: kl.maddeler.map((m) =>
          m.id === vars.id
            ? {
                ...m,
                tamamlandi_mi: true,
                tamamlama_zamani: new Date(),
                tamamlanma_oneri_durumu: "YOK" as const,
                tamamlanma_oneren_id: null,
                tamamlanma_oneren: null,
                tamamlanma_oneri_zamani: null,
                tamamlanma_red_sebebi: null,
              }
            : m,
        ),
      }));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Öneri onaylanamadı",
  });
}

export function useMaddeTamamlamaReddet(kartId: string) {
  return useOptimisticMutation<MaddeTamamlamaReddet, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(maddeTamamlamaReddetEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => ({
        ...kl,
        maddeler: kl.maddeler.map((m) =>
          m.id === vars.id
            ? {
                ...m,
                tamamlanma_oneri_durumu: "REDDEDILDI" as const,
                tamamlanma_red_sebebi: vars.sebep?.trim() || null,
              }
            : m,
        ),
      }));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Öneri reddedilemedi",
  });
}

export function useMaddeSil(kartId: string) {
  return useOptimisticMutation<MaddeSil, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(maddeSilEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KontrolListesiOzeti[] | undefined) ?? [];
      return liste.map((kl) => ({
        ...kl,
        maddeler: kl.maddeler.filter((m) => m.id !== vars.id),
      }));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Madde silinemedi",
  });
}

// =====================================================================
// Madde sorumlu picker'ı için aday kullanıcı sorgusu
// =====================================================================

export function useKartMaddeAdayKullanicilar(
  kartId: string,
  q: string,
  enabled: boolean,
) {
  return useQuery<MaddeAdayKullanici[]>({
    queryKey: maddeAdayKey(kartId, q),
    enabled,
    queryFn: async () => {
      const r = await maddeAdayKullanicilarEylem({ kart_id: kartId, q });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export { tempId };
