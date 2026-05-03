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

const storage = new AsyncLocalStorage<AuditContext>();

export const auditContext = {
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
