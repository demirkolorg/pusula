# B-Ç18 — Proje Yapısı ve Bileşen Stratejisi

> **Çıktı No:** B-Ç18
> **Sahip:** Mimar + Ön Yüz Geliştirici
> **Öncelik:** **YÜKSEK — KRİTİK KARAR**
> **Bağlı Kararlar:** B-9 (yeniden tanımlandı), Altay projesi referansı
> **Tarih:** 2026-05-01
> **Durum:** **YAPI KİLİTLENDİ — bu belgeye AYKIRI hiçbir değişiklik kabul edilmez**

---

## 1. ZORUNLU İLKELER (BAĞLAYICI)

> Bu belgenin maddeleri **kuraldır**. Yeni dosya/klasör/bileşen oluşturulurken bu maddelere uyumluluk **şarttır**. Aykırı kod **kabul edilmez**.

### 1.1. Tek Next.js Projesi (Çoklu Uygulama YOK)

❌ **YASAK:**
- `apps/web/`, `apps/admin/`, `apps/api/` gibi çoklu uygulama yapısı
- Turborepo / Nx çoklu uygulama yönetimi
- `packages/ui`, `packages/shared` gibi dahili paketler

✅ **ZORUNLU:**
- **Tek bir Next.js (App Router) projesi**
- Kök dizin doğrudan Next.js projesidir (`package.json` köke ait)
- API, ön yüz, paylaşılan kod **aynı proje içinde** ama mantıksal olarak ayrılmış

### 1.1.1. Paket Yöneticisi: BUN (ZORUNLU)

❌ **YASAK:**
- `npm`, `pnpm`, `yarn` (hiçbiri kullanılmaz — `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` deposunda yer almaz)

