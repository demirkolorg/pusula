import { NextResponse, type NextRequest } from "next/server";
import {
  metrikSnapshot,
  prometheusOlarak,
} from "@/lib/bildirim-metrikler";

// Adım 3 — Bildirim sistemi metrik endpoint'i.
//
// Yetkilendirme: cron endpoint'i ile aynı korumalı pattern (Bearer
// token + CRON_SECRET, isteğe bağlı). Metrik bilgileri kapasiteci için
// public OK görülmedi — Prometheus scrape için secret eklenmelidir.
//
// Çıktı formatları:
//   GET /api/bildirim-metrikler           → JSON
//   GET /api/bildirim-metrikler?format=prom → text/plain Prometheus

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.METRIKLER_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, hata: "Secret yapılandırılmamış." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  if (format === "prom") {
    return new NextResponse(prometheusOlarak(), {
      status: 200,
      headers: { "Content-Type": "text/plain; version=0.0.4" },
    });
  }
  return NextResponse.json({ ok: true, metrikler: metrikSnapshot() });
}
