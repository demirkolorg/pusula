# Kaymakamlık Görev Yönetimi — Proje Planı

> Trello tarzı, kanban tabanlı, kaymakamlık kurumlarına özel proje/görev takip yazılımı.
> **Tarih:** 2026-05-03 · **Durum:** Plan onaylandı, S0'a hazır

---

## 1. Karar Özeti

| Konu | Karar |
|------|-------|
| Proje | Sıfırdan yeni Next.js |
| Tenant | Single-tenant (kuruma özel deployment) |
| Stack | Next.js 16 (App Router) + Postgres + Prisma + NextAuth + shadcn/ui |
| Drag-drop | dnd-kit |
| Tablo | **TanStack Table (headless)** + shadcn DataTable wrapper |
| Server state | **TanStack Query** |
| Liste virtualization | **TanStack Virtual** (100+ satır) |
| Client state | **Zustand** |
| Realtime | Socket.io (self-hosted) |
| Dosya | MinIO (S3 API uyumlu, self-hosted) |
| Bildirim | In-app + **Sonner toast** (genişletilebilir) |
| UI yaklaşımı | **Mobile-first** (önce mobil, sonra desktop) |
| UX hızı | **Optimistic UI** (her etkileşim anında — sunucu beklenmeden UI güncellenir, hata olursa rollback + Sonner) |
| Arama | **Global full-text search** (kart, yorum, eklenti, kullanıcı, birim, log) — Postgres `tsvector` |
| Audit log | **Çekirdek düzeyinde** — kim/ne/nerede/ne zaman/nasıl + diff (eski→yeni) |
| Hata log | **Çekirdek düzeyinde** — stack trace + request context + user context |
| Paket yöneticisi | **Bun** (zorunlu — npm/pnpm/yarn yasak) |
| MVP kapsam | Trello klonu seviyesi |
| Resmi entegrasyon | MVP'de yok, v2'ye |

---

## 1.5 Çekirdek İlkeler — En Baştan Dikkat

> Bu 6 madde **ilk satır kod yazılmadan önce** mimariye gömülecek. Sonradan eklemek 10x maliyet.

### A. Global Search (Tam Kapsamlı)

**Hedef:** Tek arama kutusundan kart, yorum, kontrol maddesi, eklenti adı, kullanıcı, birim, etiket, audit log, projenin adı — hepsi aranabilir.

**Mimari:**
- **Postgres `tsvector` + GIN index** (hızlı, ek altyapı yok, Türkçe stemmer destekli)
- Her aranabilir tablo için `arama_vektoru tsvector` kolonu + trigger ile otomatik güncellenir
- Türkçe için `tsconfig` özel ayarı (`turkish` config + custom stop-word listesi)
- Sonuç tipi (`kart`, `yorum`, `kullanıcı`, `birim`, `eklenti`, `log`) gruplandırılarak döner
- Yetki filtresi **DB seviyesinde** uygulanır (kullanıcının erişemediği kart sonuçta gözükmez)
- Komut paleti tarzı UI (`Cmd/Ctrl+K`) → `/api/arama?q=...&tip=hepsi|kart|yorum|...`
- Fuzzy match için `pg_trgm` ek olarak (yazım hatası toleransı)
- v2: Eskalasyon gerekirse Meilisearch/Typesense ekleyebiliriz

**Tablolar:**
```
ArananIcerik                            (materialized view, tüm aranabilir kayıtlar tek view'da)
  - kaynak_tip (KART|YORUM|KULLANICI|...)
  - kaynak_id
  - baslik, ozet, etiketler[], yetki_filtresi[]
  - arama_vektoru (GIN index)
```

### B. Çekirdek Audit Log (Değişiklik İzleme)

**Hedef:** Sistemde olan **her değişiklik** loglanır. "Şu kart 3 gün önce kim tarafından nasıl değişti, eski açıklaması neydi?" sorusunun cevabı 1 sn içinde alınır.

**Mimari:**
- **Prisma middleware** (`prisma.$use`) — tüm `create/update/delete` operasyonlarını yakalar, audit tablosuna yazar
- **DB trigger fallback** — direkt SQL ile yapılan değişiklikler için Postgres trigger
- **Diff bazlı** — değişen alanlar JSON'da tutulur (eski → yeni)
- **Context bilgisi** — kim (`kullanici_id`), nerede (IP, user-agent, sayfa), ne zaman (timestamp + timezone), nasıl (HTTP metod, route, request_id), neden (yorum/sebep alanı opsiyonel)

