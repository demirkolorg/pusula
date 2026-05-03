import pino, { type Logger } from "pino";

const seviye = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger: Logger = pino({
  level: seviye,
  base: { hizmet: "pusula" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "parola",
      "parola_hash",
      "password",
      "*.parola",
      "*.parola_hash",
      "*.password",
      "*.token",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "***",
  },
});

export function istekGunlugu(istekId: string, ek?: Record<string, unknown>): Logger {
  return logger.child({ request_id: istekId, ...(ek ?? {}) });
}