✅ **ZORUNLU:**
- **Bun** (https://bun.sh) — paket yöneticisi + çalıştırıcı
- Lock dosyası: `bun.lockb` (binary)
- Tüm `package.json` script'leri Bun ile çalışır
- CI/CD (GitHub Actions) Bun kullanır (`oven-sh/setup-bun@v1`)
- Geliştirici makinelerinde Bun kurulu olmak zorunda

**Kurulum:**
```bash
# Linux / macOS
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Doğrulama
bun --version  # >= 1.1.x
```

**Faydalar (gerekçe):**
- 10-20 kat daha hızlı `install`
- Yerleşik TypeScript/JSX çalıştırıcı (`bun run *.ts` doğrudan)
- Yerleşik test çalıştırıcı (`bun test`)
- Yerleşik bundler ve paket yöneticisi
- Daha düşük `node_modules` boyutu

### 1.2. API Yol Öbeği ile Ayrım

API, Next.js App Router'ın `app/api/` yol öbeği içinde yaşar. Ayrı süreç/sunucu değildir.

```
app/
├── (auth)/           ← Yol öbeği: kimlik akışları (URL'de görünmez)
├── (dashboard)/      ← Yol öbeği: uygulama (URL'de görünmez)
└── api/              ← Yol öbeği: REST uç noktaları
    └── v1/
        └── ...
```

> **Altay projesi referansı:** Aynı yapı (`(auth)/`, `(dashboard)/`, `api/`) PUSULA'da kullanılır.

### 1.3. Özellik Bazlı (Feature-Based) Organizasyon

❌ **YASAK:**
- Yatay (kategori) bölme: `components/`, `pages/`, `services/`, `models/` gibi her şeyin tipine göre ayrılması
- "Tüm form bileşenleri tek klasörde", "tüm tablo bileşenleri tek klasörde" yaklaşımı (paylaşılanlar hariç — bkz. §2)

✅ **ZORUNLU:**
- Her özellik (`projeler`, `gorevler`, `derkenarlar`, `vekalet`, vb.) **kendi klasörüne** sahiptir
- Bir özelliğin **bütün** kodu (sayfa, bileşen, kanca, tip, şema, sunucu eylemi, yardımcı) o klasörde toplanır
- Yapıya bakar bakmaz **özelliğin nerede yaşadığı** anlaşılır

### 1.4. Mikro Bileşen Felsefesi (KRİTİK)

> *"Her şey küçük, tek sorumluluklu, yeniden kullanılabilir bileşenlerden oluşur."*

❌ **YASAK:**
- 200 satırı aşan tek bileşen dosyası (zorunlu sınır)
- Tek bileşen içinde 5+ JSX bölümünün gömülü olması
- "Tanrı bileşen" — props yığını + iç içe koşullar
- Aynı JSX bloğunun 2+ yerde tekrar etmesi (DRY ihlali)

✅ **ZORUNLU:**
- Her bileşen **tek bir iş** yapar
- Maksimum **150 satır** kod (boşluk + yorum hariç)
- Bileşim (composition) > yapılandırma (configuration)
- 2+ kullanılabileceği fark edilen her parça mikro bileşen olarak çıkartılır

### 1.5. Yeniden Kullanılabilirlik Kuralı

| Kullanım | Konum |
|---|---|
| Yalnız 1 özellikte kullanılıyor | `app/(dashboard)/<özellik>/components/` |
| 2+ özellikte kullanılıyor | Kök `components/` |
| Shadcn UI primitive uzantısı | `components/ui/` |
| Genel desen (DataTable, EmptyState) | Kök `components/` |

**Yükseltme akışı:** Bir bileşen önce özellik içinde başlar; **ikinci özellik** ihtiyaç duyduğunda kök `components/` altına **taşınır** (kopyalanmaz).

---

## 2. KÖK DİZİN YAPISI

```
pusula/
├── app/                              # ★ Next.js App Router
│   ├── (auth)/                       # Yol öbeği — kimlik
│   │   ├── giris/
│   │   ├── parola-sifirla/
│   │   └── otp-dogrula/
│   ├── (dashboard)/                  # Yol öbeği — uygulama
│   │   ├── layout.tsx                # ortak çatı (sidebar/header)
│   │   ├── ana-sayfa/                # özellik
│   │   ├── projeler/                 # özellik
│   │   ├── gorevler/                 # özellik
│   │   ├── derkenarlar/              # özellik
│   │   ├── yorumlar/                 # özellik
│   │   ├── dosyalar/                 # özellik
│   │   ├── vekalet/                  # özellik
│   │   ├── bildirimler/              # özellik
│   │   ├── audit/                    # özellik
│   │   ├── kullanicilar/             # özellik
│   │   ├── birimler/                 # özellik
│   │   ├── kalip/                    # görev kalıpları (Evre 3)
│   │   ├── arama/                    # genel arama (Evre 2)
│   │   └── ayarlar/                  # özellik
│   ├── api/                          # ★ REST API
│   │   └── v1/
│   │       ├── kimlik/
│   │       ├── projeler/
│   │       ├── gorevler/
│   │       ├── derkenarlar/
│   │       ├── vekalet/
│   │       ├── bildirimler/
│   │       ├── dosyalar/
│   │       ├── arama/
│   │       └── ...
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── loading.tsx
│   ├── globals.css
│   └── layout.tsx                    # kök layout (HTML/body)
│
├── components/                       # ★ PAYLAŞIMLI (mikro)
│   ├── ui/                           # Shadcn primitives + uzantı
│   ├── data-table/                   # genel tablo (TanStack Table)
│   ├── form/                         # form mikro bileşenleri (RHF + Zod)
│   ├── feedback/                     # empty/error/loading
│   ├── layout/                       # sidebar, header, breadcrumb
│   ├── navigation/                   # menüler
│   ├── badges/                       # SLA, rol, durum
│   ├── progress/                     # ilerleme çubuğu
│   ├── search/                       # Ctrl+K command-search
│   ├── drawer/                       # off-canvas sağ çekmece
│   └── theme/                        # tema değiştirici
│
├── lib/                              # ★ Genel altyapı/yardımcılar
│   ├── auth/                         # better-auth yapılandırma
│   ├── prisma/                       # singleton istemci + ara katman
│   ├── permissions/                  # izin denetleyici (B-Ç12)
│   ├── event-bus/                    # olay yolu (B-Ç10)
│   ├── storage/                      # depolama soyutlaması
│   ├── email/                        # eposta soyutlaması
│   ├── audit/                        # Prisma denetim ara katmanı
│   ├── search/                       # arama hizmeti (B-Ç17)
│   ├── utils/                        # ortak yardımcılar
│   └── validations/                  # ortak Zod şemaları
│
├── hooks/                            # ★ Genel React kancaları
│   ├── use-permission.ts
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   ├── use-toast.ts
│   └── use-current-user.ts
│
├── types/                            # ★ Paylaşılan TS tipleri
│   ├── api.ts
│   ├── events.ts
│   ├── domain.ts
│   └── enums.ts
│
├── prisma/                           # ★ Veritabanı şeması
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts
│   └── ara-katmanlar/                # yumuşak silme + denetim
│
├── public/                           # ★ Statik varlıklar
│
├── e2e/                              # ★ Playwright sınamaları
│
├── tests/                            # ★ Birim + tümleşim
│
├── scripts/                          # ★ Bakım betikleri
│   ├── denetim-arsivle.ts
│   └── ...
│
├── altyapi/                          # ★ Dağıtım yapılandırması
│   ├── docker/
│   ├── nginx/
│   └── bulut/
│
├── .github/
│   └── workflows/
│
├── docs/                             # ★ Belgeler
│
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── bun.lockb
└── README.md
```

---

## 3. ÖZELLİK KLASÖR ŞABLONU (ZORUNLU)

Her `app/(dashboard)/<özellik>/` klasörü bu şablonu izler:

```
<özellik>/
├── page.tsx                          # liste/ana sayfa
├── layout.tsx                        # özellik layout (opsiyonel)
├── loading.tsx                       # iskelet
├── error.tsx                         # hata sınırı
│
├── [kimlik]/                         # detay sayfası (opsiyonel)
│   ├── page.tsx
│   ├── duzenle/
│   │   └── page.tsx
│   └── components/                   # detay'a özel
│
├── yeni/                             # oluşturma sayfası
│   └── page.tsx
│
├── components/                       # bu özelliğe özel bileşenler
│   ├── <özellik>-list.tsx
│   ├── <özellik>-form.tsx
│   ├── <özellik>-card.tsx
│   ├── <özellik>-detail-drawer.tsx
│   └── ...
│
├── hooks/                            # bu özelliğe özel kancalar
│   ├── use-<özellik>.ts              # CRUD kancası
│   └── use-<özellik>-list.ts
│
├── actions.ts                        # Next.js Server Actions
├── api.ts                            # istemci API çağrıları
├── schemas.ts                        # Zod şemaları
├── types.ts                          # özellik tipleri
└── utils.ts                          # özellik yardımcıları
```

### 3.1. Örnek: `app/(dashboard)/gorevler/`

```
gorevler/
├── page.tsx                          # /gorevler — liste
├── loading.tsx
├── [kimlik]/
│   ├── page.tsx                      # /gorevler/{id} — detay (opsiyonel; varsayılan drawer)
│   └── components/
├── yeni/
│   └── page.tsx                      # /gorevler/yeni
├── components/
│   ├── gorev-list.tsx                # ana tablo
│   ├── gorev-row.tsx                 # tek satır
│   ├── gorev-form.tsx                # ekle/düzenle formu
│   ├── gorev-detail-drawer.tsx       # sağ çekmece
│   ├── gorev-status-select.tsx       # durum değiştirici
│   ├── gorev-onay-modal.tsx          # onay doğrulama
│   ├── gorev-red-modal.tsx           # red gerekçe modal
│   ├── gorev-bulk-actions-bar.tsx    # toplu işlem
│   ├── gorev-altgorev-list.tsx
│   └── gorev-baglilik-list.tsx
├── hooks/
│   ├── use-gorev.ts                  # tek görev yükleme
│   ├── use-gorev-list.ts             # liste sorgusu (TanStack Query)
│   ├── use-gorev-mutations.ts        # CRUD mutasyonları
│   └── use-gorev-actions.ts          # onaya sun, onayla, reddet
├── actions.ts                        # server actions (form submit)
├── api.ts                            # fetcher wrappers (TanStack Query)
├── schemas.ts                        # Zod: GörevOluşturİstegi, vb.
├── types.ts                          # özellik tipleri
└── utils.ts                          # SLA hesabı, durum metni vb.
```

### 3.2. Örnek: `app/(dashboard)/derkenarlar/`

```
derkenarlar/                          # özellik (Evre 3'te aktif)
├── components/
│   ├── derkenar-list.tsx             # bir görevdeki derkenarlar
│   ├── derkenar-card.tsx             # tek derkenar (KARAR/UYARI/ENGEL/BİLGİ)
│   ├── derkenar-editor.tsx           # zengin metin düzenleyici
│   ├── derkenar-tip-badge.tsx        # tip rozeti (mavi/turuncu/kırmızı/yeşil)
│   ├── derkenar-pin-toggle.tsx
│   ├── derkenar-version-history.tsx  # sürüm geçmişi
│   └── derkenar-form-modal.tsx
├── hooks/
│   ├── use-derkenarlar.ts
│   └── use-derkenar-mutations.ts
├── actions.ts
├── schemas.ts
├── types.ts
└── utils.ts
```

> **Not:** Derkenarlar genelde başka bir özelliğin (görev) sağ çekmecesinde **gömülü** kullanılır. Ama yine de **kendi özellik klasörü** vardır — bileşenleri bu klasörden **import** edilir.

---

## 4. PAYLAŞIMLI BİLEŞENLER (KÖK `components/`)

### 4.1. Yapı

```
components/
├── ui/                               # Shadcn primitives (kopyalanan)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx                     # off-canvas çekmece
│   ├── command.tsx                   # cmdk (Ctrl+K)
│   ├── popover.tsx
│   ├── dropdown-menu.tsx
│   ├── badge.tsx
│   ├── toast.tsx                     # sonner sarmalayıcı
│   ├── input-otp.tsx                 # OTP girişi (F-1)
│   ├── progress.tsx
│   ├── skeleton.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   └── ...
│
├── data-table/                       # genel tablo
│   ├── data-table.tsx                # ana bileşen
│   ├── data-table-toolbar.tsx        # arama + süzgeç
│   ├── data-table-pagination.tsx
│   ├── data-table-column-header.tsx
│   ├── data-table-row-actions.tsx    # satır aksiyon menüsü
│   ├── data-table-bulk-bar.tsx       # toplu seçim çubuğu
│   ├── data-table-faceted-filter.tsx # çoklu seçim filtre
│   └── types.ts
│
├── form/                             # form mikro bileşenleri
│   ├── form-field.tsx                # RHF + Label + ErrorMessage sarması
│   ├── form-input.tsx
│   ├── form-textarea.tsx
│   ├── form-select.tsx
│   ├── form-date-picker.tsx          # resmi tatil takvimi farkında
│   ├── form-multi-select.tsx
│   ├── form-checkbox.tsx
│   ├── form-radio-group.tsx
│   ├── form-rich-text.tsx            # Tiptap sarması (Evre 3)
│   ├── form-file-upload.tsx
│   └── form-error.tsx
│
├── feedback/                         # geri bildirim mikro bileşenleri
│   ├── empty-state.tsx               # boş durum
│   ├── error-boundary.tsx
│   ├── error-page.tsx
│   ├── loading-spinner.tsx
│   ├── loading-skeleton.tsx
│   └── confirmation-dialog.tsx       # genel onay modal
│
├── layout/                           # genel düzen
│   ├── sidebar.tsx
│   ├── sidebar-item.tsx              # mikro
│   ├── header.tsx
│   ├── header-search.tsx             # üst çubuk arama
│   ├── header-notifications.tsx      # üst çubuk bildirim simgesi
│   ├── header-user-menu.tsx
│   ├── breadcrumb.tsx
│   ├── page-header.tsx               # sayfa başlığı + aksiyon
│   └── container.tsx
│
├── navigation/
│   ├── tabs-nav.tsx
│   └── back-button.tsx
│
├── badges/                           # rozet mikro bileşenleri
│   ├── sla-badge.tsx                 # 🟢🟡🔴
│   ├── role-badge.tsx                # YÖNETİCİ/MÜDÜR/PERSONEL
│   ├── status-badge.tsx              # görev/proje durumu
│   ├── priority-badge.tsx
│   └── tag-badge.tsx
│
├── progress/
│   ├── progress-bar.tsx              # % yüzde gösteren
│   └── circular-progress.tsx
│
├── search/                           # genel arama (B-Ç17, Evre 2)
│   ├── command-search.tsx            # Ctrl+K modali
│   ├── command-search-results.tsx
│   └── search-result-item.tsx
│
├── drawer/                           # off-canvas çekmece çatısı
│   ├── detail-drawer.tsx             # genel sağ çekmece çatısı
│   └── drawer-tabs.tsx
│
├── avatar/
│   ├── user-avatar.tsx
│   └── avatar-group.tsx
│
├── theme/
│   └── theme-toggle.tsx
│
└── kbd/
    └── keyboard-shortcut.tsx         # ⌘K görseli
```

### 4.2. `data-table` Detayı (Mikro Bileşim Örneği)

```tsx
// components/data-table/data-table.tsx — KÖK BİLEŞEN (~120 satır)
export function DataTable<T>({ columns, data, ...props }: Props<T>) {
  return (
    <div>
      <DataTableToolbar />
      <Table>{/* ... */}</Table>
      <DataTablePagination />
    </div>
  )
}

// Her parça AYRI dosyada, AYRI bileşen, mikro.
// Tüketici (özellik) sadece <DataTable columns={...} data={...} /> çağırır.
```

### 4.3. `form` Detayı

```tsx
// components/form/form-input.tsx — ~40 satır mikro
export function FormInput({ control, name, label, ...props }: Props) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...field} {...props} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  )
}
```

Tüketici:

```tsx
<FormInput control={form.control} name="başlık" label="Başlık" />
<FormInput control={form.control} name="açıklama" label="Açıklama" />
```

---

## 5. NE NEREYE GİDİYOR — KARAR AĞACI

```
Yeni bir kod yazıyorum
        │
        ▼
Bu kod bir bileşen mi?
   ├─ Evet ──▶ Hangi özelliğe özel?
   │            ├─ Tek özellik ──▶ app/(dashboard)/<özellik>/components/
   │            ├─ 2+ özellik   ──▶ components/<kategori>/
   │            └─ Shadcn primitive ──▶ components/ui/
   │
   └─ Hayır ──▶ Bu kod nedir?
              ├─ Sayfa rotası ──▶ app/(dashboard)/<özellik>/page.tsx
              ├─ API uç noktası ──▶ app/api/v1/<kaynak>/route.ts
              ├─ Server Action ──▶ app/(dashboard)/<özellik>/actions.ts
              ├─ Zod şeması ──▶ özelliğe özelse <özellik>/schemas.ts
              │                  paylaşılan ise lib/validations/
              ├─ Yardımcı fonk ──▶ özelliğe özelse <özellik>/utils.ts
              │                    paylaşılan ise lib/utils/
              ├─ React kanca ──▶ özelliğe özelse <özellik>/hooks/
              │                  paylaşılan ise hooks/
              ├─ Tip ──▶ özelliğe özelse <özellik>/types.ts
              │           paylaşılan ise types/
              ├─ Altyapı ──▶ lib/<altyapı>/  (auth, prisma, audit, ...)
              └─ Veritabanı ──▶ prisma/
```

---

## 6. ADLANDIRMA KURALLARI (BAĞLAYICI)

### 6.1. Dosya Adları

| Tip | Stil | Örnek |
|---|---|---|
| Bileşen dosyası | `kebab-case.tsx` | `gorev-list.tsx`, `data-table.tsx` |
| Yardımcı dosya | `kebab-case.ts` | `format-date.ts` |
| Şema dosyası | `kebab-case.ts` veya `schemas.ts` | `gorev-schemas.ts` |
| Sayfa | Next.js zorunlu | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` |
| API route | Next.js zorunlu | `route.ts` |
| Test | `*.test.ts(x)` | `gorev-list.test.tsx` |
| E2E | `*.spec.ts` | `gorev-onay.spec.ts` |

### 6.2. Klasör Adları

- Tümü `kebab-case` veya tek sözcük
- Türkçe karakter **kullanılmaz** klasör/dosya adlarında: `gorevler` ✅, `görevler` ❌
- Türkçe URL **gerekirse** Next.js `/gorevler/` (ASCII) kullanılır; UI'da "Görevler" yazılır

### 6.3. Bileşen Adları

| Tip | Stil | Örnek |
|---|---|---|
| React bileşeni | `PascalCase` | `GorevList`, `DataTable` |
| Hook | `useXxx` (camelCase) | `useGorev`, `usePermission` |
| Tip / Interface | `PascalCase` | `Gorev`, `GorevDurumu` |
| Sabit | `SCREAMING_SNAKE_CASE` | `MAX_DOSYA_BOYUT` |
| Fonksiyon | `camelCase` | `formatTarih`, `calculateSLA` |

### 6.4. Türkçe Tutarlılığı

- Etki alanı kavramları **TR** (Görev, Proje, Derkenar, Vekâlet, Birim)
- Genel programlama terimleri **EN** (component, hook, schema, action)
- Veritabanı kolonları TR (Ana ÜGB §27): `silinme_tarihi`, `eyleyen_kimliği`
- Marka/paket adları (Next.js, Shadcn, Prisma) **EN**

---

## 7. MİKRO BİLEŞEN İLKELERİ (DETAYLI)

### 7.1. Tek Sorumluluk

❌ **YANLIŞ:**
```tsx
// gorev-page.tsx — 800 satır, her şey burada
function GorevPage() {
  // useEffect'ler, fetch, form, modal, tablo, drawer, bildirim... HEPSİ
}
```

✅ **DOĞRU:**
```tsx
// page.tsx — sadece kompozisyon
function GorevPage() {
  return (
    <PageLayout>
      <PageHeader title="Görevler" />
      <GorevToolbar />
      <GorevList />     {/* tablo + sıralama + sayfalama */}
      <GorevDetailDrawer /> {/* state context'ten */}
      <GorevBulkBar />
    </PageLayout>
  )
}
```

### 7.2. Bileşim > Yapılandırma

❌ **YANLIŞ:**
```tsx
<DataTable
  showHeader
  showFilters
  showPagination
  showBulkActions
  bulkActions={[...]}
  filterTypes={[...]}
  // 30 prop
/>
```

✅ **DOĞRU:**
```tsx
<DataTable columns={columns} data={data}>
  <DataTableToolbar>
    <DataTableSearch />
    <DataTableFilters />
  </DataTableToolbar>
  <DataTableBulkBar actions={[...]} />
  <DataTablePagination />
</DataTable>
```

### 7.3. Boyut Sınırı

- Bileşen dosyası: **150 satır** (yorum + boşluk dahil)
- Yardımcı fonksiyon: **50 satır**
- Hook: **80 satır**
- Sayfa (`page.tsx`): **100 satır** (ağır iş alt bileşenlere)

> Sınır aşılırsa **otomatik bölünmesi gerekir**. Code-reviewer agent bu kuralı zorlar.

### 7.4. Pure Bileşen

- Bileşenler "props in → JSX out" kuralı.
- Yan etkiler `useEffect` veya custom hook içinde.
- Prop drilling yerine context veya store (URL state, TanStack Query) kullan.

### 7.5. Sıkı Tipleme

- `any` **yasak** (ESLint kuralı `no-explicit-any: error`)
- `unknown` + tip kapısı (`if (typeof x === 'string')`) tercih edilir
- Bileşen prop'ları her zaman `interface` ile

### 7.6. Test Edilebilirlik

- Her mikro bileşen **birim testi** ile gelir (Vitest + React Testing Library)
- Her özellik en az **1 uçtan uca** sınama (Playwright)
- Storybook (opsiyonel, ileri evre): görsel regresyon

---

## 8. API YAPISI

### 8.1. Yol İşleyici Şablonu

```
app/api/v1/<kaynak>/
├── route.ts                  # GET (liste), POST (oluştur)
├── [kimlik]/
│   ├── route.ts              # GET, PATCH, DELETE (tek kaynak)
│   └── <eylem>/
│       └── route.ts          # POST (etki alanı eylemi)
```

### 8.2. Örnek: `app/api/v1/gorevler/`

```
app/api/v1/gorevler/
├── route.ts                          # GET liste, POST oluştur
├── toplu-islem/
│   └── route.ts                      # POST toplu işlem
└── [kimlik]/
    ├── route.ts                      # GET, PATCH, DELETE
    ├── ata/
    │   └── route.ts                  # POST ata
    ├── onaya-sun/
    │   └── route.ts                  # POST onaya sun
    ├── onayla/
    │   └── route.ts                  # POST onayla
    ├── reddet/
    │   └── route.ts                  # POST reddet
    ├── altgorev/
    │   └── route.ts                  # POST alt görev oluştur
    ├── bagliliklar/
    │   ├── route.ts                  # GET, POST
    │   └── [bagliKimlik]/
    │       └── route.ts              # DELETE
    ├── izle/
    │   └── route.ts                  # POST, DELETE
    └── yorumlar/
        ├── route.ts                  # GET, POST
        └── [yorumKimliği]/
            └── route.ts              # PATCH, DELETE
```

### 8.3. Yol İşleyici İskeleti

```ts
// app/api/v1/gorevler/[kimlik]/onaya-sun/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOturum } from '@/lib/auth'
import { izinDenetleyici } from '@/lib/permissions'
import { gorevHizmeti } from '@/app/(dashboard)/gorevler/services'  // veya lib/services

export async function POST(
  istek: NextRequest,
  { params }: { params: { kimlik: string } }
) {
  const oturum = await getOturum()
  if (!oturum) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinDenetleyici.gerekli(oturum.kullanıcı, 'görev.onaya_sun', { görevKimliği: params.kimlik })

  const sonuç = await gorevHizmeti.onayaSun(params.kimlik, oturum.kullanıcı)
  return NextResponse.json({ başarılı: true, veri: sonuç })
}
```

### 8.4. Hizmet Katmanı (Service Layer)

İş mantığı `lib/services/` veya özellik klasöründe `actions.ts` / `services.ts` dosyasında:

```ts
// app/(dashboard)/gorevler/services.ts (veya lib/services/gorev.ts)
export const gorevHizmeti = {
  async onayaSun(kimlik: string, kullanıcı: Kullanıcı) {
    // bağlam denetimi (Maker-Checker)
    // Prisma güncelle
    // olay yayımla
    // dön
  },
  async onayla(kimlik: string, kullanıcı: Kullanıcı) {},
  async reddet(kimlik: string, kullanıcı: Kullanıcı, gerekçe: string) {},
}
```

> **Karar:** Hizmet kodu **özellik klasörü** içinde tutulur (özellik bazlı). Yalnızca **birden fazla özellikte ortak** olan altyapı (`auth`, `prisma`, `event-bus`, `permissions`) `lib/`'e gider.

---

## 9. IMPORT KURALLARI

### 9.1. Path Alias (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 9.2. Import Sırası

ESLint `import/order` ile zorunlu:

```tsx
// 1. React + Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Üçüncü taraf paketler
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. @/lib (en temel altyapı)
import { prisma } from '@/lib/prisma'

// 4. @/components (paylaşılan bileşenler)
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'

// 5. @/hooks (paylaşılan kancalar)
import { usePermission } from '@/hooks/use-permission'

// 6. @/types
import type { Gorev } from '@/types/domain'

// 7. Aynı özellik içi (göreceli)
import { useGorevList } from './hooks/use-gorev-list'
import { gorevSchemas } from './schemas'
```

### 9.3. Çapraz Özellik İmportu Kısıtı

> Bir özellik **başka bir özelliğin** iç klasöründen import yapamaz.

❌ **YASAK:**
```tsx
// app/(dashboard)/projeler/components/...
import { GorevCard } from '@/app/(dashboard)/gorevler/components/gorev-card'
// Bu YASAK — özellikler birbirine sızdırılmaz.
```

✅ **DOĞRU:** GorevCard 2+ özellikte gerekiyorsa **kök `components/`** altına taşı:

```tsx
import { GorevCard } from '@/components/domain/gorev-card'
```

> ESLint kuralı (`@/eslint-plugin-boundaries`) bunu zorlar.

---

## 10. STATE YÖNETİMİ

### 10.1. Sunucu Durumu

- **TanStack Query** zorunlu
- Her özellik kendi `hooks/use-<özellik>-list.ts` ve `use-<özellik>-mutations.ts` dosyalarını kapsüller
- `queryKey` desen: `['<özellik>', '<eylem>', <parametreler>]`

### 10.2. UI Durumu

- Yerel state için `useState`
- Form state için **React Hook Form**
- URL state için Next.js `useSearchParams` + custom hook
- Karmaşık paylaşımlı UI state için **Zustand** (en son çare; ilk evrede gerek yok)

### 10.3. ❌ YASAK

- Redux
- MobX
- Recoil
- Jotai
- Context API'yi global state olarak kullanma (yalnızca tema, oturum gibi gerçekten global olanlar)

---

## 11. STİL KURALLARI

### 11.1. Tailwind Öncelikli

- **Yalnız Tailwind** kullanılır
- CSS-in-JS yasak (Emotion, styled-components)
- CSS modules istisnai (yalnız özel durum)

### 11.2. Karanlık Tema (S9)

- Tüm renkler `bg-foreground` gibi semantic token ile
- `dark:` modifier ihtiyaç duyulan yerlerde
- `next-themes` ile değiştirme

### 11.3. Sınıf Birleştirici

```tsx
// lib/utils/cn.ts
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...args: ClassValue[]) => twMerge(clsx(args))