**Audit tablosu şeması:**
```
AktiviteLogu
  id                 BIGSERIAL
  zaman              TIMESTAMPTZ          -- ne zaman
  kullanici_id       UUID                 -- kim
  oturum_id          UUID                 -- hangi oturum
  ip                 INET                 -- nereden (IP)
  user_agent         TEXT                 -- hangi cihaz/tarayıcı
  request_id         UUID                 -- istek korelasyon ID
  http_metod         TEXT                 -- GET/POST/PUT/DELETE
  http_yol           TEXT                 -- /api/kartlar/123
  islem              TEXT                 -- CREATE|UPDATE|DELETE|VIEW|LOGIN|...
  kaynak_tip         TEXT                 -- KART|YORUM|KULLANICI|...
  kaynak_id          TEXT                 -- ilgili kaydın ID'si
  eski_veri          JSONB                -- değişiklik öncesi tam snapshot
  yeni_veri          JSONB                -- değişiklik sonrası tam snapshot
  diff               JSONB                -- {alan: {eski, yeni}} sadece değişenler
  meta               JSONB                -- ek context (mention'lar, etkilenen ID'ler)
  sebep              TEXT                 -- opsiyonel kullanıcı notu
```

**İndeksler:** `(kaynak_tip, kaynak_id, zaman DESC)`, `(kullanici_id, zaman DESC)`, GIN on `diff`

**Saklama:** 1 yıl hot, sonra cold storage (aylık partition + pg_partman)

**UI:**
- Kart detayında "Sürüm Geçmişi" sekmesi → o karta ait tüm log
- Kullanıcı profilinde "Etkinliklerim" sekmesi
- Yöneticiler için `/ayarlar/denetim` → tam log gezgini (filtre, arama, export)
- Her log kaydı **tıklanabilir** → diff modal (yan yana eski/yeni)

### C. Çekirdek Hata Logu (Error Tracking)

**Hedef:** Sistemde oluşan **her hata** (frontend + backend) yakalanır, context ile birlikte saklanır, monitoring panelinde görünür.

**Mimari:**
- **Backend:** Next.js global error handler + API route try/catch wrapper + `unhandledRejection` listener
- **Frontend:** React Error Boundary + `window.onerror` + `unhandledrejection` event
- Tüm hatalar `/api/log/hata` endpoint'ine veya doğrudan Prisma'ya yazılır
- **Pino** (Node) + **structured JSON log** → DB + dosya (rotating)
- **Request ID propagation** → her isteğe `X-Request-Id` header, log + audit + hata kaydı bu ID ile bağlanır
- v2: Sentry self-hosted entegrasyonu opsiyonel

**Hata tablosu şeması:**
```
HataLogu
  id                 BIGSERIAL
  zaman              TIMESTAMPTZ
  seviye             TEXT                 -- DEBUG|INFO|WARN|ERROR|FATAL
  taraf              TEXT                 -- BACKEND|FRONTEND
  request_id         UUID                 -- audit ile korelasyon
  kullanici_id       UUID                 -- (varsa)
  oturum_id          UUID
  ip                 INET
  user_agent         TEXT
  url                TEXT                 -- frontend için window.location, backend için route
  hata_tipi          TEXT                 -- TypeError, PrismaError, ValidationError...
  mesaj              TEXT
  stack              TEXT                 -- tam stack trace
  http_metod         TEXT
  http_durum         INT                  -- 500, 400 vs.
  istek_govdesi      JSONB                -- payload (hassas alanlar maskelenmiş)
  istek_basliklari   JSONB                -- (auth header maskelenmiş)
  ekstra             JSONB                -- component, action, breadcrumbs vs.
  cozuldu_mu         BOOLEAN              -- yönetici "incelendi/çözüldü" işaretleyebilir
  cozum_notu         TEXT
```

