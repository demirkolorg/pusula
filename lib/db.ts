import { PrismaClient } from "@prisma/client";
import { auditExtension } from "./audit-middleware";

const olustur = () =>
  new PrismaClient({
    // Query logları gürültü yapıyor — sadece hata/uyarı.
    // Detaylı debug istenirse: PRISMA_LOG_QUERIES=1 env var ile aç.
    log:
      process.env.PRISMA_LOG_QUERIES === "1"
        ? ["query", "error", "warn"]
        : process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
  }).$extends(auditExtension);

type Db = ReturnType<typeof olustur>;

declare global {

  var __prisma: Db | undefined;
}

export const db: Db = globalThis.__prisma ?? olustur();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