// kullanım
<div className={cn('base-class', condition && 'extra-class', className)} />
```

---

## 12. PRİSMA & VERİTABANI

### 12.1. Konum

```
prisma/
├── schema.prisma                   # B-Ç2 modelleri
├── migrations/
├── seed.ts                         # tohum verisi
└── ara-katmanlar/                  # YDYK middleware'leri
    ├── yumusak-silme.ts
    └── denetim.ts
```

### 12.2. Singleton İstemci

```ts
// lib/prisma/index.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 12.3. Ara Katmanlar Bağlama

```ts
// lib/prisma/index.ts
import { yumuşakSilmeAraKatmanı } from './ara-katmanlar/yumusak-silme'
import { denetimAraKatmanı } from './ara-katmanlar/denetim'

prisma.$use(yumuşakSilmeAraKatmanı)
prisma.$use(denetimAraKatmanı)
```

---

## 13. SCRIPT KOMUTLARI (package.json) — BUN

> Tüm komutlar **`bun`** veya **`bun run`** ile çalışır. `npm`/`pnpm`/`yarn` kullanılmaz.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\"",
    "test": "bun test",
    "test:unit": "bun test --bail tests/unit",
    "test:integration": "bun test tests/integration",
    "test:coverage": "bun test --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "bun run prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

