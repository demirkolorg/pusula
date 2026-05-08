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
| Sprint 1 | ✅ Tamamlandı | 18 / 18 | 2026-05-08 | 2026-05-08 | Güvenlik kritik kapanış |
| Sprint 2 | ✅ Tamamlandı | 16 / 16 | 2026-05-08 | 2026-05-08 | DB index + test |
| Sprint 3 | ✅ Tamamlandı | 19 / 19 | 2026-05-08 | 2026-05-08 | S3-1..S3-6 mega dosya bölme uygulama dahil tamam (ADR-0032) |
| Sprint 4 | ✅ Tamamlandı | 17 / 17 | 2026-05-08 | 2026-05-08 | UX & yarım feature |
| Sprint 5 | ✅ Tamamlandı (kısmi) | 7 / 13 | 2026-05-08 | 2026-05-08 | 6 madde defer (ADR-0034) |
| **TOPLAM** | — | **82 / 88** | — | — | %93 |

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
**Statü:** ✅ Tamamlandı (2026-05-08)

#### 1.1 Rate limiting & brute-force

- [x] **S1-1** Login rate-limit (loginLimiter zaten tanımlı, çağrılmıyor) — ✅ 2026-05-08 · commit `bb428e6`
  - Dosya: `auth.ts:23-49` (authorize callback)
  - `loginLimiter.tryConsume(email.toLowerCase())` argon2.verify ÖNCESİ eklendi
  - IP bazlı ek limit S1-13 (proxy.ts) ile geliyor
- [x] **S1-2** Parola sıfırlama rate-limit + timing-equalize — ✅ 2026-05-08 · commit `54510ab`
  - IP+e-posta hash çift limit (3/dk/IP, 5/saat/email)
  - Sahte branş fake delay (100–300ms)
  - 5 dk aktif token varsa yenisi üretilmiyor
  - E-posta sha256(32-char) ile hash'lenir
- [x] **S1-3** Self-registration rate-limit — ✅ 2026-05-08 · commit `8894fc5`
  - 3/saat/IP `kayitLimiter` action başında

#### 1.2 Dosya yükleme güvenliği

- [x] **S1-4** `yuklemeOnayla`'da magic-byte check — ✅ 2026-05-08 · commit `5445bb6`
  - Yeni helper: `dosyaObjesininIlkBaytlari(yol, bayt)` — partial GET 64KB cap
  - Eşleşme false → bucket'tan obje silinir, oturum HATALI
- [x] **S1-5** SVG için inline render engelleme — ✅ 2026-05-08 · commit `790a8e1`
  - **Karar:** (B) — `INLINE_RENDER_YASAK_MIME` set ile presigned URL'e
    `response-content-disposition=attachment` query param eklenir.
    `presignedDosyaDownload(yol, mime?)` ve `presignedDownload(yol, mime?)`.
- [x] **S1-6** Token URL'lerini path → hash fragment — ✅ 2026-05-08 · commit `b5745a3`
  - Yeni `lib/auth-urls.ts` helper, yeni `/davet` ve `/parola-sifirla/yeni`
    client page'leri (hash'ten token okur, `tokenSorgula` action ile doğrular)
  - Eski `[token]` route'ları client redirect shim (30 gün backward-compat)

#### 1.3 RBAC tutarsızlıkları (ADR-0014)

- [x] **S1-7** Yorum action'ları → granüler izin kodları — ✅ 2026-05-08 · commit `25a6c76`
  - Olustur → `KART_YORUM_YAZ`, Guncelle → `KART_YORUM_KENDI_DUZENLE`,
    Sil → `herhangiBirIzin(KENDI_SIL ∥ BASKA_SIL)`
- [x] **S1-8** `yorumSil` izin kodu düzelt — ✅ 2026-05-08 · commit `94d1844`
  - `PROJE_YETKILI_YONET` → `KART_YORUM_BASKA_SIL`; sahip silmede de
    `KART_YORUM_KENDI_SIL` kontrolü eklendi
