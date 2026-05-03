"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { tempId } from "@/lib/temp-id";
import { projeDetayKey } from "../hooks/detay-sorgulari";
import type { ProjeDetayOzeti } from "../services";
import {
  etiketGuncelleEylem,
  etiketleriListeleEylem,
  etiketOlusturEylem,
  etiketSilEylem,
  kartaEtiketEkleEylem,
  kartaEtiketKaldirEylem,
  kartinEtiketleriEylem,
} from "./actions";
import type {
  EtiketGuncelle,
  EtiketOlustur,
  EtiketSil,
  KartaEtiketEkle,
  KartaEtiketKaldir,
} from "./schemas";
import type { EtiketOzeti } from "./services";

export const ETIKETLER_KEY = "etiketler";
export const KART_ETIKETLERI_KEY = "kart-etiketleri";

export function etiketlerKey(projeId: string) {
  return [ETIKETLER_KEY, projeId] as const;
}

export function kartEtiketleriKey(kartId: string) {
  return [KART_ETIKETLERI_KEY, kartId] as const;
}

// =====================================================================
// Sorgular
// =====================================================================

export function useEtiketler(projeId: string) {
  return useQuery({
    queryKey: etiketlerKey(projeId),
    queryFn: async () => {
      const r = await etiketleriListeleEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

export function useKartEtiketleri(kartId: string | null) {
  return useQuery({
    queryKey: kartEtiketleriKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kartinEtiketleriEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

// =====================================================================
// Etiket CRUD mutations (proje düzeyinde)
// =====================================================================

export function useEtiketOlustur(projeId: string) {
  return useOptimisticMutation<
    EtiketOlustur & { id_taslak: string },
    EtiketOzeti
  >({
    queryKey: etiketlerKey(projeId),
    mutationFn: ({ id_taslak: _id_taslak, ...vars }) =>
      eylemMutasyonu(etiketOlusturEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as EtiketOzeti[] | undefined) ?? [];
      const taslak: EtiketOzeti = {
        id: vars.id_taslak,
        proje_id: vars.proje_id,
        ad: vars.ad,
        renk: vars.renk,
      };
      return [...liste, taslak];
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as EtiketOzeti[] | undefined) ?? [];
      return liste.map((e) => (e.id === vars.id_taslak ? yanit : e));
    },
    hataMesaji: "Etiket eklenemedi",
  });
}

export function useEtiketGuncelle(projeId: string) {
  return useOptimisticMutation<EtiketGuncelle, { id: string }>({
    queryKey: etiketlerKey(projeId),
    mutationFn: eylemMutasyonu(etiketGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as EtiketOzeti[] | undefined) ?? [];
      return liste.map((e) =>
        e.id === vars.id
          ? { ...e, ad: vars.ad ?? e.ad, renk: vars.renk ?? e.renk }
          : e,
      );
    },
    hataMesaji: "Etiket güncellenemedi",
  });
}

export function useEtiketSil(projeId: string) {
  return useOptimisticMutation<EtiketSil, { id: string }>({
    queryKey: [etiketlerKey(projeId), projeDetayKey(projeId)] as const,
    mutationFn: eylemMutasyonu(etiketSilEylem),
    optimisticMap: [
      {
        queryKey: etiketlerKey(projeId),
        update: (eski, vars) => {
          const liste = (eski as EtiketOzeti[] | undefined) ?? [];
          return liste.filter((e) => e.id !== vars.id);
        },
      },
      {
        // Detay cache'inde silinmiş etiket sayısını da güncelle
        queryKey: projeDetayKey(projeId),
        update: (eski) => {
          // Etiket sayıları sadece _count.etiketler — invalidate ile düzelir.
          // Burada veriye dokunmuyoruz; onSettled invalidate yenileyecek.
          return eski;
        },
      },
    ],
    hataMesaji: "Etiket silinemedi",
  });
}

// =====================================================================
// Karta etiket ata / kaldır mutations
// =====================================================================

export function useKartaEtiketEkle(kartId: string, projeId: string) {
  return useOptimisticMutation<KartaEtiketEkle, { kart_id: string; etiket_id: string }>({
    queryKey: [
      kartEtiketleriKey(kartId),
      projeDetayKey(projeId),
    ] as const,
    mutationFn: eylemMutasyonu(kartaEtiketEkleEylem),
    optimisticMap: [
      {
        queryKey: kartEtiketleriKey(kartId),
        update: (eski, vars) => {
          const ids = (eski as string[] | undefined) ?? [];
          if (ids.includes(vars.etiket_id)) return ids;
          return [...ids, vars.etiket_id];
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpEtiketSayisi(eski, vars.kart_id, +1),
      },
    ],
    hataMesaji: "Etiket eklenemedi",
  });
}

export function useKartaEtiketKaldir(kartId: string, projeId: string) {
  return useOptimisticMutation<KartaEtiketKaldir, { kart_id: string; etiket_id: string }>({
    queryKey: [
      kartEtiketleriKey(kartId),
      projeDetayKey(projeId),
    ] as const,
    mutationFn: eylemMutasyonu(kartaEtiketKaldirEylem),
    optimisticMap: [
      {
        queryKey: kartEtiketleriKey(kartId),
        update: (eski, vars) => {
          const ids = (eski as string[] | undefined) ?? [];
          return ids.filter((id) => id !== vars.etiket_id);
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpEtiketSayisi(eski, vars.kart_id, -1),
      },
    ],
    hataMesaji: "Etiket kaldırılamadı",
  });
}

// Detay cache'inde kartın etiket_sayisi'nı +1/-1 değiştir (badge için).
function bumpEtiketSayisi(
  eski: unknown,
  kartId: string,
  delta: 1 | -1,
): unknown {
  const d = eski as ProjeDetayOzeti | undefined;
  if (!d) return eski;
  return {
    ...d,
    listeler: d.listeler.map((l) => ({
      ...l,
      kartlar: l.kartlar.map((k) =>
        k.id === kartId
          ? { ...k, etiket_sayisi: Math.max(0, k.etiket_sayisi + delta) }
          : k,
      ),
    })),
  };
}

export { tempId };
