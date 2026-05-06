# Aktivite Günlüğü — Mimari Plan

> **Tarih:** 2026-05-06
> **Durum:** Taslak — onay bekliyor (bkz. Bölüm 11 Karar Soruları)
> **Sahip:** —
> **İlgili ADR:** TBD-NNNN-aktivite-gunlugu-ile-denetim-forensik-ayrimi
> **İlgili kurallar:** Kural 5 (TR UI), 23 (TanStack Query), 50/50a (RBAC), 90 (5 katman), 96 (virtualization), 131 (saf modül), 139 (saf fonksiyon test), 146 (resource-level RBAC)

---

## 1. Bağlam ve Sorun

`/ayarlar/denetim` sayfası bugün makamın doğrudan kullanabileceği bir ekran değil. Kolonlar ham audit verisidir: `font-mono "ProjeYetkilisi"` kaynak tipleri, IP kolonu, JSON diff diyaloğu, `CREATE/UPDATE/DELETE` rozetleri. Bir kullanıcı buraya girdiğinde "robot logu"na bakar — denetim açısından doğru ama insan açısından okunamaz.

Kullanıcı talebi (2026-05-06): denetim/aktivite kayıtları **iki ayrı kullanıcı kitlesine** hitap etmeli:

1. **Makam (Kaymakam, Birim Amiri, Personel)** — günlük operasyon takibi için: "Mustafa Yılmaz, '2026 Kış Tedbirleri' projesinin 'Karla mücadele için ambulans' kartını tamamlandı olarak işaretledi."
2. **Sistem yöneticisi (Super Admin)** — forensik denetim için: IP, request_id, HTTP yolu, ham JSON diff, kanıt zinciri.

Talep **arka taraftaki audit altyapısını değiştirmeden** bu ayrımı kurmak.

---

## 2. Hedef

- **H1:** Makam dostu, doğal Türkçe cümleli `/aktivite-gunlugu` sayfası kurulur (yeni rota).
- **H2:** Mevcut `/ayarlar/denetim` sayfası **forensik moda** evrilir; yalnız `SUPER_ADMIN` görür.
- **H3:** Ana sayfa "Son Aktiviteler" widget'ı zaten mevcut zenginleştiriciyi kullandığından küçük rötuşla aynı tek-cümle anlatıya kavuşur.
- **H4:** Veri katmanına (`AktiviteLogu` tablosu, `audit-middleware`, `audit-context`) **sıfır değişiklik**. Kanıt zinciri korunur.
- **H5:** Eksik mesaj üreticileri (`Kullanici`, `Rol`, `RolIzin`, `KullaniciRol`, `DavetTokeni`, `Birim`, `ProjeSablonu`) doldurulur — denetim sayfasındaki en sık görülen "robot mesaj" boşlukları kapatılır.

### Hedef DEĞİL

- Aktivite logundaki ham veriyi yeniden yapılandırmak (DB, Prisma şema değişikliği).
- Mevcut `[projeId]/aktivite` modülünü değiştirmek (sadece servis katmanı genişler).
- Yeni bir log kaynağı (Sentry, OpenTelemetry, vb.) entegre etmek.

---

## 3. Mevcut Durum Tespiti

### 3.1 Veri katmanı (sağlam — dokunulmaz)

| Bileşen | Durum |
|---|---|
| `AktiviteLogu` tablosu | Tek tablo, BigInt PK, `kaynak_tip`+`kaynak_id`, `eski_veri`/`yeni_veri`/`diff` JSON, IP/HTTP/request_id/sebep, `kullanici_id` |
| [audit-middleware.ts](../../lib/audit-middleware.ts) | Prisma extension. Tüm CRUD'u yakalar. **KATİ AUDIT GUARD** — kullanıcısız yazıma izin vermez. JSON-safe normalize. |
| [audit-context.ts](../../lib/audit-context.ts) | AsyncLocalStorage; request boyunca `kullaniciId`, `ip`, `requestId`, `sebep` taşır. |
| Hassas alan maskeleme | `parola`, `mfa_secret`, `token` → `***` |

