"use client";

import { useQuery } from "@tanstack/react-query";
import { dosyaDetayEylem } from "../actions";

export const DOSYA_DETAY_KEY = "dosya-detay";

export function dosyaDetayKey(dosyaId: string) {
  return [DOSYA_DETAY_KEY, dosyaId] as const;
}

export function useDosyaDetay(dosyaId: string | null) {
  return useQuery({
    queryKey: dosyaDetayKey(dosyaId ?? ""),
    enabled: !!dosyaId,
    queryFn: async () => {
      const r = await dosyaDetayEylem({ id: dosyaId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 15_000,
  });
}
