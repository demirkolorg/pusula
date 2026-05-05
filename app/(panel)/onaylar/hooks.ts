"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  bekleyenKartOnerileriniListeleEylem,
  bekleyenMaddeOnerileriniListeleEylem,
  bekleyenOneriSayimiEylem,
} from "./actions";

// Query key konvansiyonu Kural 23 — array hiyerarşik.
export const ONAYLAR_KART_KEY = "onaylar-bekleyen-kart";
export const ONAYLAR_MADDE_KEY = "onaylar-bekleyen-madde";
export const ONAYLAR_SAYIM_KEY = "onaylar-sayim";

export function bekleyenKartKey(projeId: string | null) {
  return [ONAYLAR_KART_KEY, { projeId }] as const;
}
export function bekleyenMaddeKey(projeId: string | null) {
  return [ONAYLAR_MADDE_KEY, { projeId }] as const;
}
export const bekleyenSayimKey = [ONAYLAR_SAYIM_KEY] as const;

export function useBekleyenKartOnerileri(projeId: string | null) {
  return useInfiniteQuery({
    queryKey: bekleyenKartKey(projeId),
    queryFn: async ({ pageParam }) => {
      const r = await bekleyenKartOnerileriniListeleEylem({
        cursorZaman: pageParam?.zaman ?? null,
        cursorId: pageParam?.id ?? null,
        projeId,
        limit: 50,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    initialPageParam: null as { zaman: Date; id: string } | null,
    getNextPageParam: (sayfa) => sayfa.sonrakiCursor,
    // Realtime ile invalidate; manuel refetch yok.
    staleTime: Infinity,
  });
}

export function useBekleyenMaddeOnerileri(projeId: string | null) {
  return useInfiniteQuery({
    queryKey: bekleyenMaddeKey(projeId),
    queryFn: async ({ pageParam }) => {
      const r = await bekleyenMaddeOnerileriniListeleEylem({
        cursorZaman: pageParam?.zaman ?? null,
        cursorId: pageParam?.id ?? null,
        projeId,
        limit: 50,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    initialPageParam: null as { zaman: Date; id: string } | null,
    getNextPageParam: (sayfa) => sayfa.sonrakiCursor,
    staleTime: Infinity,
  });
}

// Sidebar badge — sayfa açık olmasa bile sık güncellenir; staleTime 60s.
// MVP: realtime socket subscription yok (kullanıcı birden fazla proje room'una
// subscribe olmazsa server emit'i kayıp). Onay/Red ETKİSİ kendi sayfanda
// invalidate edilir (onaylar-sayfa.tsx); diğer kullanıcılar için 60s
// staleTime + refetchOnWindowFocus yeterli MVP. Future: dedikleri kullanıcı
// için bir "user-onay-room" socket emit'i eklenip burada subscribe edilir.
export function useBekleyenOneriSayimi() {
  return useQuery({
    queryKey: bekleyenSayimKey,
    queryFn: async () => {
      const r = await bekleyenOneriSayimiEylem({});
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    // Sidebar badge için 60sn staleTime — daha sık invalidate gerekirse
    // socket realtime tetikler.
    staleTime: 60_000,
  });
}
