"use client";

// Client-safe error logger. Server-only `lib/hata-kayit.ts` modülü Client
// Component'lerden import edilemez (PrismaClient + server-only). Onun yerine
// burası /api/log/hata endpoint'ine fetch atar; route handler şemayı
// (govdeSemasi) doğrular ve DB'ye yazar.

export type ClientHataSeviye = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export type ClientHataKayitGirdi = {
  seviye?: ClientHataSeviye;
  /** Backward compatibility — eski server-side hataKaydet ile uyumlu olsun
   *  diye kabul edilir, fakat client tarafında her zaman "FRONTEND" yollanır. */
  taraf?: "BACKEND" | "FRONTEND";
  hata: unknown;
  url?: string;
  ekstra?: Record<string, unknown>;
};

function hataMesaj(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function hataAdi(err: unknown): string {
  if (err instanceof Error) return err.name || "Error";
  return "UnknownError";
}

function hataStack(err: unknown): string | undefined {
  if (err instanceof Error && err.stack) return err.stack;
  return undefined;
}

export async function hataKaydet(girdi: ClientHataKayitGirdi): Promise<void> {
  try {
    await fetch("/api/log/hata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seviye: girdi.seviye ?? "ERROR",
        taraf: "FRONTEND",
        mesaj: hataMesaj(girdi.hata),
        stack: hataStack(girdi.hata),
        hata_tipi: hataAdi(girdi.hata),
        url: girdi.url,
        ekstra: girdi.ekstra,
      }),
    });
  } catch {
    // Hata loglama'nın kendisi başarısız olursa sessiz geç — kullanıcı
    // zaten error boundary'de, buradan throw atmak ikinci bir hata zinciri
    // başlatır. Browser console'a düşer (fetch zaten log atar).
  }
}
