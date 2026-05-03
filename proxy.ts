// Next 16+ konvansiyonu: middleware.ts → proxy.ts (ADR-0003).
// Sorumluluklar:
//   1. NextAuth oturum gating (giriş gerektiren route'lar için redirect)
//   2. request_id propagation (audit + hata log korelasyonu için)
//   3. /api/log/hata gibi public POST endpoint'lerine origin allowlist + rate limit
//      hooks (kontrol Kural 51, 73, 147)

import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const ISTEK_BASLIK = "x-request-id";

function istekIdUret(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function izinliOrigin(istek: NextRequest): boolean {
  const origin = istek.headers.get("origin");
  if (!origin) return true; // same-origin (POST same-site) için origin yoksa geç
  const izinli = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!izinli) return true; // env yoksa development — kapı açık
  return origin === izinli;
}

export default auth((istek) => {
  const yol = istek.nextUrl.pathname;

  // Origin allowlist — public POST endpoint'leri için CSRF defense-in-depth
  if (
    istek.method === "POST" &&
    (yol.startsWith("/api/log/") || yol.startsWith("/api/auth/"))
  ) {
    if (!izinliOrigin(istek)) {
      return new NextResponse("Forbidden origin", { status: 403 });
    }
  }

  const mevcutId = istek.headers.get(ISTEK_BASLIK);
  const istekId = mevcutId ?? istekIdUret();

  const istekBasliklari = new Headers(istek.headers);
  istekBasliklari.set(ISTEK_BASLIK, istekId);

  const cevap = NextResponse.next({
    request: { headers: istekBasliklari },
  });
  cevap.headers.set(ISTEK_BASLIK, istekId);
  return cevap;
});

export const config = {
  matcher: [
    // Sayfa rotaları (auth middleware için)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
