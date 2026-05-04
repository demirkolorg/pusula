import { AsyncLocalStorage } from "node:async_hooks";

export type AuditContext = {
  kullaniciId?: string;
  oturumId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  httpMetod?: string;
  httpYol?: string;
  sebep?: string;
  bypass?: boolean;
};

// Why: Next.js dev (Turbopack) ve hatta prod build, server-action /
// auth-callback / prisma-extension katmanlarını farklı modül grafiklerinde
// evaluate edebiliyor. Modül her yeniden değerlendirildiğinde yeni bir
// `new AsyncLocalStorage()` instance'ı doğuyor → `auditContext.run` Bundle
// A'daki storage'a yazıyor, Prisma extension Bundle B'deki storage'dan
// okuyor → context boş görünüyor ve KATİ AUDIT GUARD reddi fırlıyor.
// `lib/db.ts` zaten aynı sebeple `globalThis.__prisma` singleton kullanıyor.
// Why: Next.js dev (Turbopack) farklı bundle'larda modülü tekrar evaluate
// edebiliyor; `globalThis` singleton ile aynı AsyncLocalStorage instance'ını
// tüm chunk'larda paylaşmak zorundayız. `lib/db.ts` zaten aynı sebeple
// `globalThis.__prisma` singleton kullanıyor.
declare global {
  var __auditCtxStorage: AsyncLocalStorage<AuditContext> | undefined;
}

const storage =
  globalThis.__auditCtxStorage ?? new AsyncLocalStorage<AuditContext>();

if (!globalThis.__auditCtxStorage) {
  globalThis.__auditCtxStorage = storage;
}

export const auditContext = {
  // KRİTİK: callback ZORUNLU `async` olmalı ve içindeki tüm DB çağrıları
  // `await` edilmeli. Sync callback lazy Promise döndürürse AsyncLocalStorage
  // `.run()` sync bittiği için context kapanır; Promise dış `await` ile
  // execute edilirken artık caller'ın context'indedir → Prisma extension
  // boş context görür ve KATİ AUDIT GUARD reddeder.
  run: <T>(ctx: AuditContext, fn: () => T): T => storage.run(ctx, fn),
  get: (): AuditContext | undefined => storage.getStore(),
  guncelle: (yama: Partial<AuditContext>): void => {
    const mevcut = storage.getStore();
    if (mevcut) Object.assign(mevcut, yama);
  },
};

export const HASSAS_ALANLAR = new Set([
  "parola",
  "parola_hash",
  "password",
  "password_hash",
  "token",
  "mfa_secret",
  "secret",
  "refresh_token",
  "access_token",
]);

export function maskeleHassas<T>(deger: T): T {
  if (deger === null || deger === undefined) return deger;
  if (Array.isArray(deger)) {
    return deger.map((e) => maskeleHassas(e)) as unknown as T;
  }
  if (typeof deger === "object") {
    const sonuc: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(deger as Record<string, unknown>)) {
      if (HASSAS_ALANLAR.has(k)) {
        sonuc[k] = "***";
      } else {
        sonuc[k] = maskeleHassas(v);
      }
    }
    return sonuc as unknown as T;
  }
  return deger;
}
