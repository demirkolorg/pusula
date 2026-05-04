"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  bildirimleriListeleEylem,
  bildirimOkuduIsaretleEylem,
  okunmamisSayisiEylem,
  tumunuOkuduIsaretleEylem,
} from "./actions";
import type { BildirimleriListele, BildirimOkuduIsaretle } from "./schemas";
import type { BildirimOzeti } from "./services";

export const BILDIRIM_LISTE_KEY = "bildirim-liste";
export const BILDIRIM_OKUNMAMIS_KEY = "bildirim-okunmamis";

export function bildirimListeKey(filtre: BildirimleriListele["filtre"]) {
  return [BILDIRIM_LISTE_KEY, filtre] as const;
}

export const bildirimOkunmamisKey = [BILDIRIM_OKUNMAMIS_KEY] as const;

// =====================================================================
// Sorgular
// =====================================================================

export function useBildirimler(
  filtre: BildirimleriListele["filtre"] = "hepsi",
) {
  return useQuery({
    queryKey: bildirimListeKey(filtre),
    queryFn: async () => {
      const r = await bildirimleriListeleEylem({ filtre, limit: 20 });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
    // S5 realtime aktive olunca bu manuel polling kapatılacak; şimdilik
    // 60sn aralıklarla yumuşak refresh.
    refetchInterval: 60_000,
  });
}

export function useOkunmamisSayisi() {
  return useQuery({
    queryKey: bildirimOkunmamisKey,
    queryFn: async () => {
      const r = await okunmamisSayisiEylem({});
      if (!r.basarili) throw new Error(r.hata);
      return r.veri.sayi;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// =====================================================================
// Mutations
// =====================================================================

export function useBildirimOkuduIsaretle() {
  return useOptimisticMutation<BildirimOkuduIsaretle, { ids: string[] }>({
    queryKey: [
      bildirimListeKey("hepsi"),
      bildirimListeKey("okunmamis"),
      bildirimListeKey("okunmus"),
      bildirimOkunmamisKey,
    ] as const,
    mutationFn: eylemMutasyonu(bildirimOkuduIsaretleEylem),
    optimisticMap: [
      {
        queryKey: bildirimListeKey("hepsi"),
        update: (eski, vars) => bildirimleriIsaretle(eski, vars.ids),
      },
      {
        queryKey: bildirimListeKey("okunmamis"),
        update: (eski, vars) => bildirimleriCikar(eski, vars.ids),
      },
      {
        queryKey: bildirimOkunmamisKey,
        update: (eski, vars) => Math.max(0, ((eski as number) ?? 0) - vars.ids.length),
      },
    ],
    hataMesaji: "Bildirim işaretlenemedi",
  });
}

export function useTumunuOkuduIsaretle() {
  return useOptimisticMutation<{}, { sayi: number }>({
    queryKey: [
      bildirimListeKey("hepsi"),
      bildirimListeKey("okunmamis"),
      bildirimListeKey("okunmus"),
      bildirimOkunmamisKey,
    ] as const,
    mutationFn: eylemMutasyonu(tumunuOkuduIsaretleEylem),
    optimisticMap: [
      {
        queryKey: bildirimListeKey("hepsi"),
        update: (eski) => {
          const liste = (eski as BildirimOzeti[] | undefined) ?? [];
          return liste.map((b) => ({ ...b, okundu_mu: true }));
        },
      },
      {
        queryKey: bildirimListeKey("okunmamis"),
        update: () => [],
      },
      {
        queryKey: bildirimOkunmamisKey,
        update: () => 0,
      },
    ],
    hataMesaji: "Tümü işaretlenemedi",
  });
}

// =====================================================================
// Yardımcılar
// =====================================================================

function bildirimleriIsaretle(
  eski: unknown,
  ids: string[],
): BildirimOzeti[] {
  const liste = (eski as BildirimOzeti[] | undefined) ?? [];
  const set = new Set(ids);
  return liste.map((b) => (set.has(b.id) ? { ...b, okundu_mu: true } : b));
}

function bildirimleriCikar(eski: unknown, ids: string[]): BildirimOzeti[] {
  const liste = (eski as BildirimOzeti[] | undefined) ?? [];
  const set = new Set(ids);
  return liste.filter((b) => !set.has(b.id));
}
