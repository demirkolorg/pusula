import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ISTEK_BASLIK } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import { logHataLimiter } from "@/lib/rate-limit";

// ADR-0004 + Kontrol Kural 51, 73, 147:
// - Auth zorunlu (anonim hata kabul YOK — log spam yüzeyi kapanır)
// - Rate limit: 30 / dk / IP
// - Origin allowlist proxy.ts seviyesinde uygulanır
// - Sprint 1 / S1-14: gövde 64KB hard-limit + JSON derinlik limiti

const MAKS_GOVDE_BAYT = 64 * 1024;
const MAKS_JSON_DERINLIK = 4;

const ekstraPrimitif = z.union([
  z.string().max(2000),
  z.number(),
  z.boolean(),
  z.null(),
]);
const ekstraDeger = z.union([
  ekstraPrimitif,
  z.array(ekstraPrimitif).max(50),
]);

const govdeSemasi = z.object({
  seviye: z.enum(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]).default("ERROR"),
  taraf: z.enum(["BACKEND", "FRONTEND"]).default("FRONTEND"),
  mesaj: z.string().min(1).max(2000),
  stack: z.string().max(20_000).optional(),
  url: z.string().max(2000).optional(),
  hata_tipi: z.string().max(200).optional(),
  ekstra: z.record(z.string().max(100), ekstraDeger).optional(),
});

function jsonDerinligi(deger: unknown, mevcut = 0): number {
  if (mevcut > MAKS_JSON_DERINLIK) return mevcut;
  if (Array.isArray(deger)) {
    let max = mevcut;
    for (const e of deger) {
      max = Math.max(max, jsonDerinligi(e, mevcut + 1));
      if (max > MAKS_JSON_DERINLIK) return max;
    }
    return max;
  }
  if (deger !== null && typeof deger === "object") {
    let max = mevcut;
    for (const v of Object.values(deger as Record<string, unknown>)) {
      max = Math.max(max, jsonDerinligi(v, mevcut + 1));
      if (max > MAKS_JSON_DERINLIK) return max;
    }
    return max;
  }
  return mevcut;
}

export async function POST(istek: NextRequest) {
  try {
    // 1) Auth zorunlu — anonim çağrı kabul yok
    const oturum = await auth();
    if (!oturum?.user) {
      return NextResponse.json(
        { basarili: false, hata: "Giriş gerekli" },
        { status: 401 },
      );
    }

    const ip =
      istek.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      istek.headers.get("x-real-ip") ??
      "unknown";

    // 2) Rate limit: IP başına dakikada 30 kayıt
    if (!logHataLimiter.tryConsume(ip)) {
      return NextResponse.json(
        { basarili: false, hata: "Çok fazla istek" },
        { status: 429 },
      );
    }

    // Sprint 1 / S1-14 — gövde 64KB hard cap. content-length yalan
    // söyleyebilir, raw text okuyup tekrar ölç.
    const cl = Number(istek.headers.get("content-length") ?? "0");
    if (Number.isFinite(cl) && cl > MAKS_GOVDE_BAYT) {
      return NextResponse.json(
        { basarili: false, hata: "Gövde çok büyük" },
        { status: 413 },
      );
    }
    const ham = await istek.text();
    if (ham.length > MAKS_GOVDE_BAYT) {
      return NextResponse.json(
        { basarili: false, hata: "Gövde çok büyük" },
        { status: 413 },
      );
    }
    let govdeRaw: unknown;
    try {
      govdeRaw = JSON.parse(ham);
    } catch {
      return NextResponse.json(
        { basarili: false, hata: "Geçersiz JSON" },
        { status: 400 },
      );
    }
    if (jsonDerinligi(govdeRaw) > MAKS_JSON_DERINLIK) {
      return NextResponse.json(
        { basarili: false, hata: "JSON yapısı çok derin" },
        { status: 400 },
      );
    }
    const dogrulama = govdeSemasi.safeParse(govdeRaw);
    if (!dogrulama.success) {
      return NextResponse.json(
        { basarili: false, hata: "Geçersiz girdi" },
        { status: 400 },
      );
    }
    const g = dogrulama.data;
    const requestId = istek.headers.get(ISTEK_BASLIK) ?? null;

    await db.hataLogu.create({
      data: {
        zaman: new Date(),
        seviye: g.seviye,
        taraf: g.taraf,
        request_id: requestId,
        kullanici_id: (oturum.user as { id?: string }).id ?? null,
        ip: ip === "unknown" ? null : ip,
        user_agent: istek.headers.get("user-agent"),
        url: g.url ?? null,
        hata_tipi: g.hata_tipi ?? null,
        mesaj: g.mesaj,
        stack: g.stack ?? null,
        ekstra: g.ekstra
          ? (g.ekstra as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    return NextResponse.json({ basarili: true });
  } catch (err) {
    logger.error({ err }, "/api/log/hata yazilamadi");
    return NextResponse.json(
      { basarili: false, hata: "Kayit edilemedi" },
      { status: 500 },
    );
  }
}
