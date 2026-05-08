import { NextResponse, type NextRequest } from "next/server";
import {
  tetikleBitisGecti,
  tetikleBitisYaklasiyor,
} from "@/app/(panel)/bildirimler/tetikleyiciler";
import { bearerTokenEslesiyorMu } from "@/lib/bearer-auth";
import { metrikArttir } from "@/lib/bildirim-metrikler";
import { logger } from "@/lib/logger";

// Faz 6.1 — Cron endpoint: bitiş tarihi yaklaşan / geçen kartlar için
// otomatik bildirim üretir. Daha önce manuel tetikleniyordu; bu endpoint
// dış scheduler (Vercel Cron, GitHub Actions, systemd timer) tarafından
// periyodik çağrılır.
//
// Güvenlik (Kural V.3/147):
// - CRON_SECRET env değişkeni ile Bearer token zorunlu
// - Header eşleşmezse 401, sessiz log
// - Public endpoint olduğu için DoS yüzeyi: secret olmadan asla iş yapma
//
// Önerilen frekans: 30 dakikada bir (Vercel Cron `*/30 * * * *`).
// Daha sık → "yaklaşıyor" tekrarı (idempotency yok); daha seyrek →
// "geçti" 1 saatlik pencere kayması.
//
// Çağrı: POST /api/cron/bildirim-bitis
// Header: Authorization: Bearer ${CRON_SECRET}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("[cron] CRON_SECRET tanımlı değil — endpoint devre dışı");
    return NextResponse.json(
      { ok: false, hata: "Cron secret yapılandırılmamış." },
      { status: 503 },
    );
  }

  if (!bearerTokenEslesiyorMu(req.headers.get("authorization"), secret)) {
    logger.warn("[cron] yetkisiz çağrı (geçersiz Bearer token)");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const [yaklasiyor, gecti] = await Promise.all([
      tetikleBitisYaklasiyor(24),
      tetikleBitisGecti(),
    ]);
    metrikArttir("bildirim.cron.tetiklendi");
    logger.info(
      { yaklasiyor, gecti },
      "[cron] bitiş bildirimi başarıyla üretildi",
    );
    return NextResponse.json({ ok: true, yaklasiyor, gecti });
  } catch (err) {
    metrikArttir("bildirim.cron.basarisiz");
    logger.error(
      { hata: String(err) },
      "[cron] bitiş bildirimi sırasında hata",
    );
    return NextResponse.json(
      { ok: false, hata: "İç hata" },
      { status: 500 },
    );
  }
}

// Vercel Cron sadece GET tetikler bazı sürümlerde — alternatif yol.
// Aynı korumalı handler'a yönlendir.
export const GET = POST;
