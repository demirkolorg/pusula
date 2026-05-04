---
name: kontrol
description: Pusula (kaymakamlık görev yönetimi) projesinin tüm geliştirme süreci kuralları. Modül geliştirme, kod yazma, test, commit, deploy adımlarında uyulması zorunlu 143 kural. Bu skill her kod yazımı/düzenlemesi/commit/push öncesinde devreye girer ve kuralları enforce eder.
---

# Kontrol — Pusula Geliştirme Kuralları

> Bu projede yapılan **her geliştirme adımı** bu kurallara uymak zorundadır.
> Kuralların gerekçesi `docs/plan.md` Bölüm 1.5'te. Bu skill aktifken aşağıdakiler **enforce** edilir.

## Ne Zaman Tetiklenir

- Yeni modül/özellik geliştirme başlamadan önce
- Kod yazılırken / dosya oluşturulurken
- Test yazılırken
- Commit / push öncesi
- Deploy / release öncesi
- Yeni bağımlılık eklenirken
- Refactoring sırasında

## Uygulama Şekli

1. İş başlamadan önce ilgili kategorideki kuralları **kullanıcıya hatırlat**
2. Kod yazarken kurallara aykırı durumu görürsen **DURDUR**, gerekçeyle birlikte alternatif öner
3. Bir kural ihlali kullanıcı tarafından açıkça onaylanırsa istisna olarak geçer ama `docs/adr/` altına neden istisna yapıldığı yazılır
4. Commit öncesi **Modül DONE Kriteri** (Bölüm O/91) checklist'i tek tek doğrulanır

---

## A. Paket & Araç Yönetimi

1. **Bun zorunlu** — `bun install`, `bun add`, `bun run`, `bun x`. `npm/pnpm/yarn` YASAK.
2. **package-lock.json / yarn.lock / pnpm-lock.yaml** repoya GİRMEZ — sadece `bun.lockb`.
3. **Node sürüm sabit** — `.nvmrc` ve `package.json#engines`.
4. **Bağımlılık eklemeden önce sor** — yeni paket = yeni saldırı yüzeyi. CVE kontrol et.

## B. Dil & Lokalleştirme

5. **Tüm UI metni Türkçe** — `Kaydet`, `Sil`, `Bekleniyor`, `Yükleniyor...` (İngilizce sızıntı yasak).
6. **Identifier'lar Türkçe** (slug-style) — dosya/klasör/route/DB tablosu/CSS class:
   - Klasör: `projeler/`, `kartlar/`, `bildirimler/`
   - Route: `/ayarlar/birimler` (NOT `/settings/units`)
   - Tablo: `kart`, `proje_uyesi` (NOT `card`, `project_member`)
   - **Function/var ASCII (Türkçesini İngilizce yaz)** → `getCard`, `createCard` (kod identifier'ları İngilizce, görünen her şey Türkçe)
7. **i18n hazırlığı** — string'ler component içinde hard-code edilmez, `lib/i18n/tr.ts` üzerinden gelir.
8. **Tarih/saat formatı** — `Intl.DateTimeFormat('tr-TR')`, `Europe/Istanbul` timezone, `dd.MM.yyyy HH:mm`.

## C. Mobile-First

9. **Tasarım önce 360px** — her component commit'i 360px screenshot ile gelir.
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
    - Query key konvansiyon: `['kart', kartId]`, `['projeler', { filtre }]` — array-based, hiyerarşik.
    - `staleTime: 30s` default; realtime gelen tablolarda `Infinity` + manuel invalidation.
    - **Optimistic update default (Bölüm S, Kural 107-116) — server-state mutate eden her hook bunu zorunlu kılar.**
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

27. **Özellik bazlı (feature-folder)** — `app/(panel)/projeler/{api.ts, schemas.ts, services.ts, hooks/, components/}`.
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
50a. **Makam katmanı validation** — `Kullanici.birim_id = null` sadece şu rollerde geçerli: `SUPER_ADMIN`, `KAYMAKAM`. `BIRIM_AMIRI` ve `PERSONEL` için birim ZORUNLU (Zod refine reddetsin). Yetki kontrolünde `KAYMAKAM`/`SUPER_ADMIN` rolleri birim filtresini her zaman atlar.
51. **Throttle/rate-limit** — login, davet, eklenti upload, search'te zorunlu.
52. **Hata response standardı:**
    ```ts
    type Sonuc<T> =
      | { basarili: true; veri: T }
      | { basarili: false; hata: string; kod: string; alanlar?: Record<string, string> }
    ```
53. **Try/catch tüm action'larda** — yakalanan hata `HataLogu`'na yazılır, kullanıcıya kibar mesaj döner.

## I. Realtime (Socket.io)

54. **Socket event ismi konvansiyon** — `kart:olustur`, `kart:tasi`, `proje:guncelle` (kebab-case namespace + iki nokta + fiil).
55. **Yetki socket seviyesinde** — kullanıcı sadece üyesi olduğu proje room'larına subscribe olabilir.
56. **Optimistic update default (bkz. Bölüm S)** — UI önce güncellenir, server reddederse Sonner ile geri al + rollback. Realtime echo'lar `request_id` ile filtrelenir (kendi event'ini yoksay).
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
82. **E2E: Playwright** — 3 viewport, kritik akış: giriş → proje → kart → drag → yorum → çıkış.