**Komut kullanımı:**

```bash
bun install                # bağımlılıkları kur (pnpm install yerine)
bun add <paket>            # paket ekle (pnpm add yerine)
bun add -d <paket>         # geliştirme bağımlılığı (pnpm add -D yerine)
bun remove <paket>         # paket kaldır
bun dev                    # → bun run dev (kısayol)
bun run lint               # script çalıştır
bun test                   # yerleşik test çalıştırıcı (Vitest YOK)
bun run prisma/seed.ts     # TS dosyası doğrudan (tsx YOK)
```

**Not — Test çalıştırıcı:**
- `bun test` Bun'un yerleşik test çalıştırıcısıdır (Jest API uyumlu).
- Vitest **gerekmez**; tüm birim/tümleşim testleri `bun test` ile çalışır.
- Playwright ayrı kalır (uçtan uca için).
- Test dosyası şablonu: `*.test.ts(x)` veya `*.spec.ts(x)`.

**Not — TS çalıştırıcı:**
- `tsx`, `ts-node` **gereksizdir**. Bun TypeScript dosyalarını doğrudan çalıştırır: `bun run prisma/seed.ts`.

---

## 14. ESLİNT KURALLARI (BU YAPIYI ZORLAYAN)

```js
// eslint.config.mjs
export default [
  {
    rules: {
      // mikro bileşen sınırları
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', 150],
      'complexity': ['warn', 10],

      // tip güvenliği
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',

      // import düzeni
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      }],

      // çapraz özellik importu yasak
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/(dashboard)/*/components/*', '@/app/(dashboard)/*/hooks/*'],
          message: 'Özellik içi import yalnızca aynı özellik içinden yapılır. 2+ özellikte gerekiyorsa components/ veya hooks/ altına taşı.',
        }],
      }],

      // React
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]
```