- [x] **S1-9** Kontrol listesi action'larına resource-level RBAC — ✅ 2026-05-08 · commit `683b88f`
  - Yeni `kontrolListesininKartId(listeId)` helper; 3 action'a `yetkiZorunluKart`
- [x] **S1-10** `projeArsivleEylem` granüler izin — ✅ 2026-05-08 · commit `248ecf9`
  - `PROJE_DUZENLE` → `PROJE_ARSIVLE`
- [x] **S1-11** Liste action'ları granüler izin — ✅ 2026-05-08 · commit `2555ff6`
  - Guncelle → `LISTE_AD_DUZENLE`, Sirala → `LISTE_SIRALA`

#### 1.4 Diğer güvenlik

- [x] **S1-12** Cron endpoint'lerinde `timingSafeEqual` — ✅ 2026-05-08 · commit `551ee49`
  - Yeni `lib/bearer-auth.ts:bearerTokenEslesiyorMu`; 4 endpoint migrate
- [x] **S1-13** `proxy.ts` origin allowlist — production'da env zorunlu — ✅ 2026-05-08 · commit `4e45f23`
  - Env yoksa: dev → izin, prod → ret
- [x] **S1-14** `/api/log/hata` body size + JSON depth limit — ✅ 2026-05-08 · commit `e85a71c`
  - 64KB hard cap (Content-Length + raw text); JSON derinlik 4 limit
  - `ekstra` field artık primitive | array (sıkı union)
- [x] **S1-15** `EylemHatasi` mesajları sanitize — ✅ 2026-05-08 · commit `eb4ff8d`
  - 9 regex hassas pattern + 500-karakter cap; orijinal log'da kalır
- [x] **S1-16** Notification trigger'larda sessiz catch'leri sarmala — ✅ 2026-05-08 · commit `9e340a7`
  - Yeni `lib/bildirim-guvenli.ts:bildirimGuvenliCagir`; 7 dosyada 22 çağrı migrate
- [x] **S1-17** Security headers (`next.config.ts`) — ✅ 2026-05-08 · commit `bad59c8`
  - Base: nosniff, Frame-DENY, Referrer, Permissions
  - Production: HSTS 2 yıl + CSP (default 'self')
- [x] **S1-18** `seed.ts` production safeguard — ✅ 2026-05-08 · commit `61b32b5`
  - main() başında prod/non-localhost guard, `PUSULA_SEED_PROD_OK=evet` onayı zorunlu

---

### Sprint 2 — Performans & Test Altyapısı (2 hafta)

**Amaç:** Audit middleware amplifikasyonu + FK index'leri + en yüksek-trafik 5 action testi.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ✅ Tamamlandı (2026-05-08)

#### 2.1 Audit & query amplifikasyonu

- [x] **S2-1** Audit middleware ATLA listesini genişlet — ✅ 2026-05-08 · commit `abf74db`
- [x] **S2-2** `kullaniciErisimBilgisi` cache wrap — ✅ 2026-05-08 · commit `e4a986f`
- [x] **S2-3** `superAdminMi` cache wrap — ✅ 2026-05-08 · commit `9ac410e`

#### 2.2 FK index'leri (CONCURRENTLY)

- [x] **S2-4** Migration: FK index'leri eklendi — ✅ 2026-05-08 · commit `d6e38e8`
  - 4 standart + 2 partial index. Production CONCURRENTLY notu migration.sql'de.
  - Plan'ın bahsettiği 17 sayısı agent raporundan; 6 spesifik bulgu uygulandı.

#### 2.3 Pagination & büyük query

- [x] **S2-5** `projedeTumKartlar` hard cap (1000) — ✅ 2026-05-08 · commit `7f764f6`
- [x] **S2-6** `aktiviteBaglamSecenekleriGetir` autocomplete — ✅ 2026-05-08 · commit `9511258`
  - take: 50, opsiyonel `q` arama parametresi