## N. Git & Commit

83. **Commit format:** `<tip>(<scope>): <açıklama>` — tip: feat/fix/refactor/docs/test/chore/perf/ci, açıklama Türkçe.
84. **Commit modüler** — bir commit = bir mantıksal birim. "WIP" commit yasak.
85. **Branch açma — main'e direkt commit + push.** Solo workflow; PR/feature branch akışı kaldırıldı. İstisna: kullanıcı açıkça "branch aç" derse.
86. **Push önce verifier'dan geçer** — build + test + lint + typecheck + security scan. Local commit OK olsa da `git push` öncesi verifier ZORUNLU.
87. **Yorum: WHY**, kod: WHAT. Comment yazıyorsan kodun isimleri yetersiz demektir.
88. **`--no-verify` YASAK** — pre-commit hook hatası varsa root cause'u çöz.

## O. Modül Geliştirme Akışı

89. **Modül sırası önceden belirlenir** — bugün hangi modül? Commit serisinde scope dışına çıkma.
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
    - [ ] **Tüm mutation'lar `useOptimisticMutation()` ile (Kural 107-116)** + 3 test (happy/server-fail/timeout)
    - [ ] **Fast 3G throttle altında etkileşim < 100ms görünür sonuç** (Kural 115)
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
105. **Production deploy manuel onay** — `shipper` agent ile pre-deploy checklist.

## S. Optimistic UI (Anında Tepki — ZORUNLU MİMARİ)

> Felsefe: Kullanıcı **asla** sunucu beklemez. Tıkla → gör → (arka planda doğrula). Spinner sadece ilk yükleme + dosya upload + login için. Detay: `docs/plan.md` Bölüm 1.5/F.

107. **Tüm server-state mutation'ları optimistic** — Kart, liste, proje, yorum, etiket, tarih, kontrol maddesi, üye atama, reaksiyon, isim değiştirme, sıralama, silme, arşivleme, geri yükleme. İstisnalar: Kural 113.
108. **`useOptimisticMutation()` wrapper kullan** — `lib/optimistic.ts` üzerinden. Çıplak `useMutation` + el yazımı `onMutate` yasak (helper kullanmadan tutarsız rollback olur). Wrapper imzası:
     ```ts
     useOptimisticMutation({
       queryKey,           // invalidate edilecek key(ler)
       mutationFn,         // server action
       optimistic: (vars, oldData) => newData,  // pure update fonksiyonu
       hataMesaji: 'Kart güncellenemedi',       // toast.hata aciklamasi
     })
     ```
     Wrapper otomatik: `cancelQueries` → snapshot → setQueryData → onError rollback + Sonner → onSettled invalidate.
