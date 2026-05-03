---
tarih: 2026-05-04
tip: mimari-audit
durum: aksiyona-alindi
---

# Mimari Audit — 2026-05-04

> Dış mühendis incelemesi sonrası tespit edilen 9 kritik konu. Her madde için aksiyon, ADR ve commit referansı aşağıda.

## Doğrulama Özeti (incelemede)

- `bun run build` — geçti, Next 16 `middleware → proxy` deprecated uyarısı.
- `bun x tsc --noEmit` — geçti.
- `bun run lint` — 0 hata, 7 uyarı (React Compiler + RHF.watch + TanStack Table).
- `bun run test` — 12 dosya, 198 test geçti.
- `bun run e2e` — 8 geçti, 11 başarısız, 5 atlandı.

## Bulgular ve Aksiyonlar

### 1. Mimari sözleşme ↔ gerçek ayrışması
**Bulgular:** Plan Next 15 yazıyor, gerçek 16.2.4. README boilerplate. `.nvmrc`, `engines`, CI, CHANGELOG yok.
**Aksiyon:** Plan + README + `.nvmrc` + `package.json#engines` + `packageManager` + CI workflow + `CHANGELOG.md` eklendi.
**ADR:** [`0002-mimari-audit-2026-05-04.md`](../adr/0002-mimari-audit-2026-05-04.md)

### 2. Next 16 `proxy.ts` migration
**Bulgular:** `middleware.ts` deprecated, Next 17'de kaldırılabilir.
**Aksiyon:** `middleware.ts → proxy.ts`, matcher kapsamı güvenlik için genişletildi.
**ADR:** [`0003-next16-proxy-migration.md`](../adr/0003-next16-proxy-migration.md)

### 3. Güvenlik katmanı
**Bulgular:** Cookie `sameSite: "lax"`, `/api/log/hata` public + rate-limit yok.
**Aksiyon:** `SameSite=Strict`, in-memory rate limit (`lib/rate-limit.ts`), origin allowlist, `/api/log/hata` auth zorunlu.
**ADR:** [`0004-guvenlik-omurgasi.md`](../adr/0004-guvenlik-omurgasi.md)

### 4. Resource-level RBAC (KRİTİK)
**Bulgular:** Sadece `kurum_id` kontrolü → kurum içi tüm projelerin tüm kartlarına erişim.
**Aksiyon:** `lib/yetki.ts` (`canProje`/`canKart`/`canListe`), `ProjeUyesi` entegrasyonu, services refactor.
**ADR:** [`0005-resource-level-rbac.md`](../adr/0005-resource-level-rbac.md)

### 5. Audit "çekirdek garanti" değil
**Bulgular:** Prisma extension app-level, DB trigger yok, audit yazımı swallow ediyor.
**Aksiyon:** Postgres trigger eklendi (defense-in-depth), audit yazım failure now FATAL log, batch ops için diff helper.
**Not:** `tsvector` arama altyapısı tam migration olarak ayrı sprint'e (S6 plan).

### 6. Optimistic UI tutarsızlığı
**Bulgular:** `kullanicilar-istemci` çıplak `useMutation`, `kurum-form` invalidate-only.
**Aksiyon:** Her ikisi de `useOptimisticMutation` ile sarıldı, gerçek optimistic insert eklendi.

### 7. E2E sinyalleri
**Bulgular:** `tablet-chromium` adı yanıltıcı, locator kırılgan, sıralama-bağımlı assertion.
**Aksiyon:** Project rename `tablet-webkit`, semantik locator (`getByRole`) geçişi.

### 8. TS sıkılığı
**Bulgular:** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` yok.
**Aksiyon:** İkisi de açıldı, çıkan hatalar düzeltildi. `allowJs: false`.

### 9. i18n + tasarım
**Bulgular:** `lib/i18n/tr.ts` ölü, İngilizce sızıntı (`Projects`, `More`), Sonner sabit `top-right`, iki breakpoint hook.
**Aksiyon:** İngilizce sızıntılar Türkçeye çevrildi, Sonner mobile/desktop ayrımı, `useMobile` → `useBreakpoint() === 'mobile'`.

## Süre

Toplam tahmin: ~10-13 iş günü. Tek session'da tamamlandı (otomasyon).