### 3.2 Anlam (semantik) katmanı — yarım kalmış

[aktivite/services.ts](../../app/(panel)/projeler/[projeId]/aktivite/services.ts) içinde:

| Üretici | Kapsadığı `kaynak_tip` | Çıktı örneği |
|---|---|---|
| `projeMesaji` | `Proje` | "projeyi çöp kutusuna taşıdı" |
| `listeMesaji` | `Liste` | "listeyi yeniden sıraladı" |
| `kartMesaji` | `Kart` | "kartı tamamladı" |
| `yorumMesaji` | `Yorum` | "yorum yazdı: …" |
| `eklentiMesaji` | `Eklenti` | "dosya yükledi: rapor.pdf" |
| `kontrolListesiMesaji` / `kontrolMaddesiMesaji` | `KontrolListesi`, `KontrolMaddesi` | "kontrol maddesini tamamladı" |
| `kartEtiketMesaji` / `kartYetkilisiMesaji` / `hedefBirimMesaji` | `KartEtiket`, `KartYetkilisi`, `KartBirimi` | "etiket ekledi" |
| `projeYetkilisiMesaji` / `listeYetkilisiMesaji` / `projeBirimiMesaji` / `listeBirimiMesaji` | `ProjeYetkilisi`, `ListeYetkilisi`, `ProjeBirimi`, `ListeBirimi` | aynı mantık üst düzeyde |
| `etiketTanimMesaji` | `Etiket` | etiket havuzu CRUD |
| **default → `"diger"`** | `Kullanici`, `Birim`, `Rol`, `Izin`, `DavetTokeni`, `KullaniciRol`, `RolIzin`, `Bildirim`, `BildirimMailKuyrugu`, `ProjeSablonu`, `DavetProjeBaglami`, `DavetListeBaglami`, `DavetKartBaglami` | "X kaydını güncelledi" — **ROBOT MESAJ** |

**Boşluk:** Denetim sayfasında en sık görülen idari kayıtlar (kullanıcı oluşturma, rol atama, davet) için **mesaj üretici yok**.

### 3.3 Sunum katmanı

| Ekran | Durum |
|---|---|
| Ana sayfa "Son Aktiviteler" | ✅ Zenginleştirici kullanıyor, timeline güzel ama tek cümle değil |
| Proje detay → Aktivite modalı | ✅ Tam timeline (dokunulmaz) |
| Kart yan paneli → Aktivite sekmesi | ✅ Kart-bazlı timeline (dokunulmaz) |
| **`/ayarlar/denetim`** | ❌ **Ham `DataTable`** — robot ekran |

### 3.4 Yetki tablosu (mevcut)

| İzin | Sahip rol(ler) |
|---|---|
| `DENETIM_OKU` (`audit:oku`) | SUPER_ADMIN, **KAYMAKAM** ([permissions-katalog.ts:970](../../lib/permissions-katalog.ts)) |
| `DENETIM_DISA_AKTAR` | SUPER_ADMIN, KAYMAKAM |
| Sidebar `AYAR_DENETIM` görünürlüğü | `[DENETIM_OKU]` ([sidebar-yetki.ts:56](../../lib/sidebar-yetki.ts)) |

---

## 4. Boşluk Analizi — "Robot vs İnsan"

