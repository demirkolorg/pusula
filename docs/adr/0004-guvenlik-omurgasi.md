---
adr: 0004
tarih: 2026-05-04
durum: kabul-edildi
---

# ADR-0004 — Güvenlik Omurgası

## Bağlam
- NextAuth cookie `sameSite: "lax"` (kontrol Kural 69 `Strict` istiyor).
- `/api/log/hata` public POST — rate limit, origin kontrolü, auth zorunluluğu yok → DoS + log spam yüzeyi.
- CSRF double-submit token implementasyonu yok (Server Actions cookie-based, ama header doğrulama eksik).

## Karar

### Cookie sertleştirme
```ts
session: { strategy: "jwt" }
cookies: {
  sessionToken: {
    options: { sameSite: "strict", httpOnly: true, secure: prod }
  }
}
```

### Rate limit (`lib/rate-limit.ts`)
In-memory token bucket (single-instance). Production multi-instance için Redis (S5'te). Default limitler:
- Login: 5 / dk / IP
- Davet: 3 / dk / kullanıcı
- Upload: 10 / dk / kullanıcı
- `/api/log/hata`: 30 / dk / IP

### Log endpoint (`/api/log/hata`)
- Auth zorunlu (`auth()` gerekli, anonim hata kabul YOK)
- Origin allowlist (`process.env.NEXT_PUBLIC_APP_URL`)
- Rate limit IP bazlı

### CSRF
NextAuth zaten Server Actions için CSRF token (cookie-based) kullanıyor. Double-submit ek katman olarak `proxy.ts`'de origin header karşılaştırması.

## Sonuç
DoS yüzeyi kapatıldı. Cookie hijacking zorlaştı. CSRF defense-in-depth.

## Kontrol Kural Bağlantıları
51 (rate limit), 69 (CSRF), 73 (login/davet/upload limitleri), 75 (CSP — sonraki ADR)
