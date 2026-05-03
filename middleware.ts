import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const ISTEK_BASLIK = "x-request-id";

function istekIdUret(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default auth((istek) => {
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