| Bağlam | Şu an | Olması gereken |
|---|---|---|
| Ana sayfa | "Mustafa Yılmaz · kartı tamamladı · [proje › liste]" (3 parça) | "**Mustafa Yılmaz**, *2026 Kış Tedbirleri* projesinin *Acil Müdahale* listesindeki **'Karla mücadele için ambulans hazırla'** kartını **tamamlandı** olarak işaretledi." |
| /ayarlar/denetim | "ProjeYetkilisi · CREATE · kaynak_etiket · IP" tablosu | Aynı tek-cümle akışı + "Geliştirici detayı" toggle (IP/JSON/HTTP) |
| `Kullanici` CRUD | "Kullanici kaydını güncelledi" | "**Ayşe Demir** kullanıcısının **birim** bilgisini *Yazı İşleri Müdürlüğü* olarak güncelledi" |
| `Rol` / `RolIzin` | "Rol kaydını güncelledi" | "**Birim Amiri** rolüne **kart:tamamla** iznini ekledi" |
| `KullaniciRol` | "KullaniciRol kaydını ekledi" | "**Ayşe Demir** kullanıcısına **Birim Amiri** rolünü atadı" |
| `DavetTokeni` | "DavetTokeni kaydını oluşturdu" | "**ayse@example.com** adresine davet gönderdi (3 gün geçerli)" |
| `Birim` hiyerarşi değişikliği | generic | "**Yazı İşleri Müdürlüğü** birimini **Sosyal İşler**'in altından **İdari İşler** altına taşıdı" |

Üç tip boşluk:
1. **Anlatı boşluğu** — mevcut mesajlar var ama tek cümleye birleşmiyor.
2. **Mesaj üretici eksiği** — idari kayıtlar default branch'te.
3. **UI bağlanmamış** — denetim sayfası ham tablo.

---

## 5. Önerilen Mimari — Üç Katman

```
┌──────────────────────────────────────────────────────────────┐
│  KATMAN 3 — SUNUM (kullanıcıya gösterilen)                   │
│  • /aktivite-gunlugu (yeni, makam dostu) → timeline + filtre │
│  • /ayarlar/denetim (mevcut, evriltilir) → forensik tablo    │
│  • Ana sayfa "Son Aktiviteler" widget (mevcut, iyileştirme)  │
│  • Proje aktivite modalı (mevcut, dokunulmaz)                │
└──────────────────────┬───────────────────────────────────────┘
                       │ AktiviteOzeti[] (uniform tip)
┌──────────────────────┴───────────────────────────────────────┐
│  KATMAN 2 — ANLAM (semantik zenginleştirici)                 │
│  • zenginlestirVeOzetle() — mevcut, GENİŞLETİLİR             │
│    + insanCumlesi(ozet) yeni helper (1 cümle)                │
│    + Kullanici/Rol/RolIzin/KullaniciRol/Davet üreticileri    │
│  • lib/aktivite-anlati.ts (yeni, saf modül, test edilebilir) │
└──────────────────────┬───────────────────────────────────────┘
                       │ Ham AktiviteLogu satırı
┌──────────────────────┴───────────────────────────────────────┐
│  KATMAN 1 — VERİ (audit) — DOKUNULMAZ                        │
│  • AktiviteLogu tablosu (Prisma)                             │
│  • audit-middleware.ts (Prisma extension)                    │
│  • audit-context.ts (AsyncLocalStorage)                      │
└──────────────────────────────────────────────────────────────┘
```

**Felsefe:**

- Veri katmanı kanıt zinciri (kim, ne zaman, IP, request_id) → **delil hukuku**.
- Anlam katmanı insan dilinden anlatı → **iletişim**.
- Sunum katmanı role göre derinlik (makam akış, super admin forensik) → **yetki ergonomisi**.

---

## 6. Yeni `/aktivite-gunlugu` Modülü

### 6.1 Klasör yapısı (Kural 90)

```
app/(panel)/aktivite-gunlugu/
├── page.tsx                          (server, izin + ilk veri)
├── schemas.ts                        (Zod filtreler)
├── services.ts                       (Prisma + zenginlestirVeOzetle)
├── actions.ts                        (server action — sayfalama)
├── hooks/
│   └── kullan-aktivite-akisi.ts      (TanStack Query, infinite)
└── components/
    ├── aktivite-akisi-istemci.tsx    (client, timeline + filtre)
    ├── aktivite-filtre-cubugu.tsx    (kişi/proje/birim/tarih/tür)
    ├── aktivite-anlati-satiri.tsx    (tek cümle + zaman + chip)
    └── aktivite-detay-cekmecesi.tsx  (sağdan kayan, mevcut detay-içerik kullanır)
```

