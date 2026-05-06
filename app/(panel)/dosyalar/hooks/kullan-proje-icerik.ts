"use client";

import { useQuery } from "@tanstack/react-query";
import { projeIciDosyaAgaciEylem } from "../actions";

export const PROJE_ICERIK_KEY = "dosya-proje-icerigi";

export function projeIcerikKey(projeId: string) {
  return [PROJE_ICERIK_KEY, projeId] as const;
}

export function useProjeIcerigi(projeId: string | null) {
  return useQuery({
    queryKey: projeIcerikKey(projeId ?? ""),
    enabled: !!projeId,
    queryFn: async () => {
      const r = await projeIciDosyaAgaciEylem({ proje_id: projeId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 15_000,
  });
}