- [x] **S2-7** `bildirimUret` `createManyAndReturn` — ✅ 2026-05-08 · commit `1494ef0`
- [x] **S2-8** `ProjeZiyareti` 1 saatlik throttle — ✅ 2026-05-08 · commit `aaaab8e`

#### 2.4 Action layer test (en yüksek-trafik 5)

- [x] **S2-9..S2-13** 5 dosya × min 4 test = 24 yeni test — ✅ 2026-05-08 · commit `b2e49e2`
  - Pattern: `vi.hoisted` + `vi.mock("@/auth")` + `next/headers` + `lib/hata-kayit` mock'ları
  - Coverage: yetki fail/ok, audit kayıt, Zod validation; CAKISMA/GIRIS_YOK fallback'leri

#### 2.5 ADR-0028 tamamlama (Eklenti → Dosya)

- [x] **S2-14** Kapak görseli `db.eklenti` → `db.dosya` — ✅ 2026-05-08 · commit `ddb5b92`
  - DosyaBaglantisi üzerinden kart kontrolü
- [x] **S2-15** Aktivite servisinde Eklenti ID eşleştirme → Dosya — ✅ 2026-05-08 · commit `d0d1984`
  - `kaynak_tip="Dosya"` da bağlam çıkarımına eklendi
- [x] **S2-16** `Eklenti` tablosu drop planı — ✅ 2026-05-08 · commit `4e78639`
  - ADR-0030 ile 3 fazlı plan: hazırlık (DONE), read-only/gözlem (Sprint 3), drop (Sprint 4)

---

### Sprint 3 — Refactor & DRY (2 hafta)

**Amaç:** En büyük 5 servis dosyasını böl + ortak helper'ları çıkar + duplicate'leri sıfırla.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ✅ Tamamlandı (2026-05-08) — S3-1..S3-6 plan-level (ADR-0032)

#### 3.1 Mega dosya bölme

> **S3-1..S3-6 uygulama tamam (2026-05-08)** — ADR-0032 (commit `59a4fc5`) bölme metodolojisini dökümante etti, ardından dedicated session'da 6 mega dosya barrel pattern ile parçalara ayrıldı. Çağıran kod (~115 dosya) hiç değişmedi; type-check + 100+ birim test geçti.

- [x] **S3-1..S3-6** ADR-0032 mega dosya bölme — ✅ 2026-05-08 · commit `59a4fc5` (plan)
  - **Uygulama dedicated session — barrel + parça dosyalar:**
    - [x] **S3-5** permissions-katalog 1214 → 7 parça + barrel · commit `15e3497`
    - [x] **S3-4** bildirimler/tetikleyiciler 1082 → 8 parça + barrel · commit `38fe232`
    - [x] **S3-3** dosyalar/services 985 → 5 parça + barrel · commit `578ce4f`
    - [x] **S3-2** projeler/[projeId]/services 1350 → 4 parça + barrel · commit `abe5783`
    - [x] **S3-1** aktivite/services 1756 → 6 parça + barrel · commit `967c43b`
    - [x] **S3-6** kanban-pano 814 → 392 + use-kanban-dnd hook 548 (UI/orkestrasyon/pure-logic 3 katman) · commit `1ca8729`
      - Bonus: dosya seviyesi `eslint-disable react-hooks/set-state-in-effect` kaldırıldı (`mounted` → `useSyncExternalStore`, `acikKartId` → URL canonical kaynak)

#### 3.2 Yeni ortak helper'lar