### 6.2 Sayfa düzeni (mobile-first, Kural 9-15)

```
┌─────────────────────────────────────────────────────────┐
│  Aktivite Günlüğü                                       │
│  Sistemdeki herkesin yaptığı her şey, anlaşılır dilde.  │
├─────────────────────────────────────────────────────────┤
│  [🔍 Ara: kişi, proje, kart…]   [📅 Bu hafta ▾]         │
│  [👤 Herkes ▾] [📁 Tüm projeler ▾] [🏛 Tüm birimler ▾]   │
│  [🏷 Tüm tipler ▾] [Filtreleri temizle]                 │
├─────────────────────────────────────────────────────────┤
│  ▎ Bugün                                                │
│  ●  14:32  Mustafa Yılmaz, "2026 Kış Tedbirleri"        │
│            projesinin "Karla mücadele için ambulans"    │
│            kartını tamamlandı olarak işaretledi.        │
│            [Karta git] [Detay]                          │
│  ●  14:18  Ayşe Demir, "Acil Müdahale" listesine        │
│            "Kar küreme aracı kontrolü" kartını ekledi.  │
│  ▎ Dün                                                  │
│  ●  16:05  Hasan Çelik, kullanıcı Ayşe Demir'e          │
│            "Birim Amiri" rolünü atadı.                  │
│  …                                                      │
│  [Daha eskileri yükle ↓]                                │
└─────────────────────────────────────────────────────────┘
```

- Mobile (360px): filtre çubuğu Sheet (Kural 13), satırlar full-width.
- Tablo değil card-list (Kural 15).
- Virtualization `@tanstack/virtual`, 100+ satır için (Kural 96, 23b).
- Cursor pagination, 50/sayfa (Kural 97).

### 6.3 Tek-cümle anlatı üretici (saf modül)

Yeni dosya: `lib/aktivite-anlati.ts` (Kural 131, U.1):

```ts
export type AnlatiParcasi =
  | { tip: "kullanici"; metin: string }
  | { tip: "proje"; id: string; metin: string }
  | { tip: "liste"; id: string; metin: string }
  | { tip: "kart"; id: string; metin: string }
  | { tip: "vurgu"; metin: string }     // alıntılar, yeni değer
  | { tip: "metin"; metin: string };    // bağlaç, yardımcı

export type AnlatiCumlesi = {
  parcalar: AnlatiParcasi[];
  sonHal?: { etiket: string; deger: string }; // "Yeni başlık: 'X'"
};

export function aktiviteAnlati(o: AktiviteOzeti): AnlatiCumlesi { /* ... */ }
```

**Türkçe gramer kritik:** Tamlama ekleri (-nin, -ndeki, -nı) doğru bağlanmalı: "**'2026 Kış Tedbirleri' projesi**nin 'Acil Müdahale' **listesi**ndeki 'Karla...' **kartı**nı tamamladı". Saf TS modülde kotarılır, snapshot test'lerle doğrulanır (Kural 139).

### 6.4 Yetki & izin

Yeni izin ([permissions-katalog.ts](../../lib/permissions-katalog.ts) içine):

```ts
AKTIVITE_OKU: "aktivite:oku",  // herkes (DENETIM_OKU'dan ayrı)
AKTIVITE_DISA_AKTAR: "aktivite:disa-aktar",  // makam + super admin
```

| Rol | `AKTIVITE_OKU` | `AKTIVITE_DISA_AKTAR` | `DENETIM_OKU` (forensik) |
|---|---|---|---|
| SUPER_ADMIN | ✅ | ✅ | ✅ |
| KAYMAKAM | ✅ | ✅ | ❌ (kullanıcı talebi) |
| BIRIM_AMIRI | ✅ (kapsam) | ❌ | ❌ |
| PERSONEL | ✅ (kapsam) | ❌ | ❌ |

