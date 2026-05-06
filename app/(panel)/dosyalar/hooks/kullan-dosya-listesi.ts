"use client";

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { dosyalariListeleEylem } from "../actions";
import type { DosyaListeFiltre } from "../schemas";
import type { DosyaListeSonuc } from "../services";

export const DOSYA_LISTESI_KEY = "dosya-listesi";

export function dosyaListesiKey(filtre: DosyaListeFiltre) {
  return [DOSYA_LISTESI_KEY, filtre] as const;
}

export function useDosyaListesi(
  filtre: DosyaListeFiltre,
  ilkSayfa: DosyaListeSonuc | null,
) {
  return useInfiniteQuery<
    DosyaListeSonuc,
    Error,
    InfiniteData<DosyaListeSonuc, string | undefined>,
    ReturnType<typeof dosyaListesiKey>,
    string | undefined
  >({
    queryKey: dosyaListesiKey(filtre),
    queryFn: async ({ pageParam }) => {
      const girdi = pageParam ? { ...filtre, cursor: pageParam } : filtre;
      const r = await dosyalariListeleEylem(girdi);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    initialPageParam: undefined,
    getNextPageParam: (son) => son.sonraki_cursor ?? undefined,
    initialData: ilkSayfa
      ? { pages: [ilkSayfa], pageParams: [undefined] }
      : undefined,
    staleTime: 30_000,
  });
}
