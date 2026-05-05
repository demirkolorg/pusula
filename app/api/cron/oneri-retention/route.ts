import { NextResponse, type NextRequest } from "next/server";
import { oneriRetention } from "@/app/(panel)/onaylar/retention";
import { metrikArttir } from "@/lib/bildirim-metrikler";
import { logger } from "@/lib/logger";

// ADR-0020 — Cron endpoint: REDDEDILDI durumdaki kart/madde önerilerinde
// 90+ gün eski kayıtların `red_sebebi` ve denormalize alanlarını temizler.
// Audit log korunur; KVKK için kişisel veri içerebilen text alanı silinir.
//
// Güvenlik (Kural V.3/147):
// - CRON_SECRET env değişkeni ile Bearer token zorunlu
// - Header eşleşmezse 401, sessiz log
// - Public endpoint — secret olmadan asla iş yapma
//
// Önerilen frekans: günde bir (Vercel Cron `0 3 * * *` Türkiye gece 3:00).
// Daha sık → işlem gereksiz; daha seyrek → veri biraz daha kalır, sorun yok.
//
// Çağrı: POST /api/cron/oneri-retention
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

  const auth = req.headers.get("authorization") ?? "";
  const beklenen = `Bearer ${secret}`;
  if (auth !== beklenen) {
    logger.warn("[cron] yetkisiz çağrı (geçersiz Bearer token)");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const sonuc = await oneriRetention();
    metrikArttir("oneri.retention.tetiklendi");
    logger.info(
      {
        kartTemizlendi: sonuc.kartTemizlendi,
        maddeTemizlendi: sonuc.maddeTemizlendi,
        esik: sonuc.esik.toISOString(),
        retentionGun: sonuc.retentionGun,
      },
      "[cron] öneri retention temizliği tamamlandı",
    );
    return NextResponse.json({
      ok: true,
      kartTemizlendi: sonuc.kartTemizlendi,
      maddeTemizlendi: sonuc.maddeTemizlendi,
      retentionGun: sonuc.retentionGun,
    });
  } catch (err) {
    metrikArttir("oneri.retention.basarisiz");
    logger.error(
      { hata: String(err) },
      "[cron] öneri retention sırasında hata",
    );
    return NextResponse.json({ ok: false, hata: "İç hata" }, { status: 500 });
  }
}

// Vercel Cron bazı sürümlerde GET tetikler — alternatif yol.
export const GET = POST;
