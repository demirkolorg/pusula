"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  projeSusturmaDurumuEylem,
  projeSusturmaToggleEylem,
} from "./actions";

export const PROJE_SUSTURMA_KEY = "proje-susturma";

export function projeSusturmaKey(projeId: string) {
  return [PROJE_SUSTURMA_KEY, projeId] as const;
}

export function useProjeSusturmaDurumu(projeId: string | null) {
  return useQuery({
    queryKey: projeSusturmaKey(projeId ?? ""),
    queryFn: async () => {
      if (!projeId) return { susturuluyor: false };
      const r = await projeSusturmaDurumuEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: !!projeId,
    staleTime: 5 * 60_000,
  });
}

export function useProjeSusturmaToggle(projeId: string) {
  return useOptimisticMutation<
    { sustur: boolean },
    { proje_id: string; susturuluyor: boolean }
  >({
    queryKey: projeSusturmaKey(projeId),
    mutationFn: ({ sustur }) =>
      eylemMutasyonu(projeSusturmaToggleEylem)({
        proje_id: projeId,
        sustur,
      }),
    optimistic: (_eski, vars) => ({ susturuluyor: vars.sustur }),
    swap: (_eski, _vars, yanit) => ({ susturuluyor: yanit.susturuluyor }),
    hataMesaji: "Proje susturma değiştirilemedi",
  });
}
