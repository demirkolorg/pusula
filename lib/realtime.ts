// Server-side realtime broadcast helper.
//
// Kullanım (Server Action içinden):
//   await yayinla(SOCKET.KART_OLUSTUR, room.proje(projeId), { kart_id, ... });
//
// Plan: docs/plan.md Bölüm 7 S5
// Kurallar: 54 (event isim), 55 (room yetki), 114 (request_id echo filtresi)

import { auditContext } from "./audit-context";
import type { EventZarfi, SocketEventAdi } from "./socket-events";

const SOCKET_URL = process.env.SOCKET_INTERNAL_URL ?? "http://localhost:2501";
const TOKEN = process.env.SOCKET_INTERNAL_TOKEN ?? "dev-internal-token";
const TIMEOUT_MS = 2000;

// Server'dan socket-server'a fire-and-forget broadcast. Hata yutulur —
// realtime broadcast asıl işlemi (mutation) bozmaz; client refetch ile
// kendini günceller.
export async function yayinla<T>(
  event: SocketEventAdi,
  hedefRoom: string,
  veri: T,
): Promise<void> {
  // Audit context'ten request_id ve kullanıcı id'sini al — echo filtresi
  // için Kural 114 zorunlu kılıyor.
  const ctx = auditContext.get();
  const zarf: EventZarfi<T> = {
    request_id: ctx?.requestId ?? null,
    ureten_id: ctx?.kullaniciId ?? null,
    room: hedefRoom,
    veri,
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    await fetch(`${SOCKET_URL}/yayinla`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ event, room: hedefRoom, payload: zarf }),
      signal: ctrl.signal,
    });
  } catch {
    // Sessiz: socket-server kapalıysa da app çalışır, sadece realtime gitmez.
    // Production'da metrik counter eklenebilir (S8).
  } finally {
    clearTimeout(timer);
  }
}
