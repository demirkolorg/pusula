// Pusula realtime server — Bun ile çalışan standalone Socket.io.
//
// Mimari:
// - Pusula Next.js app port 2500'de
// - Bu server port 2501'de (aynı seri — proje bağlamı)
// - Frontend her ikisine bağlanır
// - Auth: NextAuth session cookie → /api/oturum endpoint forward
// - Room yetki: kullanıcı sadece üye olduğu projelerin room'una katılır
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
import { db } from "@/lib/db";
import { SOCKET, room } from "@/lib/socket-events";

const PORT = Number(process.env.SOCKET_PORT ?? 2501);
const APP_URL = process.env.APP_URL ?? "http://localhost:2500";
const INTERNAL_TOKEN = process.env.SOCKET_INTERNAL_TOKEN ?? "dev-internal-token";

type OturumKullanicisi = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_id: string;
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
          res.writeHead(400);
          res.end("eksik alan");
          return;
        }
        io.to(hedef).emit(event, payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
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
    if (!cookie) return next(new Error("oturum-yok"));

    const r = await fetch(`${APP_URL}/api/oturum`, {
      headers: { cookie },
      // Bun fetch'in node http'sine güveniyoruz; cookie forward eder.
    });
    if (!r.ok) return next(new Error("oturum-dogrulanamadi"));
    const data = (await r.json()) as { kullanici: OturumKullanicisi | null };
    if (!data.kullanici) return next(new Error("oturum-yok"));
    socket.data.kullanici = data.kullanici;
    next();
  } catch (e) {
    next(new Error("oturum-hata"));
  }
});

io.on("connection", (socket: Socket) => {
  const kullanici = socket.data.kullanici as OturumKullanicisi | undefined;
  if (!kullanici) {
    socket.disconnect(true);
    return;
  }

  // Otomatik: kullanıcının kendi room'una katıl (bildirim için)
  socket.join(room.kullanici(kullanici.id));

  // Proje room'una katılma isteği — DB'de üyelik kontrol et (Kural 55)
  socket.on(SOCKET.PROJE_KATIL, async (projeId: string) => {
    if (typeof projeId !== "string") return;
    const uye = await db.projeUyesi.findUnique({
      where: {
        proje_id_kullanici_id: {
          proje_id: projeId,
          kullanici_id: kullanici.id,
        },
      },
      select: { kullanici_id: true },
    });
    if (!uye) {
      socket.emit("hata", { kod: "yetkisiz", mesaj: "Proje üyesi değilsiniz." });
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
    const k = await db.kart.findUnique({
      where: { id: kartId },
      select: {
        liste: {
          select: {
            proje_id: true,
            proje: {
              select: {
                uyeler: {
                  where: { kullanici_id: kullanici.id },
                  select: { kullanici_id: true },
                },
              },
            },
          },
        },
      },
    });
    if (!k) return;
    // Tek-birim (ADR-0007) — birim izolasyonu düştü; erişim ProjeUyesi seviyesinde.
    if (k.liste.proje.uyeler.length === 0) return;
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
