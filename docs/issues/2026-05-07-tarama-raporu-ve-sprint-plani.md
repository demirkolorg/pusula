# Pusula — Kapsamlı Tarama Raporu & Sprint Planı

**Oluşturulma:** 2026-05-07
**Sahibi:** Tüm ekip
**Statü:** Aktif — sprint takibi açık
**Yöntem:** 6 paralel uzman agent (scout · security-reviewer · code-reviewer · database-reviewer · accessibility-auditor · janitor)

> Bu dosya hem rapor hem de canlı sprint takip panosudur. Bir madde tamamlandığında `[ ]` → `[x]` yapılır, `İlerleme Dashboard` bölümü güncellenir, gerekirse "Tamamlandı tarihi" ve "PR/commit" eklenir.

---

## İçindekiler

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [İlerleme Dashboard](#2-ilerleme-dashboard)
3. [Sprint Planı (5 Sprint)](#3-sprint-planı-5-sprint)
   - [Sprint 0 — Acil Hotfix (30 dakika)](#sprint-0--acil-hotfix-30-dakika)
   - [Sprint 1 — Güvenlik Kapanışı (1 hafta)](#sprint-1--güvenlik-kapanışı-1-hafta)
   - [Sprint 2 — Performans & Test Altyapısı (2 hafta)](#sprint-2--performans--test-altyapısı-2-hafta)
   - [Sprint 3 — Refactor & DRY (2 hafta)](#sprint-3--refactor--dry-2-hafta)
   - [Sprint 4 — UX, A11y, Yarım Feature'lar (2 hafta)](#sprint-4--ux-a11y-yarım-featurelar-2-hafta)
   - [Sprint 5 — Altyapı & Production Hazırlık (2 hafta)](#sprint-5--altyapı--production-hazırlık-2-hafta)
4. [Bulgu Detayları (Referans)](#4-bulgu-detayları-referans)
5. [Agent Devam ID'leri](#5-agent-devam-idleri)
6. [Kullanım Kılavuzu](#6-kullanım-kılavuzu)

---

## 1. Yönetici Özeti

| Kategori | Kritik | Yüksek | Orta | Düşük | Toplam |
|---|---|---|---|---|---|
| Güvenlik | 5 | 9 | 9 | 4 | 27 |
| Veritabanı / Performans | 10 | 15 | 15 | 10 | 50 |
| Kod Kalitesi | 4 | 12 | 14 | 8 | 38 |
| Tutarsızlık / Dead Code | 3 | 10 | 13 | 9 | 35 |
| Erişilebilirlik (a11y) | 3 | 9 | 7 | 5 | 24 |
| Tech Debt / Hijyen | — | 9 | 16 | 16 | 41 |
| **TOPLAM** | **25** | **64** | **74** | **52** | **215** |

**Risk:** YÜKSEK. Production öncesi 25 kritik + 64 yüksek bulgu kapatılmalı.

**Güçlü yönler:** ADR disiplini, `eylem()` wrapper, `Sonuç<T>` tipi, granüler RBAC, audit altyapısı, tsvector full-text search, argon2id, soft-delete, `__Host-`/`__Secure-` cookie config, path traversal koruması, magic-byte fonksiyonu (yazılmış ama bağlanmamış), AsyncLocalStorage audit context, TipTap DoS koruması.

**Zayıf yönler:** Action katmanının %96 test'siz olması, login'de rate-limit hiç kullanılmaması (tanımlı ama çağrılmıyor), magic-byte check'in hazır olmasına rağmen çağrılmaması, audit middleware'in 3x query amplifikasyonu, 5 servisin 1000+ satıra ulaşmış olması, `cookies.txt`'in disk'te durması, hardcoded secret fallback'leri.

---

## 2. İlerleme Dashboard

> Sprint başlangıcında ve sonunda güncellenir.

| Sprint | Statü | İlerleme | Başlangıç | Bitiş | Notlar |
|---|---|---|---|---|---|
| Sprint 0 | ✅ Tamamlandı | 5 / 5 | 2026-05-08 | 2026-05-08 | Acil hotfix kapandı |
| Sprint 1 | ⏳ Beklemede | 0 / 18 | — | — | Güvenlik kritik kapanış |
| Sprint 2 | ⏳ Beklemede | 0 / 16 | — | — | DB index + test |
| Sprint 3 | ⏳ Beklemede | 0 / 19 | — | — | Refactor & DRY |
| Sprint 4 | ⏳ Beklemede | 0 / 17 | — | — | UX & yarım feature |
| Sprint 5 | ⏳ Beklemede | 0 / 13 | — | — | Production altyapı |
| **TOPLAM** | — | **5 / 88** | — | — | %5,7 |

**Statü ikonları:** ⏳ Beklemede · 🚧 Devam ediyor · ✅ Tamamlandı · ⛔ Blocked · 🚫 İptal

---

## 3. Sprint Planı (5 Sprint)

### Sprint 0 — Acil Hotfix (30 dakika)

**Amaç:** Production'a sızmış olabilecek secret'leri temizle ve sessiz fail açıklarını kapat.
**Süre:** ~30 dakika
**Sahip:** —
**Statü:** ✅ Tamamlandı (2026-05-08)

- [x] **S0-1** [secret-leak] `Remove-Item d:\projects\pusula\cookies.txt` — diskten sil — ✅ 2026-05-08
  - Dosya .gitignore'da listeli olduğu için disk silme yeterli; commit gerekmedi.
  - Pre-commit hook (git-secrets/trufflehog) ekleme görevi Sprint 5'e
- [x] **S0-2** [dead-dep] `bun remove vaul @tanstack/query-core` — sıfır direct import — ✅ 2026-05-08 · commit `e9b1b96`
- [x] **S0-3** [dead-code] `rm components/ui/collapsible.tsx components/yetki-koru.tsx` — sıfır import — ✅ 2026-05-08 · commit `63583e9`
- [x] **S0-4** [security:critical] `eklentiSilEylem`'e `yetkiZorunluKart` ekle — ✅ 2026-05-08 · commit `a4f7ed4`
  - Dosya: `app/(panel)/projeler/[projeId]/eklenti/actions.ts:104-129`
  - **Düzeltme:** Plan'daki `IZIN_KODLARI.EKLENTI_SIL` katalog'da yok. Bunun yerine `herhangiBirIzin(KART_EKLENTI_KENDI_SIL, KART_EKLENTI_BASKA_SIL)` ile defense-in-depth uygulandı. Resource-level kontrol `dosyalar.sil` → `yetkiZorunluDosya("dosya:delete")` ile hâlâ service katmanında.
- [x] **S0-5** [security:critical] Hardcoded secret fallback'leri production'da fail-fast yap — ✅ 2026-05-08 · commit `4ccdfda`
  - `lib/realtime.ts:13` (SOCKET_INTERNAL_TOKEN)
  - `socket-server/index.ts:25` (SOCKET_INTERNAL_TOKEN)
  - `lib/storage.ts:22-23` (MINIO_ACCESS_KEY, MINIO_SECRET_KEY)
  - Pattern: `if (process.env.NODE_ENV === "production" && !val) throw new Error(...)`

---

### Sprint 1 — Güvenlik Kapanışı (1 hafta)

**Amaç:** CRITICAL ve yüksek-trafik HIGH güvenlik bulgularını kapat.
**Süre:** 1 hafta
**Sahip:** —
**Statü:** ⏳

#### 1.1 Rate limiting & brute-force

- [ ] **S1-1** Login rate-limit (loginLimiter zaten tanımlı, çağrılmıyor)
  - Dosya: `auth.ts:23-49` (authorize callback)
  - Ekle: `loginLimiter.tryConsume(email.toLowerCase())` — argon2.verify ÖNCESİ
  - IP bazlı ek limit `proxy.ts`'te
- [ ] **S1-2** Parola sıfırlama rate-limit + timing-equalize
  - Dosya: `app/(auth)/parola-sifirla/actions.ts:20-53`
  - IP+e-posta hash bazlı limit (3/dk/IP, 5/saat/email)
  - Sahte branch'e fake delay (200ms ± 200ms)
  - Aynı user'a 5dk içinde aktif token varsa yeni üretme
- [ ] **S1-3** Self-registration rate-limit
  - Dosya: `app/(auth)/kayit/actions.ts`
  - 3/saat/IP limiter

#### 1.2 Dosya yükleme güvenliği

- [ ] **S1-4** `yuklemeOnayla`'da magic-byte check (fonksiyon hazır, çağrılmıyor)
  - Dosya: `app/(panel)/dosyalar/services.ts:177-213`
  - Çağrı: `lib/dosya-guvenlik.ts:194` `magicByteEsleseMi`
  - MinIO `getObject` ile ilk 4KB oku → bildirilen mime'a karşı kontrol et
  - SHA256 hash kaydet (TOCTOU önleme)
- [ ] **S1-5** SVG için inline render engelleme veya whitelist'ten çıkarma
  - `lib/dosya-guvenlik.ts:27` (image/svg+xml: GORSEL)
  - Karar: **(A) yasakla** veya **(B) presigned download'da `response-content-disposition=attachment` zorla**
- [ ] **S1-6** Token URL'lerini path → POST body veya hash fragment
  - `/davet/[token]` → `/davet#token=...` veya POST body
  - `/parola-sifirla/[token]` → aynı
  - Sebep: Referer leak + log/CDN log retention

#### 1.3 RBAC tutarsızlıkları (ADR-0014)

- [ ] **S1-7** Yorum action'ları → granüler izin kodları
  - Dosya: `app/(panel)/projeler/[projeId]/yorum/actions.ts`
  - `KART_DUZENLE` → `KART_YORUM_YAZ`, `KART_YORUM_KENDI_DUZENLE`, `KART_YORUM_KENDI_SIL`
- [ ] **S1-8** `yorumSil` izin kodu düzelt
  - Dosya: `app/(panel)/projeler/[projeId]/yorum/services.ts:247`
  - `PROJE_YETKILI_YONET` → `KART_YORUM_BASKA_SIL`
- [ ] **S1-9** Kontrol listesi action'larına resource-level RBAC
  - `app/(panel)/projeler/[projeId]/kontrol-listesi/actions.ts:78-86, 160-168`
  - `await yetkiZorunluKart(ctx, kartId, ...)` ekle
- [ ] **S1-10** `projeArsivleEylem` granüler izin
  - `app/(panel)/projeler/actions.ts:72`
  - `PROJE_DUZENLE` → `PROJE_ARSIVLE`
- [ ] **S1-11** Liste action'ları granüler izin
  - `app/(panel)/projeler/[projeId]/actions.ts:128, 156`
  - `LISTE_DUZENLE` → `LISTE_AD_DUZENLE`, `LISTE_SIRALA`

#### 1.4 Diğer güvenlik

- [ ] **S1-12** Cron endpoint'lerinde `timingSafeEqual`
  - `app/api/cron/bildirim-bitis/route.ts:39-44`
  - `app/api/cron/bildirim-mail-digest/route.ts:53`
  - `app/api/cron/oneri-retention/route.ts:34-39`
  - `app/api/bildirim-metrikler/route.ts:28-31`
- [ ] **S1-13** `proxy.ts` origin allowlist — production'da env zorunlu
  - `proxy.ts:25-27`
  - `if (NODE_ENV === "production" && !izinli) return false`
- [ ] **S1-14** `/api/log/hata` body size + JSON depth limit
  - `app/api/log/hata/route.ts:60-77`
  - 64KB hard-limit, ekstra alanı `z.unknown()` yerine sınırlı union
- [ ] **S1-15** `EylemHatasi` mesajları sanitize
  - `lib/action-wrapper.ts:101-110`
  - Prisma constraint violation mesajlarını UI'a sızdırma; generic mesaja çevir
- [ ] **S1-16** Notification trigger'larda sessiz catch'leri sarmala
  - 26 yer, `app/(panel)/projeler/[projeId]/actions.ts:145, 197-201, 207, 228, 250-251, 256, 279`
  - `bildirimGuvenliCagir()` helper'ı yaz, hepsini migrate et
- [ ] **S1-17** Security headers (`next.config.ts`)
  - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [ ] **S1-18** `seed.ts` production safeguard
  - `prisma/seed.ts` `main()` başına `NODE_ENV === "production"` ve localhost dışı DB guard'ı

---

### Sprint 2 — Performans & Test Altyapısı (2 hafta)

**Amaç:** Audit middleware amplifikasyonu + FK index'leri + en yüksek-trafik 5 action testi.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ⏳

#### 2.1 Audit & query amplifikasyonu

- [ ] **S2-1** Audit middleware ATLA listesini genişlet
  - `lib/audit-middleware.ts`
  - Ekle: `Bildirim`, `ProjeZiyareti`, `BildirimMailKuyrugu` (write-heavy + audit kritik değil)
  - Ölç: write throughput öncesi/sonrası
- [ ] **S2-2** `kullaniciErisimBilgisi` cache wrap
  - `lib/yetki.ts`
  - React `cache()` ile request-scoped cache
- [ ] **S2-3** `superAdminMi` cache wrap
  - `lib/permissions.ts:24-51`
  - React `cache()` ile

#### 2.2 FK index'leri (CONCURRENTLY)

- [ ] **S2-4** Migration: 17 FK index'i `CREATE INDEX CONCURRENTLY` ile
  - `KullaniciRol.atayan_id`
  - `Yorum.yanit_yorum_id`
  - `KontrolMaddesi.bitis` + `(atanan_id, bitis)` composite
  - `BildirimMailKuyrugu_bekleyen_idx` partial WHERE durum='BEKLIYOR'
  - `DosyaYuklemeOturumu_expired_idx` partial
  - `Kart_baslik_idx` partial WHERE silindi_mi=false
  - `Liste_ad_idx`, `Proje_ad_idx`
  - (Tam liste için bkz. database-reviewer raporu — agent ID Bölüm 5)

#### 2.3 Pagination & büyük query

- [ ] **S2-5** `projedeTumKartlar` cursor pagination
  - `app/(panel)/projeler/[projeId]/services.ts:1243-1322`
  - `take: 1000` veya cursor-based
- [ ] **S2-6** `aktiviteBaglamSecenekleriGetir` autocomplete'a dönüştür
  - `app/(panel)/aktivite-gunlugu/services.ts:286-323`
  - Server-action search + arama parametresi (`take: 50`)
- [ ] **S2-7** `bildirimUret` `createManyAndReturn`
  - `app/(panel)/bildirimler/services.ts`
  - N INSERT loop → tek query
- [ ] **S2-8** `ProjeZiyareti` 1 saatlik throttle
  - `app/(panel)/projeler/[projeId]/services.ts:257-275`
  - findUnique → son_ziyaret <1h ise atla

#### 2.4 Action layer test (en yüksek-trafik 5)

- [ ] **S2-9** `app/(panel)/projeler/[projeId]/actions.ts.test.ts` (548 satır)
- [ ] **S2-10** `app/(panel)/projeler/actions.test.ts`
- [ ] **S2-11** `app/(panel)/dosyalar/actions.test.ts`
- [ ] **S2-12** `app/(panel)/ayarlar/kullanicilar/actions.test.ts`
- [ ] **S2-13** `app/(panel)/onaylar/actions.test.ts`
  - Her birinde: yetki başarısız, yetki başarılı, audit kayıt assertion, validation hata
  - Pattern: `lib/optimistic.test.tsx` referans alınabilir

#### 2.5 ADR-0028 tamamlama (Eklenti → Dosya)

- [ ] **S2-14** Kapak görseli `db.eklenti` → `db.dosya`
  - `app/(panel)/projeler/[projeId]/kapak/services.ts:43-48`
  - `app/(panel)/projeler/[projeId]/services.ts:368`
- [ ] **S2-15** Aktivite servisinde Eklenti ID eşleştirme → Dosya
  - `app/(panel)/projeler/[projeId]/aktivite/services.ts:575`
- [ ] **S2-16** `Eklenti` tablosu için drop migration planı (data backfill ardından)

---

### Sprint 3 — Refactor & DRY (2 hafta)

**Amaç:** En büyük 5 servis dosyasını böl + ortak helper'ları çıkar + duplicate'leri sıfırla.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ⏳

#### 3.1 Mega dosya bölme

- [ ] **S3-1** `app/(panel)/projeler/[projeId]/aktivite/services.ts` (1749 satır)
  - `services/listele.ts`, `services/zenginlestir.ts`, `services/ozet.ts`
- [ ] **S3-2** `app/(panel)/projeler/[projeId]/services.ts` (1323 satır)
  - `services/kart.ts`, `services/liste.ts`, `services/arsiv.ts`
- [ ] **S3-3** `app/(panel)/dosyalar/services.ts` (1001 satır)
  - `services/upload.ts`, `services/etiket.ts`, `services/baglanti.ts`, `services/listele.ts`
- [ ] **S3-4** `app/(panel)/bildirimler/tetikleyiciler.ts` (1083 satır)
  - `tetikleyiciler/{kart,liste,proje,davet,kontrol-listesi,etiket,dosya}.ts` + barrel
- [ ] **S3-5** `lib/permissions-katalog.ts` (1214 satır — saf veri)
  - Kategori bazlı: `permissions-katalog/{proje,kart,dosya,bildirim}.ts`
- [ ] **S3-6** `app/(panel)/projeler/[projeId]/components/kanban-pano.tsx` (814 satır)
  - `kanban-pano.tsx` (UI) + `use-kanban-pano.ts` (DnD logic)
  - Dosya seviyesi `eslint-disable react-hooks/set-state-in-effect` kaldır

#### 3.2 Yeni ortak helper'lar

- [ ] **S3-7** `lib/zod-helpers.ts` oluştur
  - `uuid`, `eposta`, `tcKimlik`, `telefon`, `idSemasi`, `siralamaSemasi`
- [ ] **S3-8** `lib/tarih-format.ts` oluştur
  - `TARIH_KISA`, `TARIH_TAM`, `SAAT`, `RELATIVE`
  - 54 occurrence Strangler Fig ile migrate
- [ ] **S3-9** `lib/metin-helpers.ts` — `kisalt()` (5 duplicate sil)
- [ ] **S3-10** `lib/dosya-bicim.ts` — `boyutBicimle()` (2 duplicate sil)
- [ ] **S3-11** `lib/query-keys.ts` — TanStack QK pattern
  - `QK.kullanicilar`, `QK.roller`, `QK.birimler`, vb.
- [ ] **S3-12** `lib/action-helpers.ts` — `kullaniciIdAl`, `superAdminZorunlu`, `birimIdAl` merkezileştir
  - `ayarlar/denetim/actions.ts:36`, `ayarlar/hata-loglari/actions.ts:15` kopya sil
- [ ] **S3-13** `lib/yetki-erisim.ts` — `kullaniciKaynakKapsami` 7 yerdeki nested OR EXISTS duplicate

#### 3.3 Tutarsızlık ve dead code temizliği

- [ ] **S3-14** `birimIdAl()` → doğru ad veya kaldır (kullaniciId döndürüyor)
  - `app/(panel)/projeler/[projeId]/yorum/actions.ts:20-28`
- [ ] **S3-15** `Vurgu` tipi + `VURGU_SINIFLARI` ortak dosya
  - `app/(panel)/ana-sayfa/components/vurgu.ts` oluştur
  - `metrik-kartlari.tsx` + `makam-kpi-seridi.tsx` import etsin
- [ ] **S3-16** `oturum.user as { id: string }` cast'lerini temizle (17+ dosya)
- [ ] **S3-17** `console.log/error` → `logger`
  - `lib/audit-middleware.ts:317`
  - `app/(auth)/giris/actions.ts:68`
  - `app/(panel)/projeler/[projeId]/components/proje-baslik-aksiyonlar.tsx:70`
- [ ] **S3-18** `useMutation` ham kullanımları → `useOptimisticMutation` veya gerekçe yorumu
  - 8 yer (Kural 108)
- [ ] **S3-19** `key={index}` antipattern fix
  - `aktivite-listesi.tsx:575, 682` → `${aktivite.id}:${d.alan}`
  - `sablon-liste-yonetici.tsx:62-66` → `tempId()`

---

### Sprint 4 — UX, A11y, Yarım Feature'lar (2 hafta)

**Amaç:** Erişilebilirlik kütüphane seviyesinden patch + yarım kalan feature'ları tamamla.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ⏳

#### 4.1 Erişilebilirlik (kütüphane patching)

- [ ] **S4-1** Skip Navigation link
  - `app/layout.tsx`'e `<a href="#ana-icerik" className="sr-only focus:not-sr-only ...">Ana içeriğe atla</a>`
  - `app/(panel)/layout.tsx:112` `<div id="ana-icerik" tabIndex={-1}>`
- [ ] **S4-2** `prefers-reduced-motion` global CSS
  - `app/globals.css`
- [ ] **S4-3** `<FormField>` helper component
  - `components/ui/form-field.tsx`
  - aria-describedby + aria-required + aria-invalid otomatik
  - Tüm form'larda kademeli migrate
- [ ] **S4-4** Dialog/Sheet/Sidebar TR çeviri
  - "Close" → "Kapat", "Toggle Sidebar" → "Yan menüyü aç/kapat"
- [ ] **S4-5** Skeleton `aria-busy` + `role="status"` + sr-only "Yükleniyor…"
  - `components/ui/skeleton.tsx`
- [ ] **S4-6** `<TableHead>` `scope="col"` default
  - `components/ui/table.tsx:68`
- [ ] **S4-7** Sonner toast `aria-live` ayarı + ikonlara `aria-hidden`
  - `components/ui/sonner.tsx`
- [ ] **S4-8** ThemeToggle `aria-pressed`
  - `components/theme-toggle.tsx`
- [ ] **S4-9** kayit-form `role="alert"` + `aria-invalid` (diğer formlarda var)
  - `app/(auth)/kayit/components/kayit-form.tsx`
- [ ] **S4-10** Etiket renk algoritması WCAG luminance (sRGB lin)
  - `app/(panel)/projeler/[projeId]/etiket/components/etiket-rozet.tsx:31-48`
- [ ] **S4-11** `:focus-visible { scroll-margin-top: 5rem }` (sticky header focus-not-obscured)
  - `app/globals.css`

#### 4.2 Loading & Error boundary granülaritesi

- [ ] **S4-12** `app/(panel)/loading.tsx` (global panel)
- [ ] **S4-13** `app/(panel)/projeler/[projeId]/loading.tsx`
- [ ] **S4-14** `app/(panel)/projeler/[projeId]/error.tsx`
- [ ] **S4-15** `app/(panel)/ayarlar/error.tsx`

#### 4.3 Yarım Feature'lar

- [ ] **S4-16** Profil yönetimi
  - `app/(panel)/profil/page.tsx:122` stub
  - Ad/soyad/avatar düzenleme
  - Parola değiştirme (mevcut parola + yeni parola + onay)
  - Audit log + bildirim
- [ ] **S4-17** Dead izinler kararı
  - `KART_KOPYALA`, `KART_ILISKI_KUR`, `KART_ILISKI_KALDIR`
  - **Karar:** [ ] implement / [ ] katalogtan + seed'den + roller'dan kaldır

---

### Sprint 5 — Altyapı & Production Hazırlık (2 hafta)

**Amaç:** Production'da scale ve observability — Redis rate-limiter, monitoring, partitioning, E2E.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ⏳

#### 5.1 Rate limiter & multi-pod

- [ ] **S5-1** Redis tabanlı rate limiter
  - `lib/rate-limit.ts` Redis impl (`@upstash/ratelimit` veya `ioredis` + Lua)
  - Tüm limiter'ları geçir: `loginLimiter`, `davetLimiter`, `logHataLimiter`, vb.

#### 5.2 Veritabanı

- [ ] **S5-2** `aktivite_logu` partitioning + retention
  - PARTITION BY RANGE (ay/çeyrek)
  - 90 günden eski cron retention
- [ ] **S5-3** `aciklama_dokuman` JSONB validation
  - Zod TiptapDokumanSchema veya CHECK constraint
- [ ] **S5-4** Schema CHECK constraint'leri
  - `Kullanici.tc_kimlik_no` (regex 11 hane)
  - `Etiket.renk` (hex format)
  - `Birim.logo_url` (URL format)
  - String alanlar `@db.VarChar(N)` veya CHECK length
- [ ] **S5-5** `Eklenti.boyut` ve `Dosya.boyut` `Int` → `BigInt` (>2GB destek)
- [ ] **S5-6** Connection pool config (`DATABASE_URL` parametre)
  - `connection_limit=10&pool_timeout=20&connect_timeout=10`
- [ ] **S5-7** Slow query alarm
  - `lib/db.ts` `emit: "event"` mode + 500ms threshold
  - `client.$on("query", ...)` → logger.warn

#### 5.3 Test ve observability

- [ ] **S5-8** Playwright E2E (5 kritik akış)
  - Login, kart CRUD/move, yorum, davet kabul, dosya upload
- [ ] **S5-9** `@axe-core/playwright` CI WCAG 2.2 AA
- [ ] **S5-10** Sentry / DataDog entegrasyonu
  - `lib/hata-kayit.ts` external sink
  - Slow query log shipping

#### 5.4 Hijyen & secret prevention

- [ ] **S5-11** Pre-commit hook (`git-secrets` veya `trufflehog`)
- [ ] **S5-12** ESLint rule: `no-console: ["error", { allow: ["warn", "error"] }]`
  - `lib/logger.ts` hariç
- [ ] **S5-13** `lib/db.ts` üstüne `import "server-only"`

---

## 4. Bulgu Detayları (Referans)

> Bu bölüm sprint maddelerinin arkasındaki ham bulguların özeti. Detay için 5. bölümdeki agent ID'leri.

### 4.1 Kritik (P0) — 25 madde

#### Güvenlik (5)
- **K-01** `cookies.txt` repo dizininde (`.gitignore`'da listeli ama disk'te) → S0-1
- **K-02** `loginLimiter` tanımlı, hiç çağrılmıyor → S1-1
- **K-03** Parola sıfırlama rate-limit + timing side-channel → S1-2
- **K-04** `eklentiSilEylem` yetki kontrolsüz → S0-4
- **K-05** Hardcoded secret fallback → S0-5

#### Veritabanı / Performans (10)
- **K-06** Upload magic-byte yok (TOCTOU) → S1-4
- **K-07** `Prisma.raw` allow-list yok → (Sprint 5 hardening)
- **K-08** Audit middleware 3x query → S2-1
- **K-09** `aktivite_logu` partition yok → S5-2
- **K-10** 17+ FK index eksik → S2-4
- **K-11** `projedeTumKartlar` pagination yok → S2-5
- **K-12** `aktiviteBaglamSecenekleriGetir` full sort → S2-6
- **K-13** `bildirimUret` N INSERT loop → S2-7
- **K-14** `seed.ts` production guard yok → S1-18

#### Kod Kalitesi (4)
- **K-15** Action testleri %96 boş → S2-9..13
- **K-16** Notification trigger sessiz catch → S1-16
- **K-17** ADR-0028 yarım kalmış → S2-14, S2-15

#### Erişilebilirlik (3)
- **K-18** `aria-describedby`/`aria-required` 0 occurrence → S4-3
- **K-19** Skip-link yok → S4-1
- **K-20** `prefers-reduced-motion` desteği yok → S4-2

### 4.2 Yüksek (P1) — 64 madde
> Tam liste için her bir agent raporundaki HIGH bölümlerine bak (Bölüm 5).

### 4.3 Orta (P2) — 74 madde
> Backlog. Sprint 3-5'te kademeli ele alınır.

### 4.4 Düşük (P3) — 52 madde
> Cosmetic, type safety, edge case. Sprint 5 sonrası veya fırsat doğdukça.

---

## 5. Agent Devam ID'leri

Detaylı bulgular için aşağıdaki agent'ları SendMessage ile devam ettirebilirsin:

| Agent | ID | Kapsam |
|---|---|---|
| scout | `aac3d391ac07b1241` | 35 bulgu — tutarsızlık, dead code, eksiklik, geliştirme |
| security-reviewer | `a2b74067a592830f6` | 27 bulgu — auth, RBAC, file upload, secrets, CSRF/SSRF |
| code-reviewer | `a0da420b38800027e` | 38 bulgu — React 19, type safety, server action, naming |
| database-reviewer | `aa6170af704b9e8b4` | 50 bulgu — schema, index, query perf, migration, seed |
| accessibility-auditor | `a8a548dff496d6494` | 24 bulgu — WCAG 2.2 AA, keyboard, screen reader, kontrast |
| janitor | `abdccc367f5bc2c03` | 41 bulgu — tech debt, dead code, oversized, duplicate |

Kullanım: `Agent` tool'u yerine SendMessage ile `to: "<id>"` parametresi vererek aynı bağlamla devam ettir.

---

## 6. Kullanım Kılavuzu

### Madde tamamlandığında

1. `[ ]` → `[x]` yap.
2. Aynı satıra: `— ✅ 2026-MM-DD · <kısa not veya commit hash>` ekle.
   - Örnek: `- [x] **S0-1** ... — ✅ 2026-05-08 · commit abc1234`
3. Sprint başlığındaki Statü'yü güncelle (⏳ → 🚧 → ✅).
4. Bölüm 2'deki Dashboard'da:
   - İlerleme `0 / 5` → `1 / 5` (vb.)
   - Yüzde hesapla
   - Sprint statüsünü güncelle

### Sprint başladığında

1. Sprint başlığında `Statü: ⏳` → `🚧 Devam ediyor`
2. `Başlangıç:` tarihini doldur
3. `Sahip:` ata
4. Dashboard'da güncelle

### Sprint bittiğinde

1. Statü `✅ Tamamlandı`
2. `Bitiş:` tarihi
3. Notlar bölümüne özet ekle
4. Bir sonraki sprint'i başlat

### Yeni bulgu çıkarsa

1. Uygun sprint'e ek madde olarak ekle (`S1-19`, `S2-17`, vb.)
2. Toplam sayıyı dashboard'da güncelle
3. Bulgu detaylarını Bölüm 4'e referans olarak ekle

### İptal / Blocked

- ⛔ Blocked: madde önüne ⛔ koy, sebep yorumu ekle, çözüldüğünde geri al
- 🚫 İptal: `~~[ ] **S1-X** ...~~ — 🚫 iptal: <sebep>`

---

**Son güncelleme:** 2026-05-07
**İlgili dokümanlar:**
- `docs/issues/2026-05-04-mimari-audit.md`
- `docs/issues/2026-05-06-aktivite-gunlugu-plani.md`
- `docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md`
- `docs/plan.md`
- `CHANGELOG.md`
- `AGENTS.md`
