"use client";

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { aktiviteGunluguListeleEylem } from "../actions";
import type { AktiviteGunluguFiltre } from "../schemas";
import type { AktiviteGunluguSayfasi } from "../services";

export const AKTIVITE_GUNLUGU_KEY = "aktivite-gunlugu";

export function aktiviteGunluguKey(filtre: AktiviteGunluguFiltre) {
  return [AKTIVITE_GUNLUGU_KEY, filtre] as const;
}

export function useAktiviteGunlugu(
  filtre: AktiviteGunluguFiltre,
  ilkSayfa: AktiviteGunluguSayfasi,
  ilkSayfaKullan: boolean,
) {
  return useInfiniteQuery<
    AktiviteGunluguSayfasi,
    Error,
    InfiniteData<AktiviteGunluguSayfasi, string | undefined>,
    ReturnType<typeof aktiviteGunluguKey>,
    string | undefined
  >({
    queryKey: aktiviteGunluguKey(filtre),
    queryFn: async ({ pageParam }) => {
      const girdi = pageParam ? { ...filtre, cursor: pageParam } : filtre;
      const r = await aktiviteGunluguListeleEylem(girdi);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    initialPageParam: undefined,
    getNextPageParam: (son) => son.sonrakiCursor ?? undefined,
    initialData: ilkSayfaKullan
      ? { pages: [ilkSayfa], pageParams: [undefined] }
      : undefined,
    staleTime: 30_000,
  });
}