- [x] **S3-7** `lib/zod-helpers.ts` — ✅ 2026-05-08 · commit `b4530cc`
- [x] **S3-8** `lib/tarih-format.ts` — ✅ 2026-05-08 · commit `6e346e6` (helper, kademeli migrate)
- [x] **S3-9** `lib/metin-helpers.ts` — `kisalt()` 3 duplicate silindi — ✅ 2026-05-08 · commit `1bf6141`
- [x] **S3-10** `lib/dosya-bicim.ts` — `boyutBicim()` 2 duplicate silindi + 1 re-export — ✅ 2026-05-08 · commit `107ed93`
- [x] **S3-11** `lib/query-keys.ts` — QK namespace 11 entity grubu — ✅ 2026-05-08 · commit `6199514`
- [x] **S3-12** `lib/action-helpers.ts` — `kullaniciIdAl`, `superAdminZorunlu`; 2 duplicate silindi — ✅ 2026-05-08 · commit `d0c52a2`
- [x] **S3-13** `lib/yetki-erisim.ts` — `kullaniciKaynakKapsami` taşındı — ✅ 2026-05-08 · commit `4d2bc4c`

#### 3.3 Tutarsızlık ve dead code temizliği

- [x] **S3-14** `birimIdAl()` yanlış adlandırma fix — ✅ 2026-05-08 · commit `c94e763`
- [x] **S3-15** `Vurgu` tipi + `VURGU_SINIFLARI` ortak dosya — ✅ 2026-05-08 · commit `3f106c3`
- [x] **S3-16** `oturum.user as { id: string }` helper + 2 örnek migrate — ✅ 2026-05-08 · commit `3d1e425`
  - `lib/oturum.ts:aktifKullaniciId`/`aktifOturumKullanicisi`; kalan 15+ dosya kademeli geçiş
- [x] **S3-17** `console.log/error` → `logger` (3 yer) — ✅ 2026-05-08 · commit `14e32d7`
- [x] **S3-18** `useMutation` ham + ADR-0031 (9 yer kategori A/B) — ✅ 2026-05-08 · commit `bc679ae`
- [x] **S3-19** `key={index}` antipattern fix (3 yer + `_tempId` field) — ✅ 2026-05-08 · commit `91531e7`

---

### Sprint 4 — UX, A11y, Yarım Feature'lar (2 hafta)

**Amaç:** Erişilebilirlik kütüphane seviyesinden patch + yarım kalan feature'ları tamamla.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ✅ Tamamlandı (2026-05-08)

#### 4.1 Erişilebilirlik (kütüphane patching)

- [x] **S4-1** Skip Navigation link — ✅ 2026-05-08 · commit `d722406`
- [x] **S4-2** `prefers-reduced-motion` global CSS — ✅ 2026-05-08 · commit `b80c1a5`
- [x] **S4-3** `<FormField>` helper component — ✅ 2026-05-08 · commit `1775802`
- [x] **S4-4** Dialog/Sheet/Sidebar TR çeviri — ✅ 2026-05-08 · commit `cf5a21f`
- [x] **S4-5** Skeleton `aria-busy` + `role="status"` + sr-only — ✅ 2026-05-08 · commit `6069dc3`
- [x] **S4-6** `<TableHead>` `scope="col"` default — ✅ 2026-05-08 · commit `6069dc3`
- [x] **S4-7** Sonner ikonlara `aria-hidden` — ✅ 2026-05-08 · commit `a5e82e5`
- [x] **S4-8** ThemeToggle `aria-pressed` — ✅ 2026-05-08 · commit `6069dc3`
- [x] **S4-9** kayit-form `role="alert"` + `aria-invalid` — ✅ 2026-05-08 · commit `c93f614`
- [x] **S4-10** Etiket renk algoritması WCAG sRGB linear luminance — ✅ 2026-05-08 · commit `fb23746`
- [x] **S4-11** `:focus-visible { scroll-margin-top: 5rem }` — ✅ 2026-05-08 · commit `b80c1a5`

#### 4.2 Loading & Error boundary granülaritesi

- [x] **S4-12..S4-15** loading + error boundary'ler (4 dosya) — ✅ 2026-05-08 · commit `3d179ea`

#### 4.3 Yarım Feature'lar

