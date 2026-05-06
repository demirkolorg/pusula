# ADR-0028 — Dosya Yönetimi Çekirdek Modeli

- **Tarih:** 2026-05-06
- **Durum:** Kabul edildi
- **İlgili plan:** [docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md](../issues/2026-05-06-dosya-yonetimi-modulu-plani.md)
- **İlgili kural:** Kontrol Bölüm B/E/G/H (TR identifier, feature folder, Prisma, server actions), Bölüm J (audit), Bölüm L (güvenlik/upload), Bölüm O (5 katman), Bölüm S (optimistic UI), Bölüm V/146 (resource-level RBAC)
- **İlgili ADR:** ADR-0005 (resource-level RBAC), ADR-0014 (granüler izin kataloğu), ADR-0017 (global arama tsvector), ADR-0020 (çöp kutusu), ADR-0024 (sidebar RBAC görünürlük), ADR-0027 (aktivite günlüğü)

## Bağlam

Pusula'da dosya bugün yalnızca kart detayındaki **Eklenti** akışı üzerinden var.
`Eklenti.kart_id` zorunlu olduğu için dosya, kart dışındaki kaynaklara
bağlanamıyor. Bu kısıt aşağıdaki kurumsal ihtiyaçları karşılamıyor:

- Tüm dosyaları tek merkezden (`/dosyalar`) görme.
- Aynı binary'nin birden fazla karta/projeye/listeye bağlanabilmesi.
- Dosya adı/açıklama/etiket/gizlilik üzerinde merkezi düzenleme.
- Kart kapsamından bağımsız ama kaynak erişimiyle uyumlu RBAC.
- Tür bazlı önizleme, sürümleme, retention, orphan temizliği, indirme/önizleme
  audit'i.

Mevcut tabloyu büyütmek (`Eklenti`'ye opsiyonel `proje_id`/`liste_id` eklemek)
şu sorunları üretiyordu:

1. `kart_id` NOT NULL kısıtını gevşetmek geçmiş audit semantiğini bozar.
2. Aynı binary'nin birden fazla kaynağa bağlanması için satır kopyalamak
   gerekir, dedup ve sürüm semantiği kaybolur.
3. Etiket/sürüm/erişim logu için ek tablolar gerekiyor, ad ön eki tutarsızlaşıyor.

## Karar

Dosya, **bağımsız çekirdek varlık** olarak modellenir. Kaynaklarla ilişki
ayrı bir bağlantı tablosu üzerinden kurulur.

### Çekirdek Şema (özet)

```text
Dosya                 Tekil dosya metadata + aktif sürüm referansı.
DosyaSurumu           Aynı dosyanın immutable binary sürümleri.
DosyaBaglantisi       Dosyanın kart/proje/liste gibi kaynaklarla ilişkisi.
DosyaEtiketi          Evrak sınıflama etiketi (kart etiketinden ayrı).
DosyaEtiketBaglantisi Many-to-many bağ.
DosyaYuklemeOturumu   Presigned upload süreci ve doğrulama durumu.
DosyaErisimLogu       Önizleme/indirme okuma olayları.
```

`DosyaBaglantisi` denormalize `proje_id` / `liste_id` / `kart_id` alanları
tutar — RBAC kapsam filtreleri ve liste sorguları join'siz çalışsın diye.

### v1 Karar Matrisi

Plan Bölüm 20'deki 7 açık soru, sahip onayı ile aşağıdaki şekilde
karara bağlandı:

| # | Karar | Sonuç |
|---|---|---|
| 1 | **Kaynak tipi kapsamı** | v1: `KART`, `PROJE`, `LISTE`. `DosyaKaynakTipi` enum'u `YORUM`/`KONTROL_MADDESI`/`KULLANICI`/`BIRIM` değerlerini de içerir ama UI v1'de bu tipleri yazmaz. Schema rezervi v2 için hazır kalır. |
| 2 | **Gizlilik politikası** | `NORMAL`: kart/proje erişimi olan herkes görür. `HASSAS`: kart/proje erişimi **+** `BIRIM_AMIRI` ve üstü görür. `GIZLI`: yalnız yükleyen + `KAYMAKAM`/`SUPER_ADMIN` görür. |
| 3 | **Office önizleme** | v1: indirme fallback. Word/Excel/PowerPoint için tarayıcıda render YOK. PDF conversion (LibreOffice headless) v2'ye bırakıldı. Görsel/PDF/metin tarayıcıda önizlenir. |
| 4 | **Retention** | Soft delete sonrası **30 gün**. Cron `silindi_mi=true` ve `silinme_zamani < NOW() - 30d` olan kayıtları kalıcı silme kuyruğuna alır. |
| 5 | **Etiket havuzu** | Ayrı `DosyaEtiketi` tablosu. Kart etiketi = "iş süreci durumu", dosya etiketi = "evrak sınıflama". Karıştırma yok. |
| 6 | **Hash/dedup** | `Dosya.hash_sha256` baştan saklanır (forensik + future dedup). v1'de UI uyarısı veya storage dedup YOK. v2'de "bu dosya zaten yüklü" akışı açılabilir. |
| 7 | **Virüs taraması** | v1: ClamAV servisi YOK. Schema baştan hazır: `DosyaDurumu.KARANTINA`, `Dosya.virus_tarama_durumu` (`DosyaIslemeDurumu`), "karantinada" filtre görünümü. v2'de servis devreye alındığında schema değişikliği gerekmez. |

### Migration Stratejisi

Plan Bölüm 6'daki 5 fazlı strateji onaylandı:

- **F0 (bu ADR)** — karar.
- **F1** — `Dosya*` tabloları, enum'lar, `tsvector` migration, `DOSYA_*` izinleri, izin kataloğu.
- **F2** — Mevcut `Eklenti` kayıtlarının idempotent backfill'i (her `Eklenti` →
  bir `Dosya` + `DosyaSurumu(surum_no=1)` + `DosyaBaglantisi(kaynak_tip=KART)`).
