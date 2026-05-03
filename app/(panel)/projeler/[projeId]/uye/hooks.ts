"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { projeDetayKey } from "../hooks/detay-sorgulari";
import type { ProjeDetayOzeti } from "../services";
import {
  kartaUyeEkleEylem,
  kartaUyeKaldirEylem,
  kartinUyeleriEylem,
  projeAdayKullanicilarEylem,
  projeUyeleriniListeleEylem,
  projeUyesiSeviyeGuncelleEylem,
  projeyeUyeEkleEylem,
  projeyeUyeKaldirEylem,
} from "./actions";
import type {
  KartaUyeEkle,
  KartaUyeKaldir,
  ProjeUyesiSeviyeGuncelle,
  ProjeyeUyeEkle,
  ProjeyeUyeKaldir,
} from "./schemas";
import type { KartUyeOzeti, ProjeUyeOzeti } from "./services";

export const PROJE_UYELERI_KEY = "proje-uyeleri";
export const KART_UYELERI_KEY = "kart-uyeleri";
export const PROJE_ADAY_KEY = "proje-aday-kullanicilar";

export function projeUyeleriKey(projeId: string) {
  return [PROJE_UYELERI_KEY, projeId] as const;
}
export function kartUyeleriKey(kartId: string) {
  return [KART_UYELERI_KEY, kartId] as const;
}
export function projeAdayKey(projeId: string, q: string) {
  return [PROJE_ADAY_KEY, projeId, q] as const;
}

// =====================================================================
// Sorgular
// =====================================================================

export function useProjeUyeleri(projeId: string) {
  return useQuery({
    queryKey: projeUyeleriKey(projeId),
    queryFn: async () => {
      const r = await projeUyeleriniListeleEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

export function useKartUyeleri(kartId: string | null) {
  return useQuery({
    queryKey: kartUyeleriKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kartinUyeleriEylem({ kart_id: kartId! });
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

// =====================================================================
// Proje üye yönetimi mutations
// =====================================================================

export function useProjeyeUyeEkle(projeId: string) {
  return useOptimisticMutation<ProjeyeUyeEkle, ProjeUyeOzeti>({
    queryKey: [projeUyeleriKey(projeId), [PROJE_ADAY_KEY, projeId]] as const,
    mutationFn: eylemMutasyonu(projeyeUyeEkleEylem),
    optimisticMap: [
      {
        queryKey: projeUyeleriKey(projeId),
        update: (eski, vars) => {
          const liste = (eski as ProjeUyeOzeti[] | undefined) ?? [];
          if (liste.some((u) => u.kullanici_id === vars.kullanici_id))
            return liste;
          // Aday listesinden bilgi gelmiyor — invalidate yenileyecek; geçici plak
          const taslak: ProjeUyeOzeti = {
            kullanici_id: vars.kullanici_id,
            ad: "—",
            soyad: "",
            email: "",
            seviye: vars.seviye ?? "NORMAL",
            eklenme_zamani: new Date(),
          };
          return [...liste, taslak];
        },
      },
    ],
    swap: (eski, vars, yanit) => {
      const liste = (eski as ProjeUyeOzeti[] | undefined) ?? [];
      return liste.map((u) =>
        u.kullanici_id === vars.kullanici_id ? yanit : u,
      );
    },
    hataMesaji: "Üye eklenemedi",
    basariMesaji: "Üye eklendi",
  });
}

export function useProjeyeUyeKaldir(projeId: string) {
  return useOptimisticMutation<
    ProjeyeUyeKaldir,
    { proje_id: string; kullanici_id: string }
  >({
    queryKey: projeUyeleriKey(projeId),
    mutationFn: eylemMutasyonu(projeyeUyeKaldirEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeUyeOzeti[] | undefined) ?? [];
      return liste.filter((u) => u.kullanici_id !== vars.kullanici_id);
    },
    hataMesaji: "Üye kaldırılamadı",
  });
}

export function useProjeUyesiSeviyeGuncelle(projeId: string) {
  return useOptimisticMutation<
    ProjeUyesiSeviyeGuncelle,
    { proje_id: string; kullanici_id: string; seviye: string }
  >({
    queryKey: projeUyeleriKey(projeId),
    mutationFn: eylemMutasyonu(projeUyesiSeviyeGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeUyeOzeti[] | undefined) ?? [];
      return liste.map((u) =>
        u.kullanici_id === vars.kullanici_id
          ? { ...u, seviye: vars.seviye }
          : u,
      );
    },
    hataMesaji: "Yetki seviyesi güncellenemedi",
  });
}

// =====================================================================
// Kart üye atama mutations
// =====================================================================

export function useKartaUyeEkle(kartId: string, projeId: string) {
  return useOptimisticMutation<
    KartaUyeEkle & { uye_ozeti?: KartUyeOzeti },
    { kart_id: string; kullanici_id: string }
  >({
    queryKey: [
      kartUyeleriKey(kartId),
      projeDetayKey(projeId),
    ] as const,
    mutationFn: ({ uye_ozeti: _uo, ...vars }) =>
      eylemMutasyonu(kartaUyeEkleEylem)(vars),
    optimisticMap: [
      {
        queryKey: kartUyeleriKey(kartId),
        update: (eski, vars) => {
          const liste = (eski as KartUyeOzeti[] | undefined) ?? [];
          if (liste.some((u) => u.kullanici_id === vars.kullanici_id))
            return liste;
          const yeni: KartUyeOzeti = vars.uye_ozeti ?? {
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
        update: (eski, vars) => bumpUyeSayisi(eski, vars.kart_id, +1),
      },
    ],
    hataMesaji: "Üye eklenemedi",
  });
}

export function useKartaUyeKaldir(kartId: string, projeId: string) {
  return useOptimisticMutation<
    KartaUyeKaldir,
    { kart_id: string; kullanici_id: string }
  >({
    queryKey: [
      kartUyeleriKey(kartId),
      projeDetayKey(projeId),
    ] as const,
    mutationFn: eylemMutasyonu(kartaUyeKaldirEylem),
    optimisticMap: [
      {
        queryKey: kartUyeleriKey(kartId),
        update: (eski, vars) => {
          const liste = (eski as KartUyeOzeti[] | undefined) ?? [];
          return liste.filter((u) => u.kullanici_id !== vars.kullanici_id);
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpUyeSayisi(eski, vars.kart_id, -1),
      },
    ],
    hataMesaji: "Üye kaldırılamadı",
  });
}

function bumpUyeSayisi(
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
          ? { ...k, uye_sayisi: Math.max(0, k.uye_sayisi + delta) }
          : k,
      ),
    })),
  };
}
