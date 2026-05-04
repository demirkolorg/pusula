"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "@/lib/toast";
import { useOturumKullanicisi } from "@/hooks/use-oturum";

// Singleton socket — uygulama boyunca tek bağlantı.
// Kural 56-57: optimistic + reconnection. Echo filtresi (Kural 114) hook
// içinde uygulanır.

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

let _socket: Socket | null = null;
let _socketRef = 0;

// Mutation request_id'lerini tut — gelen event'in request_id'si match ediyorsa
// echo (kendi mutation'ı) — drop. Set 5dk sonra otomatik temizler ki sonsuz
// büyümesin.
const KENDI_REQUEST_IDLER = new Set<string>();
const REQUEST_TTL = 5 * 60 * 1000;

export function kendiRequestKaydet(requestId: string | null | undefined): void {
  if (!requestId) return;
  KENDI_REQUEST_IDLER.add(requestId);
  setTimeout(() => KENDI_REQUEST_IDLER.delete(requestId), REQUEST_TTL);
}

function kendiMi(requestId: string | null | undefined): boolean {
  return !!requestId && KENDI_REQUEST_IDLER.has(requestId);
}

function socketAl(): Socket {
  if (_socket) return _socket;
  _socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    // connectionStateRecovery server-side, client otomatik denemeyi sürdürür
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return _socket;
}

// Provider olmadan global durum — kart/proje katılma için herhangi bir yerden
// import edilebilir.
export function useSocket(): {
  socket: Socket | null;
  bagli: boolean;
} {
  const oturumQ = useOturumKullanicisi();
  const oturum = oturumQ.data;
  const [bagli, setBagli] = React.useState(false);
  const cevrimdisiToastIdRef = React.useRef<string | number | null>(null);

  React.useEffect(() => {
    if (!oturum) return;
    const s = socketAl();
    _socketRef++;

    if (!s.connected) s.connect();

    const onConnect = () => {
      setBagli(true);
      // Çevrimdışı toast'ını kapat
      if (cevrimdisiToastIdRef.current) {
        toast.kapat(cevrimdisiToastIdRef.current);
        cevrimdisiToastIdRef.current = null;
        toast.basari("Bağlantı yenilendi");
      }
    };
    const onDisconnect = (sebep: Socket.DisconnectReason) => {
      setBagli(false);
      // Manuel kapanma değilse toast göster
      if (sebep !== "io client disconnect" && !cevrimdisiToastIdRef.current) {
        cevrimdisiToastIdRef.current = toast.bilgi(
          "Çevrimdışısınız, değişiklikler bağlantı gelince senkronize edilecek.",
          { sure: Infinity },
        );
      }
    };
    const onConnectError = () => {
      setBagli(false);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      _socketRef--;
      // Tüm consumer'lar leave ederse bağlantıyı kapat — opsiyonel,
      // singleton olduğu için aktif tutuyoruz.
    };
  }, [oturum]);

  return { socket: bagli ? _socket : null, bagli };
}

// =====================================================================
// Echo filtreli event handler — kendi request_id'sini drop eder
// =====================================================================

import type { EventZarfi } from "@/lib/socket-events";

type SocketEventOpts = {
  // Aynı kullanıcının başka sekmesinden / kendi mutation'ından gelen echo'yu
  // drop et. Default true (Kural 114). Bildirim için false geçilebilir
  // (ureten ≠ alici zaten).
  selfFilter?: boolean;
  enabled?: boolean;
};

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (zarf: EventZarfi<T>) => void,
  opts: SocketEventOpts = {},
): void {
  const { selfFilter = true, enabled = true } = opts;
  const oturumQ = useOturumKullanicisi();
  const oturumId = oturumQ.data?.id ?? null;
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!enabled) return;
    const s = socketAl();
    const dinleyici = (zarf: EventZarfi<T>) => {
      // Echo filtresi (Kural 114):
      // 1. request_id eşleşmesi — client kendi mutation'ını kaydetmişse
      if (kendiMi(zarf.request_id)) return;
      // 2. ureten_id eşleşmesi — kullanıcı self-filter (default açık)
      if (selfFilter && oturumId && zarf.ureten_id === oturumId) return;
      handlerRef.current(zarf);
    };
    s.on(event, dinleyici);
    return () => {
      s.off(event, dinleyici);
    };
  }, [event, enabled, selfFilter, oturumId]);
}

// =====================================================================
// Room yönetimi yardımcıları
// =====================================================================

export function useProjeRoom(projeId: string | null): void {
  const { socket } = useSocket();
  React.useEffect(() => {
    if (!socket || !projeId) return;
    socket.emit("proje:katil", projeId);
    return () => {
      socket.emit("proje:ayril", projeId);
    };
  }, [socket, projeId]);
}

export function useKartPresence(kartId: string | null): {
  kullanicilar: Array<{ id: string; ad: string; soyad: string }>;
} {
  const { socket } = useSocket();
  const [kullanicilar, setKullanicilar] = React.useState<
    Array<{ id: string; ad: string; soyad: string }>
  >([]);

  React.useEffect(() => {
    if (!socket || !kartId) {
      setKullanicilar([]);
      return;
    }
    socket.emit("kart:katil", kartId);
    const onPresence = (p: {
      kart_id: string;
      kullanicilar: Array<{ id: string; ad: string; soyad: string }>;
    }) => {
      if (p.kart_id === kartId) setKullanicilar(p.kullanicilar);
    };
    socket.on("kart:presence", onPresence);
    return () => {
      socket.off("kart:presence", onPresence);
      socket.emit("kart:ayril", kartId);
    };
  }, [socket, kartId]);

  return { kullanicilar };
}
