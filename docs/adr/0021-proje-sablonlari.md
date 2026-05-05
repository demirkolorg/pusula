# ADR 0021 — Proje Şablonları (Sistem + Kullanıcı Şablonları)

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** `docs/plan.md` Bölüm 5 + Bölüm 6/#2, Sprint S7.

## Bağlam

Plan'ın 5. bölümünde "Proje şablonları (boş, klasik, kaymakamlık-onay-akışı)" ve 6. bölümünde "#2 Proje şablonları — Boş, klasik (Yapılacak/Devam/Bitti), kaymakamlık-onay-akışı, denetim-süreci hazır şablonları" maddeleri var. Bu ADR, şablon altyapısını, sistem vs. kullanıcı şablonları ayrımını, ve "şablondan proje oluştur" akışını kayıt altına alır.

## Karar

### 1) Veri Modeli — `ProjeSablonu` + `SablonListesi`

```prisma
model ProjeSablonu {
  id                String        @id @default(uuid()) @db.Uuid
  ad                String
  aciklama          String?
  kapak_renk        String?
  kapak_ikon        String?
  // Sistem şablonu mu? Kullanıcı silemez/düzenleyemez.
  // Sistem şablonları seed ile yüklenir, kod (kebab-case) sabittir.
  sistem_mi         Boolean       @default(false)
  // Sistem şablonları için stable kod — i18n + güncellemede referans.
  // Kullanıcı şablonlarında null.
  sistem_kodu       String?       @unique
  // Kim oluşturdu (kullanıcı şablonlarında zorunlu, sistem'de null)
  olusturan_id      String?       @db.Uuid
  silindi_mi        Boolean       @default(false)
  silinme_zamani    DateTime?
  olusturma_zamani  DateTime      @default(now())
  guncelleme_zamani DateTime      @updatedAt

  olusturan Kullanici?       @relation("SablonOlusturan", fields: [olusturan_id], references: [id])
  listeler  SablonListesi[]

  @@index([sistem_mi])
  @@index([silindi_mi])
}

model SablonListesi {
  id          String   @id @default(uuid()) @db.Uuid
  sablon_id   String   @db.Uuid
  ad          String
  // LexoRank — sıralama (boş şablonda tek liste, klasik'te 3 liste vb.)
  sira        String
  wip_limit   Int?

  sablon ProjeSablonu @relation(fields: [sablon_id], references: [id], onDelete: Cascade)

  @@index([sablon_id, sira])
}
```

**Neden ayrı tablolar?** Bir şablon birden çok liste tanımlar (örn. "Yapılacak / Devam / Bitti"). Listeler join tablo olmadan tek-tek satırlar; sıra ve wip_limit korunur.

**Neden kart şablonu yok (v1)?** Şablonlar sadece **boş listeler** içerir. Trello'da da şablonlar genelde liste yapısı + etiket havuzu sağlar; kartlar kullanıcıya bırakılır. Etiket şablonu da v2.

### 2) Sistem Şablonları (Seed ile yüklenir)

| Kod | Ad | Listeler |
|-----|-----|----------|
| `bos` | Boş Proje | (yok — sadece varsayılan Arşiv listesi otomatik eklenir) |
| `klasik` | Klasik (Yapılacak / Devam / Bitti) | Yapılacak, Devam Ediyor, Bitti |
| `kaymakamlik-onay-akisi` | Kaymakamlık Onay Akışı | Talep, İncelemede, Onay Bekliyor, Onaylandı, Reddedildi |
| `denetim-sureci` | Denetim Süreci | Plan, Hazırlık, Saha, Rapor Yazımı, Tamamlandı |

Sistem şablonları `prisma/seed.ts`'te ve yeni `prisma/seed/sablonlar.ts` modülünde tanımlanır. `sistem_kodu` **unique** — duplicate yüklemeyi engeller (idempotent seed).

### 3) Yetki