109. **Geçici ID üretimi** — yeni kayıtlar `temp-<nanoid>` ile başlar; sunucudan gerçek ID dönünce `setQueryData` ile swap. Geçici ID görünür her yerde (drag handle, link, route) bu swap'a hazır olmalı (`router.replace` veya transparent ref).
110. **Sıralama değişiklikleri fractional indexing** — `LexoRank` veya `between(prev, next)` ile. Drag-drop sırasında yarım pozisyon hesabı client'ta yapılır, server doğrular. Server reddederse **sadece etkilenen kart** geri döner, tüm kanban yeniden çizilmez.
111. **Optimistic state görsel olarak ayırt edilmez** — soluk/italik/spinner KULLANMA. Kullanıcı farkı hissederse optimistic değildir. Sadece **fail durumunda** kart köşesinde küçük `⚠` ikonu + tooltip "Senkronize edilemedi, tekrar dene" + "Tekrar Dene" butonu.
112. **Çevrimdışı kuyruk** — TanStack Query `networkMode: 'offlineFirst'`, mutation kuyruğu otomatik. Çevrimdışıyken `toast.bilgi("Çevrimdışısınız, değişiklikler bağlantı gelince gönderilecek")` (tek toast, throttled).
113. **Optimistic YASAK olan aksiyonlar** — Login, parola değiştir, MFA setup, eklenti dosya upload (metadata optimistic, dosya değil), ödeme/onay (MVP'de yok), toplu işlem 50+ kayıt (kullanıcıya batch progress göster). Bu listede olmayan her aksiyon optimistic'tir.
114. **Realtime echo filtresi** — Socket.io kendi event'ini yoksay (server `request_id` bazlı emit eder, frontend kendi `request_id`'sini eşleştirip drop eder). Yoksa optimistic update + echo update → çift uygulama bug'ı çıkar.
115. **Test ZORUNLU — her optimistic mutation 3 test:**
     - happy path (server kabul, UI = expected)
     - server 400/500 → rollback + toast.hata
     - network timeout (5sn) → rollback + toast.hata
     E2E (Playwright): "fast 3G" throttle altında etkileşim < 100ms görünür sonuç.
116. **Audit log korunur** — Optimistic UI sadece **client UX**'tir; server tarafında Audit middleware (Kural 42) her zaman gerçek transaction'ı kaydeder. Optimistic state audit'e yazılmaz, sadece final state.

## T. Drag-Drop Mimarisi (dnd-kit + Trello UX — ZORUNLU PATTERN)

> Kanban tarzı her drag-drop sayfası bu kuralları izler. S3 kanban-pano kararlarından çıkarıldı; gelecekteki tüm drag-drop özelliklerinde (örn. çoklu liste, kart hiyerarşisi) referans.
>
> **Felsefe:** Trello davranışı = "drop ANINDA değil, drag SIRASINDA hedef bul". Cache cancel'lanmaz, görsel feedback state ile verilir.

### T.1 — Saf Logic Ayrımı

117. **DnD logic UI'dan ayrı saf modüle yazılır** — `<sayfa>/components/<sayfa>-dnd.ts` (saf fonksiyonlar, React'siz). Drop konum hesabı, hedef tipi belirleme, reorder helper'ları burada. UI bileşeni sadece event'leri buraya delege eder.
   - Örnek: [`app/(panel)/projeler/[projeId]/components/kanban-dnd.ts`](app/(panel)/projeler/[projeId]/components/kanban-dnd.ts)
   - Fonksiyonlar: `hedefTipi`, `xxxDropKonumuHesapla`, `xxxKonumaTasi`, `xxxTasimasiDegistirirMi`
   - **Test ZORUNLU** — saf fonksiyonlar olduğu için DOM/dnd-kit gerekmez, doğrudan unit test (`<sayfa>-dnd.test.ts`).

