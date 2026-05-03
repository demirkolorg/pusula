---
name: kontrol
description: Pusula (kaymakamlık görev yönetimi) projesinin tüm geliştirme süreci kuralları. Modül geliştirme, kod yazma, test, commit, deploy adımlarında uyulması zorunlu 106 kural. Bu skill her kod yazımı/düzenlemesi/PR öncesinde devreye girer ve kuralları enforce eder.
---

# Kontrol — Pusula Geliştirme Kuralları

> Bu projede yapılan **her geliştirme adımı** bu kurallara uymak zorundadır.
> Kuralların gerekçesi `docs/plan.md` Bölüm 1.5'te. Bu skill aktifken aşağıdakiler **enforce** edilir.

## Ne Zaman Tetiklenir

- Yeni modül/özellik geliştirme başlamadan önce
- Kod yazılırken / dosya oluşturulurken
- Test yazılırken
- Commit / PR öncesi
- Deploy / release öncesi
- Yeni bağımlılık eklenirken
- Refactoring sırasında

## Uygulama Şekli

1. İş başlamadan önce ilgili kategorideki kuralları **kullanıcıya hatırlat**
2. Kod yazarken kurallara aykırı durumu görürsen **DURDUR**, gerekçeyle birlikte alternatif öner
3. Bir kural ihlali kullanıcı tarafından açıkça onaylanırsa istisna olarak geçer ama `docs/adr/` altına neden istisna yapıldığı yazılır
4. PR öncesi **Modül DONE Kriteri** (Bölüm O/91) checklist'i tek tek doğrulanır

---

## A. Paket & Araç Yönetimi

1. **Bun zorunlu** — `bun install`, `bun add`, `bun run`, `bun x`. `npm/pnpm/yarn` YASAK.
2. **package-lock.json / yarn.lock / pnpm-lock.yaml** repoya GİRMEZ — sadece `bun.lockb`.
3. **Node sürüm sabit** — `.nvmrc` ve `package.json#engines`.
4. **Bağımlılık eklemeden önce sor** — yeni paket = yeni saldırı yüzeyi. CVE kontrol et.

## B. Dil & Lokalleştirme