**Kapsam filtresi:** Servis katmanında `kullaniciErisimBilgisi(id)` zaten mevcut ([ana-sayfa/services.ts:27](../../app/(panel)/ana-sayfa/services.ts) `erisimliProjeIdleri`). Aynı pattern: makam-değil kullanıcılar yalnızca eriştikleri proje/liste/kart kapsamındaki aktiviteleri görür (Kural 146).

### 6.5 Filtreler

| Filtre | Tip | Notlar |
|---|---|---|
| Kişi | combobox (kullanıcı listesi) | "Herkes" default |
| Proje | combobox | makam-değilse erişimliler |
| Birim | combobox | hiyerarşik |
| Tarih aralığı | preset (Bugün / Dün / Bu Hafta / Bu Ay / Özel) | default Bu Hafta |
| Tür | multi-select kategori (Kart, Yorum, Kullanıcı, Rol, …) | default tümü |
| Arama | text | kart/proje/kullanıcı adı (debounce 300ms) |

Filtreler **URL query param'a** yansır (deep-link, copy-paste). TanStack Query key: `["aktivite-akisi", filtreler]` (Kural 23).

---

## 7. `/ayarlar/denetim` Sayfasının Evrimi (Forensik Mod)

Sayfa **silinmez**, yeniden konumlandırılır:

| Önceki | Yeni |
|---|---|
| Görünen ad: "Denetim Günlüğü" | "Denetim Günlüğü (Forensik)" |
| Açıklama: "Sistemdeki tüm değişiklikler" | "Audit log — IP, request kimliği, JSON diff. Yalnız sistem yöneticileri için." |
| İzin: KAYMAKAM + SUPER_ADMIN | **Yalnız SUPER_ADMIN** |
| Kolonlar: Zaman, İşlem rozeti, Tip (font-mono), Kayıt, Kullanıcı, IP, Detay | Aynı + **HTTP yol/metod, request_id, sebep** kolonları (`hideable`) |
| Detay diyaloğu | Mevcut JSON diff (dokunulmaz) **+ üst kısma `aktiviteAnlati()` ile insan cümlesi başlık** |

**Sidebar etiket değişikliği:**

```
Önceki:                    Yeni:
─ Ayarlar                  ─ Aktivite Günlüğü        ← yeni, sidebar üstünde
   • Denetim                  (herkes görür)
                            ─ Ayarlar
                               • Denetim (Forensik)  ← yalnız SUPER_ADMIN
```

---

## 8. Ana Sayfa "Son Aktiviteler" İyileştirmesi

[son-aktiviteler.tsx](../../app/(panel)/ana-sayfa/components/son-aktiviteler.tsx) **dokunmadan kalabilir** (zaten zenginleştirici kullanıyor). Önerilen küçük rötuş:

1. **Tek cümle anlatı modu** opsiyonel toggle (varsayılan kapalı, kullanıcı ayarına bağlanır):
   - Açık: tek paragraf akış
   - Kapalı: mevcut 3-satırlı çip görünümü
2. **"Tüm Denetim"** linki → **"Tüm Aktiviteler"** olur, `/aktivite-gunlugu`'na gider. Forensik link sadece SUPER_ADMIN'e gösterilir.
3. **Filtre rozeti**: header'a "Sadece benim" / "Tüm takım" toggle ekle (kapsam zaten servis tarafında ayrıştırılıyor).

---

## 9. Veri Çekme & Performans Notları

