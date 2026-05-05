"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { projeDetayKey } from "../hooks/detay-sorgulari";
import { kartAktiviteleriKey } from "../aktivite/keys";
import type { ProjeDetayOzeti } from "../services";
import {
  kartAdayKullanicilarEylem,
  kartaYetkiliEkleEylem,
  kartaYetkiliKaldirEylem,
  kartinYetkilileriEylem,
  projeAdayKullanicilarEylem,
  projeYetkilileriniListeleEylem,
  projeyeYetkiliEkleEylem,
  projeyeYetkiliKaldirEylem,
} from "./actions";
import type {
  KartaYetkiliEkle,
  KartaYetkiliKaldir,
  ProjeyeYetkiliEkle,
  ProjeyeYetkiliKaldir,
} from "./schemas";
import type { KartYetkiliOzeti, ProjeYetkiliOzeti } from "./services";

export const PROJE_YETKILILERI_KEY = "proje-yetkilileri";
export const KART_YETKILILERI_KEY = "kart-yetkilileri";
export const KART_ADAY_KEY = "kart-aday-kullanicilar";
export const PROJE_ADAY_KEY = "proje-aday-kullanicilar";

export function projeYetkilileriKey(projeId: string) {
  return [PROJE_YETKILILERI_KEY, projeId] as const;
}
export function kartYetkilileriKey(kartId: string) {
  return [KART_YETKILILERI_KEY, kartId] as const;
}
export function projeAdayKey(projeId: string, q: string) {
  return [PROJE_ADAY_KEY, projeId, q] as const;
}
export function kartAdayKey(kartId: string, q: string) {
  return [KART_ADAY_KEY, kartId, q] as const;
}

// =====================================================================
// Sorgular
// =====================================================================

export function useProjeYetkilileri(projeId: string) {
  return useQuery({
    queryKey: projeYetkilileriKey(projeId),
    queryFn: async () => {
      const r = await projeYetkilileriniListeleEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

export function useKartYetkilileri(kartId: string | null) {
  return useQuery({
    queryKey: kartYetkilileriKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kartinYetkilileriEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

export function useProjeAdayKullanicilar(
  projeId: string,
  q: string,
  enabled = true,
) {
  return useQuery({
    queryKey: projeAdayKey(projeId, q),
    enabled,
    queryFn: async () => {
      const r = await projeAdayKullanicilarEylem({ proje_id: projeId, q });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useKartAdayKullanicilar(
  kartId: string,
  q: string,
  enabled = true,
) {
  return useQuery({
    queryKey: kartAdayKey(kartId, q),
    enabled,
    queryFn: async () => {
      const r = await kartAdayKullanicilarEylem({ kart_id: kartId, q });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// =====================================================================
// Proje yetkili yönetimi mutations
// =====================================================================

export function useProjeyeYetkiliEkle(projeId: string) {
  return useOptimisticMutation<ProjeyeYetkiliEkle, ProjeYetkiliOzeti>({
    queryKey: [projeYetkilileriKey(projeId), [PROJE_ADAY_KEY, projeId]] as const,
    mutationFn: eylemMutasyonu(projeyeYetkiliEkleEylem),
    optimisticMap: [
      {
        queryKey: projeYetkilileriKey(projeId),
        update: (eski, vars) => {
          const liste = (eski as ProjeYetkiliOzeti[] | undefined) ?? [];
          if (liste.some((u) => u.kullanici_id === vars.kullanici_id))
            return liste;
          // Aday listesinden bilgi gelmiyor — invalidate yenileyecek; geçici plak
          const taslak: ProjeYetkiliOzeti = {
            kullanici_id: vars.kullanici_id,
            ad: "—",
            soyad: "",
            email: "",
            eklenme_zamani: new Date(),
          };
          return [...liste, taslak];
        },
      },
    ],
    swap: (eski, vars, yanit) => {
      const liste = (eski as ProjeYetkiliOzeti[] | undefined) ?? [];
      return liste.map((u) =>
        u.kullanici_id === vars.kullanici_id ? yanit : u,
      );
    },
    hataMesaji: "Yetkili eklenemedi",
    basariMesaji: "Yetkili eklendi",
  });
}

export function useProjeyeYetkiliKaldir(projeId: string) {
  return useOptimisticMutation<
    ProjeyeYetkiliKaldir,
    { proje_id: string; kullanici_id: string }
  >({
    queryKey: projeYetkilileriKey(projeId),
    mutationFn: eylemMutasyonu(projeyeYetkiliKaldirEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeYetkiliOzeti[] | undefined) ?? [];
      return liste.filter((u) => u.kullanici_id !== vars.kullanici_id);
    },
    hataMesaji: "Yetkili kaldırılamadı",
  });
}

// ADR-0012: useProjeYetkilisiSeviyeGuncelle kaldırıldı (seviye kavramı yok).

// =====================================================================
// Kart yetkili atama mutations
// =====================================================================

export function useKartaYetkiliEkle(kartId: string, projeId: string) {
  return useOptimisticMutation<
    KartaYetkiliEkle & { yetkili_ozeti?: KartYetkiliOzeti },
    { kart_id: string; kullanici_id: string }
  >({
    queryKey: [
      kartYetkilileriKey(kartId),
      projeDetayKey(projeId),
      [KART_ADAY_KEY, kartId],
    ] as const,
    mutationFn: ({ yetkili_ozeti: _uo, ...vars }) =>
      eylemMutasyonu(kartaYetkiliEkleEylem)(vars),
    optimisticMap: [
      {
        queryKey: kartYetkilileriKey(kartId),
        update: (eski, vars) => {
          const liste = (eski as KartYetkiliOzeti[] | undefined) ?? [];
          if (liste.some((u) => u.kullanici_id === vars.kullanici_id))
            return liste;
          const yeni: KartYetkiliOzeti = vars.yetkili_ozeti ?? {
            kullanici_id: vars.kullanici_id,
            ad: "—",
            soyad: "",
            email: "",
          };
          return [...liste, yeni];
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpYetkiliSayisi(eski, vars.kart_id, +1),
      },
    ],
    ekInvalidate: [kartAktiviteleriKey(kartId), [KART_ADAY_KEY, kartId]],
    hataMesaji: "Yetkili eklenemedi",
  });
}

export function useKartaYetkiliKaldir(kartId: string, projeId: string) {
  return useOptimisticMutation<
    KartaYetkiliKaldir,
    { kart_id: string; kullanici_id: string }
  >({
    queryKey: [
      kartYetkilileriKey(kartId),
      projeDetayKey(projeId),
      [KART_ADAY_KEY, kartId],
    ] as const,
    mutationFn: eylemMutasyonu(kartaYetkiliKaldirEylem),
    optimisticMap: [
      {
        queryKey: kartYetkilileriKey(kartId),
        update: (eski, vars) => {
          const liste = (eski as KartYetkiliOzeti[] | undefined) ?? [];
          return liste.filter((u) => u.kullanici_id !== vars.kullanici_id);
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpYetkiliSayisi(eski, vars.kart_id, -1),
      },
    ],
    ekInvalidate: [kartAktiviteleriKey(kartId), [KART_ADAY_KEY, kartId]],
    hataMesaji: "Yetkili kaldırılamadı",
  });
}

function bumpYetkiliSayisi(
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
          ? { ...k, yetkili_sayisi: Math.max(0, k.yetkili_sayisi + delta) }
          : k,
      ),
    })),
  };
}
