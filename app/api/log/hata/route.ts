import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ISTEK_BASLIK } from "@/lib/request-context";
import { logger } from "@/lib/logger";

const govdeSemasi = z.object({
  seviye: z.enum(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]).default("ERROR"),
  taraf: z.enum(["BACKEND", "FRONTEND"]).default("FRONTEND"),
  mesaj: z.string().min(1).max(2000),
  stack: z.string().max(20_000).optional(),
  url: z.string().max(2000).optional(),
  hata_tipi: z.string().max(200).optional(),
  ekstra: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(istek: NextRequest) {
  try {
    const govdeRaw = await istek.json();
    const dogrulama = govdeSemasi.safeParse(govdeRaw);
    if (!dogrulama.success) {
      return NextResponse.json(
        { basarili: false, hata: "Geçersiz girdi" },
        { status: 400 },
      );
    }
    const g = dogrulama.data;
    const oturum = await auth();
    const requestId = istek.headers.get(ISTEK_BASLIK) ?? null;
    const ip =
      istek.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      istek.headers.get("x-real-ip") ??
      null;

    await db.hataLogu.create({
      data: {
        zaman: new Date(),
        seviye: g.seviye,
        taraf: g.taraf,
        request_id: requestId,
        kullanici_id: (oturum?.user as { id?: string } | undefined)?.id ?? null,
        ip,
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