5. **Tüm UI metni Türkçe** — `Kaydet`, `Sil`, `Bekleniyor`, `Yükleniyor...` (İngilizce sızıntı yasak).
6. **Identifier'lar Türkçe** (slug-style) — dosya/klasör/route/DB tablosu/CSS class:
   - Klasör: `panolar/`, `kartlar/`, `bildirimler/`
   - Route: `/ayarlar/birimler` (NOT `/settings/units`)
   - Tablo: `kart`, `pano_uyesi` (NOT `card`, `board_member`)
   - **Function/var ASCII (Türkçesini İngilizce yaz)** → `getCard`, `createCard` (kod identifier'ları İngilizce, görünen her şey Türkçe)
7. **i18n hazırlığı** — string'ler component içinde hard-code edilmez, `lib/i18n/tr.ts` üzerinden gelir.
8. **Tarih/saat formatı** — `Intl.DateTimeFormat('tr-TR')`, `Europe/Istanbul` timezone, `dd.MM.yyyy HH:mm`.

## C. Mobile-First

9. **Tasarım önce 360px** — her component PR'ı 360px screenshot ile gelir.
10. **Tailwind: default = mobile**, sonra `sm:`/`md:`/`lg:` ile büyüt. Desktop-first negation YASAK.
11. **Hit target ≥ 44×44px** (Apple HIG).
12. **Drag-drop:** dnd-kit `TouchSensor` + `PointerSensor` her zaman birlikte. Long-press 250ms.
13. **Modal yerine Sheet** — mobilde `vaul` (alttan), desktop'ta center modal.
14. **Bottom nav** mobilde, **sidebar** desktop'ta.
15. **Tablolar yasak mobilde** — card-based liste'ye düş.
16. **`useBreakpoint()` hook'u tek kaynaktır** — magic number kullanma.
17. **Playwright her testi 3 viewport'ta** — `mobile: 375x667`, `tablet: 768x1024`, `desktop: 1440x900`.

## D. Komponent & UI

18. **shadcn/ui temel** — kendi component yazmadan önce shadcn'de var mı kontrol et.
19. **Mikro bileşen** — bir component max 200 satır, max 3 prop varyantı. Daha büyükse böl.
20. **Tek sorumluluk** — UI component sadece UI; data fetch/business logic hook veya server component'e.
21. **Server Component default** — `'use client'` sadece interaktiviteye ihtiyaç olunca.
22. **Form: react-hook-form + Zod** — başka form lib'i yok. `@hookform/resolvers/zod`.
23. **State: server-state için TanStack Query**, **client-state için Zustand**. Redux/MobX yasak.
    - Query key konvansiyon: `['kart', kartId]`, `['panolar', { filtre }]` — array-based, hiyerarşik.
    - `staleTime: 30s` default; realtime gelen tablolarda `Infinity` + manuel invalidation.
    - Optimistic update + rollback: mutation `onMutate`/`onError` çiftiyle.
23a. **Tablo: TanStack Table (headless)** + shadcn `<DataTable>` wrapper. AG Grid, MUI DataGrid yasak.
    - Kullanım: kullanıcı listesi, birim listesi, audit log, hata log, denetim, eklenti listesi.
    - Mobile'de tablo değil card-list (Kural 15) — `useBreakpoint()` ile dallandır.
    - Server-side sorting/filtering/pagination zorunlu (50+ satır).
    - Kolon görünürlüğü, sıralama, sıkıştırma (density), kolon yeniden sıralama desteklenir.
23b. **Liste virtualization: @tanstack/virtual** — 100+ item için zorunlu (Kural 96 ile uyumlu).
24. **className: `cn()` helper** ile birleştir (`clsx + tailwind-merge`).
25. **Tema:** `next-themes`, `dark:` Tailwind variant. CSS variable üzerinden renk.
26. **İkon: lucide-react** tek lib. Karışım yasak.

## E. Klasör & Dosya Yapısı

27. **Özellik bazlı (feature-folder)** — `app/(panel)/panolar/{api.ts, schemas.ts, services.ts, hooks/, components/}`.
28. **Tek Next.js app** — monorepo değil (B-Ç18).
29. **Dosya max 400 satır** — 800 hard limit. Aşıyorsa böl.
30. **Function max 50 satır**, nesting max 4 seviye.
31. **Index.ts barrel re-export sadece public API için** — gereksiz barrel yasak.
32. **Test dosyası komşu** — `kart.tsx` yanında `kart.test.tsx`.

## F. TypeScript

33. **Strict mode açık** — `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
34. **`any` yasak** — gerçekten gerekli ise `unknown` + tip daraltma.
35. **Tip türetme** — `z.infer<typeof Schema>`, Prisma `Prisma.KartGetPayload<...>`. El ile interface yazma.
36. **`as` cast yasak** — `satisfies` veya tip daraltma kullan.
37. **Function dönüş tipi yazılır** — public API'lerde explicit, lokal helper'larda inference OK.

## G. Veritabanı & Prisma

38. **Migration: `prisma migrate dev`** — manuel SQL yasak (özel durum hariç).
39. **Migration ASLA elle düzenlenmez** — yanlışsa yeni migration yaz.
40. **Soft delete** — kritik tablolarda `silindi_mi` + `silinme_zamani`. Çöp kutusu için.
41. **Tüm tablolarda** — `id` (uuid), `olusturma_zamani`, `guncelleme_zamani`.
42. **Audit middleware her yazımı yakalar** (plan Bölüm 1.5/B). Bypass için özel flag gerekir.
43. **N+1 yasak** — Prisma `include`/`select` veya DataLoader pattern.
44. **Index ekle** — sıkça filtrelenen kolonlara, FK'lere, `(siralama_kolonu) DESC` patterns.
45. **Transaction** — birden fazla yazma varsa `prisma.$transaction([...])` zorunlu.
46. **Connection pool** — Postgres'e `pgbouncer` veya Prisma `connection_limit` ayarı.
47. **Migration'da downtime yasak** — büyük tablo değişikliği için multi-step (önce add, sonra migrate, sonra drop).

## H. Server Actions / API

48. **Server Action default** — REST endpoint sadece dışarıya açılan veya 3rd-party callback için.
49. **Tüm girdi Zod ile validate edilir** — server tarafında, client validation güvenlik DEĞİL.
50. **RBAC kontrol her action başında** — `await yetkiKontrol(user, 'kart:edit', kartId)`.
51. **Throttle/rate-limit** — login, davet, eklenti upload, search'te zorunlu.
52. **Hata response standardı:**
    ```ts
    type Sonuc<T> =
      | { basarili: true; veri: T }
      | { basarili: false; hata: string; kod: string; alanlar?: Record<string, string> }
    ```
53. **Try/catch tüm action'larda** — yakalanan hata `HataLogu`'na yazılır, kullanıcıya kibar mesaj döner.

## I. Realtime (Socket.io)

54. **Socket event ismi konvansiyon** — `kart:olustur`, `kart:tasi`, `pano:guncelle` (kebab-case namespace + iki nokta + fiil).
55. **Yetki socket seviyesinde** — kullanıcı sadece üyesi olduğu pano room'larına subscribe olabilir.
56. **Optimistic update** — UI önce güncellenir, server reddederse Sonner ile geri al + rollback.
57. **Reconnection** — bağlantı koparsa `toast.bilgi("Çevrimdışı...")`, geri gelince state senkronu çalışır.

## J. Audit & Hata Logu

58. **Hiçbir kod yolu Audit'i bypass edemez** — Prisma middleware + DB trigger çift güvence.
59. **Hassas alan maskeleme** — `parola`, `mfa_secret`, `auth header`, kart bilgileri JSON içinde `***` ile maskelenir.
60. **request_id propagation** — `X-Request-Id` her isteğe; audit log + hata log + frontend toast hep aynı ID.
61. **Hata seviyesi: FATAL/ERROR otomatik bildirim** — yöneticiye in-app + (v2: e-posta).
62. **Frontend error boundary her route segment'inde** — `error.tsx` her klasörde.

## K. Bildirim (Sonner + Bildirim Merkezi)

63. **Geçici → Sonner**, **kalıcı → `Bildirim` tablosu**. İkisi karışmaz.
64. **`lib/toast.ts` wrapper'ı dışında `toast()` çağrısı yasak** — `toast.basari/hata/bilgi/uyari/gerial`.
65. **Undo desteği zorunlu** — silme, arşivleme, taşıma gibi geri alınabilir aksiyonlarda 5sn `gerial` toast.
66. **Throttle** — aynı tip 5+ ardışık toast → tek özet.

## L. Güvenlik

67. **Hardcoded secret yasak** — `.env`, `process.env` ile, başlatmada validation.
68. **Parola: argon2id** — bcrypt değil. NextAuth credentials'ta override.
69. **CSRF: SameSite=Strict cookie + double-submit token** Server Action'larda.
70. **XSS: DOMPurify** — markdown/HTML render eden her yerde.
71. **SQL injection: Prisma raw query yasak** — gerekirse `Prisma.sql\`...\`` template literal.
72. **Upload:** mime/extension whitelist + boyut limit + virüs scan (v2: ClamAV) + presigned URL.
73. **Rate limit:** login (5/dk/IP), davet (3/dk/user), upload (10/dk/user).
74. **HTTPS only** — Cloudflare proxy + HSTS header.
75. **Content-Security-Policy** header — strict, MinIO origin'i whitelist'te.

## M. Test

76. **TDD** — yeni feature/bug fix için önce test (RED → GREEN → REFACTOR).
77. **Coverage ≥ %80** — yeni kodda zorunlu, mevcut için aşamalı.
78. **Test piramidi:** unit > integration > E2E. E2E sadece kritik akışlar.
79. **Test isimlendirme Türkçe** — `it('kart silinince çöp kutusuna gider')`.
80. **Mock yasak** — DB için `pg-mem` veya gerçek test DB. Mock'lar gerçeği gizler.
81. **Seed data: faker-tr** — Türkçe isim, adres.
82. **E2E: Playwright** — 3 viewport, kritik akış: giriş → pano → kart → drag → yorum → çıkış.

## N. Git & Commit

83. **Commit format:** `<tip>(<scope>): <açıklama>` — tip: feat/fix/refactor/docs/test/chore/perf/ci, açıklama Türkçe.
84. **Commit modüler** — bir commit = bir mantıksal birim. "WIP" commit yasak.
85. **Branch:** `feature/<modul>-<kisa-aciklama>`, `fix/<bug-id>`, `refactor/<ne>`.
86. **PR önce verifier'dan geçer** — build + test + lint + typecheck + security scan.
87. **Yorum: WHY**, kod: WHAT. Comment yazıyorsan kodun isimleri yetersiz demektir.
88. **`--no-verify` YASAK** — pre-commit hook hatası varsa root cause'u çöz.

## O. Modül Geliştirme Akışı

89. **Modül sırası önceden belirlenir** — bugün hangi modül? PR'da scope dışına çıkma.
90. **Her modül 5 katmandan oluşur:**
    1. `schemas.ts` (Zod) → validation contract
    2. `services.ts` (Prisma + business) → DB işlemleri
    3. `api.ts` (Server Action) → istemci köprüsü
    4. `hooks/` (TanStack Query) → state
    5. `components/` (UI) → görünüm
91. **Modül DONE kriteri:**
    - [ ] Schema yazıldı
    - [ ] Service yazıldı + unit test
    - [ ] API yazıldı + integration test
    - [ ] UI yazıldı + 360px screenshot
    - [ ] Audit log akıyor
    - [ ] Hata logu akıyor
    - [ ] Sonner toast'lar bağlı
    - [ ] Yetki kontrolü var
    - [ ] E2E happy path geçiyor
    - [ ] Code review PASS
92. **Bir modül bitmeden diğerine geçme** — yarım modül çürür.
93. **Layout S0'da kurulur ve dondurulur** — sonraki modüllerde layout'a dokunma.

## P. Performans

94. **Image: next/image** — her görsel optimize.
95. **Bundle analizi haftalık** — `next-bundle-analyzer`.
96. **List virtualization** — 100+ item olan liste için `@tanstack/virtual`.
97. **Pagination/cursor** — server'dan max 50 kayıt çekilir.
98. **Cache:** `unstable_cache` Next.js, Redis v2'ye.
99. **Lighthouse mobile ≥ 90** her release'de.

## Q. Dokümantasyon

100. **Her modülün `README.md`'si var** — public API + örnek kullanım.
101. **CHANGELOG.md** — Keep a Changelog formatı, Türkçe.
102. **ADR (Architecture Decision Record)** — `docs/adr/NNNN-<karar>.md` her büyük teknik karar için.
103. **`docs/plan.md` güncel kalır** — sapma olunca güncellenir.

## R. CI/CD

104. **CI step'leri:** install → typecheck → lint → unit test → build → integration test → E2E (kritik) → security scan.
105. **Main'e direkt push yasak** — PR + review zorunlu.
106. **Production deploy manuel onay** — `shipper` agent ile pre-deploy checklist.

---

## Kural İhlali Davranışı

| Durum | Tepki |
|-------|-------|
| Kural ihlali tespit edildi | **DURDUR**, kuralı söyle, alternatif öner |
| Kullanıcı ihlali bilerek istedi | `docs/adr/` altına gerekçe yazıp devam et |
| Kural belirsiz / çatışma var | Kullanıcıya sor, karar plana yaz |
| Yeni durum, hiçbir kural kapsamamış | Geçici karar al, oturum sonu skill'e ekleme öner |

## İlgili Dosyalar

- `docs/plan.md` — proje planı, çekirdek ilkeler (Bölüm 1.5)
- `docs/adr/` — mimari karar kayıtları
- `CHANGELOG.md` — sürüm notları
- `.claude/skills/kontrol/SKILL.md` — bu dosya
