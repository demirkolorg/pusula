import type { NextAuthConfig } from "next-auth";

const guvenli = process.env.NODE_ENV === "production";

// Kontrol Kural 69 + ADR-0004: SameSite=Strict cookie zorunlu.
// `lax`'tan `strict`'e geçiş: cross-site link tıklamalarında oturum cookie'si
// gönderilmez → CSRF saldırı yüzeyi büyük ölçüde kapatıldı.
// Kullanıcı dış siteden link ile geldiğinde tekrar giriş gerekmez (NextAuth
// callbackUrl pattern'i bunu zaten handle eder).
const cookieOpts = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  secure: guvenli,
};

// callbackUrl için lax: kullanıcının başka siteden tıklayıp dönüşünde
// callbackUrl'yi kaybetmesin (UX gereği).
const callbackCookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: guvenli,
};

export const authConfig = {
  pages: {
    signIn: "/giris",
  },
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${guvenli ? "__Secure-" : ""}pusula-session-token`,
      options: cookieOpts,
    },
    callbackUrl: {
      name: `${guvenli ? "__Secure-" : ""}pusula-callback-url`,
      options: callbackCookieOpts,
    },
    csrfToken: {
      name: `${guvenli ? "__Host-" : ""}pusula-csrf-token`,
      options: cookieOpts,
    },
    pkceCodeVerifier: {
      name: `${guvenli ? "__Secure-" : ""}pusula-pkce`,
      options: { ...cookieOpts, maxAge: 900 },
    },
    state: {
      name: `${guvenli ? "__Secure-" : ""}pusula-state`,
      options: { ...cookieOpts, maxAge: 900 },
    },
    nonce: {
      name: `${guvenli ? "__Secure-" : ""}pusula-nonce`,
      options: cookieOpts,
    },
  },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const oturumAcik = !!auth?.user;
      const yol = nextUrl.pathname;
      const apiAuthYolu = yol.startsWith("/api/auth");
      const oturumTemizlemeYolu = yol.startsWith("/api/oturum/gecersiz");
      // Sosyal paylaşım (WhatsApp/Twitter/LinkedIn/Slack/FB) crawler'ları
      // ve tarayıcı favicon istekleri için erişimi açan public meta route'lar.
      // Bu pathlerden herhangi biri ile başlayan istekler auth check'siz geçer
      // — Next.js file-based metadata (icon.tsx, opengraph-image.tsx,
      // twitter-image.tsx, apple-icon.tsx) ve statik manifest/robots/sitemap.
      const publicMetaYollar = [
        "/icon",
        "/apple-icon",
        "/opengraph-image",
        "/twitter-image",
        "/favicon.ico",
        "/manifest.json",
        "/manifest.webmanifest",
        "/robots.txt",
        "/sitemap.xml",
      ];
      const publicMetaYol = publicMetaYollar.some((y) => yol.startsWith(y));
      const acikYollar = ["/giris", "/parola-sifirla", "/davet", "/kayit"];
      const acikYol = acikYollar.some((y) => yol.startsWith(y));
      const girisYolu = yol.startsWith("/giris");

      if (apiAuthYolu || oturumTemizlemeYolu || publicMetaYol) return true;
      if (acikYol) {
        if (oturumAcik && girisYolu) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }
      if (!oturumAcik) {
        return Response.redirect(new URL("/giris", nextUrl));
      }
      return true;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.birimId = (user as { birimId?: string }).birimId;
        token.adSoyad = (user as { adSoyad?: string }).adSoyad;
        token.roller = (user as { roller?: string[] }).roller;
        // ADR-0013: izin matrisi + versiyon JWT'ye gömülür
        token.izinler = (user as { izinler?: string[] }).izinler;
        token.izinVersiyonu = (user as { izinVersiyonu?: number }).izinVersiyonu;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as { birimId?: string }).birimId = token.birimId as string;
        (session.user as { adSoyad?: string }).adSoyad = token.adSoyad as string;
        (session.user as { roller?: string[] }).roller =
          (token.roller as string[]) ?? [];
        (session.user as { izinler?: string[] }).izinler =
          (token.izinler as string[]) ?? [];
        (session.user as { izinVersiyonu?: number }).izinVersiyonu =
          (token.izinVersiyonu as number) ?? 0;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
