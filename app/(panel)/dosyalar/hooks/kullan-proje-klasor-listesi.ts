"use client";

import { useQuery } from "@tanstack/react-query";
import { projeKlasorListesiEylem } from "../actions";
import type { ProjeKlasoru } from "../services-proje-gorunumu";

export const PROJE_KLASOR_LISTESI_KEY = "dosya-proje-klasor-listesi";

export function useProjeKlasorListesi(ilkVeri?: ProjeKlasoru[]) {
  return useQuery({
    queryKey: [PROJE_KLASOR_LISTESI_KEY],
    queryFn: async () => {
      const r = await projeKlasorListesiEylem({});
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    initialData: ilkVeri,
    staleTime: 30_000,
  });
}
