"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useKartRoom, useSocketEvents } from "@/hooks/use-socket";
import { SOCKET } from "@/lib/socket-events";
import { projeDetayKey } from "./detay-sorgulari";
import { kartYorumlariKey } from "../yorum/hooks";
import { kartYetkilileriKey } from "../yetkili/hooks";
import { kartEtiketleriKey } from "../etiket/hooks";
import { kartKontrolKey } from "../kontrol-listesi/hooks";
import { kartEklentileriKey } from "../eklenti/hooks";
import { kartAktiviteleriKey } from "../aktivite/keys";

// Modül seviyesi sabit (Kural 134) — useSocketEvents deps stabilitesi için.
// Her event hangi cache'leri etkiler, `KART_EVENT_CACHE_HARITASI`'nda tanımlı.
const KART_REALTIME_EVENTLERI = [
  SOCKET.YORUM_OLUSTUR,
  SOCKET.YORUM_GUNCELLE,
  SOCKET.YORUM_SIL,
  SOCKET.YETKILI_KART_EKLE,
  SOCKET.YETKILI_KART_KALDIR,
  SOCKET.ETIKET_KART_EKLE,
  SOCKET.ETIKET_KART_KALDIR,
  SOCKET.KONTROL_LISTESI_OLUSTUR,
  SOCKET.KONTROL_LISTESI_GUNCELLE,
  SOCKET.KONTROL_LISTESI_SIL,
  SOCKET.MADDE_OLUSTUR,
  SOCKET.MADDE_GUNCELLE,
  SOCKET.MADDE_SIL,
  SOCKET.EKLENTI_OLUSTUR,
  SOCKET.EKLENTI_SIL,
  SOCKET.KAPAK_AYARLA,
  SOCKET.KAPAK_KALDIR,
  SOCKET.KAPAK_RENGI_AYARLA,
  SOCKET.KAPAK_RENGI_KALDIR,
] as const;

type EventAdi = (typeof KART_REALTIME_EVENTLERI)[number];

/**
 * Bir event geldiğinde hangi query key'ler invalidate edilmeli — saf logic
 * (Kural 131/139). UI'dan ayrı, deterministik, test edilebilir.
 *
 * Pano için `projeDetayKey` ekleniyor çünkü kart sayıları (yetkili_sayisi,
 * etiket_sayisi, yorum_sayisi, ek_sayisi, madde_*, kapak) pano detay
 * sorgusunda agregat olarak duruyor. Modal sayfası kapalı olsa bile
 * pano açıkken bu invalidate, agregaları günceller.
 *
 * Aktivite sekmesi her olaydan etkilenir → `kartAktiviteleriKey` her event'te
 * invalidate edilir.
 */
export function kartEventCacheKeyleri(
  event: EventAdi,
  kartId: string,
  projeId: string,
): readonly (readonly unknown[])[] {
  const aktivite = kartAktiviteleriKey(kartId);
  switch (event) {
    case SOCKET.YORUM_OLUSTUR:
    case SOCKET.YORUM_GUNCELLE:
    case SOCKET.YORUM_SIL:
      return [kartYorumlariKey(kartId), projeDetayKey(projeId), aktivite];
    case SOCKET.YETKILI_KART_EKLE:
    case SOCKET.YETKILI_KART_KALDIR:
      return [kartYetkilileriKey(kartId), projeDetayKey(projeId), aktivite];
    case SOCKET.ETIKET_KART_EKLE:
    case SOCKET.ETIKET_KART_KALDIR:
      return [kartEtiketleriKey(kartId), projeDetayKey(projeId), aktivite];
    case SOCKET.KONTROL_LISTESI_OLUSTUR:
    case SOCKET.KONTROL_LISTESI_GUNCELLE:
    case SOCKET.KONTROL_LISTESI_SIL:
    case SOCKET.MADDE_OLUSTUR:
    case SOCKET.MADDE_GUNCELLE:
    case SOCKET.MADDE_SIL:
      return [kartKontrolKey(kartId), projeDetayKey(projeId), aktivite];
    case SOCKET.EKLENTI_OLUSTUR:
    case SOCKET.EKLENTI_SIL:
      return [kartEklentileriKey(kartId), projeDetayKey(projeId), aktivite];
    case SOCKET.KAPAK_AYARLA:
    case SOCKET.KAPAK_KALDIR:
    case SOCKET.KAPAK_RENGI_AYARLA:
    case SOCKET.KAPAK_RENGI_KALDIR:
      return [projeDetayKey(projeId), aktivite];
  }
}

/**
 * Kart modalı açıkken canlı senkron. İki iş:
 *  1. Kart room'una katıl (server `kart:read` yetkisini doğrular — Kural 55)
 *  2. Kart-içi event'leri dinle, etkilenen cache key'leri invalidate et
 *
 * Echo filtresi (`request_id` + `selfFilter`) `useSocketEvents` içinde
 * uygulanır — kendi mutation'ım optimistic update'i bozmaz (Kural 114).
 *
 * NOT: Eğer modalda KartPresence component'i de kullanılıyorsa, presence
 * kendi `kart:katil` emitini yapar — duplicate join idempotent (Socket.IO
 * `socket.join` aynı room'a iki kez katılmayı no-op kabul eder).
 */
export function useKartRealtime(kartId: string, projeId: string): void {
  useKartRoom(kartId);
  const istemci = useQueryClient();

  const yenile = React.useCallback(
    (event: string) => {
      const keyler = kartEventCacheKeyleri(event as EventAdi, kartId, projeId);
      for (const k of keyler) {
        istemci.invalidateQueries({ queryKey: k });
      }
    },
    [istemci, kartId, projeId],
  );

  useSocketEvents(KART_REALTIME_EVENTLERI, yenile);
}