### T.2 — Pointer-Aware Drop Pozisyonu (Trello Davranışı)

118. **Cross-list drop sona ekleme YASAK** — kullanıcının hedef kartın hangi yarısına geldiğine göre `index` (üst yarı) veya `index+1` (alt yarı) seç. Dnd-kit'in `getEventCoordinates(activatorEvent) + e.delta` ile pointer Y hesaplanır, hedef kartın `over.rect`'iyle karşılaştırılır.
   ```ts
   function pointerKartinAltYarisindaMi(pointerY, overRect): boolean {
     return pointerY > overRect.top + overRect.height / 2;
   }
   ```
   "Sadece sona ekleyebilirim" UX'i kabul edilemez.

### T.3 — Cache Mutation Drag Esnasında YASAK

119. **`onDragOver` cache mutate ETMEZ** — `setQueryData` drag esnasında çağrılırsa React Query subscriber zinciri + dnd-kit re-render zinciri infinite loop'a girer. Bunun yerine **lokal component state** ile placeholder/transient gösterilir; cache sadece `onDragEnd`'de tek seferde güncellenir.
   - dragOver: `setKartPlaceholder({ liste_id, index, yukseklik })` (sadece görsel)
   - dragEnd: `istemci.setQueryData(...)` + `mutation.mutate(...)` (kalıcı)

### T.4 — Idempotent State Setter (Re-Render Spam Önleme)

120. **`setState` aynı içerik için referans değiştirmez** — pointer dragOver'da titrediğinde aynı pozisyona art arda set tetiklenir. Setter callback ile guard:
   ```ts
   setKartPlaceholder((onceki) => {
     if (
       onceki?.liste_id === sonraki?.liste_id &&
       onceki?.index === sonraki?.index
     ) return onceki;  // referans aynı kalsın → re-render yok
     return sonraki;
   });
   ```
   Pointer 1px hareketinde `over.id` kart A↔B alternation yapsa bile aynı insertion point'e karşılık geliyorsa state değişmez.

### T.5 — Stable Handler Referansları