| Kural | Uygulama |
|---|---|
| Kural 43 (N+1 yasağı) | `kaynakEtiketleriOlustur` zaten 16 tabloyu paralel batch'ler. Yeni anlatı katmanı gerekirse 1-2 ek paralel sorgu (kullanıcı_birimi, rol_adı, davet_email). |
| Kural 96 (virtualization) | `@tanstack/virtual` zorunlu — sayfada 50/yükleme, "daha eski" tıklayınca cumulative 500+ satıra çıkar. |
| Kural 97 (cursor pagination) | `AktiviteLogu.id` BigInt → cursor kolaylığı. Mevcut `kartAktiviteleriListele` zaten `cursor: { id: { lt: BigInt(girdi.cursor) } }` pattern'ini kullanıyor. |
| Kural 98 (cache) | TanStack Query `staleTime: 30s`. Realtime istenirse `Infinity` + Socket.io invalidation. |
| Kural 146 (resource-level RBAC) | Servis tarafında `erisimliProjeIdleri` zaten var. Yeni servis bunu çağıracak — yetkisiz proje hiç döndürülmez. |
| Audit logu okumak audit logu yazar mı? | **Hayır.** Read operation; middleware sadece YAZMA_ISLEMLERI'ni yakalar ([audit-middleware.ts:14](../../lib/audit-middleware.ts)). |

**DB index önerileri (Faz F2 sırasında doğrula):**

- `(zaman DESC)` — zaten var olabilir
- `(kullanici_id, zaman DESC)` — kişi filtresi için
- `(kaynak_tip, zaman DESC)` — tür filtresi için
- `(kaynak_tip, kaynak_id)` — bağlam join'i için (zaten olmalı)

---

## 10. Faz Faz Yapılacaklar

| Faz | İş | Tahmini efor | Bağımlılık |
|---|---|---|---|
| **F0 — Hazırlık** | ADR yaz: "Aktivite Günlüğü ile Denetim Forensik ayrımı". `permissions-katalog.ts`'e `AKTIVITE_OKU` + `AKTIVITE_DISA_AKTAR` ekle. Varsayılan rol matrisi güncelle. Migration: yeni izinleri seed'e ekle. | 1 saat | — |
| **F1 — Anlatı motoru** | `lib/aktivite-anlati.ts` saf modül — `aktiviteAnlati(ozet) → AnlatiCumlesi`. Türkçe tamlama eki helper'ları. Test ZORUNLU (Kural 139, U.9): 30+ snapshot test (her kategori + her ana mesaj varyantı). | 1 gün | F0 |
| **F2 — Eksik üreticiler** | `aktivite/services.ts` içine yeni mesaj fonksiyonları: `kullaniciMesaji`, `rolMesaji`, `rolIzinMesaji`, `kullaniciRolMesaji`, `davetTokeniMesaji`, `birimMesaji`, `projeSablonuMesaji`. Her biri için unit test. `aktiviteOzetle` switch'ine eklen. | 1 gün | F1 |
| **F3 — Yeni modül iskeleti** | `app/(panel)/aktivite-gunlugu/` 5 katman (schemas, services, actions, hooks, components). İlk MVP: timeline + tek tarih grubu, filtre yok. | 1 gün | F2 |
| **F4 — Filtre çubuğu** | Filtre çubuğu (kişi/proje/birim/tür/tarih/arama). URL sync. TanStack Query infinite. | 1 gün | F3 |
| **F5 — Sidebar yetki** | `MENU_KODLARI`'a `AKTIVITE_GUNLUGU`, `MENU_IZIN_HARITASI`'a izin map. `app-sidebar.tsx`'e item ekle. Sidebar testlerini güncelle. | 1 saat | F0, F3 |
| **F6 — Denetim'i forensik moda evir** | Sayfa başlığı + açıklama değiştir. `permissions-katalog`'tan `DENETIM_OKU`'yu KAYMAKAM'dan çıkar. Diff diyaloğunun tepesine `AnlatiOzet` ekle. | 2 saat | F1, F2 |
| **F7 — Ana sayfa rötuşu** | "Tüm Denetim" linki → "Tüm Aktiviteler" + role-aware target. Opsiyonel: tek-cümle toggle. | 1 saat | F3 |
| **F8 — E2E test (Playwright)** | 3 viewport × 3 senaryo: makam ana sayfadan akışa, akış filtresi, super admin denetim'e geçiş, kaymakam denetim'i göremez. | 1 gün | F5, F6 |
| **F9 — Belgeleme** | `docs/adr/NNNN-aktivite-gunlugu.md`, `app/(panel)/aktivite-gunlugu/README.md`, CHANGELOG. | 1 saat | F8 |

