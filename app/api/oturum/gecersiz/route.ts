import { NextResponse, type NextRequest } from "next/server";

const temizlenecekCookieAdlari = [
  "pusula-session-token",
  "__Secure-pusula-session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "pusula-callback-url",
  "__Secure-pusula-callback-url",
  "pusula-csrf-token",
  "__Host-pusula-csrf-token",
];

function cookieTemizle(cevap: NextResponse, ad: string): void {
  cevap.cookies.set(ad, "", {
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
}

export function GET(istek: NextRequest): NextResponse {
  const hedef = new URL("/giris?oturum=gecersiz", istek.url);
  const cevap = NextResponse.redirect(hedef);

  for (const ad of temizlenecekCookieAdlari) {
    cookieTemizle(cevap, ad);
    for (let i = 0; i < 10; i += 1) {
      cookieTemizle(cevap, `${ad}.${i}`);
    }
  }

  return cevap;
}