- [x] **S4-16** Profil yönetimi — ✅ 2026-05-08 · commit `61f8721`
  - 5 yeni dosya: schemas, services, actions, ProfilForm, ParolaDegistirForm + page güncellemesi
  - argon2.verify mevcut parola + argon2id yeni hash; aria-invalid + role="alert"
- [x] **S4-17** Dead izinler kararı — ✅ 2026-05-08 · commit `bcb0ce2`
  - **Karar:** ADR-0033 hibrit — katalogta tanım kalır (gelecek implement için), varsayılan rol listelerinden çıkarıldı, eski-kod genişletmesi temizlendi.

---

### Sprint 5 — Altyapı & Production Hazırlık (2 hafta)

**Amaç:** Production'da scale ve observability — Redis rate-limiter, monitoring, partitioning, E2E.
**Süre:** 2 hafta
**Sahip:** —
**Statü:** ✅ Tamamlandı (kısmi) — 2026-05-08

> **6 madde implement; 7 madde defer** (ADR-0034) — external altyapı /
> production deploy / E2E test scope'u nedeniyle Sprint 6+ takibinde.

#### 5.1 Rate limiter & multi-pod

- [ ] **S5-1** Redis tabanlı rate limiter — 🚫 defer (ADR-0034)

#### 5.2 Veritabanı

- [ ] **S5-2** `aktivite_logu` partitioning + retention — 🚫 defer (ADR-0034)
- [x] **S5-3** `aciklama_dokuman` JSONB validation — ✅ 2026-05-08 · zaten var (`tiptapDokumanSemasi` `lib/tiptap/schema.ts` Zod superRefine; `kart.guncelle` action schema'sında kullanılıyor)
- [x] **S5-4** Schema CHECK constraint'leri — ✅ 2026-05-08 · commit `5e4d7a4`
  - 8 constraint: tc_kimlik_no regex, Etiket.renk hex, Birim.logo_url URL, char_length cap'leri (Kullanici/Proje/Liste/Kart/Etiket)
- [ ] **S5-5** `Eklenti.boyut` ve `Dosya.boyut` `Int` → `BigInt` — 🚫 defer (ADR-0034) — MVP 100MB limit, future-proofing
- [x] **S5-6** Connection pool config — ✅ 2026-05-08 · commit `567dec9`
  - `docs/deploy/sunucu-kurulum.md` production örneği güncel; `?connection_limit=10&pool_timeout=20&connect_timeout=10`
- [x] **S5-7** Slow query alarm — ✅ 2026-05-08 · commit `bf6bce4`
  - Prisma `emit: "event"` + `client.$on("query")` callback; 500ms eşik (PRISMA_SLOW_THRESHOLD_MS env var ile özelleştirilebilir); Pino `logger.warn` structured log. Sentry/DataDog sink (S5-10) köprüsü hazır.

#### 5.3 Test ve observability

- [ ] **S5-8** Playwright E2E (5 kritik akış) — 🚫 defer (ADR-0034)
- [ ] **S5-9** `@axe-core/playwright` CI WCAG 2.2 AA — 🚫 defer (ADR-0034)
- [ ] **S5-10** Sentry / DataDog entegrasyonu — 🚫 defer (ADR-0034)

#### 5.4 Hijyen & secret prevention

- [x] **S5-11** Pre-commit hook + secret tarayıcı — ✅ 2026-05-08 · commit `9a11896`
  - `simple-git-hooks` paketi + `scripts/check-secrets.mjs` (8 pattern)
  - Production'da gitleaks/trufflehog ile değiştirilmesi önerilir
- [x] **S5-12** ESLint `no-console` rule — ✅ 2026-05-08 · commit `0eedf4a`
  - error level; warn/error istisna; lib/logger + seed + scripts + socket-server + tests override
- [x] **S5-13** `lib/db.ts` üstüne `import "server-only"` — ✅ 2026-05-08 · commit `58e241e`

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
