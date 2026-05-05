"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  kartSusturmaDurumuEylem,
  kartSusturmaToggleEylem,
} from "./actions";

export const KART_SUSTURMA_KEY = "kart-susturma";

export function kartSusturmaKey(kartId: string) {
  return [KART_SUSTURMA_KEY, kartId] as const;
}

export function useKartSusturmaDurumu(kartId: string | null) {
  return useQuery({
    queryKey: kartSusturmaKey(kartId ?? ""),
    queryFn: async () => {
      if (!kartId) return { susturuluyor: false };
      const r = await kartSusturmaDurumuEylem({ kart_id: kartId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: !!kartId,
    staleTime: 5 * 60_000,
  });
}

export function useKartSusturmaToggle(kartId: string) {
  const istemci = useQueryClient();
  return useOptimisticMutation<
    { sustur: boolean },
    { kart_id: string; susturuluyor: boolean }
  >({
    queryKey: kartSusturmaKey(kartId),
    mutationFn: ({ sustur }) =>
      eylemMutasyonu(kartSusturmaToggleEylem)({
        kart_id: kartId,
        sustur,
      }),
    optimistic: (_eski, vars) => ({ susturuluyor: vars.sustur }),
    swap: (_eski, _vars, yanit) => ({ susturuluyor: yanit.susturuluyor }),
    hataMesaji: "Susturma değiştirilemedi",
    onSettledExtra: () => {
      // Bildirim sayacı/listesi etkilenmez ama yeni gelen bildirimlerin
      // süzme davranışı toggle sonrasında güncellenir; cache invalidation
      // gereksiz.
      void istemci;
    },
  });
}
