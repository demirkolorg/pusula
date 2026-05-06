# Aktivite Günlüğü — Mimari Plan

> **Tarih:** 2026-05-06
> **Durum:** Taslak v3 — kapsam motoru uygulanabilirlik revizyonu sonrası (bkz. Bölüm 12 Karar Soruları)
> **Sahip:** —
> **İlgili ADR:** TBD-NNNN-aktivite-gunlugu, ayrıca [ADR-0005 Resource-Level RBAC](../adr/0005-resource-level-rbac.md), [ADR-0008 Birim Paylaşım Saf Modeli](../adr/0008-birim-paylasim-saf-model.md), [ADR-0014 Granüler İzin Kataloğu](../adr/0014-granuler-izin-katalogu.md), [ADR-0020 Çöp Kutusu / Sidebar RBAC](../adr/0020-cop-kutusu.md)
> **İlgili kurallar:** Kural 5 (TR UI), 23 (TanStack Query), 50/50a (RBAC), 90 (5 katman), 96 (virtualization), 131 (saf modül), 139 (saf fonksiyon test); resource-level RBAC için [ADR-0005](../adr/0005-resource-level-rbac.md)

---

## Revizyon Notları (v3 — 2026-05-06)

İlk taslağa gelen geri bildirim sonrası şu noktalar düzeltildi/genişletildi:

1. **H4 netleşti** — "veri katmanı dokunulmaz" izin kataloğu eklemesini kapsamaz. Tek istisna açıkça belirtildi (Bölüm 2).
2. **Yeni Bölüm 7 — RBAC Kapsam Matrisi** — `kaynak_tip` × rol bazında "kim hangi satırı görür" tablosu eklendi.
3. **Anlatı motoru saf gramer yerine şablon-bazlı** kuruldu (Bölüm 6.3) — Türkçe ek üretiminin riski minimize edildi.
4. **Ortak motor `lib/aktivite/` altına taşınır** (Bölüm 5, 6.1, 13). Şu an `app/(panel)/projeler/[projeId]/aktivite/services.ts` doğrudan en az 3 dosyadan import ediliyor; yeni `/aktivite-gunlugu` ve forensik denetim de kullanacağı için yeri yanlış.
5. **Modül DONE çek-listesi okuma-modülüne uyarlandı** (Bölüm 11.1) — `useOptimisticMutation` çıkarıldı; RBAC, kapsam matrisi, cursor pagination, mobil görünüm, export yetkisi testleri kondu.
6. **Forensik denetim sayfasındaki `sebep` kolonu** için `DenetimSatiri` tipinin de genişletilmesi gerektiği işaretlendi (Bölüm 8 + Faz F6).
7. **Doğrulanmayan resource-level kural numarası referansları kaldırıldı** — resource-level RBAC için tek kaynak ADR-0005 yapıldı.
8. **Kapsam motoru iki aşamalı hale getirildi** — async `kapsamBaglamiHazirla()` gerekli id setlerini toplar, saf `kapsamWhere()` yalnızca hazır bağlamdan Prisma `where` üretir.
9. **Sistem/kendi işlem istisnaları allowlist'e bağlandı** — gizli `kaynak_tip` kayıtları `kullanici_id = null` veya `kullanici_id = mevcut kullanıcı` istisnasıyla akışa sızmaz.
10. **Ana sayfa varsayılanı düzeltildi** — "Son Aktiviteler" tek cümle anlatıyı varsayılan gösterir; eski çipli görünüm ikincil/kompakt seçenektir.

---

## 1. Bağlam ve Sorun

`/ayarlar/denetim` sayfası bugün makamın doğrudan kullanabileceği bir ekran değil. Kolonlar ham audit verisidir: `font-mono "ProjeYetkilisi"` kaynak tipleri, IP kolonu, JSON diff diyaloğu, `CREATE/UPDATE/DELETE` rozetleri. Bir kullanıcı buraya girdiğinde "robot logu"na bakar — denetim açısından doğru ama insan açısından okunamaz.

Kullanıcı talebi (2026-05-06): denetim/aktivite kayıtları **iki ayrı kullanıcı kitlesine** hitap etmeli:

1. **Makam (Kaymakam, Birim Amiri, Personel)** — günlük operasyon takibi için: "Mustafa Yılmaz, '2026 Kış Tedbirleri' projesinin 'Karla mücadele için ambulans' kartını tamamlandı olarak işaretledi."
2. **Sistem yöneticisi (Super Admin)** — forensik denetim için: IP, request_id, HTTP yolu, ham JSON diff, kanıt zinciri.

Talep **arka taraftaki audit yazım altyapısını değiştirmeden** bu ayrımı kurmak.

---

## 2. Hedef

- **H1:** Makam dostu, doğal Türkçe cümleli `/aktivite-gunlugu` sayfası kurulur (yeni rota).
- **H2:** Mevcut `/ayarlar/denetim` sayfası **forensik moda** evrilir; yalnız `SUPER_ADMIN` görür.
- **H3:** Ana sayfa "Son Aktiviteler" widget'ı zaten mevcut zenginleştiriciyi kullandığından küçük rötuşla aynı tek-cümle anlatıya kavuşur.
- **H4 (revize):** **Audit yazım altyapısı dokunulmaz.** `AktiviteLogu` tablosunun şeması, `audit-middleware` Prisma extension'ı, `audit-context` AsyncLocalStorage, JSON-safe normalize, hassas alan maskeleme — hepsi olduğu gibi kalır. Kanıt zinciri korunur. **Tek istisna:** `permissions-katalog.ts`'e `AKTIVITE_OKU` + `AKTIVITE_DISA_AKTAR` izinleri eklenir, varsayılan rol matrisi güncellenir, `Izin` tablosuna seed migration yazılır. Bu izin kataloğu eklemesidir, audit veri modelinin değişikliği değildir.
- **H5:** Eksik mesaj üreticileri (`Kullanici`, `Rol`, `RolIzin`, `KullaniciRol`, `DavetTokeni`, `Birim`, `ProjeSablonu`) doldurulur — denetim sayfasındaki en sık görülen "robot mesaj" boşlukları kapatılır.
- **H6 (yeni):** Semantik zenginleştirici `lib/aktivite/` altında ortaklaştırılır — anasayfa, proje aktivitesi, `/aktivite-gunlugu` ve forensik denetim sayfası **aynı motoru** kullanır. Tek doğru kaynak.
- **H7 (yeni):** Her `kaynak_tip` için **görünürlük kuralı** açıkça yazılır (Bölüm 7); hiçbir kullanıcı yetkisi olmayan satırı görmez, hiçbir yetkili görmesi gerekeni kaçırmaz.

### Hedef DEĞİL

