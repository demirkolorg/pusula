"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjeRoom, useSocketEvents } from "@/hooks/use-socket";
import { SOCKET } from "@/lib/socket-events";
import { projeDetayKey, projeKartlarKey } from "./detay-sorgulari";

// Pano sayfasında dinlenen event'ler. Server tarafında ilgili services.ts
// dosyaları yayinla() ile broadcast eder. request_id (Kural 114) ve
// selfFilter sayesinde kendi mutation echo'su zaten otomatik düşer.
//
// Modül seviyesi sabit (Kural 134) — useSocketEvents'in deps'i identity
// stable olsun, listener her render kurulup yıkılmasın.
const PROJE_REALTIME_EVENTLERI = [
  SOCKET.KART_OLUSTUR,
  SOCKET.KART_GUNCELLE,
  SOCKET.KART_SIL,
  SOCKET.KART_TASI,
  SOCKET.KART_GERI_YUKLE,
  SOCKET.LISTE_OLUSTUR,
  SOCKET.LISTE_GUNCELLE,
  SOCKET.LISTE_SIL,
  SOCKET.LISTE_SIRALA,
] as const;

/**
 * Pano detayı için canlı senkron. Tek hook iki işi yapar:
 *  1. Proje room'una katılır (server `proje:read` yetkisini kontrol eder — Kural 55)
 *  2. Liste/kart event'lerini dinler ve detay cache'ini invalidate eder
 *
 * Strateji: lokal cache mutate yerine **invalidation**. Server tek doğruluk
 * kaynağıdır, optimistik update zaten kendi mutation'ımı kapsıyor; başkasının
 * değişikliği geldiğinde refetch ile güncel veriyi al. Pano sorgusu küçük ve
 * staleTime: Infinity olduğu için ekstra refetch gürültüsü yok.
 */
export function useProjeDetayRealtime(projeId: string): void {
  useProjeRoom(projeId);
  const istemci = useQueryClient();

  const yenile = React.useCallback(() => {
    istemci.invalidateQueries({ queryKey: projeDetayKey(projeId) });
    // Kart sayma sorgusu varsa o da güncellenmeli (proje header rozeti vb).
    istemci.invalidateQueries({ queryKey: projeKartlarKey(projeId) });
  }, [istemci, projeId]);

  useSocketEvents(PROJE_REALTIME_EVENTLERI, yenile);
}