- **F3** — Storage/güvenlik helper'ları (`lib/dosya-storage.ts`,
  `lib/dosya-guvenlik.ts`, `lib/dosya-yetki.ts`, `lib/dosya-onizleme.ts`).
- **F4** — Service + action katmanı (`app/(panel)/dosyalar/`).
- **F5** — Kart eki UI'sı yeni service'i tüketir; eski `Eklenti` yazımı durur.
- **F6–F10** — Merkezi `/dosyalar` MVP, önizleme/sürüm, çöp kutusu/global arama
  entegrasyonu, toplu işlemler, test/dokümantasyon.

`Eklenti` modeli F4 sonrası read-only kalır, F5 tamamlanınca yeni yazımlar
durur, bir release boyunca geriye dönüş güvencesi olarak tutulur, sonra
düşürülür (yeni ADR ile).

### RBAC

`lib/yetki.ts` için yeni helper:

```ts
canDosya(kullaniciId, aksiyon, dosyaId)
yetkiZorunluDosya(kullaniciId, aksiyon, dosyaId)
```

Karar mantığı:

- **Makam** (`SUPER_ADMIN`, `KAYMAKAM`): kapsam filtresini aşar.
- **Diğer roller**: dosyanın **en az bir** `DosyaBaglantisi` kaydına bağlı
  proje/liste/kart üzerinde okuma yetkisi varsa görür.
- **Yükleyen**: kendi başına "görme" yetkisi vermez. İstisna: dosya henüz
  `YUKLENIYOR` durumundaki kendi upload session'ı.
- **Silme**:
  - Yükleyen + `dosya:kendi-sil` + bağlı kaynakta edit yetkisi.
  - Başkasının dosyası için `dosya:baska-sil` + bağlı kaynakta edit.
  - Kalıcı silme yalnız `dosya:kalici-sil` (makam).
- **Bağlantı ekleme/kaldırma**: hedef kaynakta edit yetkisi.
- **Gizlilik**: Karar Matrisi #2 üzerinden uygulanır.

