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
    // Why: kart durumu projeler/kart-modal'dan da değişebiliyor (manuel
    // tamamlama, silme, arşivleme); o akışlar sayım/listeleme cache'ini
    // invalidate etmediği için staleTime: Infinity sayım != liste mismatch
    // bug'ı yaratıyordu (badge=1, liste boş). 30sn + mount'ta refetch ile
    // sayfa açılışında her zaman sunucu doğrulaması alınır.
    staleTime: 30_000,
    refetchOnMount: "always",
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
    staleTime: 30_000,
    refetchOnMount: "always",
  });
}

// Sidebar badge — sayfa açık olmasa bile sık güncellenir.
// Why: kart manuel tamamlama / silme / arşivleme akışlarında bu cache
// invalidate edilmiyordu → badge stale kalıyordu (DB=0 ama badge=1). 30sn
// staleTime + refetchOnMount ile her sayfa geçişinde fresh sayım garanti.
// Future: dedikleri kullanıcı için "user-onay-room" socket emit'i eklenince
// burada subscribe edilebilir.
export function useBekleyenOneriSayimi() {
  return useQuery({
    queryKey: bekleyenSayimKey,
    queryFn: async () => {
      const r = await bekleyenOneriSayimiEylem({});
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
    refetchOnMount: "always",
  });
}
