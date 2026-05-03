import { Prisma } from "@prisma/client";
import { db } from "./db";
import { auditContext } from "./audit-context";
import { logger } from "./logger";

export type HataSeviye = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
export type HataTaraf = "BACKEND" | "FRONTEND";

export type HataKayitGirdi = {
  seviye?: HataSeviye;
  taraf?: HataTaraf;
  hata: unknown;
  url?: string;
  http_metod?: string;
  http_durum?: number;
  istek_govdesi?: unknown;
  istek_basliklari?: Record<string, string>;
  ekstra?: Record<string, unknown>;
  request_id?: string;
};

function hataAdi(err: unknown): string {
  if (err instanceof Error) return err.name || "Error";
  if (typeof err === "string") return "StringError";
  return "UnknownError";
}

function hataMesaj(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function hataStack(err: unknown): string | undefined {
  if (err instanceof Error && err.stack) return err.stack;
  return undefined;
}

export async function hataKaydet(girdi: HataKayitGirdi): Promise<void> {
  const ctx = auditContext.get();
  const seviye = girdi.seviye ?? "ERROR";
  const taraf = girdi.taraf ?? "BACKEND";
  const requestId = girdi.request_id ?? ctx?.requestId;

  logger.error(
    {
      seviye,
      taraf,
      request_id: requestId,
      hata: hataMesaj(girdi.hata),
      stack: hataStack(girdi.hata),
      url: girdi.url,
    },
    "uygulama hatasi",
  );

  try {
    await db.hataLogu.create({
      data: {
        zaman: new Date(),
        seviye,
        taraf,
        request_id: requestId ?? null,
        kullanici_id: ctx?.kullaniciId ?? null,
        oturum_id: ctx?.oturumId ?? null,
        ip: ctx?.ip ?? null,
        user_agent: ctx?.userAgent ?? null,
        url: girdi.url ?? ctx?.httpYol ?? null,
        hata_tipi: hataAdi(girdi.hata),
        mesaj: hataMesaj(girdi.hata),
        stack: hataStack(girdi.hata) ?? null,
        http_metod: girdi.http_metod ?? ctx?.httpMetod ?? null,
        http_durum: girdi.http_durum ?? null,
        istek_govdesi:
          maskele(girdi.istek_govdesi) ?? Prisma.JsonNull,
        istek_basliklari:
          maskele(girdi.istek_basliklari) ?? Prisma.JsonNull,
        ekstra: girdi.ekstra
          ? (girdi.ekstra as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (kayitHatasi) {

    logger.error({ kayitHatasi }, "HataLogu yazilamadi");
  }
}

const HASSAS_BASLIK = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

function maskele(deger: unknown): Prisma.InputJsonValue | undefined {
  if (deger === null || deger === undefined) return undefined;
  if (typeof deger !== "object") return { _: String(deger) };
  if (Array.isArray(deger))
    return { _: deger.map((e) => String(e)) } satisfies Prisma.InputJsonValue;

  const sonuc: Record<string, Prisma.InputJsonValue> = {};
  for (const [k, v] of Object.entries(deger as Record<string, unknown>)) {
    const ka = k.toLowerCase();
    if (
      HASSAS_BASLIK.has(ka) ||
      ka.includes("parola") ||
      ka.includes("password") ||
      ka.includes("token")
    ) {
      sonuc[k] = "***";
    } else {
      sonuc[k] = (v ?? null) as Prisma.InputJsonValue;
    }
  }
  return sonuc;
}
