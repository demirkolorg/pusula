import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const PUBLIC_ROUTES = ['/giris', '/parola-sifirla', '/otp-dogrula']
const API_AUTH_PREFIX = '/api/auth'

export function middleware(istek: NextRequest) {
  const { pathname } = istek.nextUrl

  // Auth API rotaları serbest
  if (pathname.startsWith(API_AUTH_PREFIX)) return NextResponse.next()

  // Herkese açık rotalar serbest
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next()

  // Oturum cookie kontrolü — cookiePrefix auth config ile eşleşmeli
  const oturum = getSessionCookie(istek, { cookiePrefix: 'pusula' })
  if (!oturum) {
    const girisUrl = new URL('/giris', istek.url)
    girisUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(girisUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