121. **DndContext event handler'ları `useEvent` ile sarılır** — `@dnd-kit/utilities`'ten **resmi `useEvent`** kullan. Manuel `useStableHandler` yazma — dnd-kit'in kendi useEvent'i context ile uyumlu.
   ```ts
   import { useEvent } from "@dnd-kit/utilities";
   const dragBaslatStable = useEvent(dragBaslat);
   const dragUzerindeStable = useEvent(dragUzerinde);
   const dragBittiStable = useEvent(dragBitti);
   const dragIptalStable = useEvent(dragIptal);
   ```
   useCallback yetmez (deps her render'da yeni → yeni referans). useEvent kalıcı stable + içerik güncel.

### T.6 — Stable Data/Sensor Referansları

122. **`useSortable.data`, `useDroppable.data` `useMemo` ile, sensor opsiyonları MODÜL SEVİYESİNDE sabit:**
   ```ts
   // Modül seviyesi (component dışı):
   const POINTER_OPS = { activationConstraint: { distance: 5 } } as const;
   const TOUCH_OPS = { activationConstraint: { delay: 200, tolerance: 8 } } as const;
   const KEY_OPS = { coordinateGetter: sortableKeyboardCoordinates } as const;
   const MODIFIERS = [restrictToWindowEdges];

   // Component içi:
   const sortableData = useMemo(() => ({ tip: "kart", liste_id: id }), [id]);
   ```
   Aksi halde dnd-kit her render'da yeni referans diff'leyip internal state güncelliyor → infinite loop.

### T.7 — Transition İki Katmanda Disable (Drop Akma Engeli)

123. **Sortable transition iki katmanda kapatılır** — sadece `style.transition` yetmez:
   ```ts
   // 1. Hook seviyesi: dnd-kit kendi transition üretmesin
   useSortable({ ..., transition: null });
   // 2. Render seviyesi: garantile
   const stil = { transform, transition: "none" };  // listeler için
   const stil = { transform, transition: active ? sortable.transition : "none" };  // kartlar için
   ```
   Drop'ta cache anında doğru sırada → eski pozisyondan yeniye akma görseli istenmez.

### T.8 — Veri Kaybı Koruması (`baslangicSnapshotRef`)

124. **dragBaslat'ta orijinal cache snapshot al, hata/iptal'de manuel restore** — `useOptimisticMutation` wrapper'ı snapshot'ı `onMutate` anında alır; eğer dragOver cache mutate ediyorsa snapshot BOZUK olur. Çözüm:
   ```ts
   const baslangicSnapshotRef = useRef<Detay | null>(null);
   // dragBaslat:
   baslangicSnapshotRef.current = istemci.getQueryData(anahtar) ?? null;
   // baslangicaDon:
   if (snap) istemci.setQueryData(anahtar, snap);
   // dragBitti mutation:
   mutation.mutate(vars, { onError: baslangicaDon, onSuccess: () => snapshotRef.current = null });
   ```
   `onDragCancel={dragIptalStable}` da ZORUNLU — drag iptal edilirse cache geri yüklenir.

### T.9 — Tek Root + Conditional İçerik (Sortable Re-Init Önleme)

125. **`useSortable` döndürdüğü `setNodeRef`'i farklı DOM düğümlerine bağlamak YASAK** — `if (isDragging) return <X ref={setNodeRef}>...; return <Y ref={setNodeRef}>...` her render'da farklı node bağlar → dnd-kit state set eder → infinite loop. **TEK root** + içerik conditional:
   ```tsx
   return (
     <div ref={sortable.setNodeRef} ...>
       {ruyaModu ? <Placeholder /> : <NormalIcerik />}
     </div>
   );
   ```

### T.10 — Custom Collision Detection (Multi-Container Pattern)

126. **Aktif item tipine göre dinamik collision detection** — kart sürüklerken sadece kart+liste-body, liste sürüklerken sadece liste hedeflenir. Kart için dnd-kit multi-container pattern'i:
   ```ts
   if (aktifTip === "kart") {
     // 1. Pointer hangi liste-body'sinde? (pointerWithin + rectIntersection fallback)
     const pointerListe = pointerWithin(...) ?? rectIntersection(...);
     if (!pointerListe) return [];
     // 2. O liste içindeki kartlardan closestCenter
     return closestCenter({ ..., droppableContainers: oListedeKartlar });
   }
   ```
   `pointerWithin` tek başına kart kenarlarında titreme yapar; `closestCenter` aktif item merkezine göre stable.

### T.11 — Placeholder Bileşeni — Kartlar Arasına Render

127. **Drop placeholder kartlar arasına `index` bazlı render edilir** — boyut korumalı, tutarlı:
   ```tsx
   function KartDropPlaceholder({ yukseklik }) {
     return (
       <div
         className="border-primary/60 bg-primary/5 box-border rounded-md border border-dashed p-2"
         style={yukseklik ? { height: yukseklik } : undefined}
         aria-hidden
       >
         <div className="invisible"><span>&nbsp;</span></div>
       </div>
     );
   }

   {kartPlaceholder?.index === 0 && <KartDropPlaceholder yukseklik={kartPlaceholder.yukseklik} />}
   {liste.kartlar.map((k, index) => (
     <Fragment key={k.id}>
       <KartMini ... />
       {kartPlaceholder?.index === index + 1 && <KartDropPlaceholder yukseklik={kartPlaceholder.yukseklik} />}
     </Fragment>
   ))}
   ```
   - `box-border` + sabit yükseklik = aktif kartla aynı boy → layout shift yok
   - `aria-hidden` + invisible content = screen reader'ı kirletmez

### T.12 — Server-Side LexoRank Rebalance

128. **`siraArasi` "0" alfabe tabanına çarpınca otomatik rebalance** — sürekli liste başına ekleme LexoRank tabanına ulaşır. Server-side fonksiyonlar (`kartiTasi`, `listeyeSiraVer`, `projeyeSiraVer`) try/catch içinde rebalance + retry yapar:
   ```ts
   try {
     yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
   } catch (err) {
     if (err instanceof Error && err.message.includes("alfabe tabanı")) {
       await ilgiliRebalance(...);  // Tüm öğelere M, T, Z... yeni sira ata
       const yeni = await komsulariOku();
       yeniSira = siraArasi(yeni.onceki?.sira, yeni.sonraki?.sira);
     } else throw err;
   }
   ```
   Mevcut sıralama korunur, sadece sira string'leri yeniden dağıtılır. Kullanıcı hata görmez.

### T.13 — Granüler Yetki Tipi (Tek Boolean YASAK)

129. **Drag-drop sayfasında `yetkili: boolean` YASAK** — granüler tip kullanılır:
   ```ts
   export type KanbanYetkileri = {
     listeOlustur: boolean;
     listeDuzenle: boolean;
     listeSil: boolean;
     kartOlustur: boolean;
     kartTasi: boolean;
   };
   ```
   page.tsx'te server-side `izinVarMi(...)` ile her bir yetki ayrı hesaplanıp prop olarak geçer. UI dropdown'da/buton'da ilgili yetki ile koşullu render.

### T.14 — Saf Fonksiyonlar Test Edilir

130. **`<sayfa>-dnd.test.ts` ZORUNLU** — Tur 1 altyapı testleri seviyesinde unit testler:
   - `kartDropKonumuHesapla` happy path (üst yarı / alt yarı / liste-body / boş liste)
   - `kartiKonumaTasi` reorder doğruluğu (kaynak çıkarma + hedef ekleme)
   - `kartTasimasiDegistirirMi` aynı yer false / farklı liste true
   - `hedefTipi` 3 durum (kart, liste, liste-body)

   Bu testler dnd-kit/jsdom gerektirmez — saf JS, hızlı ve flaky değil.

## U. Genel Mimari İlkeler (Tüm Sayfa/Modüllerde Geçerli)

> Bölüm T (drag-drop) kararlarından genelleştirilen, tüm modüllerde uyulması zorunlu mimari prensipleri. Yeni bir özellik tasarlarken bu kurallar **önce** referans alınır.

### U.1 — İş Mantığı UI'dan Ayrı

131. **Saf iş mantığı `<modül>-logic.ts` veya `<modül>-helper.ts` modülüne ayrılır** — React'siz, side-effect'siz, deterministik fonksiyonlar. UI bileşeni sadece bu fonksiyonları çağırır + sonucu render eder. Örnekler:
   - Drop konum hesabı: `kanban-dnd.ts`
   - Filtre/arama logic: `arama-helper.ts`
   - Form validation logic: schema'da (Zod refine)
   - Sıralama/gruplama: pure helper

   **Sebep:** test edilebilirlik (DOM/jsdom gereksiz), yeniden kullanılabilirlik, bug izolasyonu (UI bug'ı vs logic bug'ı ayırma).

### U.2 — Resmi Araçları Manuel Hack'lere Tercih Et

132. **Kütüphanenin resmi yardımcısı varsa kendi yazma** — `useStableHandler` yerine `@dnd-kit/utilities/useEvent`, manuel debounce yerine `lodash-es/debounce`, custom localeCompare yerine `Intl.Collator`. Resmi araçlar edge case'leri çözmüş, bakımsız kalmaz.

   **Anti-pattern:** "Bu hook'u kendim yazayım, basit görünüyor" → 3 ay sonra resmi versiyon eklenir, senin'ki bakımsız kalır.

### U.3 — Idempotent State Setter

133. **Aynı içerik için referans değiştirme — `setState` callback ile guard:**
     ```ts
     setX((onceki) => {
       if (eskiVeYeniAyniIcerik(onceki, yeni)) return onceki;
       return yeni;
     });
     ```
     Yüksek frekanslı event'lerde (drag, scroll, resize, mousemove, input) re-render spam'ini absorb eder. **`Object.is` referans karşılaştırma yetmez** — derin içerik karşılaştırması.

### U.4 — Stable Referans, Memoize Veya Modül-Sabit

134. **Aşağıdaki durumlarda obje/array referansı **stable** olmalı:**
   - Bir hook'a `data`, `options`, `config` olarak veriliyorsa → `useMemo([deps])`
   - Bir context/provider'a prop olarak veriliyorsa → `useMemo` veya `useCallback`
   - Hiç değişmeyecekse → **modül seviyesi sabit** (component dışı `const`)
   - Bir kütüphane prop diff yapıyorsa (DnD, ReactQuery key, formik fields) → kesin stable

   **Kural:** "Her render'da yeni obje yaratma — bunu kim okuyacak, ona ne yapacak?" diye sor.

### U.5 — Cache Mutation Yüksek Frekanslı Event'lerde YASAK

135. **TanStack Query cache (`setQueryData`) yüksek frekanslı event handler'larda çağrılmaz:**
   - `onMouseMove`, `onScroll`, `onDragOver`, `onResize` içinde **cache mutate ETME**
   - Cache değişikliği subscriber zinciri (re-render dalgası) tetikler → infinite loop riski
   - Bunun yerine **lokal component state** ile transient gösterim, cache sadece "commit" event'lerinde (`onClick`, `onDragEnd`, `onSubmit`)

### U.6 — Stable Event Handler Pattern (`useEvent`)

136. **DnD context, observer-based kütüphaneler, debounce/throttle wrapper'larında `useEvent` pattern:**
     ```ts
     // useCallback yetmez (deps her render değişiyorsa)
     const handlerStable = useEvent(handler);
     ```
     Kalıcı stable referans + içerik güncel. dnd-kit'in `@dnd-kit/utilities` resmi `useEvent`'i öncelikli; başka kütüphane verilmediyse manuel pattern (ref + render-time assignment).

### U.7 — Veri Kaybı Koruması (Snapshot + Rollback)

137. **Optimistic mutation'lara EK olarak `dragBaslat`/`formAcil`/`islemBasla` anında orijinal snapshot al** — eğer mutation'dan ÖNCE cache değişikliği yapılıyorsa (transient state veya başka kullanıcı eylemi), wrapper'ın otomatik rollback'i bozuk snapshot'a döner. Çözüm:
   ```ts
   const baslangicSnapshotRef = useRef(null);
   // İşlem öncesi:
   baslangicSnapshotRef.current = istemci.getQueryData(anahtar);
   // Hata/iptal:
   istemci.setQueryData(anahtar, baslangicSnapshotRef.current);
   ```
   `onCancel`/`onIptal` handler'ı **ZORUNLU** — kullanıcı vazgeçerse bile cache temiz kalmalı.

### U.8 — Granüler Yetki Tipi (Boolean YASAK)

138. **`yetkili: boolean` prop'u sadece tek-aksiyon component'lerde kabul** — birden fazla aksiyon (oluştur, düzenle, sil, taşı, paylaş) içeren component'lerde **granüler yetki objesi** kullan:
     ```ts
     export type ModulYetkileri = {
       olustur: boolean;
       duzenle: boolean;
       sil: boolean;
       paylasim: boolean;
       // ...
     };
     ```
   page.tsx'te server-side `izinVarMi(...)` ile her bir yetki ayrı hesaplanır, prop olarak iletilir. UI'da koşullu render her aksiyon için ayrı kontrol.

   **Sebep:** "Düzenleyebiliyor ama silemez" gibi gerçek hayat senaryoları boolean ile ifade edilemez.

### U.9 — Saf Fonksiyon Test ZORUNLU

139. **`<modül>-logic.ts` / `<modül>-helper.ts` / `<modül>-dnd.ts` için unit test ZORUNLU** — saf fonksiyonlar olduğu için test maliyeti düşük, fayda yüksek. Tur 1 altyapı testleri seviyesinde:
   - Happy path (her dal için en az 1 test)
   - Edge case'ler (boş input, sınır değerler, null/undefined)
   - Hata yolları (throw/return değer kontrolleri)

   Component (UI) testlerine ihtiyaç olmadan logic doğruluğu garantilenir.

### U.10 — Server-Side Self-Healing (Otomatik Onarım)

140. **Algoritmik sınırlara ulaşıldığında server otomatik onarım yapar** — kullanıcıya hata göstermek yerine:
   - LexoRank "0" tabanı çarpması → rebalance + retry
   - Connection pool tükenmesi → exponential backoff retry
   - Stale lock → timeout sonrası release + retry
   - Partial transaction failure → rollback + idempotency key ile retry

   Pattern:
   ```ts
   try {
     return await islemiYap();
   } catch (err) {
     if (onarilabilirHata(err)) {
       await onarimUygula();
       return await islemiYap();
     }
     throw err;
   }
   ```
   **Audit log'a `onarım yapıldı` event'i yazılır** — invisible failure değil, observable self-healing.

### U.11 — Yüksek Frekanslı Event'lerde Layout Shift YASAK

141. **Drag, hover, focus, expand/collapse gibi sürekli tetiklenen state değişiklikleri layout shift YAPMAZ:**
   - Placeholder bileşenleri **boyut korumalı** (sabit height/width veya görünmez içerik)
   - Scrollbar gizleme/gösterme yerine `scrollbar-gutter: stable`
   - Skeleton'lar gerçek içeriğin boyutuyla aynı
   - Animation'lar `transform` kullanır, `width`/`height` değil (compositor-only)

   **CLS (Cumulative Layout Shift) metriği < 0.1** Lighthouse'ta zorunlu.

### U.12 — Kütüphane Re-Init Önleme

142. **Kütüphane context'lerine geçen prop'ların stabilitesi kontrol edilir:**
   - Event handler'lar → `useEvent` veya `useCallback` doğru deps
   - Config objeleri → `useMemo` veya modül-sabit
   - Sensör/observer/listener'ların opsiyonları → modül-sabit

   **Belirti:** "infinite loop", "Maximum update depth", "context kept re-initializing", performance düşüşü.
   **Test:** React DevTools Profiler ile component re-render count > 1/saniye ise inceleme yap.

### U.13 — Snapshot + Replay Pattern

143. **Geri alınabilir aksiyonlar (silme, taşıma, düzenleme) için snapshot tut:**
   - Aksiyondan ÖNCE → `snapshotRef.current = state.clone()`
   - Aksiyon başarılı → `snapshotRef.current = null`
   - Aksiyon başarısız / kullanıcı vazgeçti → `state.replace(snapshotRef.current)`

   Sonner `gerial` toast (Kural 65) ile birleşir: kullanıcı 5sn içinde "Geri Al" tıklarsa snapshot replay edilir.

### U.14 — Workflow / Long Operation: Cancel Token Zorunlu

144. **Uzun süren işlemler (drag, file upload, batch operation, animasyon) için iptal mekanizması:**
   - DnD: `onDragCancel` handler ZORUNLU
   - Upload: AbortController + cancel button
   - Batch: progress + "Durdur" butonu
   - Animasyon: `cancelAnimationFrame` cleanup

   **Pattern:** State'e `iptal` flag'i veya `AbortSignal` ile alt seviye operasyonlar erken çıkış. Kullanıcı her zaman vazgeçebilmeli.

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
- `.Codex/skills/kontrol/SKILL.md` — bu dosya