**Toplam:** ~5-6 iş günü, kapsam genişletilirse 7-8.

### 10.1 Faz başına Kural Çek-Listesi (Kural 91 — Modül DONE)

Her faz için tamamlanma kriteri:

- [ ] Schema yazıldı
- [ ] Service yazıldı + unit test
- [ ] API yazıldı + integration test
- [ ] UI yazıldı + 360px screenshot
- [ ] Audit log akıyor (yeni modül de audit altında)
- [ ] Sonner toast'lar bağlı (filtre uygulandı, dışa aktarma başlatıldı)
- [ ] Yetki kontrolü var (Kural 50, 50a, 146)
- [ ] Tüm mutation'lar `useOptimisticMutation()` ile (Kural 107-116) — yeni modülde mutation az; yine de filtre kayıt etme gibi state için uygula
- [ ] E2E happy path geçiyor
- [ ] Code review PASS

---

## 11. Karar Bekleyen Sorular

1. **Anlatı tonu:** "Mustafa Yılmaz tamamlandı olarak işaretledi" mi (resmi), "Mustafa kart tamamladı" mı (kısa)? Default önerim **resmi tam tamlama**, ama makam'a sorulmalı.
2. **`Yorum` aktivitesi:** Mention-çözümlü tam metin gösterilsin mi yoksa "yorum yazdı" kısa form mu? Mahremiyet açısından bir karar (örn: PERSONEL başkasının yorumunu görmemeli, sadece "yorum yazdı" özet).
3. **Bildirim & E-posta kuyruğu kayıtları:** Aktivite günlüğüne dahil edilsin mi? Default önerim **HAYIR** — gürültü, sistem trafiği. Yalnız forensik denetimde kalır.
4. **Sebep alanı (`AktiviteLogu.sebep`):** Bazı işlemlerde "Neden bu aksiyon yapıldı?" alanı var. Anlatıya eklenir mi? Önerim: **EVET, parantez içinde** ("…sildi (gerekçe: kayıt mükerrer)").
5. **Realtime aktivite akışı:** Socket.io ile canlı akacak mı yoksa "Yenile" butonuyla mı? Default önerim: **TanStack Query 30s polling**, realtime opsiyonel ileri faz.
6. **Dışa aktarma:** Aktivite günlüğünde CSV/PDF dışa aktarma ister misiniz? Forensik'te zaten `DENETIM_DISA_AKTAR` var; aktivite tarafına da `AKTIVITE_DISA_AKTAR` eklenmeli mi?
7. **`/ayarlar/denetim`** menüden gizleyince path'i koruyalım mı (super admin doğrudan URL ile girebilsin) yoksa rota tamamen kapatılsın mı? Önerim: **path korunur, sayfa korunur, sadece sidebar gizlenir + sayfa-içi `izinVarMi` zaten var**.

---

## 12. Riskler

