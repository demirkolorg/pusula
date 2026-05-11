// Pusula realtime server — Bun ile çalışan standalone Socket.io.
//
// Mimari:
// - Pusula Next.js app port 2500'de
// - Bu server port 2501'de (aynı seri — proje bağlamı)
// - Frontend her ikisine bağlanır
// - Auth: NextAuth session cookie → /api/oturum endpoint forward
// - Room yetki: kullanıcı sadece yetkili olduğu kaynakların room'una katılır
// - Internal broadcast: Server Action'lar HTTP POST /yayinla ile çağırır
//   (lib/realtime.ts üzerinden)
//
// Çalıştırma: `bun run dev:socket`
// Ortam değişkenleri:
//   SOCKET_PORT (default 2501)
//   APP_URL (default http://localhost:2500) — auth doğrulama için
//   SOCKET_INTERNAL_TOKEN — broadcast endpoint koruma anahtarı

import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { SOCKET, room } from "@/lib/socket-events";
import { canKart, canProje } from "@/lib/yetki";

const PORT = Number(process.env.SOCKET_PORT ?? 2501);
const APP_URL = process.env.APP_URL ?? "http://localhost:2500";
// Production'da `SOCKET_INTERNAL_TOKEN` zorunlu — internal broadcast
// endpoint'i bu token ile korunur (Sprint 0 / S0-5).
const INTERNAL_TOKEN = (() => {
  const fromEnv = process.env.SOCKET_INTERNAL_TOKEN;
  if (process.env.NODE_ENV === "production" && !fromEnv) {
    throw new Error(
      "SOCKET_INTERNAL_TOKEN ortam değişkeni production'da zorunludur.",
    );
  }
  return fromEnv ?? "dev-internal-token";
})();

type OturumKullanicisi = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_id: string | null;
};

// =====================================================================
// HTTP server — internal broadcast endpoint + health
// =====================================================================