`KART_EKLENTI_*` izinleri bir geçiş dönemi `permissions-eslesme.ts` üzerinden
yeni `DOSYA_*` izinlerine genişletilir.

### Güvenlik

- Upload akışı: presigned PUT (5 dk TTL), magic-byte + mime/uzantı tutarlılık,
  boyut limiti (görsel 25MB, PDF/Office 50MB, metin 10MB, arşiv 100MB).
- Download/önizleme: presigned GET (10 dk TTL).
- Rate limit: 10 upload başlatma/dk/kullanıcı.
- SVG inline render YASAK (XSS riski). PDF iframe sandbox.
- Markdown render edilirse DOMPurify zorunlu.
- Audit middleware (Kural 42) `Dosya`/`DosyaBaglantisi`/`DosyaEtiketBaglantisi`/
  `DosyaSurumu` mutasyonlarını yakalar. Okuma olayları `DosyaErisimLogu`'na
  yazılır, audit'e gitmez.

## Sonuçlar

### Olumlu

- Dosya birinci sınıf varlık olur; merkezi `/dosyalar` ekranı doğal şekilde
  doğar.
- Aynı binary birden fazla kaynağa bağlanabilir; sürüm/etiket/erişim logu
  ayrı tablolarda temiz tutulur.
- Kaynak bazlı RBAC denormalize alanlarla join'siz çalışır.
- v2'de `YORUM`/`KONTROL_MADDESI`/`BIRIM`/`KULLANICI` kaynak tipleri
  schema değişikliği gerektirmeden açılabilir.
- ClamAV servisi v2'de eklenince `KARANTINA` durumu hâlâ aynı semantiği
  taşır; UI değişmez.

### Olumsuz / Maliyet

- `Eklenti` → `Dosya` geçişi büyük scope (10 faz, 1–2 sprint). Yarım kalırsa
  iki paralel akış kalır → Kural 92 ihlali.
- Backfill idempotent yazılmazsa duplicate üretir → F2'de test ZORUNLU.
- Yeni 7 model + 18 izin + tsvector index + trigram index → migration süresi
  uzun. Production deploy multi-step yapılmalı (Kural 47).
- Office önizleme yokluğu kullanıcı geri dönüşüyle "Word'ü tarayıcıda göster"
  baskısı yaratabilir → v2'ye yazıldı.
- Virus scan v1'de yok; ClamAV açılana kadar `KARANTINA` filtresi sadece
  altyapı rezervi olarak görünür.

### Kabul Edilen Riskler

| Risk | Etki | Azaltma |
|---|---|---|
| `Eklenti` → `Dosya` geçişinde eski kart ekleri bozulur | Yüksek | F2 backfill testleri (`integration`), F5'e kadar dual-read compatibility |
| RBAC sızıntısı (kapsam dışı dosya görünür) | Yüksek | `canDosya` unit + integration test, global arama filtre testi |
| Storage/DB tutarsızlığı (orphan obje veya orphan satır) | Orta | Transaction sırası, orphan GC cron, hata logu |
| LexoRank tipi self-healing burada yok ama upload session TTL temizliği gerekli | Orta | Cron ile süresi geçen `DosyaYuklemeOturumu` temizliği |

## Uygulama Notları

- F1 başlamadan önce AGENTS.md gereği Next.js 16 guide'ı
  `node_modules/next/dist/docs/` altından okunur (özellikle Server Actions
  + cache invalidation + stream/preview davranışı).
- `tsvector` ve trigger Prisma'nın native ifade edemediği alanlar; migration
  ADR-0017'deki global arama deseninin aynısını izler — Prisma migration
  dosyasına manuel SQL eklenir, gerekçe migration başlığında yazılır.
- F1 commit'i tek mantıksal birim: schema + migration + izin kataloğu +
  seed izin matrisi. UI/service kodu F4'te.
- Bu ADR'in onaylanmasıyla plan dosyasının "Durum" başlığı "Onaylandı —
  F0 tamamlandı, F1 başlayabilir" olarak güncellenir.