**UI:**
- `/ayarlar/hata-loglari` sayfası — yöneticiler için
- Filtre: seviye, taraf, kullanıcı, tarih, çözülmüş/çözülmemiş
- "Aynı hata grubu" kümeleme (mesaj + stack ilk 3 satır hash'i)
- Realtime alarm — FATAL/ERROR seviyesi gelince bildirim merkezine düşer

### D. Mobile-First Yaklaşım

**Hedef:** Önce 360-414px ekran için tasarla, sonra tablet ve desktop'a genişlet. Drag-drop dahil tüm etkileşimler dokunmatikte birinci sınıf çalışır.

**Mimari:**
- **Tailwind responsive** — varsayılan stil = mobile, `sm:`/`md:`/`lg:` ile büyütme
- **Touch-friendly drag-drop** — dnd-kit `TouchSensor` + `PointerSensor` birlikte, 250ms long-press aktivasyonu
- **Mobile kanban** — yatay swipe ile listeler arası geçiş, kart detay full-screen drawer
- **Bottom navigation** mobilde — desktop'ta sidebar
- **Komponent breakpoint'leri** ortak `useBreakpoint()` hook'u
- **Hit target minimum 44x44px** (Apple HIG)
- **Klavye kısayolları** desktop, **gesture'lar** mobile (swipe-to-archive, long-press toplu seçim)
- **Önce küçük tasarla** — her component PR'ı 360px ekran screenshot'ı ile gelir
- **Test stratejisi:** Playwright her testi 3 viewport'ta çalıştırır (mobile/tablet/desktop)

**Komponent ipuçları:**
- Kart çekmece → mobilde tam ekran, desktop'ta sağdan slide
- Bildirim merkezi → mobilde tam sayfa, desktop'ta dropdown
- Tablolar → mobilde card-based liste, desktop'ta tabular
- Modal'lar → mobilde sheet (alttan), desktop'ta center modal

### E. Sonner Bildirim Sistemi (Toast)

**Hedef:** Tüm geçici kullanıcı bildirimleri (başarı, hata, bilgi, undo) **Sonner** ile tek tip ve tutarlı.

**Mimari:**
- **shadcn/ui Sonner** wrapper kurulumu (`<Toaster richColors closeButton position="top-right" />`)
- Mobilde `position="top-center"`, desktop'ta `top-right`
- **Wrapper helper** — `lib/toast.ts`:
  ```ts
  toast.basari("Kart kaydedildi")
  toast.hata("Kart kaydedilemedi", { aciklama: error.message })
  toast.bilgi("Çevrimdışısınız, değişiklikler senkronize edilecek")
  toast.uyari("Bu kart 3 gün gecikti")
  toast.gerial(action, "Kart silindi", { onUndo: () => restore(id) })  // undo desteği
  toast.yukleniyor(promise, { yukleme, basari, hata })                  // promise toast
  ```
- **Realtime entegrasyon** — Socket.io event'leri Sonner'a bağlanır
  - "Ahmet sana bir görev atadı" → tıklanınca karta yönlendirir
  - "@mention edildiniz" → tıklanınca yoruma yönlendirir
- **Bildirim merkezi (kalıcı)** ile fark:
  - Sonner = geçici, görsel feedback (5sn)
  - `/bildirimler` = kalıcı, listelenen, okundu/okunmadı durumlu
- **Error boundary entegrasyonu** — yakalanan hatalar otomatik `toast.hata()` (development'ta), production'da daha kibar mesaj
- **Action toast** — kritik bildirimler için aksiyon butonu ("Görüntüle", "Geri Al", "Onayla")
- **Throttle** — aynı tipte ardışık 5+ toast → tek tane "5 yeni bildirim" özetine sıkıştırılır

### F. Optimistic UI (Anında Tepki)

**Hedef:** Kullanıcı bir aksiyon yaptığında (kart taşıma, etiket ekleme, yorum yazma, isim değiştirme, üye atama, tamamlandı işaretleme, silme, arşivleme...) UI **0ms** içinde güncellenir. Sunucu yanıtı beklenmez. Hata olursa otomatik rollback + Sonner.

**Felsefe:**
- Kullanıcı **asla "yükleniyor..." spinner'ı görmemeli** rutin etkileşimlerde
- "Tıkla → bekle → gör" değil, "tıkla → gör → (arka planda doğrula)"
- Sunucu reddederse: state geri al + `toast.hata("İşlem başarısız", { aciklama, geriAl: false })`

**Mimari (TanStack Query):**
- Her mutation'da `onMutate` + `onError` + `onSettled` üçlüsü ZORUNLU:
  ```ts
  useMutation({
    mutationFn: kartGuncelle,
    onMutate: async (yeni) => {
      await queryClient.cancelQueries({ queryKey: ['kart', yeni.id] })
      const onceki = queryClient.getQueryData(['kart', yeni.id])
      queryClient.setQueryData(['kart', yeni.id], (old) => ({ ...old, ...yeni }))
      return { onceki }       // rollback context
    },
    onError: (err, yeni, ctx) => {
      queryClient.setQueryData(['kart', yeni.id], ctx?.onceki)
      toast.hata('Kart güncellenemedi', { aciklama: err.message })
    },
    onSettled: (_, __, yeni) => {
      queryClient.invalidateQueries({ queryKey: ['kart', yeni.id] })
    },
  })
  ```
- **Geçici ID** — yeni oluşturulan kayıtlar için `temp-<nanoid>` ID, sunucudan gerçek ID gelince swap
- **Sıra çakışması (drag-drop)** — fractional indexing veya `LexoRank` ile, server reddederse sadece etkilenen kart geri döner (tüm liste değil)

**Realtime ile birleşim (Bölüm 1.5/E ile çakışmasın):**
- Optimistic update **kendi aksiyonum için** anında
- Socket.io event'i **başkasının aksiyonu için** gelir
- Kendi aksiyonun socket echo olarak geri gelirse → `request_id` ile filtrele (kendi event'ini yoksay)

**Hangi aksiyonlar Optimistic? (varsayılan: HEPSİ)**

| Aksiyon | Optimistic? | Not |
|---------|-------------|-----|
| Kart oluştur | ✅ | Geçici ID, sunucu ID swap |
| Kart taşı (drag) | ✅ | Sıra anında değişir |
| Kart düzenle (başlık/açıklama/etiket/üye/tarih) | ✅ | Inline edit anında commit |
| Yorum yaz | ✅ | Yorum hemen görünür, fail → "❌ gönderilemedi" rozeti |
| Kontrol maddesi tikle | ✅ | Anında işaretlenir |
| Sil / arşivle | ✅ | Kart hemen kaybolur, undo toast 5sn (Kural 65) |
| Liste/proje rename | ✅ | Anında değişir |
| Reaksiyon ekle (emoji) | ✅ | Anında görünür |
| Eklenti yükle | ❌ | Progress bar gerçek (boyut > 0), ancak metadata optimistic |
| Toplu işlem (50+ kayıt) | ⚠️ | Kullanıcıya "X kayıt işleniyor" feedback, batch fail → kısmi rollback |
| Login / parola değiştir | ❌ | Güvenlik kritik, gerçek yanıt beklenir |
| Ödeme / kritik onay | ❌ | (MVP'de yok) |

**UI sinyalleri:**
- Optimistic state'te kayıt **soluk değil** (kullanıcı farkı hissetmemeli)
- Senkronizasyon başarısızsa kart köşesinde küçük `⚠` ikonu + tooltip: "Sunucuyla senkronize edilemedi, tekrar dene"
- Çevrimdışı durumda mutation'lar kuyruğa alınır (TanStack Query `networkMode: 'offlineFirst'`)

**Test:**
- Her optimistic mutation için 3 test: happy path, server error rollback, network timeout rollback
- E2E (Playwright): network throttle ile "fast 3G" altında bile UI lag olmamalı

---

## 2. Domain Modeli — Kaymakamlık Yapısı

```
Kurum (1) ─ tek kayıt, "Tekman Kaymakamlığı"
  │
  ├── Makam katmanı (sanal — birim_id = null)
  │     • Süper Admin (rol: SUPER_ADMIN)
  │     • Kaymakam    (rol: KAYMAKAM)
  │     • Kaymakam Yardımcısı (rol: KAYMAKAM — kaymakamla aynı işleyiş)
  │
  ├── Birim (n)
  │     • Özel Kalem
  │     • Yazı İşleri Müdürlüğü
  │     • İlçe Yazı İşleri
  │     • Sosyal Yardımlaşma
  │     • Nüfus Müdürlüğü
  │     • (her birim hiyerarşik olabilir, alt birim destekli)
  │
  ├── Kullanıcı (n)
  │     • Makam'da (birim_id = null) → SUPER_ADMIN, KAYMAKAM
  │     • Birime bağlı (birim_id = X) → BIRIM_AMIRI, PERSONEL
  │     • Bir veya birden çok rol
  │     • Aktif/pasif, izinli vs.
  │
  └── Proje (Project) (n)                  ← veri modeli
        │   (UI'da iki görünüm tipi var: Pano/Kanban + Liste)
        ├── Liste (Column) (n)
        │     └── Kart (Görev) (n)
        │           ├── Etiketler
        │           ├── Üyeler (kart üyeleri)
        │           ├── Tarihler (başlangıç/bitiş + hatırlatıcı)
        │           ├── Kontrol Listesi (n) → Madde (n)
        │           ├── Yorum (n)
        │           ├── Eklenti (n) → MinIO
        │           ├── Kapak (renk veya görsel)
        │           ├── Aktivite/Log
        │           └── İlişki (blocks, related, duplicates)
```

### Rol Modeli (RBAC)

| Rol | Yetki Özeti |
|-----|-------------|
| `SUPER_ADMIN` | Sistem ayarları, tüm projeler, kullanıcı yönetimi |
| `KAYMAKAM` | Tüm projeleri görür, onay, denetim, raporlar |
| `BIRIM_AMIRI` | Kendi biriminin projeleri + atandığı projeler |
| `PERSONEL` | Atandığı projeler + atandığı kartlar |

Yetkiler **permission bazlı** (granular): `proje:create`, `kart:edit`, `user:invite`, `audit:read`, vs.
Roller bu izinleri gruplar. UI'dan rol-izin matrisi düzenlenebilir.

### Makam Katmanı (Birime Bağlı Olmayan Kullanıcılar)

Kaymakam ve sistem yöneticileri **herhangi bir birime bağlı değildir**; kuruma doğrudan bağlıdır. Schema'da bu durum `Kullanici.birim_id = null` ile temsil edilir.

| Kural | Detay |
|-------|-------|
| **Hangi roller `birim_id = null` olabilir?** | `SUPER_ADMIN`, `KAYMAKAM` |
| **Kaymakam Yardımcısı** | `KAYMAKAM` rolüyle aynı (işleyişte fark yok). Ayrı rol/birim yok. |
| **Validation** | `BIRIM_AMIRI` ve `PERSONEL` için `birim_id` **zorunlu** — Zod refine reddetsin (hata fırlatsın). |
| **Yetki kontrolü** | `KAYMAKAM` ve `SUPER_ADMIN` rolleri **birim filtresini her zaman atlar** → kurumun tamamına erişim. |
| **UI etiketi** | Birim alanı boş kullanıcılar için **"Makam"** rozeti. i18n: `birim.makam = "Makam"`. |
| **Birim formu** | Rol KAYMAKAM/SUPER_ADMIN seçildiğinde birim alanı disabled + üzerinde "Makam" yazılı. |
| **Birim bazlı raporlar** | Makam kullanıcıları ayrı bölüm ("Makam: 2 kişi") olarak listelenir. |
| **Audit log** | Birim alanı null kalır, gezgin "Makam" olarak render eder. |

---

## 3. Prisma Schema (özet)

### Tablolar

```
Kurum                                   (tek satır — single tenant)
Birim                                   (parent_id ile self-reference)
Kullanici                               (birim_id, password_hash, mfa_secret)
Rol  ─ İzin                             (RBAC matrisi)
KullaniciRol                            (n-n)

Proje                                   (project — veri modeli; UI'da Pano/Liste görünümü)
ProjeUyesi                              (kim bu projede yetkili, level)
Liste                                   (column, sıra, arşiv flag)
Kart                                    (sıra, durumu, kapak_renk, kapak_dosya_id)
KartUyesi                               (n-n)
Etiket                                  (proje-scoped, renk + ad)
KartEtiket                              (n-n)
KontrolListesi                          (kart_id, baslik, sıra)
KontrolMaddesi                          (liste_id, metin, tamamlandi, atanan_id, son_tarih)
Yorum                                   (kart_id, yazar_id, içerik, mention_user_ids[])
Eklenti                                 (kart_id, dosya_url, mime, boyut, yukleyen_id)
KartIliskisi                            (kart_a, kart_b, tip: BLOCKS|RELATES|DUPLICATES)
ProjeSablonu                            (template)

Bildirim                                (kullanici_id, tip, kaynak_tip, kaynak_id, okundu)
BildirimAyari                           (kullanici_id, tip, kanal, açık/kapalı)

AktiviteLogu                            (audit — bkz. Bölüm 1.5/B, çekirdek seviye)
HataLogu                                (error tracking — bkz. Bölüm 1.5/C)
ArananIcerik                            (materialized view — global search, bkz. Bölüm 1.5/A)
Oturum                                  (NextAuth)
SifirlamaTokeni
DavetTokeni
```

### Kritik İndeksler

- `kart(liste_id, sira)` — kanban sıralama
- `bildirim(kullanici_id, okundu, created_at)` — bildirim merkezi
- `aktivite(kaynak_tip, kaynak_id, created_at)` — kart aktivite paneli

---

## 4. Klasör Yapısı (özellik-bazlı)

```
app/
├── (auth)/
│   ├── giris/
│   ├── parola-sifirla/
│   └── davet/[token]/
├── (panel)/
│   ├── layout.tsx                      # Sidebar + topbar + bildirim çanı
│   ├── ana-sayfa/
│   ├── projeler/
│   │   ├── page.tsx                    # Proje listesi (grid)
│   │   ├── [projeId]/
│   │   │   ├── page.tsx                # Pano (Kanban) görünümü — varsayılan
│   │   │   ├── liste/                  # Liste (tablo) görünümü
│   │   │   ├── takvim/                 # Takvim görünümü (v1.1)
│   │   │   └── ayarlar/
│   │   └── components/
│   ├── kartlar/[kartId]/page.tsx       # Deep-link kart sayfası
│   ├── bildirimler/
│   ├── ayarlar/
│   │   ├── kurum/                      # Kurum bilgileri
│   │   ├── birimler/
│   │   ├── kullanicilar/
│   │   ├── roller/                     # Rol-izin matrisi
│   │   └── etiketler/                  # Global etiket havuzu
│   └── arama/
├── api/
│   ├── auth/[...nextauth]/
│   ├── projeler/
│   ├── kartlar/
│   ├── bildirimler/
│   ├── eklenti/                        # MinIO presigned URL
│   └── socket/                         # Socket.io endpoint
└── server/
    ├── db.ts                           # Prisma client
    ├── auth.ts                         # NextAuth config
    ├── rbac.ts                         # İzin kontrolü helper
    ├── audit.ts                        # Aktivite log helper
    ├── notify.ts                       # Bildirim üretici
    └── storage.ts                      # MinIO client
components/
├── ui/                                 # shadcn primitives
├── tablo/                              # TanStack Table wrapper (DataTable, kolon helper'ları)
├── kanban/                             # Liste, Kart, Sürükle-bırak
├── kart-cekmece/                       # Trello-vari kart detay drawer
└── bildirim/                           # Çan, dropdown, liste
lib/
├── permissions.ts
├── socket-client.ts
└── validators/                         # Zod şemaları
```

---

## 5. Trello Klonu — MVP Özellik Listesi

### Proje düzeyi
- Proje oluştur/sil/arşivle, kapak rengi, açıklama
- Proje üyesi ekle/çıkar, üye rolü (admin/normal/izleyici)
- Proje ayarları (kim kart oluşturabilir, yorum yazabilir vs.)
- Proje şablonları (boş, klasik, kaymakamlık-onay-akışı)

### Liste (kolon)
- Liste ekle, yeniden adlandır, sırala (drag), arşivle
- Liste sınırı (WIP limit) opsiyonel

### Kart
- Başlık, açıklama (markdown), kapak rengi/görseli
- **Etiketler** — renk + ad, proje-scoped
- **Tarihler** — başlangıç + bitiş + hatırlatma + tekrarlayan
- **Kontrol listesi** — alt başlıklı, atanan kişi + son tarih
- **Üyeler** — kart üyeleri (atama)
- **Yorumlar** — markdown, mention (@kullanici), düzenleme/silme
- **Eklenti** — MinIO upload, önizleme (resim/PDF), boyut limiti
- **Aktivite (log)** — tüm değişiklikler kronolojik
- **İlişkiler** — blocks/related/duplicates
- **Kapak** — renk paleti veya yüklenmiş görsel
- **Kart taşıma** — drag-drop liste içi/arası
- **Kart kopyalama, arşivleme, silme**
- **Deep link** — `/kartlar/[kartId]` paylaşılabilir

### Görünümler (proje içinde)
- **Pano (Kanban)** — varsayılan, drag-drop liste/kart
- **Liste** — tablo, sıralama/filtreleme/sıkıştırma
- *(v1.1)* Takvim — tarih atanmış kartlar

> MVP'de iki görünüm tipi: **Pano** ve **Liste**. Her proje aynı kartları iki farklı şekilde gösterir.

### Filtre & Arama
- Proje içi filtre — etiket, üye, tarih, anahtar kelime (her iki görünümde de geçerli)
- Genel arama — `/arama?q=...` (kart başlık, açıklama, yorum, ek)

### Bildirim
- Kart üyesi olduğun karta yorum/değişiklik
- Sana atanan kart, kontrol maddesi
- Mention edildiğin yorum
- Yaklaşan deadline (1 gün önce, kişiye göre özelleştirilebilir)
- Bildirim merkezi — okundu/okunmadı, filtre, "tümünü okundu işaretle"
- Bildirim tercihleri — olay × kanal matrisi

### Audit / Etkinlik
- Kullanıcı bazlı aktivite (`Kullanıcı X 14:30'da Kart Y'ye yorum ekledi`)
- Proje bazlı zaman tüneli
- Kurum bazlı denetim raporu (yöneticiler için)

### Yönetim
- Kullanıcı CRUD, davet (token + paylaş)
- Birim hiyerarşisi
- Rol-izin matrisi (UI'dan düzenlenebilir)
- Etiket havuzu (kurum geneli)
- Çöp kutusu (soft delete + 30 gün sonra hard delete)
- Yedek alma (DB dump tetikleme — opsiyonel)

---

## 6. Ek Özellikler — Kapsam Kararı

### MVP'ye dahil

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **@Mention sistemi** | Yorum içinde `@kullanici` autocomplete, mention edilene bildirim |
| 2 | **Proje şablonları** | Boş, klasik (Yapılacak/Devam/Bitti), kaymakamlık-onay-akışı, denetim-süreci hazır şablonları |
| 3 | **Çöp kutusu (soft delete)** | Silinen kart/liste/proje 30 gün geri yüklenebilir, sonra hard delete |
| 4 | **Sürüm geçmişi (kart bazlı)** | Kartın her alanı için eski/yeni değer log'u, "Kim ne değiştirdi?" paneli |
| 5 | **Karanlık/açık tema** | shadcn next-themes, kullanıcı tercihi DB'ye yazılır |
| 6 | **Klavye kısayolları** | `N` yeni kart, `/` arama, `Esc` kapat, `P` proje değiştir, `?` yardım menüsü |
| 7 | **Toplu işlem** | Çoklu kart seçimi → toplu taşı/etiketle/üye ekle/arşivle/sil |
| 10 | **Aktivite akışı (timeline)** | Proje bazlı son 7 gün özeti, kullanıcı bazlı zaman çizelgesi |
| 12 | **Mobil web (responsive)** | Tablet/telefon için touch-friendly drag-drop, responsive sidebar |

### v1.1'e ertelenen

| # | Özellik | Neden Sonraya |
|---|---------|---------------|
| 8 | Kayıtlı görünümler | Filtre + arama yeterli, "kayıtlı" özelliği erteleniyor |
| 9 | CSV export | Rapor ihtiyacı belirtildiğinde eklenecek |
| 11 | Otomasyon kuralları | Kompleks, MVP sonrası kullanım pattern'lerine göre tasarlanmalı |
| 13 | 2FA / TOTP | Kurumsal güvenlik gereksinimi netleştiğinde |
| 14 | KVKK aydınlatma | Hukuki metin hazırlandıktan sonra |

---

## 7. Sprint Planı

| Sprint | Süre | Çıktı |
|--------|------|-------|
| **S0 — İskelet + Çekirdek Altyapı** | 5 gün | Next.js + Bun + Prisma + NextAuth + shadcn + Docker compose (Postgres + MinIO + Socket.io). **TanStack Query/Table/Virtual provider'ları**, **DataTable wrapper iskeleti**, **Pino logger + request_id middleware (1.5/C)**, **Sonner kurulumu + wrapper (1.5/E)**, **mobile-first Tailwind config + breakpoint hook (1.5/D)**, **next-themes**, **Prisma audit middleware iskeleti (1.5/B)**, **`useOptimisticMutation()` wrapper + geçici ID üretici + offlineFirst networkMode (1.5/F)**, CI. |
| **S1 — Auth + Kullanıcı** | 4 gün | Giriş/çıkış/parola sıfırlama, davet token. Birim CRUD. Kullanıcı CRUD + rol atama. Audit middleware tüm yazımları yakalıyor. |
| **S2 — RBAC + Audit + Hata Logu + Sürüm Geçmişi** | 5 gün | İzin matrisi, middleware. **AktiviteLogu tablo + diff (1.5/B)**, **HataLogu tablo + frontend Error Boundary + backend error handler (1.5/C)**, denetim/hata-logu yönetici sayfaları, **kart bazlı sürüm geçmişi UI (#4)**. |
| **S3 — Proje + Liste + Kart (CRUD)** | 5 gün | Proje veri modeli, **Pano (Kanban) görünümü** + **Liste görünümü** iskeleti (dnd-kit), drag-drop proje içi/arası, kart çekmece (drawer). **Tüm CRUD optimistic (1.5/F)** — kart oluştur/taşı/sil/rename anında, rollback testleri. **Responsive iskelet (#12)**. |
| **S4 — Kart Detay (Trello özellikleri)** | 8 gün | Etiket, tarih, kontrol listesi, üye, yorum, eklenti (MinIO), kapak, ilişki. **Tüm alan değişiklikleri optimistic (1.5/F)** — yorum/etiket/tarih/checklist anında görünür. Eklenti upload progress gerçek, metadata optimistic. **@Mention autocomplete (#1)**. |
| **S5 — Realtime + Bildirim** | 4 gün | Socket.io entegrasyonu, presence, bildirim merkezi, push (in-app), mention bildirimi. **Optimistic + realtime echo filtresi (request_id ile kendi event'ini yoksay, 1.5/F)**. |
| **S6 — Görünüm Polish + Global Search + Filtre + Timeline** | 6 gün | Pano/Liste görünümleri arasında geçiş, proje içi filtre. **Global search: tsvector kolonları + GIN index + ArananIcerik view + komut paleti (Cmd/Ctrl+K) UI (1.5/A)**, fuzzy match (pg_trgm), Türkçe stemmer. **Aktivite timeline (#10)**. (Takvim görünümü v1.1'e ertelendi) |
| **S7 — Şablon + Çöp + Toplu İşlem + Kısayol** | 5 gün | **Proje şablonları (#2)**, **çöp kutusu (#3)**, **toplu işlem (#7)**, **klavye kısayolları (#6)**, mobile polish (#12). |
| **S8 — Test + Sertleştirme** | 5 gün | E2E (Playwright — **3 viewport: mobile/tablet/desktop**), **fast 3G throttle altında optimistic UI lag testi (1.5/F)**, yük testi, deploy runbook, log retention/partition setup, audit log export aracı. |

**Toplam: ~46 iş günü (~9-10 hafta tek geliştirici)**

---

## 8. Açık Sorular

1. Sprint sıralaması uygun mu? (Örn. "Bildirim önemli, S5 yerine S2'den sonra yap" gibi tercih var mı?)
2. Dosya boyut limiti? (Eklenti başına maksimum kaç MB?)
3. Kullanıcı sayısı tahmini? (Performans/sertleştirme planı için)
4. Domain & SSL — `pusulaportal.com` mu kullanılacak yoksa kuruma özel mi?

---

## 9. Sonraki Adım

Bölüm 8'deki sorulara karar verildikten sonra **S0 — İskelet** sprintine başlanır:
- `bun create next-app`
- Prisma init + schema (Bölüm 3)
- Docker compose (Postgres 16 + MinIO + Redis opsiyonel)
- shadcn init + tema
- TanStack Query/Table/Virtual provider'lar + DataTable wrapper
- NextAuth credentials provider iskeleti
- ESLint + Prettier + husky + lint-staged
- GitHub Actions CI (typecheck + test + build)