const httpServer = createServer(async (req, res) => {
  // CORS headers — Next.js'ten POST için
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/saglik" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, ts: Date.now() }));
    return;
  }

  if (req.url === "/yayinla" && req.method === "POST") {
    // Internal token doğrulaması — DoS / yetkisiz broadcast'i engeller.
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (token !== INTERNAL_TOKEN) {
      console.log("[yayinla] FAIL: token mismatch");
      res.writeHead(401);
      res.end("yetkisiz");
      return;
    }
    let govde = "";
    req.on("data", (chunk) => (govde += chunk));
    req.on("end", () => {
      try {
        const { event, room: hedef, payload } = JSON.parse(govde);
        if (typeof event !== "string" || typeof hedef !== "string") {
          console.log(
            `[yayinla] FAIL: eksik alan event=${typeof event} room=${typeof hedef}`,
          );
          res.writeHead(400);
          res.end("eksik alan");
          return;
        }
        const odadakiSayi = io.sockets.adapter.rooms.get(hedef)?.size ?? 0;
        console.log(
          `[yayinla] OK: event=${event} room=${hedef} dinleyici=${odadakiSayi}`,
        );
        io.to(hedef).emit(event, payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.log(`[yayinla] FAIL: parse hatası ${err}`);
        res.writeHead(400);
        res.end("gecersiz json");
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("yok");
});

// =====================================================================
// Socket.io server — WebSocket bağlantı + auth + room yetki
// =====================================================================

const io = new Server(httpServer, {
  cors: {
    origin: APP_URL,
    credentials: true,
  },
  // Connection state recovery — kısa kopuk düşmeden mesajları tutar.
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
});

// Auth middleware — NextAuth session cookie'sini Next.js'in /api/oturum
// endpoint'ine forward eder. Endpoint kullanıcı bilgisi döndürürse OK.
io.use(async (socket: Socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie ?? "";
    // GEÇİCİ DEBUG: handshake izleme — production'da socket bağlantısı
    // sessizce fail ediyor mu görmek için. Kök neden bulununca silinecek.
    console.log(
      `[socket-auth] handshake: id=${socket.id} cookie_len=${cookie.length} addr=${socket.handshake.address}`,
    );
    if (!cookie) {
      console.log("[socket-auth] FAIL: cookie boş");
      return next(new Error("oturum-yok"));
    }

    const r = await fetch(`${APP_URL}/api/oturum`, {
      headers: { cookie },
      // Bun fetch'in node http'sine güveniyoruz; cookie forward eder.
    });
    if (!r.ok) {
      console.log(`[socket-auth] FAIL: /api/oturum returned ${r.status}`);
      return next(new Error("oturum-dogrulanamadi"));
    }
    const data = (await r.json()) as { kullanici: OturumKullanicisi | null };
    if (!data.kullanici) {
      console.log("[socket-auth] FAIL: data.kullanici null");
      return next(new Error("oturum-yok"));
    }
    console.log(`[socket-auth] OK: ${data.kullanici.email}`);
    socket.data.kullanici = data.kullanici;
    next();
  } catch (err) {
    console.log(`[socket-auth] EXCEPTION: ${err}`);
    next(new Error("oturum-hata"));
  }
});

io.on("connection", (socket: Socket) => {
  const kullanici = socket.data.kullanici as OturumKullanicisi | undefined;
  if (!kullanici) {
    console.log(`[socket-conn] disconnect: kullanici yok (id=${socket.id})`);
    socket.disconnect(true);
    return;
  }
  console.log(`[socket-conn] connected: ${kullanici.email} (id=${socket.id})`);

  // Otomatik: kullanıcının kendi room'una katıl (bildirim için)
  socket.join(room.kullanici(kullanici.id));

  // Proje room'una katılma isteği — kaynak yetkisi kontrol et (Kural 55)
  socket.on(SOCKET.PROJE_KATIL, async (projeId: string) => {
    if (typeof projeId !== "string") return;
    const yetkiliMi = await canProje(kullanici.id, "proje:read", projeId);
    if (!yetkiliMi) {
      socket.emit("hata", {
        kod: "yetkisiz",
        mesaj: "Projeye erişim yetkiniz yok.",
      });
      return;
    }
    socket.join(room.proje(projeId));
  });

  socket.on(SOCKET.PROJE_AYRIL, (projeId: string) => {
    if (typeof projeId === "string") socket.leave(room.proje(projeId));
  });

  // Kart presence — kullanıcının kart erişimi var mı?
  socket.on(SOCKET.KART_KATIL, async (kartId: string) => {
    if (typeof kartId !== "string") return;
    const yetkiliMi = await canKart(kullanici.id, "kart:read", kartId);
    if (!yetkiliMi) return;
    socket.join(room.kart(kartId));
    yayinlaPresence(kartId);
  });

  socket.on(SOCKET.KART_AYRIL, (kartId: string) => {
    if (typeof kartId === "string") {
      socket.leave(room.kart(kartId));
      yayinlaPresence(kartId);
    }
  });

  socket.on("disconnecting", () => {
    // Kart room'larından çıkmadan önce presence güncelle
    for (const r of socket.rooms) {
      if (r.startsWith("kart:")) {
        const kartId = r.slice(5);
        // setTimeout ile çık SONRA presence yayınla
        setTimeout(() => yayinlaPresence(kartId), 0);
      }
    }
  });
});

async function yayinlaPresence(kartId: string): Promise<void> {
  const odali = await io.in(room.kart(kartId)).fetchSockets();
  const kullanicilar = Array.from(
    new Map(
      odali.map((s) => {
        const u = s.data.kullanici as OturumKullanicisi | undefined;
        return [u?.id ?? s.id, u ? { id: u.id, ad: u.ad, soyad: u.soyad } : null];
      }),
    ).values(),
  ).filter((x): x is { id: string; ad: string; soyad: string } => !!x);
  io.to(room.kart(kartId)).emit(SOCKET.KART_PRESENCE, {
    kart_id: kartId,
    kullanicilar,
  });
}

// =====================================================================
// Boot
// =====================================================================

httpServer.listen(PORT, () => {

  console.log(`[socket] dinleniyor: http://localhost:${PORT}`);
});