---

## 15. ÖNCEKİ KARAR (B-9) İLE FARK

### B-9 (Eski) — KALDIRILDI

```
apps/web/        ← KALDIRILDI
apps/api/        ← KALDIRILDI
packages/ui/     ← KALDIRILDI
packages/shared/ ← KALDIRILDI
packages/...     ← KALDIRILDI
turbo.json       ← KALDIRILDI
pnpm-workspace.yaml ← KALDIRILDI
```

### B-Ç18 (Yeni) — YÜRÜRLÜKTE

```
app/                ← Tek Next.js (App Router)
components/         ← paylaşımlı mikro bileşenler
lib/                ← genel altyapı
hooks/              ← paylaşımlı kancalar
types/              ← paylaşımlı tipler
prisma/             ← veritabanı
```

> **Geçiş gerekmez:** Henüz kod yazılmadığı için B-9 sadece belgede kalan bir karardı. B-Ç18 onun yerine geçer.

---

## 16. KÖ-0.5 GÜNCELLEMESİ (C Evresi)

C-Evresi-MVP plan içindeki öykü değişir:

**Eski:**
> KÖ-0.5 — Tek depo (monorepo) iskeleti (pnpm + Turborepo) — 5 SP

**Yeni:**
> **KÖ-0.5** — Tek Next.js projesi iskeleti + **Bun** kurulum + B-Ç18 klasör yapısı (app, components, lib, hooks, types, prisma) — **3 SP**

