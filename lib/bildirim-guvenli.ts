// Sprint 1 / S1-16 — bildirim trigger'ları için sessiz catch sarmalayıcısı.
//
// Bildirim üretmek bir "yan etki"dir; ana mutation transaction'ı tamamlandıktan
// sonra fire-and-forget çalışır. Eski pattern her yerde `.catch(() => {})`
// ile hatayı sessizce yutuyordu — debug etmek imkansız hale geliyordu.
//
// Bu helper hatayı yakalar AMA log'a düşürür (warn). Akış bozulmaz, ama
// operatör Pino logger üzerinden bildirim hatalarını görebilir.

import { logger } from "./logger";

export function bildirimGuvenliCagir<T>(
  promise: Promise<T>,
  baglam: string,
): Promise<T | null> {
  return promise.catch((err: unknown) => {
    logger.warn(
      {
        baglam,
        hata: err instanceof Error ? err.message : String(err),
      },
      "[bildirim] tetikleyici hatası — akış durmadı",
    );
    return null;
  });
}
