// Sprint 5 / S5-13 — `server-only` paketi yanlışlıkla client bundle'ına
// import edilirse build hatası fırlatır. Prisma client + audit extension
// + DB credentials hiçbir şekilde tarayıcıya sızmamalı.
import "server-only";

import { Prisma, PrismaClient } from "@prisma/client";
import { auditExtension } from "./audit-middleware";
import { logger } from "./logger";

// Sprint 5 / S5-7 — Slow query alarm threshold (ms).
// 500ms üzeri query'ler logger.warn ile structured log'a yazılır.
// PRISMA_SLOW_THRESHOLD_MS env var ile özelleştirilebilir.
const YAVAS_QUERY_ESIK_MS = Number(
  process.env.PRISMA_SLOW_THRESHOLD_MS ?? "500",
);

const olustur = () => {
  // S5-7 — query event'lerini ayrı sink'e bağlamak için emit:"event" mode.
  // Hata/uyarı stdout'a, query event'i custom handler'a.
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
      ...(process.env.NODE_ENV === "development"
        ? ([{ emit: "stdout", level: "warn" }] as const)
        : []),
    ],
  });

  // S5-7 — slow query handler. e.duration ms cinsindendir.
  client.$on("query", (e: Prisma.QueryEvent) => {
    if (e.duration >= YAVAS_QUERY_ESIK_MS) {
      logger.warn(
        {
          duration_ms: e.duration,
          query: e.query.slice(0, 500),
          params: e.params.slice(0, 500),
          target: e.target,
        },
        "[prisma] yavaş sorgu",
      );
    }
  });

  return client.$extends(auditExtension);
};

type Db = ReturnType<typeof olustur>;

declare global {

  var __prisma: Db | undefined;
}

// Lazy init — Next 16 / Turbopack build-time modül grafik evaluation'ında
// PrismaClient instantiate edilmesin diye Proxy. Gerçek instance ilk property
// erişiminde oluşturulur, build sırasında fake tracing yapılırken yan etki
// üretmez. Runtime davranışı tek-instance singleton olarak aynıdır.
let _gercekDb: Db | undefined;
function dbAl(): Db {
  if (_gercekDb) return _gercekDb;
  _gercekDb = globalThis.__prisma ?? olustur();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = _gercekDb;
  }
  return _gercekDb;
}

export const db: Db = new Proxy({} as Db, {
  get(_t, prop, receiver) {
    return Reflect.get(dbAl() as object, prop, receiver);
  },
  has(_t, prop) {
    return Reflect.has(dbAl() as object, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(dbAl() as object);
  },
  getOwnPropertyDescriptor(_t, prop) {
    return Reflect.getOwnPropertyDescriptor(dbAl() as object, prop);
  },
}) as Db;
