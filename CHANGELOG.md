# Değişiklik Günlüğü

[Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) formatına uyulur. Sürümler [Semantic Versioning](https://semver.org/lang/tr/).

## [Yayınlanmamış]

### Eklenen
- `lib/yetki.ts` — resource-level RBAC (proje/liste/kart için `can*` policy katmanı, `ProjeUyesi` entegrasyonu).
- `lib/rate-limit.ts` — in-memory token bucket (login/davet/upload/log limit).
- `proxy.ts` — Next 16 yeni middleware konvansiyonu (eski `middleware.ts` taşındı).
- `.nvmrc`, `package.json#engines`, `packageManager` — Node 22 LTS + Bun 1.3+ sözleşmesi.
- `.github/workflows/ci.yml` — typecheck + lint + test + build pipeline.
- `CHANGELOG.md` — bu dosya.
- `docs/adr/0002..0005` — mimari audit kararları.
- `docs/issues/2026-05-04-mimari-audit.md` — dış mühendis audit raporu.

### Değişen
- `auth.config.ts` — cookie `sameSite: "strict"`.
- `/api/log/hata` — auth zorunlu, origin allowlist, rate limit.
- Proje/liste/kart `services.ts` — tüm fonksiyonlar `kullaniciId` alır, `yetkiZorunluKaynak` çağırır.
- `kullanicilar-istemci.tsx`, `kurum-form.tsx` — `useOptimisticMutation` ile sarıldı.
- `useMobile` → `useBreakpoint() === 'mobile'` (tek kaynak).
- Sonner toast position: mobile `top-center`, desktop `top-right`.
- `tsconfig.json` — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` açık, `allowJs: false`.
- E2E `tablet-chromium` → `tablet-webkit` rename, `getByRole` semantik locator.
- İngilizce sızıntılar Türkçe (`Projects` → `Projeler`, `More` → `Daha fazla`).
- `docs/plan.md` — Next 15 → Next 16 güncellemesi.
- `README.md` — Pusula'ya özgü yeniden yazıldı (Bun, port 2500).

### Düzeltilen
- Drag-drop infinite loop (`useEvent` + memoize edilmiş data + module-level constraints).
- LexoRank "0" alfabe tabanı çarpması — server-side rebalance + retry.
- Drop sonrası soldan akma — `transition: null` iki katmanda.
- Cross-list placeholder eksik — pointer-aware `kartDropKonumuHesapla`.
- Veri kaybı — `baslangicSnapshotRef` + `onDragCancel` manuel rollback.
- Resource-level yetki bypass — `lib/yetki.ts` (KVKK riski kapatıldı).

### Kontrol Skill
- Kural 145 — Major version upgrade sonrası 24 saat içinde plan + README güncel.
- Kural 146 — Resource-level RBAC her aksiyon için zorunlu (`can*` kontrolü).
- Kural 147 — Public POST endpoint'leri auth + rate limit + origin allowlist'siz YASAK.

## [0.1.0] — 2026-05-03 (Initial S0-S3)

### Eklenen
- S0: Next.js 16 + Bun + Prisma + NextAuth + shadcn/ui + TanStack Query/Table altyapı.
- S1: Auth (giriş/kayıt/davet/parola sıfırla) + kullanıcı/kurum CRUD.
- S2: RBAC izin matrisi + audit log + hata logu + denetim sayfaları.
- S3: Proje + Liste + Kart CRUD + Trello tarzı kanban + drag-drop + liste görünümü.
- Optimistic UI altyapısı (`useOptimisticMutation` + LexoRank + temp-id).
- Test altyapısı (Vitest + Testing Library + Playwright + 151 test).
- Kontrol skill — 144 mimari kural (`.claude/skills/kontrol/SKILL.md`).