| Aksiyon | Kim |
|---------|-----|
| **Sistem şablonu görüntüle** | Tüm kullanıcılar |
| **Kullanıcı şablonu görüntüle** | Sadece kendi şablonu (kendi `olusturan_id`'si) |
| **Şablon oluştur** | `proje:create` izni olan herkes |
| **Şablon düzenle/sil** | Sadece şablon sahibi (`olusturan_id == kullaniciId`) — sistem şablonu DOKUNULMAZ |
| **Şablondan proje oluştur** | `proje:create` izni olan herkes |

Sistem şablonu silinmesini schema seviyesinde **engellemek için** servis tarafında check; DB constraint kullanmıyoruz (Prisma'da CHECK desteklenmez).

### 4) "Şablondan Proje Oluştur" Akışı

1. Kullanıcı `/projeler` sayfasında "Yeni Proje" butonuna basar.
2. **Yeni: dialog'da iki adım**
   - **Adım 1:** Şablon seç (kart-grid: sistem + kendi şablonları). "Boş" varsayılan.
   - **Adım 2:** Proje detayları (ad, açıklama, kapak rengi/ikonu — şablondan ön-doldurulur, kullanıcı düzenleyebilir).
3. Submit:
   - Yeni proje oluşturulur (mevcut `projeOlusturEylem`'e `sablonId` parametresi eklenir).
   - Şablonun `listeler[]`'ı kopyalanır (sıralama korunur).
   - Otomatik Arşiv listesi yine eklenir (ADR-0009 — sistem listesi).

**Mevcut kod etkisi:** `proje/services.ts:projeOlustur` fonksiyonuna opsiyonel `sablonId` parametresi eklenecek; verilmezse "boş şablon" mantığı çalışır (yalnızca Arşiv listesi).

### 5) UI — `/ayarlar/sablonlar`

Şablonların yönetildiği sayfa — kullanıcı kendi şablonlarını CRUD edebilir, sistem şablonlarını sadece görüntüler.

- Liste (kart-grid): kapak ikonu + ad + liste sayısı + sistem badge.
- Düzenle: dialog ile ad/açıklama/listeler ekle-çıkar-sırala.
- "Mevcut bir projeden şablon oluştur" (v2 — şablonu projeden eksport).

### 6) Optimistic & Audit

- Şablon CRUD optimistic (`useOptimisticMutation`).
- Şablondan proje oluşturma optimistic değil — server'da liste kopyalama transaction zorunlu (Kural 45), kullanıcı yükleme bekler.
- Audit middleware tüm `ProjeSablonu` ve `SablonListesi` yazımlarını otomatik loglar.

## Sonuçlar

- **Veri:** 2 yeni tablo — `ProjeSablonu`, `SablonListesi`.
- **Sistem şablonları:** 4 hazır (boş, klasik, onay, denetim) — seed ile.
- **Yetki:** sistem dokunulmaz; kullanıcı kendi şablonlarını yönetir.
- **Akış:** proje oluştur dialog'una 2-adım wizard.
- **UI:** `/ayarlar/sablonlar` yönetim sayfası (sidebar bağı).

## İlgili Kurallar

- **Kontrol Kural 38** — Prisma migrate dev (manuel SQL yok).
- **Kontrol Kural 45** — Şablondan proje oluşturma birden çok yazma → transaction.
- **Kontrol Kural 50** — RBAC her action başında.
- **Kontrol Kural 90** — 5 katman.
- **Kontrol Kural 81** — Sistem şablonu için faker kullanılmaz; sabit Türkçe metinler.

## Açık Sorular (v2)

- Etiket şablonu (her şablon için varsayılan etiket havuzu).
- Şablondan proje oluştururken birim/yetkili önceden tanımlama.
- "Mevcut projeyi şablona kaydet" — proje yapısını şablona kopyalama.
- Şablon paylaşma — başka kullanıcılarla şablon paylaşımı.
