---
adr: 0003
tarih: 2026-05-04
durum: kabul-edildi
---

# ADR-0003 — Next 16 `proxy.ts` Migration

## Bağlam
Next 16, edge `middleware.ts` konvansiyonunu deprecated etti. Yeni dosya adı `proxy.ts`. Build warning veriyor; Next 17/18'de tamamen kalkabilir.

## Karar
- `middleware.ts → proxy.ts` taşındı.
- Matcher kapsamı genişletildi: `/api/log/hata` (rate limit), `/api/auth/*` (origin kontrolü) dahil.
- `request_id` propagation aynı kaldı (header inject + auditContext).

## Sonuç
- Build warning kalktı.
- Güvenlik middleware'i artık tüm API route'larda etkili.
- Forward compatibility sağlandı.

## Kontrol Kural Bağlantıları
60 (request_id propagation), 145 (yeni — major version upgrade)
