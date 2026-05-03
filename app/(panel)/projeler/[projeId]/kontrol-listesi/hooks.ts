"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { siraSonuna } from "@/lib/sira";
import { tempId } from "@/lib/temp-id";
import {
  kontrolListeleriListeleEylem,
  kontrolListesiGuncelleEylem,
  kontrolListesiOlusturEylem,
  kontrolListesiSilEylem,
  maddeGuncelleEylem,
  maddeOlusturEylem,
  maddeSilEylem,
} from "./actions";
import type {
  KontrolListesiGuncelle,
  KontrolListesiOlustur,
  KontrolListesiSil,
  MaddeGuncelle,
  MaddeOlustur,
  MaddeSil,
} from "./schemas";
import type { KontrolListesiOzeti, MaddeOzeti } from "./services";

export const KART_KONTROL_KEY = "kart-kontrol-listeleri";

export function kartKontrolKey(kartId: string) {
  return [KART_KONTROL_KEY, kartId] as const;
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
    hataMesaji: "Madde eklenemedi",
  });
}

export function useMaddeGuncelle(kartId: string) {
  return useOptimisticMutation<MaddeGuncelle, { id: string }>({
    queryKey: kartKontrolKey(kartId),
    mutationFn: eylemMutasyonu(maddeGuncelleEylem),
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
                bitis: vars.bitis !== undefined ? (vars.bitis ?? null) : m.bitis,
              }
            : m,
        ),
      }));
    },
    hataMesaji: "Madde güncellenemedi",
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
    hataMesaji: "Madde silinemedi",
  });
}

export { tempId };