| Risk | Etki | Azaltma |
|---|---|---|
| Anlatı motorunda Türkçe tamlama hatası | Düşük güvenirlik algısı | 50+ snapshot test, edge case (uzun başlık, özel karakter, silinmiş kayıt) |
| Yeni izin migration prod'da boşa düşer | Kullanıcılar erişimi kaybeder | Seed migration'la varsayılan rollere izinleri otomatik atayan güvenli kod yaz; rollback için ayrı migration |
| `/ayarlar/denetim` URL'si crawler'a açık kalsa | Bilgi sızıntısı | Sayfa-içi `izinVarMi` zaten var; sadece sidebar gizlemek yetmez — kontrol mevcut |
| Performans (1M+ aktivite kaydı) | Sayfa yavaşlar | Index kontrolü (Bölüm 9), cursor pagination zorunlu |
| Mevcut `son-aktiviteler.tsx` UI'sini bozma | Gerileme | F7 opsiyonel toggle ile, default'ta görünüm korunur |
| Mention'lı yorum içeriği kapsam dışı kullanıcıya sızar | Mahremiyet | Servis tarafında `kart_yetkisi_yok → mesajı "yorum yazdı"` kısa forma indir |
| Yeni `AKTIVITE_OKU` izni eski rollere otomatik atanmazsa | Tüm kullanıcılar erişimi kaybeder | Migration'da `BIRIM_AMIRI` ve `PERSONEL` rollerine seed-time'da izni ata |
| Anlatı katmanı async/sync karışırsa context kaybı | KATİ AUDIT GUARD reddi | Tüm yeni servis fonksiyonları `async`, tüm DB çağrıları `await` (audit-context.ts:38 uyarısı) |

---

## 13. İlgili Dosyalar

### Veri katmanı (dokunulmaz)

- [lib/audit-middleware.ts](../../lib/audit-middleware.ts)
- [lib/audit-context.ts](../../lib/audit-context.ts)
- [lib/audit-kaynak-etiket.ts](../../lib/audit-kaynak-etiket.ts)
- [prisma/schema.prisma](../../prisma/schema.prisma) — `AktiviteLogu` model

### Anlam katmanı (genişletilir)

- [app/(panel)/projeler/[projeId]/aktivite/services.ts](../../app/(panel)/projeler/[projeId]/aktivite/services.ts) — `zenginlestirVeOzetle`, mesaj üreticileri
- `lib/aktivite-anlati.ts` — **yeni**, saf modül

### Sunum katmanı

- **Yeni:** `app/(panel)/aktivite-gunlugu/` (5 katman)
- [app/(panel)/ayarlar/denetim/](../../app/(panel)/ayarlar/denetim/) — forensik moda evrilir
- [app/(panel)/ana-sayfa/components/son-aktiviteler.tsx](../../app/(panel)/ana-sayfa/components/son-aktiviteler.tsx) — küçük rötuş
- [app/(panel)/projeler/[projeId]/aktivite/components/](../../app/(panel)/projeler/[projeId]/aktivite/components/) — dokunulmaz

### Yetki

- [lib/permissions-katalog.ts](../../lib/permissions-katalog.ts) — `AKTIVITE_OKU`, `AKTIVITE_DISA_AKTAR` eklenecek
- [lib/sidebar-yetki.ts](../../lib/sidebar-yetki.ts) — `AKTIVITE_GUNLUGU` menü kodu eklenecek
- [components/app-sidebar.tsx](../../components/app-sidebar.tsx) — sidebar item eklenecek

### Test (yeni)

- `lib/aktivite-anlati.test.ts` — snapshot testleri
- `app/(panel)/aktivite-gunlugu/services.test.ts`
- `tests/e2e/aktivite-gunlugu.e2e.ts`

---

## 14. Sonuç

Bu iş **sıfırdan bir log sistemi yazmak değil, mevcut iyi-yazılmış-ama-bağlanmamış katmanı doğru ekrana bağlamak ve eksik fiilleri tamamlamak**. Ağır iş `aktivite-anlati.ts`'in Türkçe tamlama doğruluğu ve eksik `kaynak_tip` mesaj üreticileridir; geri kalan iskelet 1-2 günlük standart Pusula pattern'i.

Onay alındıktan sonra **F0**'dan başlanır (ADR + izin matrisi). Karar sorularına (özellikle 1, 2, 7) cevap, F1 motorunun ton seçimini netleştirir.
