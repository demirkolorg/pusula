// Sprint 1 / S1-6 — token taşıyan auth URL'leri merkezi nokta.
//
// Token path segment olarak gönderildiğinde:
//   - Server access log'una düşer (Vercel/CDN/proxy)
//   - Browser history'sinde plaintext kalır
//   - Outbound request'lerde Referer header'ı ile sızar
//
// Hash fragment (`#token=...`) tarayıcıdan sunucuya gönderilmez;
// sayfa client-side okur. Path-leak yüzeyi kapanır.

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2500";
}

export function davetUrl(token: string): string {
  return `${baseUrl()}/davet#token=${encodeURIComponent(token)}`;
}

export function parolaSifirlamaUrl(token: string): string {
  return `${baseUrl()}/parola-sifirla/yeni#token=${encodeURIComponent(token)}`;
}
