import type { NextConfig } from "next";

// Sprint 1 / S1-17 — global security header'ları.
//
// CSP'de `unsafe-inline` ve `unsafe-eval` Next.js runtime + Tailwind utility
// stilleri için zorunlu (nonce-based CSP geçişi Sprint 5/S5-7 ile gelir).
// img-src `https:` MinIO presigned URL'leri için açık tutulur; production'da
// daha sıkı (NEXT_PUBLIC_MINIO_HOST whitelist'i) için ayrı bir iyileştirme
// yapılabilir.

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: http: https:",
  "font-src 'self' data:",
  "connect-src 'self' http: https: ws: wss:",
  "frame-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const productionHeaders = [
  ...baseHeaders,
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  async headers() {
    const headers =
      process.env.NODE_ENV === "production" ? productionHeaders : baseHeaders;
    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
  // Same-origin socket.io proxy: tarayıcı `pusulaportal.com/socket.io/*`
  // adresine istek atar; Next.js bunu içeride socket-server container'ına
  // forward eder. Cookie aynı origin'de olduğu için NextAuth oturumu
  // doğrulanır — subdomain (socket.pusulaportal.com) için ayrı cookie
  // domain ayarlamaya gerek kalmaz.
  // SOCKET_INTERNAL_URL Dokploy'da `http://pusula-socket-vrpbmy:2501`
  // olarak set edilir; yoksa lokal geliştirme için `http://localhost:2501`.
  async rewrites() {
    const socketTarget =
      process.env.SOCKET_INTERNAL_URL ?? "http://localhost:2501";
    return [
      {
        source: "/socket.io/:path*",
        destination: `${socketTarget}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
