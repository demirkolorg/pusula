# ADR-0034 — Sprint 5'in büyük altyapı maddeleri için defer kararları

**Durum:** Onaylandı (Sprint 5 / S5-1, S5-2, S5-5, S5-7, S5-8, S5-9, S5-10)
**Tarih:** 2026-05-08
**İlişkili:** Tarama raporu Sprint 5

## Bağlam

Sprint 5 — production altyapı sprint'i. 13 maddeden 6'sı kod
tabanında küçük değişiklikle uygulanabilir (S5-3, S5-4, S5-6, S5-11,
S5-12, S5-13); kalan 7 maddenin her biri:

- **External altyapı** (Redis, Sentry/DataDog) gerektirir
- **Production deploy** olmadan test edilemez (partitioning, slow query
  alarm)
- **E2E test infrastructure** sıfırdan kurulum gerektirir
- **Veri tipi geçişi** (BigInt) downstream her boyut kullanım yerini
  etkiler

Bu ADR scope'u ve sırayla uygulanma metodolojisini dökümante eder.

## Karar

Aşağıdaki maddeler **Sprint 6+ takibinde**. Her biri için ayrı atomik
sprint dilimi. Bu Sprint 5'te dashboard'da `defer` etiketli olarak
işaretlenir.

### S5-1 — Redis tabanlı rate limiter

- **Mevcut**: in-memory token bucket (`lib/rate-limit.ts`); single-pod
  production'da yeterli.
- **Defer sebebi**: Redis container, auth, cluster topolojisi kararları
  ops dökümanında. `@upstash/ratelimit` kütüphanesi candidate.
- **Geçiş yolu**: `lib/rate-limit.ts` interface'i (`tryConsume`/`reset`)
  korur, implementation Redis ile değişir; preset limiter'lar (login/
  davet/kayit/parolaSifirla/upload/logHata) tek noktadan dağılır.

### S5-2 — `aktivite_logu` partitioning + retention

- **Mevcut**: tek tablo, sınırsız büyür. KVKK retention politikası yok.
- **Defer sebebi**: PARTITION BY RANGE (ay) Postgres-spesifik; mevcut
  data backup → partition'lı tablo migrate sürecinde downtime gerek.
  Production deploy ile koordine edilmeli.
- **Geçiş yolu**: ayrı migration (CREATE TABLE LIKE + ATTACH PARTITION
  + cron retention). 90 gün cutoff.

### S5-5 — `Eklenti.boyut` + `Dosya.boyut` Int → BigInt

- **Mevcut**: Int (max ~2GB). MVP storage limiti 100MB'de (S1-4
  uyumlu); 2GB üzeri dosya yok.
- **Defer sebebi**: Runtime BigInt → number cast'leri her UI yerine
  yayılır (`boyutBicim(byte: number)` — S3-10), JSON serialize için
  string dönüşüm ekstra audit middleware kontrolü gerek.
- **Geçiş yolu**: Future-proofing; storage limiti 1GB+'a çıktığında
  schema migration + boyut helper'ları + JSON marshal güncellenir.
  Sprint 6+'ya defer edildi.

### S5-7 — Slow query alarm

- **Mevcut**: Prisma `log: ["error", "warn"]` (lib/db.ts); query
  süreleri logger'a düşmüyor.
- **Defer sebebi**: `client.$on("query", ...)` callback Pino sink'e
  bağlanır + 500ms threshold + Sentry breadcrumb. S5-10 ile
  birlikte gelmesi mantıklı (Sentry/DataDog setup'ından sonra).

### S5-8 — Playwright E2E (5 kritik akış)

- **Mevcut**: Playwright kurulu; sadece bir test dosyası var
  (`tests/e2e/`).
- **Defer sebebi**: Login, kart CRUD/move, yorum, davet kabul, dosya
  upload akışlarının her biri ayrı setup + auth fixture + teardown.
  Scope ~8-12 saat. Test stability için CI runner'da headless modunda
  çalıştırılması önemli.

### S5-9 — `@axe-core/playwright` CI WCAG 2.2 AA

- **Mevcut**: Yok. axe-core S4'teki a11y düzeltmeleri otomatik
  validate edilemez.
- **Defer sebebi**: S5-8'in altyapısına bağlı (Playwright zaten
  kurulu olunca paketi import etmek + axe runner ayarlamak yeterli).

### S5-10 — Sentry / DataDog entegrasyonu

- **Mevcut**: Pino logger (lib/logger) JSON çıktı verir. `lib/hata-kayit.ts`
  HataLogu DB tablosuna yazar.
- **Defer sebebi**: SaaS hesap + DSN secret yönetimi ops kararları;
  S5-7 (slow query) bu sink'i kullanır.
- **Geçiş yolu**: `@sentry/nextjs` (next.config.ts'in `withSentryConfig`)
  + Pino transport (`pino-sentry`) köprüsü.

## Sonuçlar

Sprint 5 dashboard:
- 6 madde implement edildi (S5-3, S5-4, S5-6, S5-11, S5-12, S5-13).
- 7 madde **defer** etiketli (bu ADR ile Sprint 6+ takibinde).

Plan dashboard'unda Sprint 5 statü olarak `✅ Tamamlandı (kısmi)`
işaretlenir; defer maddelerinin kapsamı bu ADR'da.

## Risk

- **Düşük**: Mevcut MVP altyapısı production'a yetiyor (single-pod,
  in-memory rate-limit, sınırlı E2E). Defer maddelerinin hepsi
  scaling/observability/future-proofing kategorisinde.