- Aktivite logundaki ham veriyi yeniden yapılandırmak (DB, Prisma şema değişikliği).
- Mevcut `[projeId]/aktivite` modülünün kullanıcıya görünen davranışını değiştirmek (sadece servis dosyası `lib/aktivite/`'ye taşınır, public API aynı).
- Yeni bir log kaynağı (Sentry, OpenTelemetry, vb.) entegre etmek.

---

## 3. Mevcut Durum Tespiti

### 3.1 Veri katmanı (sağlam — yazım yolu dokunulmaz)

| Bileşen | Durum |
|---|---|
| `AktiviteLogu` tablosu | Tek tablo, BigInt PK, `kaynak_tip`+`kaynak_id`, `eski_veri`/`yeni_veri`/`diff` JSON, IP/HTTP/request_id/`sebep`/oturum_id/user_agent, `kullanici_id` |
| [audit-middleware.ts](../../lib/audit-middleware.ts) | Prisma extension. Tüm CRUD'u yakalar. **KATİ AUDIT GUARD** — kullanıcısız yazıma izin vermez. JSON-safe normalize. |
| [audit-context.ts](../../lib/audit-context.ts) | AsyncLocalStorage; request boyunca `kullaniciId`, `ip`, `requestId`, `sebep` taşır. |
| Hassas alan maskeleme | `parola`, `mfa_secret`, `token` → `***` |

### 3.2 Anlam (semantik) katmanı — yarım kalmış ve yanlış konumda

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

**Boşluk 1 (mesaj üretici eksiği):** Denetim sayfasında en sık görülen idari kayıtlar için **mesaj üretici yok**.

**Boşluk 2 (yanlış konum):** Servis `app/(panel)/projeler/[projeId]/aktivite/` altında, ama bugün **doğrudan en az 3 dosyadan** import ediliyor (`ana-sayfa/{schemas,services}`, `projeler/[projeId]/components/kart-modal-tumu-listesi`). Yeni `/aktivite-gunlugu` ve forensik denetim sayfası da kullanacak — `lib/aktivite/` ortaklaştırma şart.

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

### 3.5 `DenetimSatiri` tipi — `sebep` alanı eksik

[denetim/actions.ts:11-28](../../app/(panel)/ayarlar/denetim/actions.ts) içinde `DenetimSatiri` tipi var ama Prisma şemasındaki `AktiviteLogu.sebep` alanı seçilmiyor/dönülmüyor. Forensik mod planında "sebep kolonu" denmişti; tip ve servis genişletmesi gerekir (Faz F6).

---

## 4. Boşluk Analizi — "Robot vs İnsan"

| Bağlam | Şu an | Olması gereken |
|---|---|---|
| Ana sayfa | "Mustafa Yılmaz · kartı tamamladı · [proje › liste]" (3 parça) | "**Mustafa Yılmaz**, '2026 Kış Tedbirleri' projesinin 'Acil Müdahale' listesindeki **'Karla mücadele için ambulans hazırla'** kartını **tamamlandı** olarak işaretledi." |
| /ayarlar/denetim | "ProjeYetkilisi · CREATE · kaynak_etiket · IP" tablosu | Aynı tek-cümle akışı + "Geliştirici detayı" toggle (IP/JSON/HTTP/sebep) |
| `Kullanici` CRUD | "Kullanici kaydını güncelledi" | "**Ayşe Demir** kullanıcısının birim bilgisini *Yazı İşleri Müdürlüğü* olarak güncelledi" |
| `Rol` / `RolIzin` | "Rol kaydını güncelledi" | "**Birim Amiri** rolüne **'kart:tamamla'** iznini ekledi" |
| `KullaniciRol` | "KullaniciRol kaydını ekledi" | "**Ayşe Demir** kullanıcısına **Birim Amiri** rolünü atadı" |
| `DavetTokeni` | "DavetTokeni kaydını oluşturdu" | "**ayse@example.com** adresine davet gönderdi (3 gün geçerli)" |
| `Birim` hiyerarşi değişikliği | generic | "**Yazı İşleri Müdürlüğü** birimini **Sosyal İşler**'in altından **İdari İşler** altına taşıdı" |

**Üç tip boşluk:**

1. **Anlatı boşluğu** — mevcut mesajlar var ama tek cümleye birleşmiyor (Bölüm 6.3 — şablon motoru çözer).
2. **Mesaj üretici eksiği** — idari kayıtlar default branch'te (Faz F2 çözer).
3. **UI bağlanmamış** — denetim sayfası ham tablo, yeni `/aktivite-gunlugu` rotası yok (Faz F3-F6 çözer).

**Görünürlük boşluğu (yeni Bölüm 7'de detaylı):** mevcut tasarım yetki kapsamını `kaynak_tip` bazında tanımlamıyor. Aşağıda netleştirilir.

---

## 5. Önerilen Mimari — Üç Katman

```
┌──────────────────────────────────────────────────────────────┐
│  KATMAN 3 — SUNUM (kullanıcıya gösterilen)                   │
│  • /aktivite-gunlugu (yeni, makam dostu) → timeline + filtre │
│  • /ayarlar/denetim (mevcut, evriltilir) → forensik tablo    │
│  • Ana sayfa "Son Aktiviteler" widget (mevcut, iyileştirme)  │
│  • Proje aktivite modalı (mevcut, dokunulmaz)                │
│  • Kart yan paneli → Aktivite sekmesi (dokunulmaz)           │
└──────────────────────┬───────────────────────────────────────┘
                       │ AktiviteOzeti[] (uniform tip)
┌──────────────────────┴───────────────────────────────────────┐
│  KATMAN 2 — ANLAM (semantik zenginleştirici — ORTAK)         │
│  • lib/aktivite/                                             │
│     - tipler.ts        (AktiviteOzeti, AnlatiCumlesi, …)     │
│     - zenginlestirici.ts  (eski services.ts'in saf kısmı)    │
│     - mesajlar/        (kategori bazlı üreticiler)           │
│     - anlati.ts        (şablon-bazlı tek cümle)              │
│     - kapsam.ts        (RBAC görünürlük matrisi — Bölüm 7)   │
└──────────────────────┬───────────────────────────────────────┘
                       │ Ham AktiviteLogu satırı
┌──────────────────────┴───────────────────────────────────────┐
│  KATMAN 1 — VERİ (audit) — DOKUNULMAZ                        │
│  • AktiviteLogu tablosu (Prisma) — şema değişmez             │
│  • audit-middleware.ts (Prisma extension) — değişmez         │
│  • audit-context.ts (AsyncLocalStorage) — değişmez           │
│  • İSTİSNA: permissions-katalog.ts'e yeni izin eklenir       │
│    (audit yazımı değil, izin kataloğu güncellemesi)          │
└──────────────────────────────────────────────────────────────┘
```

**Felsefe:**

- Veri katmanı kanıt zinciri (kim, ne zaman, IP, request_id) → **delil hukuku**.
- Anlam katmanı insan dilinden anlatı + kapsam filtresi → **iletişim ve mahremiyet**.
- Sunum katmanı role göre derinlik (makam akış, super admin forensik) → **yetki ergonomisi**.

---

## 6. Yeni `/aktivite-gunlugu` Modülü

### 6.1 Klasör yapısı (Kural 90) + ortak motor taşıma

**Yeni shared motor:**

```
lib/aktivite/
├── tipler.ts                 (AktiviteOzeti, AnlatiCumlesi, KapsamFiltresi)
├── zenginlestirici.ts        (zenginlestirVeOzetle, batch lookup)
├── mesajlar/
│   ├── proje.ts              (projeMesaji)
│   ├── liste.ts              (listeMesaji)
│   ├── kart.ts               (kartMesaji)
│   ├── yorum.ts              (yorumMesaji)
│   ├── eklenti.ts            (eklentiMesaji)
│   ├── kontrol.ts            (kontrolListesi/Maddesi)
│   ├── iliski.ts             (KartEtiket/Yetkilisi/Birimi, Proje/Liste varyantları)
│   ├── etiket.ts             (etiketTanimMesaji)
│   ├── kullanici.ts          (YENİ — Kullanici, KullaniciRol)
│   ├── rol-izin.ts           (YENİ — Rol, RolIzin, Izin)
│   ├── davet.ts              (YENİ — DavetTokeni + bağlamlar)
│   ├── birim.ts              (YENİ — Birim hiyerarşi)
│   └── proje-sablonu.ts      (YENİ — ProjeSablonu)
├── anlati.ts                 (şablon-bazlı tek cümle üretici)
├── kapsam.ts                 (RBAC kapsam matrisi — Bölüm 7)
└── *.test.ts                 (saf modül testleri — Kural 139)
```

**Eski yer:**

`app/(panel)/projeler/[projeId]/aktivite/services.ts` içindeki **route-bound** kısımlar (`kartAktiviteleriniListele`, `projeAktiviteleriniListele`) yerinde kalır; **saf zenginleştirici** ve mesaj üreticileri `lib/aktivite/`'ye **taşınır**. Public API aynı kalır:

```ts
// Önce
import { zenginlestirVeOzetle, type AktiviteOzeti } from "@/app/(panel)/projeler/[projeId]/aktivite/services";

// Sonra
import { zenginlestirVeOzetle, type AktiviteOzeti } from "@/lib/aktivite";
```

Doğrudan import noktaları tek pas'ta güncellenir; `[projeId]/aktivite/services.ts` 1700 → ~200 satıra iner (sadece route kalır).

**Yeni rota:**

```
app/(panel)/aktivite-gunlugu/
├── page.tsx                          (server, izin + ilk veri)
├── schemas.ts                        (Zod filtreler)
├── services.ts                       (Prisma + lib/aktivite kullanımı)
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
│  Yetkiniz kapsamındaki aktiviteler, anlaşılır dilde.     │
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

### 6.3 Anlatı motoru — şablon-bazlı (saf gramer DEĞİL)

İlk taslakta önerilen "saf TS Türkçe ek üreticisi" yaklaşımı **terk edildi**. Sebep: tamlama ekleri (-nin, -ndeki, -nı) ünlü uyumu, son ses, alıntı tırnağı içinde başka kelime başı, kısaltmalar, yabancı ad, sayısal başlık gibi onlarca edge case içerir; saf TS ile %100 doğruluk kırılgan.

**Yerine geçen:** Olay tipine göre **statik Türkçe cümle şablonları**. Şablon parametreleri sadece **ad/başlık metni** (ek olmadan, tırnak içinde). Eylem cümlesi şablona gömülü.

```ts
// lib/aktivite/anlati.ts
type Sablon = (
  k: SablonGirdi
) => AnlatiCumlesi;

const SABLONLAR: Record<KategoriAnahtari, Sablon> = {
  "kart.tamamlandi": (g) => ({
    parcalar: [
      { tip: "kullanici", metin: g.kullanici },
      { tip: "metin", metin: ", " },
      ...projePart(g.proje),       // "\"X\" projesinin" — tırnak + " projesinin" sabit
      { tip: "metin", metin: " " },
      ...listePart(g.liste),        // "\"Y\" listesindeki"
      { tip: "metin", metin: " " },
      ...kartPart(g.kart),          // "\"Z\" kartını"
      { tip: "metin", metin: " tamamlandı olarak işaretledi." },
    ],
  }),
  "kart.tasindi": (g) => ({ /* "...kartını \"A\" listesinden \"B\" listesine taşıdı." */ }),
  "kart.silindi": (g) => ({ /* "...kartını çöp kutusuna taşıdı." */ }),
  "kart.olusturuldu": (g) => ({ /* "...listesine \"X\" kartını ekledi." */ }),
  // ... her kategori × her ana eylem için bir şablon
};

function projePart(p: BaglamProje | null): AnlatiParcasi[] {
  if (!p?.ad) return [{ tip: "metin", metin: "bir projenin" }];
  return [
    { tip: "metin", metin: "\"" },
    { tip: "proje", id: p.id, metin: p.ad },
    { tip: "metin", metin: "\" projesinin" },
  ];
}
```

**Ek çıkarım kuralları:**

- Adlar **tırnak içinde** verilir; tamlama eki tırnak DIŞINDA sabittir → ünlü uyumu derdi yok.
- Şablonlar `kategori.eylem` anahtarlarıyla, her biri Türkçe gramerde önceden yazılmış cümle.
- Bilinmeyen kombinasyon → fallback şablon: `"{kullanici}, {kategori-etiketi} kaydını güncelledi."` (mevcut "diger" mesajı gibi ama şablon biçiminde).
- Test: her şablon için en az 1 snapshot (Kural 139). Toplam ~40-60 şablon × 1 test.

**Pseudo-kod tip:**

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
  sonHal?: { etiket: string; deger: string }; // "Yeni başlık: 'X'" — opsiyonel ek satır
};

export function aktiviteAnlati(o: AktiviteOzeti): AnlatiCumlesi { /* şablon seçimi */ }
```

### 6.4 Yetki & izin

Yeni izinler ([permissions-katalog.ts](../../lib/permissions-katalog.ts) içine):

```ts
AKTIVITE_OKU: "aktivite:oku",                // herkes (DENETIM_OKU'dan ayrı)
AKTIVITE_DISA_AKTAR: "aktivite:disa-aktar",  // makam + super admin
```

| Rol | `AKTIVITE_OKU` | `AKTIVITE_DISA_AKTAR` | `DENETIM_OKU` (forensik) |
|---|---|---|---|
| SUPER_ADMIN | ✅ | ✅ | ✅ |
| KAYMAKAM | ✅ | ✅ | ❌ (kullanıcı talebi) |
| BIRIM_AMIRI | ✅ (kapsam → Bölüm 7) | ❌ | ❌ |
| PERSONEL | ✅ (kapsam → Bölüm 7) | ❌ | ❌ |

**Önemli:** "AKTIVITE_OKU iznin var" demek "her aktivite satırını görürsün" demek değildir. Hangi satırları gördüğü **Bölüm 7'deki kapsam matrisine** bağlıdır.

### 6.5 Filtreler

| Filtre | Tip | Notlar |
|---|---|---|
| Kişi | combobox (kullanıcı listesi) | "Herkes" default |
| Proje | combobox | makam-değilse erişimliler |
| Birim | combobox | hiyerarşik |
| Tarih aralığı | preset (Bugün / Dün / Bu Hafta / Bu Ay / Özel) | default Bu Hafta |
| Tür | multi-select kategori (Kart, Yorum, Kullanıcı, Rol, …) | default tümü |
| Arama | text | kart/proje/kullanıcı adı (debounce 300ms) |

Filtreler **URL query param'a** yansır (deep-link, copy-paste). TanStack Query key: `["aktivite-akisi", filtreler]` (Kural 23). Filtre + kapsam birleşimi: server tarafında **önce kapsam (Bölüm 7)**, **sonra filtre** uygulanır — "filtreyle birim X seçtim ama kapsamım yok" durumunda boş set döner.

---

## 7. Aktivite Sorgu & RBAC Kapsam Matrisi (YENİ — kritik bölüm)

> Bu bölüm v2 revizyonun en kritik eklemesi. `lib/aktivite/kapsam.ts` modülü bu matrisi kod olarak ifade eder ve `services.ts` her sorguda `WHERE` koşullarını buradan üretir. Matris **`kaynak_tip` × rol** bazlıdır.

### 7.1 Roller ve mantık

| Rol kısaltması | Açıklama |
|---|---|
| **SA** | SUPER_ADMIN — tüm kayıtlar (filtre = `{}`) |
| **KM** | KAYMAKAM — makam, sistem geneli (filtre = `{}`) |
| **BA** | BIRIM_AMIRI — birim kapsamı + erişimli proje/liste/kart |
| **PR** | PERSONEL — sadece erişimli proje/liste/kart + kendi yaptığı işlemler |

`erisimli`: `kullaniciErisimBilgisi(id)` + `erisimliProjeIdleri(id)` ile hesaplanır (mevcut helper, [ana-sayfa/services.ts:27](../../app/(panel)/ana-sayfa/services.ts)).

### 7.2 Görünürlük matrisi

| `kaynak_tip` | SA | KM | BA | PR | Sebep / kural |
|---|---|---|---|---|---|
| `Proje` | ✅ | ✅ | ✅ erişimli proje | ✅ erişimli proje | Proje üzerinden kapsam doğal |
| `ProjeSablonu` | ✅ | ✅ | ❌ | ❌ | Şablon tanımı yönetimsel |
| `Liste` | ✅ | ✅ | ✅ erişimli liste/proje | ✅ erişimli liste/proje | Liste → proje join |
| `Kart` | ✅ | ✅ | ✅ erişimli kart/liste | ✅ erişimli kart/liste | Kart → liste → proje |
| `KartYetkilisi` / `KartBirimi` / `KartEtiket` | ✅ | ✅ | ✅ erişimli kart | ✅ erişimli kart | Aynı kart kapsamı |
| `ListeYetkilisi` / `ListeBirimi` | ✅ | ✅ | ✅ erişimli liste | ✅ erişimli liste | Aynı liste kapsamı |
| `ProjeYetkilisi` / `ProjeBirimi` | ✅ | ✅ | ✅ erişimli proje | ✅ erişimli proje | Aynı proje kapsamı |
| `Yorum` | ✅ | ✅ | ✅ erişimli karta yorum (TAM metin) | ✅ erişimli karta yorum (TAM metin) | Yetkisiz kart → satır gizli |
| `Eklenti` | ✅ | ✅ | ✅ erişimli kart | ✅ erişimli kart | Dosya adı görünür, indirme ayrı yetki |
| `KontrolListesi` / `KontrolMaddesi` | ✅ | ✅ | ✅ erişimli kart | ✅ erişimli kart | Karta dolaylı bağlanır |
| `Etiket` (proje havuzu) | ✅ | ✅ | ✅ erişimli proje | ✅ erişimli proje | Proje altında |
| `Kullanici` | ✅ | ✅ | ✅ kendi birimindeki kullanıcılar | ❌ kendi kaydı (sadece kendi yaptığı) | İdari kayıt; PR başkasının verisini görmez |
| `Birim` | ✅ | ✅ | ✅ kendi birimi + alt birimler | ❌ | Birim yönetimi BA yetkisinde |
| `Rol` / `Izin` / `RolIzin` | ✅ | ✅ | ❌ | ❌ | Sistem yönetimi yalnız makam |
| `KullaniciRol` | ✅ | ✅ | ✅ kendi birimindeki kullanıcılara atama | ❌ | İdari atama |
| `DavetTokeni` + `Davet*Baglami` | ✅ | ✅ | ✅ kendi gönderdiği davetler | ✅ kendi gönderdiği davetler | Davet veren kişi görür |
| `Bildirim` / `BildirimMailKuyrugu` | ✅ | ❌ (default) | ❌ | ❌ | **Default GİZLİ** — gürültü; opsiyonel olarak SUPER_ADMIN forensik'te görünür |

### 7.3 Servis seviyesinde uygulama

`lib/aktivite/kapsam.ts` iki parçalı tasarlanır:

1. **Async bağlam hazırlama:** DB erişimi yapar; proje/liste/kart/kontrol listesi/birim/davet id setlerini toplar.
2. **Saf `where` üretimi:** Hazır bağlamı alır, deterministik `Prisma.AktiviteLoguWhereInput` döndürür (Kural 131, 139).

Bu ayrım zorunlu: `kapsamWhere()` tek başına liste→proje, kart→liste, kontrol maddesi→kontrol listesi veya kullanıcı→birim ilişkilerini bilemez.

```ts
export type AktiviteRol = "SA" | "KM" | "BA" | "PR";

export type KapsamBaglami = {
  rol: AktiviteRol;
  kullaniciId: string;
  birimId: string | null;

  // SA/KM için null = sistem geneli; BA/PR için hazır id setleri.
  erisimliProjeIdleri: string[] | null;
  erisimliListeIdleri: string[] | null;
  erisimliKartIdleri: string[] | null;
  erisimliKontrolListesiIdleri: string[] | null;

  // İdari kayıtlar için.
  altBirimIdleri: string[];
  birimKullaniciIdleri: string[];
  kendiDavetIdleri: string[];
};

export async function kapsamBaglamiHazirla(
  kullaniciId: string,
): Promise<KapsamBaglami> {
  // 1) rol + kullaniciErisimBilgisi()
  // 2) erisimliProjeIdleri()
  // 3) erişimli projelerden liste/kart/kontrol listesi id setleri
  // 4) BA için alt birimler + o birimlerdeki kullanıcı id'leri
  // 5) DavetTokeni.davet_eden_id = kullaniciId olan davet id'leri
}

export function kapsamWhere(b: KapsamBaglami): Prisma.AktiviteLoguWhereInput {
  if (b.rol === "SA" || b.rol === "KM") return sistemGeneliWhere(b);

  return {
    OR: [
      projeKapsami(b),
      listeKapsami(b),
      kartKapsami(b),
      kontrolMaddesiKapsami(b),
      idariKapsam(b),
      davetKapsami(b),
      kendiIslemKapsami(b),
      sistemKaydiKapsami(b),
    ].filter(Boolean),
  };
}
```

**Prisma JSON path kuralı:** Üretilen Prisma client'ta JSON path filtresinde `path + in` yok; mevcut proje aktivitesi kodu `equals` ile OR açıyor. Kapsam motoru aynı deseni kullanır:

```ts
function jsonPathEqualsAny(
  alan: "yeni_veri" | "eski_veri",
  path: string[],
  idler: string[],
): Prisma.AktiviteLoguWhereInput[] {
  return idler.map((id) => ({
    [alan]: {
      path,
      equals: id,
    } as Prisma.JsonNullableFilter<"AktiviteLogu">,
  }));
}

function kartIdJsonKapsami(idler: string[]): Prisma.AktiviteLoguWhereInput {
  return {
    kaynak_tip: {
      in: ["Yorum", "Eklenti", "KontrolListesi", "KartYetkilisi", "KartBirimi", "KartEtiket"],
    },
    OR: [
      ...jsonPathEqualsAny("yeni_veri", ["kart_id"], idler),
      ...jsonPathEqualsAny("eski_veri", ["kart_id"], idler),
    ],
  };
}
```

**Allowlist kuralı (kritik):**

`kullanici_id = mevcut kullanıcı` veya `kullanici_id = null` tek başına görünürlük kuralı olamaz. Her istisna önce `kaynak_tip` allowlist'inden geçer:

```ts
const AKTIVITE_AKISI_TIPLERI = [
  "Proje", "Liste", "Kart", "Yorum", "Eklenti",
  "KontrolListesi", "KontrolMaddesi",
  "KartYetkilisi", "KartBirimi", "KartEtiket",
  "ListeYetkilisi", "ListeBirimi",
  "ProjeYetkilisi", "ProjeBirimi", "Etiket",
  "Kullanici", "Birim", "KullaniciRol",
  "DavetTokeni", "DavetProjeBaglami", "DavetListeBaglami", "DavetKartBaglami",
] as const;

const AKTIVITE_GIZLI_TIPLERI = ["Bildirim", "BildirimMailKuyrugu"] as const;

function sistemGeneliWhere(b: KapsamBaglami): Prisma.AktiviteLoguWhereInput {
  if (b.rol === "SA") return {};
  return { NOT: { kaynak_tip: { in: [...AKTIVITE_GIZLI_TIPLERI] } } };
}

function kendiIslemKapsami(b: KapsamBaglami): Prisma.AktiviteLoguWhereInput {
  return {
    kullanici_id: b.kullaniciId,
    kaynak_tip: { in: [...AKTIVITE_AKISI_TIPLERI] },
    NOT: { kaynak_tip: { in: [...AKTIVITE_GIZLI_TIPLERI] } },
  };
}

function sistemKaydiKapsami(_: KapsamBaglami): Prisma.AktiviteLoguWhereInput {
  return {
    kullanici_id: null,
    kaynak_tip: { in: ["Proje", "Liste", "Kart", "KontrolListesi", "KontrolMaddesi"] },
  };
}
```

**Önemli notlar:**

- **PR kullanıcı kendi yaptığı işlemleri görür** — ama yalnız `AKTIVITE_AKISI_TIPLERI` içinde ve gizli tipleri delmeden. Örn. kendi yorumunu sildi satırı görünebilir; `BildirimMailKuyrugu` kaydı görünmez.
- **Sistem kayıtları her rolde blanket görünmez** — yalnız allowlist'teki operasyonel `kaynak_tip` kayıtları "Sistem" olarak yazılır.
- **Performans:** Erişimli proje/liste/kart id setleri 50K+ olabilir → Prisma `in` listesi şişer. Çözüm: alt seviyede ek tablo (`kullanici_erisim_cache`) **isteğe bağlı**, ilk sürüm için yeterli (mevcut `erisimliProjeIdleri` zaten benzer pattern kullanıyor).
- **Test:** Her satır × her rol için en az 1 birim testi (matrisi otomatik üretir). Ek olarak entegrasyon testi: BA kullanıcısı "Y projesi" kartına ait yorumu görür, "Z projesi" yorumunu görmez (ADR-0005).

### 7.4 Bilinçli olarak gizlenen alanlar

- `parola_hash`, `mfa_secret`, `token` → audit-context tarafında zaten `***` (Kural 59). Aktivite anlatısında **alan adı bile gösterilmez** ("güvenlik bilgisini güncelledi" generic mesaj).
- `kullanici_id = null` (Sistem) kayıtları yalnız Bölüm 7.3'teki operasyonel allowlist içindeyse görünür; anlatıda "Sistem" olarak yazılır (mevcut `aktiviteKullaniciAdi` davranışı).

---

## 8. `/ayarlar/denetim` Sayfasının Evrimi (Forensik Mod)

Sayfa **silinmez**, yeniden konumlandırılır:

| Önceki | Yeni |
|---|---|
| Görünen ad: "Denetim Günlüğü" | "Denetim Günlüğü (Forensik)" |
| Açıklama: "Sistemdeki tüm değişiklikler" | "Audit log — IP, request kimliği, JSON diff. Yalnız sistem yöneticileri için." |
| İzin: KAYMAKAM + SUPER_ADMIN | **Yalnız SUPER_ADMIN** |
| Kolonlar: Zaman, İşlem rozeti, Tip, Kayıt, Kullanıcı, IP, Detay | Aynı + **HTTP yol/metod, request_id, sebep** kolonları (`hideable`) |
| `DenetimSatiri` tipi (actions.ts:11) | **`sebep`, `oturum_id`, `user_agent` alanları eklenir** + servis `select` genişler |
| Detay diyaloğu | Mevcut JSON diff (dokunulmaz) **+ üst kısma `aktiviteAnlati()` ile insan cümlesi başlık** |

**Kritik:** [actions.ts:11-28](../../app/(panel)/ayarlar/denetim/actions.ts) içindeki `DenetimSatiri` tipi şu anda `sebep` alanı içermiyor; eklenmediği takdirde yeni kolon boş kalır veya tip kırılır. Faz F6'nın ilk işi tip + servis genişletmesidir.

**Sidebar etiket değişikliği:**

```
Önceki:                    Yeni:
─ Ayarlar                  ─ Aktivite Günlüğü        ← yeni, sidebar üstünde
   • Denetim                  (herkes görür, kapsamlı filtreli)
                            ─ Ayarlar
                               • Denetim (Forensik)  ← yalnız SUPER_ADMIN
```

---

## 9. Ana Sayfa "Son Aktiviteler" İyileştirmesi

[son-aktiviteler.tsx](../../app/(panel)/ana-sayfa/components/son-aktiviteler.tsx) zenginleştiriciyi zaten kullanıyor; ancak kullanıcı talebi gereği **varsayılan görünüm tek cümle anlatı** olur. Eski 3-satırlı çip görünümü yalnız ikincil/kompakt seçenek olarak kalır.

1. **Tek cümle anlatı modu** varsayılan:
   - Varsayılan: tek paragraf akış (`aktiviteAnlati()` çıktısı)
   - Kompakt görünüm: mevcut 3-satırlı çip görünümü (kullanıcı tercihi olarak saklanabilir)
2. **"Tüm Denetim"** linki → **"Tüm Aktiviteler"** olur, `/aktivite-gunlugu`'na gider. Forensik link sadece SUPER_ADMIN'e gösterilir.
3. **Filtre rozeti:** header'a "Sadece benim" / "Tüm takım" toggle ekle (kapsam zaten servis tarafında ayrıştırılıyor, makam-değil için "Tüm takım" = "erişimli kapsam").
4. Mevcut `sonAktiviteleriGetir` ([ana-sayfa/services.ts:284](../../app/(panel)/ana-sayfa/services.ts#L284)) **`lib/aktivite/kapsam.ts`** üzerinden geçecek şekilde refactor — şu anki ad-hoc OR koşulu (`kullanici_id` veya `kaynak_tip:Proje + erişimli`) Bölüm 7 matrisinin kısıtlı bir versiyonu. Tek kaynak için merkez modüle bağlanır.

---

## 10. Veri Çekme & Performans Notları

| Kural | Uygulama |
|---|---|
| Kural 43 (N+1 yasağı) | `kaynakEtiketleriOlustur` zaten 16 tabloyu paralel batch'ler. Yeni anlatı katmanı gerekirse 1-2 ek paralel sorgu (kullanıcı_birimi, rol_adı, davet_email). |
| Kural 96 (virtualization) | `@tanstack/virtual` zorunlu — sayfada 50/yükleme, "daha eski" tıklayınca cumulative 500+ satıra çıkar. |
| Kural 97 (cursor pagination) | `AktiviteLogu.id` BigInt → cursor kolaylığı. Mevcut `kartAktiviteleriListele` zaten `cursor: { id: { lt: BigInt(girdi.cursor) } }` pattern'ini kullanıyor. |
| Kural 98 (cache) | TanStack Query `staleTime: 30s`. Realtime istenirse `Infinity` + Socket.io invalidation. |
| ADR-0005 (resource-level RBAC) | Kapsam matrisi (Bölüm 7) servis girişinde uygulanır — yetkisiz proje/kart kayıtları **hiç döndürülmez**. UI filtresi güvenlik DEĞİL. |
| Audit logu okumak audit logu yazar mı? | **Hayır.** Read operation; middleware sadece `YAZMA_ISLEMLERI`'ni yakalar ([audit-middleware.ts:14](../../lib/audit-middleware.ts)). |

**DB index önerileri (Faz F4/F5 sırasında doğrula):**

- `(zaman DESC)` — zaten var olabilir
- `(kullanici_id, zaman DESC)` — kişi filtresi + PR "kendi aktivitem"
- `(kaynak_tip, zaman DESC)` — tür filtresi
- `(kaynak_tip, kaynak_id)` — bağlam join
- JSON path `(yeni_veri->>'kart_id')` üzerine GIN index — kart kapsamı taraması büyük tabloda yavaşlarsa

---

## 11. Faz Faz Yapılacaklar

| Faz | İş | Tahmini efor | Bağımlılık |
|---|---|---|---|
| **F0 — Hazırlık** | ADR yaz: "Aktivite Günlüğü ile Denetim Forensik ayrımı + ortak motor". `permissions-katalog.ts`'e `AKTIVITE_OKU` + `AKTIVITE_DISA_AKTAR` ekle. Varsayılan rol matrisi güncelle. Migration: yeni izinleri seed'e ekle. RBAC kapsam matrisi (Bölüm 7) iskeleti. | 2 saat | — |
| **F1 — Ortak motor taşıma** | `app/(panel)/projeler/[projeId]/aktivite/services.ts` saf kısımları `lib/aktivite/`'ye taşı. Mesaj fonksiyonlarını `lib/aktivite/mesajlar/*` altına böl. Doğrudan import noktalarını güncelle. Mevcut testler geçmeye devam etmeli. | 1 gün | F0 |
| **F2 — Eksik üreticiler** | `lib/aktivite/mesajlar/{kullanici,rol-izin,davet,birim,proje-sablonu}.ts`. Her biri için unit test. `aktiviteOzetle` switch'ine eklen. | 1 gün | F1 |
| **F3 — Şablon-bazlı anlatı motoru** | `lib/aktivite/anlati.ts` — `Sablon` tipi, `SABLONLAR` map'i, ~40-60 şablon. Test ZORUNLU (Kural 139): her şablon için 1 snapshot + edge case (silinmiş kayıt, uzun başlık, özel karakter). | 1 gün | F2 |
| **F4 — Kapsam motoru** | `lib/aktivite/kapsam.ts` — async `kapsamBaglamiHazirla()` + saf `kapsamWhere(baglam) → Prisma.AktiviteLoguWhereInput`. Bölüm 7 matrisi, JSON path `equals` OR deseni ve allowlist istisnaları koda dökülür. Test: rol × kaynak_tip matris birim testi (otomatik üretilir). | 1 gün | F0 |
| **F5 — Yeni modül iskeleti** | `app/(panel)/aktivite-gunlugu/` 5 katman. İlk MVP: timeline + tek tarih grubu, filtre yok. `lib/aktivite/{zenginlestirici,anlati,kapsam}` kullanır. | 1 gün | F3, F4 |
| **F6 — Filtre çubuğu + URL sync** | Filtre çubuğu (kişi/proje/birim/tür/tarih/arama). URL sync. TanStack Query infinite. Boş set / "kapsamım yok" görsel handling. | 1 gün | F5 |
| **F7 — Sidebar yetki** | `MENU_KODLARI`'a `AKTIVITE_GUNLUGU`, `MENU_IZIN_HARITASI`'a izin map. `app-sidebar.tsx`'e item ekle. Sidebar testlerini güncelle. | 1 saat | F0, F5 |
| **F8 — Denetim'i forensik moda evir** | `DenetimSatiri` tipini `sebep` + `oturum_id` + `user_agent` ile genişlet. Servis `select` güncelle. Sayfa başlığı + açıklama değiştir. `permissions-katalog`'tan `DENETIM_OKU`'yu KAYMAKAM'dan çıkar. Diff diyaloğunun tepesine `AnlatiOzet` ekle. | 3 saat | F1, F3 |
| **F9 — Ana sayfa rötuşu** | "Tüm Denetim" linki → "Tüm Aktiviteler" + role-aware target. Tek-cümle anlatı varsayılan; eski çipli görünüm kompakt seçenek. `sonAktiviteleriGetir` `lib/aktivite/kapsam.ts` üzerinden refactor. | 2 saat | F4, F5 |
| **F10 — E2E test (Playwright)** | 3 viewport × 5 senaryo: makam ana sayfadan akışa, akış filtresi, super admin denetim'e geçiş, kaymakam denetim'i göremez, BA başkasının kapsamı dışındaki kartı görmez (kapsam matrisi entegrasyon testi), export yetkisi (DİSA_AKTAR yoksa buton yok). | 1 gün | F7, F8 |
| **F11 — Belgeleme** | `docs/adr/NNNN-aktivite-gunlugu.md`, `lib/aktivite/README.md`, `app/(panel)/aktivite-gunlugu/README.md`, CHANGELOG. | 1 saat | F10 |

**Toplam:** ~7-8 iş günü.

### 11.1 Aktivite Günlüğü DONE Kriteri (Kural 91 — okuma modülüne uyarlanmış)

`useOptimisticMutation` ve "audit log akıyor" bu sayfada **ANLAMSIZ** — sayfa CRUD yapmıyor, sadece okuyor (filtre kayıt etme gibi UI state mutasyonları varsa onlar TanStack Query cache içi, sunucuya yazım yok). Onun yerine:

- [ ] `lib/aktivite/tipler.ts` — public API stabil (eski doğrudan import noktaları geçişli)
- [ ] `lib/aktivite/zenginlestirici.ts` — saf modül, mevcut testler geçer
- [ ] `lib/aktivite/mesajlar/*.ts` — her dosya için unit test
- [ ] `lib/aktivite/anlati.ts` — her şablon için snapshot test (40-60 şablon)
- [ ] `lib/aktivite/kapsam.ts` — `kapsamBaglamiHazirla` + `kapsamWhere` ayrımı, RBAC matris birim testi (rol × kaynak_tip)
- [ ] `aktivite-gunlugu/services.ts` — Zod validate edilmiş filtre, kapsam matrisi uygulanmış, cursor pagination
- [ ] Server action `eylem()` wrapper'ı içinde, RBAC `yetkiZorunlu(...AKTIVITE_OKU)` (Kural 50)
- [ ] **Resource-level RBAC entegrasyon testi** — BA kullanıcısı yetkisiz kart aktivitesini servis seviyesinde alamıyor (ADR-0005)
- [ ] UI 360px screenshot (mobile-first, Kural 9)
- [ ] Filtre çubuğu mobile Sheet, desktop sticky bar (Kural 13)
- [ ] Cursor pagination çalışıyor (50/sayfa, "daha eski" yükleme)
- [ ] Virtualization devrede (`@tanstack/virtual`, 100+ satır için, Kural 96)
- [ ] URL sync — filtre değişikliği `pushState`, deep-link açılınca filtre dolu gelir
- [ ] Export yetkisi: `AKTIVITE_DISA_AKTAR` yoksa export butonu DOM'da YOK (UI kontrolü değil servis kontrolü ek olarak)
- [ ] Sidebar görünürlük testi: rol bazında menü item açık/kapalı (mevcut `sidebar-yetki.test.ts` deseni)
- [ ] E2E happy path geçiyor (Faz F10)
- [ ] Code review PASS

---

## 12. Karar Bekleyen Sorular

1. **Anlatı tonu:** Şablonlar resmi tam tamlama mı ("tamamlandı olarak işaretledi") yoksa kısa form mu ("kart tamamladı")? Default önerim **resmi tam tamlama**, ama makam'a sorulmalı. (Şablonlar kolay değişir; karar geç verilebilir.)
2. **`Yorum` aktivitesi mahremiyeti:** Bölüm 7'de "TAM metin" yazdım. Alternatif: BA/PR için "yorum yazdı" özet, sadece SA/KM tam metin. Hangisi?
3. **`Bildirim` & `BildirimMailKuyrugu` kayıtları:** Bölüm 7'de "default GİZLİ" işaretledim. SUPER_ADMIN forensik'te de gizlensin mi yoksa açılsın mı?
4. **`AktiviteLogu.sebep` alanı anlatıya:** Default önerim **EVET, parantez içinde** ("…sildi (gerekçe: kayıt mükerrer)"). Onay?
5. **Realtime aktivite akışı:** Socket.io ile canlı akacak mı yoksa "Yenile" butonuyla mı? Default önerim: **TanStack Query 30s polling**, realtime opsiyonel ileri faz.
6. **Dışa aktarma kapsamı:** `AKTIVITE_DISA_AKTAR` izni KAYMAKAM'a verildi (Bölüm 6.4). BA da export edebilsin mi (kendi kapsamında)?
7. **`/ayarlar/denetim` URL erişimi:** Sidebar gizleme + sayfa-içi `izinVarMi` yeterli (mevcut pattern). Path tamamen kapatılmasın. Onay?
8. **Ortak motor `lib/aktivite/` lokasyonu:** `lib/` altında mı kalsın yoksa `lib/audit/` altında mı (audit-middleware ile aynı namespace)? Default önerim: **`lib/aktivite/`** (audit = yazım, aktivite = okuma/sunum, ayrı domain).
9. **Şablon eksik kombinasyonu fallback:** Bilinmeyen `kategori.eylem` için fallback şablon "{kullanici}, {kategori-etiketi} kaydını {islemAdi}" yeterli mi yoksa kategori bazlı varsayılan şablon mu (örn. her `kart.*` için `"...kartını güncelledi"`)?
10. **Kullanıcı tablosundaki PII:** `Kullanici` kayıtları anlatıda email gösterilsin mi yoksa sadece "Ayşe Demir" gibi ad/soyad mı? Default önerim: **sadece ad/soyad**, email forensik'te.

---

## 13. Riskler

| Risk | Etki | Azaltma |
|---|---|---|
| **RBAC kapsam matrisi hatası → eksik/fazla kayıt gösterme** | Ya makam önemli aktiviteyi göremez (operasyon kaybı) ya da PR başkasının kart yorumunu görür (mahremiyet ihlali) | Bölüm 7 matris × rol birim testleri (Faz F4); F10 entegrasyon testleri; her `kaynak_tip` için en az 1 PR/BA negatif test |
| Şablon eksikliği → "diger" fallback'e düşme | Robot mesaja geri dönüş | Snapshot test bilinen tüm `kategori.eylem` kombinasyonları için zorunlu; CI'da kategori coverage raporu |
| Yeni izin migration prod'da boşa düşer | Kullanıcılar erişimi kaybeder | Seed migration'la varsayılan rollere izinleri otomatik atayan güvenli kod; rollback için ayrı migration; staging'de doğrula |
| `/ayarlar/denetim` URL'si crawler'a açık kalsa | Bilgi sızıntısı | Sayfa-içi `izinVarMi` zaten var; sadece sidebar gizlemek yetmez — kontrol mevcut |
| Performans (1M+ aktivite kaydı + büyük `in` listesi) | Sayfa yavaşlar | Index kontrolü (Bölüm 10), cursor pagination zorunlu, alternatif: erişim cache tablosu |
| Mevcut `son-aktiviteler.tsx` UI'sini bozma | Gerileme | F9'da tek cümle görünüm varsayılan yapılır; eski çipli görünüm kompakt kullanıcı tercihi olarak korunur |
| `lib/aktivite/` taşıma sırasında doğrudan import noktasını kaçırma | Build kırılır | F1'de `tsc --noEmit` + import araması ile import noktalarını listele, hepsini tek pas'ta güncelle |
| Mention'lı yorum içeriği kapsam dışı kullanıcıya sızar | Mahremiyet | Bölüm 7 — `Yorum` satırı kart kapsamı yoksa görünmez; mention çözüldükten sonra anlatıya girer |
| Şablon-bazlı yaklaşım onlarca cümle yazma yükü | Geliştirme süresi şişer | İlk sürümde sadece **en sık 30 kombinasyon** (Bölüm 4 örnekleri); gerisi fallback "diger" şablonu — ileri sprint'te genişletilir |
| `DenetimSatiri` tip değişikliği client kırar | TypeScript hatası | Tip değişikliği F8'de tek pas, optional alan olarak eklenebilir; geri uyumlu |

---

## 14. İlgili Dosyalar

### Veri katmanı (yazım yolu dokunulmaz)

- [lib/audit-middleware.ts](../../lib/audit-middleware.ts)
- [lib/audit-context.ts](../../lib/audit-context.ts)
- [lib/audit-kaynak-etiket.ts](../../lib/audit-kaynak-etiket.ts) — kaynak adı çıkarımı (kapsam motoru için de yararlı)
- [prisma/schema.prisma](../../prisma/schema.prisma) — `AktiviteLogu` model

### Anlam katmanı (YENİ — ortak motor)

- **Yeni:** `lib/aktivite/tipler.ts`
- **Yeni:** `lib/aktivite/zenginlestirici.ts` (eski `services.ts`'in saf kısmı)
- **Yeni:** `lib/aktivite/mesajlar/*.ts` (kategori bazlı, biri başına ~100 satır)
- **Yeni:** `lib/aktivite/anlati.ts` (şablon motoru)
- **Yeni:** `lib/aktivite/kapsam.ts` (RBAC kapsam matrisi)
- **Taşınır:** [app/(panel)/projeler/[projeId]/aktivite/services.ts](../../app/(panel)/projeler/[projeId]/aktivite/services.ts) → saf kısımlar `lib/aktivite/`'ye, route-bound kısımlar yerinde kalır

### İzin kataloğu (tek istisna — H4 notu)

- [lib/permissions-katalog.ts](../../lib/permissions-katalog.ts) — `AKTIVITE_OKU`, `AKTIVITE_DISA_AKTAR` eklenecek; `DENETIM_OKU` KAYMAKAM'dan çıkarılacak
- [lib/sidebar-yetki.ts](../../lib/sidebar-yetki.ts) — `AKTIVITE_GUNLUGU` menü kodu eklenecek
- Yeni Prisma migration — `Izin` tablosuna seed (idempotent upsert)

### Sunum katmanı

- **Yeni:** `app/(panel)/aktivite-gunlugu/` (5 katman)
- [app/(panel)/ayarlar/denetim/](../../app/(panel)/ayarlar/denetim/) — forensik moda evrilir; `actions.ts` `DenetimSatiri` tipi genişler
- [components/app-sidebar.tsx](../../components/app-sidebar.tsx) — sidebar item eklenecek
- [app/(panel)/ana-sayfa/components/son-aktiviteler.tsx](../../app/(panel)/ana-sayfa/components/son-aktiviteler.tsx) — küçük rötuş + link hedefi
- [app/(panel)/projeler/[projeId]/aktivite/components/](../../app/(panel)/projeler/[projeId]/aktivite/components/) — UI dokunulmaz, sadece import path değişir

### Test (yeni)

- `lib/aktivite/anlati.test.ts` — şablon snapshot testleri
- `lib/aktivite/kapsam.test.ts` — RBAC matris birim testleri (rol × kaynak_tip)
- `lib/aktivite/mesajlar/*.test.ts` — her kategori için
- `app/(panel)/aktivite-gunlugu/services.test.ts` — kapsam entegrasyonu
- `tests/e2e/aktivite-gunlugu.e2e.ts` — 3 viewport × 5 senaryo

### ADR çapraz referansları

- [ADR-0005 Resource-Level RBAC](../adr/0005-resource-level-rbac.md) — kapsam matrisinin temeli
- [ADR-0008 Birim Paylaşım Saf Modeli](../adr/0008-birim-paylasim-saf-model.md) — BA kapsamı için
- [ADR-0014 Granüler İzin Kataloğu](../adr/0014-granuler-izin-katalogu.md) — `AKTIVITE_OKU` kataloğa nasıl eklenir
- [ADR-0020 Çöp Kutusu / Sidebar RBAC](../adr/0020-cop-kutusu.md) — sidebar görünürlük pattern'i

---

## 15. Sonuç

Bu iş **sıfırdan bir log sistemi yazmak değil, mevcut iyi-yazılmış-ama-bağlanmamış katmanı doğru ekrana bağlamak, ortak motoru `lib/aktivite/`'ye çıkarmak, eksik fiilleri tamamlamak ve net bir RBAC kapsam matrisi koymak**.

Ağır iş üç noktada:

1. **`lib/aktivite/kapsam.ts`** — Bölüm 7 matrisinin doğru kodlanması (yanlışlık eksik veya fazla kayıt gösterir).
2. **`lib/aktivite/anlati.ts`** — şablon-bazlı, ~40-60 cümle, her biri test edilir.
3. **Eksik mesaj üreticileri** (Faz F2) — idari kayıtların robot mesajdan kurtarılması.

Geri kalan iskelet 1-2 günlük standart Pusula pattern'i.

**Sıradaki adım:** Bölüm 12'deki karar sorularına onay → F0 (ADR + izin matrisi) → F1 (ortak motor taşıma).