Tasarruf: 2 SP (Turborepo karmaşıklığı yok). Ek: Bun ile kurulum + dev döngüsü daha hızlı.

---

## 17. ALTAY PROJESİ İLE BENZERLİK

PUSULA, kullanıcının daha önce çalıştığı **Altay** projesindeki yapıyı temel alır:
- `app/(auth)/`, `app/(dashboard)/`, `app/api/` yol öbekleri
- Tek Next.js projesi
- TS + Tailwind + Shadcn

Eklenen iyileştirmeler:
- **Özellik bazlı** organizasyon (Altay'da yatay olabilir)
- **Mikro bileşen ilkesi** (sıkı sınırlar)
- **Yeniden kullanılabilirlik karar ağacı** (§5)
- **ESLint kuralları** ile zorlama (§14)

---

## 18. KONTROL LİSTESİ — HER PR'DA

Code-reviewer agent her PR'da bu maddeleri denetler:

- [ ] Yeni bileşen dosyası **150 satır altında** mı?
- [ ] Aynı JSX bloğu 2+ yerde tekrarlanıyor mu? (Mikro bileşene çıkarmalı)
- [ ] Özellik içinde mi, paylaşımlı mı doğru yere konulmuş mu?
- [ ] Çapraz özellik importu var mı? (Yasak)
- [ ] `any` kullanımı var mı? (Yasak)
- [ ] Bileşen adı PascalCase, dosya adı kebab-case mi?
- [ ] TR karakter klasör/dosya adında var mı? (Yasak)
- [ ] İmport sırası doğru mu?
- [ ] Birim sınama yazılmış mı?
- [ ] Tip tanımı `interface` ile mi?

---

## 19. SONUÇ

Bu yapı **kilitlendi**. Tüm sonraki çıktılar (kod yazımı, code-review, mimari değişiklik) bu belgeye **mutlak uyumlu** olur. Aykırı bir gereksinim oluşursa **bu belge önce güncellenir**, sonra kod yazılır.

**Etkilenen belgeler güncellendi:**
- B-Ç11-Ç13-Ç14-Ç15-Ç16 (Tek Depo bölümü değişti)
- Ana ÜGB (yapı bölümü güncellendi)
- C-Evresi-MVP-ayrıntı-plan (KÖ-0.5 güncellendi)
- README

**Sonraki adım:** Sprint 0 → KÖ-0.5 (B-Ç18 iskeleti).
