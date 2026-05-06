# Dosya Yönetimi Modülü — Mimari Plan

> **Tarih:** 2026-05-06
> **Durum:** Onaylandı — F0 tamamlandı, F1 başlayabilir
> **Sahip:** demirkolorg
> **İlgili ADR:** [ADR-0028](../adr/0028-dosya-yonetimi-cekirdek-modeli.md)
> **İlgili kurallar:** Kural 5, 7, 23, 23a, 23b, 40-45, 48-53, 63-65, 72-73, 90-91, 94, 96-98, 100-103, 107-116, 131, 138-139, 143-144

---

## 1. Bağlam ve Sorun

Sistemde dosya bugün yalnızca kart detayındaki **Eklenti** akışı üzerinden var. Kullanıcı bir karta dosya yükleyebiliyor, dosya MinIO'ya gidiyor, metadata `Eklenti` tablosuna yazılıyor ve kart içinde listeleniyor. Bu model kart içi iş akışı için yeterli; fakat kurumsal dosya yönetimi ihtiyacını karşılamıyor.

Eksik olan ana kabiliyetler:

- Sistemdeki tüm dosyaları tek merkezden görme.
- Dosyaları proje, liste, kart, yükleyen, tür, tarih, boyut, etiket, açıklama ve güvenlik durumuna göre filtreleme.
- Dosya adı/açıklaması/etiketleri/bağlantıları üzerinde düzenleme.
- Dosyayı yalnızca kart eki olarak değil, ileride proje/liste/yorum/kontrol maddesi gibi kaynaklara bağlayabilme.
- Dosya türüne göre güvenli önizleme ve inceleme.
- Sürüm, indirme/gezinme geçmişi, çöp kutusu, kalıcı silme, orphan temizliği ve storage tutarlılığı.
- RBAC'ın kart izinlerinden bağımsız ama kaynak erişimiyle uyumlu şekilde çalışması.

Bu planın amacı, Pusula'da muadil bir kurumsal görev/dosya yönetimi sisteminde beklenen dosya yöneticisi özelliklerini kapsayan **çekirdek dosya modülünü** tasarlamaktır.

---

## 2. Mevcut Durum Tespiti

| Katman | Mevcut durum |
|---|---|
| Prisma | `Eklenti` modeli var: `kart_id`, `yukleyen_id`, `ad`, `mime`, `boyut`, `depolama_yolu`, `silindi_mi`, `arama_vektoru`. |
| Storage | `lib/storage.ts` MinIO istemcisi, presigned PUT/GET, mime whitelist, 25 MB limit ve `kartlar/<kartId>/...` storage yolu üretiyor. |
| API | `app/(panel)/projeler/[projeId]/eklenti/actions.ts` içinde `yuklemeBaslat`, `yuklemeOnayla`, `listele`, `indir`, `sil` server action'ları var. |
| Service | `services.ts` iki aşamalı upload, soft delete, presigned download ve realtime publish yapıyor. |
| UI | `KartModalEklerListesi` kart içinde upload/drop zone, satır listesi, indirme ve silme aksiyonlarını sunuyor. |
| RBAC | `KART_EKLENTI_*` izinleri katalogda var; bazı action'lar hâlâ geniş `KART_DUZENLE` alias'ına dayanıyor. |
| Resource erişimi | Dosya erişimi dolaylı olarak kart erişimine bağlı. `canDosya` gibi dosya özelinde bir kaynak kontrolü yok. |
| Arama | Global arama `Eklenti` adını arıyor; dosya içeriği/açıklama/etiket yok. |
| Çöp kutusu | `Eklenti` soft delete çöp kutusunda görünüyor; kalıcı silmede MinIO obje silme TODO. |
| Seed | Proje seed'lerinde kart `ekler` alanı metadata oluşturuyor; gerçek MinIO objesi gerekmiyor. |
| Aktivite/Bildirim | `Eklenti` create/delete aktivite mesajları ve `EKLENTI_YUKLENDI` bildirimi var. |

### 2.1 Temel kısıt

`Eklenti` modelinin `kart_id` zorunlu alanı, dosyayı kart dışı birinci sınıf kaynak haline getirmeyi zorlaştırıyor. Bu nedenle mevcut tabloyu büyütmek yerine, dosyayı çekirdek bir varlık olarak modellemek daha doğru.

---

## 3. Hedefler

- **H1:** `/dosyalar` altında merkezi dosya yöneticisi kurulur.
- **H2:** Mevcut kart eklenti deneyimi bozulmadan yeni çekirdek dosya modeline taşınır.
- **H3:** Dosya birden fazla kaynağa bağlanabilir: kart, proje, liste; v2'de yorum/kontrol maddesi/kullanıcı/birim.
- **H4:** Dosya metadata'sı düzenlenebilir: ad, açıklama, etiket, gizlilik, bağlantılar.
- **H5:** Güvenli upload hattı kurulur: presigned URL, mime/extension/magic-byte kontrolü, boyut limiti, rate limit, virus scan durumu, orphan cleanup.
- **H6:** Dosya türüne göre önizleme sağlanır: görsel, PDF, düz metin, CSV/Markdown; Office dosyaları için güvenli fallback.
- **H7:** RBAC iki katmanlı olur: sistem izni + dosyanın bağlı olduğu kaynaklara erişim.
- **H8:** Arama ve filtreleme dosya adı, açıklama, etiket ve ileride çıkarılmış metin içeriğini kapsar.
- **H9:** Audit, hata logu, aktivite, bildirim, realtime ve çöp kutusu mevcut Pusula desenleriyle entegre edilir.
- **H10:** Mobile-first, desktop'ta yoğun tablo/gallery, mobilde kart-list yaklaşımı uygulanır.

### Hedef Değil

- İlk fazda Google Drive benzeri klasör hiyerarşisi kurmak. Kaynak bağlantısı ve filtreler klasör ihtiyacının çoğunu karşılar.
- İlk fazda dosya içeriklerini düzenlemek. Düzenleme metadata ve bağlantılarla sınırlıdır.
- İlk fazda Office dosyalarını tarayıcı içinde tam render etmek. Güvenli önizleme altyapısı hazırlanır, gelişmiş Office render v2'ye bırakılır.
- Harici paylaşım linki veya vatandaş erişimi açmak. Kurum içi RBAC birinci fazdır.

---

## 4. Ana Mimari Karar

Yeni çekirdek model:

```text
Dosya                 Tekil dosya metadata'sı ve aktif sürüm.
DosyaSurumu           Aynı dosyanın immutable binary sürümleri.
DosyaBaglantisi       Dosyanın kart/proje/liste gibi kaynaklarla ilişkisi.
DosyaEtiketi          Dosya özelinde arama/filtre etiketi.
DosyaYuklemeOturumu   Presigned upload süreci ve doğrulama durumu.
DosyaErisimLogu       İndirme/önizleme gibi okuma olayları.
```

**Neden `Dosya` + `DosyaBaglantisi`:**

- Dosya tek binary olarak saklanır, birden fazla kaynağa bağlanabilir.
- Kart içi ekler yeni modelin sadece bir görünümü olur.
- Merkezi dosya yöneticisi doğrudan `Dosya` üzerinden çalışır.
- Kaynak bazlı RBAC, bağlantı tablosu üzerinden proje/liste/kart kapsamına indirgenir.
- İleride proje evrakları, liste belgeleri, karar tutanakları, kullanıcı profil evrakı gibi kaynaklar aynı çekirdeğe eklenebilir.

---

## 5. Veri Modeli Planı

> Uygulama fazında migration `prisma migrate dev` ile üretilecek. `tsvector` ve trigger gibi Prisma'nın native ifade edemediği alanlar için mevcut global arama migration desenine uyulacak ve ADR'de istisna gerekçesi yazılacak.

### 5.1 Enum'lar

```prisma
enum DosyaKategori {
  GORSEL
  PDF
  OFIS_BELGESI
  TABLO
  SUNUM
  METIN
  ARSIV
  DIGER
}

enum DosyaDurumu {
  YUKLENIYOR
  HAZIR
  KARANTINA
  HATALI
}

enum DosyaGizlilik {
  NORMAL
  HASSAS
  GIZLI
}

enum DosyaKaynakTipi {
  PROJE
  LISTE
  KART
  YORUM
  KONTROL_MADDESI
  KULLANICI
  BIRIM
}

enum DosyaIslemeDurumu {
  BEKLIYOR
  ISLENIYOR
  TAMAMLANDI
  BASARISIZ
  ATLANDI
}

enum DosyaErisimTipi {
  ONIZLEME
  INDIRME
  PAYLASIM
}
```

### 5.2 `Dosya`

```prisma
model Dosya {
  id                    String             @id @default(uuid()) @db.Uuid
  yukleyen_id            String             @db.Uuid
  ad                    String
  aciklama              String?            @db.Text
  mime                  String
  uzanti                String?
  kategori              DosyaKategori
  boyut                 Int
  hash_sha256           String?
  aktif_surum_id         String?            @db.Uuid
  bucket                String
  depolama_yolu          String
  thumbnail_yolu         String?
  onizleme_yolu          String?
  metin_icerik           String?            @db.Text
  durum                 DosyaDurumu        @default(YUKLENIYOR)
  gizlilik              DosyaGizlilik      @default(NORMAL)
  virus_tarama_durumu    DosyaIslemeDurumu @default(BEKLIYOR)
  onizleme_durumu        DosyaIslemeDurumu @default(BEKLIYOR)
  metin_cikarma_durumu   DosyaIslemeDurumu @default(BEKLIYOR)
  indirme_sayisi         Int                @default(0)
  son_indirme_zamani     DateTime?
  silindi_mi             Boolean            @default(false)
  silinme_zamani         DateTime?
  olusturma_zamani       DateTime           @default(now())
  guncelleme_zamani      DateTime           @updatedAt

  yukleyen      Kullanici              @relation(fields: [yukleyen_id], references: [id])
  surumler      DosyaSurumu[]
  baglantilar   DosyaBaglantisi[]
  etiketler     DosyaEtiketBaglantisi[]
  erisimler     DosyaErisimLogu[]

  arama_vektoru Unsupported("tsvector")?

  @@index([yukleyen_id, olusturma_zamani(sort: Desc)])
  @@index([kategori, olusturma_zamani(sort: Desc)])
  @@index([mime])
  @@index([boyut])
  @@index([durum])
  @@index([gizlilik])
  @@index([silindi_mi, olusturma_zamani(sort: Desc)])
  @@index([hash_sha256])
  @@index([arama_vektoru], type: Gin)
  @@index([ad(ops: raw("gin_trgm_ops"))], type: Gin, map: "Dosya_ad_trgm_idx")
}
```

### 5.3 `DosyaSurumu`

```prisma
model DosyaSurumu {
  id               String   @id @default(uuid()) @db.Uuid
  dosya_id          String   @db.Uuid
  surum_no          Int
  yukleyen_id       String   @db.Uuid
  ad               String
  mime             String
  boyut            Int
  hash_sha256      String?
  bucket           String
  depolama_yolu     String
  aciklama         String?  @db.Text
  olusturma_zamani DateTime @default(now())

  dosya    Dosya     @relation(fields: [dosya_id], references: [id], onDelete: Cascade)
  yukleyen Kullanici @relation(fields: [yukleyen_id], references: [id])

  @@unique([dosya_id, surum_no])
  @@index([dosya_id, olusturma_zamani(sort: Desc)])
  @@index([hash_sha256])
}
```

### 5.4 `DosyaBaglantisi`

```prisma
model DosyaBaglantisi {
  id               String          @id @default(uuid()) @db.Uuid
  dosya_id          String          @db.Uuid
  kaynak_tip        DosyaKaynakTipi
  kaynak_id         String          @db.Uuid
  proje_id          String?         @db.Uuid
  liste_id          String?         @db.Uuid
  kart_id           String?         @db.Uuid
  ekleyen_id        String          @db.Uuid
  birincil_mi       Boolean         @default(false)
  olusturma_zamani  DateTime        @default(now())

  dosya   Dosya     @relation(fields: [dosya_id], references: [id], onDelete: Cascade)
  ekleyen Kullanici @relation(fields: [ekleyen_id], references: [id])

  @@unique([dosya_id, kaynak_tip, kaynak_id])
  @@index([kaynak_tip, kaynak_id])
  @@index([proje_id])
  @@index([liste_id])
  @@index([kart_id])
  @@index([dosya_id])
}
```

`proje_id`, `liste_id`, `kart_id` denormalize alanları RBAC, filtre ve arama performansı için tutulur. Örneğin kart bağlantısında üçü de doldurulur; proje bağlantısında yalnız `proje_id` doldurulur.

### 5.5 Etiket, upload oturumu ve erişim logu

```prisma
model DosyaEtiketi {
  id               String   @id @default(uuid()) @db.Uuid
  proje_id          String?  @db.Uuid
  ad               String
  renk             String?
  olusturan_id      String?  @db.Uuid
  olusturma_zamani  DateTime @default(now())

  baglar DosyaEtiketBaglantisi[]

  @@unique([proje_id, ad])
  @@index([ad])
}

model DosyaEtiketBaglantisi {
  dosya_id  String @db.Uuid
  etiket_id String @db.Uuid

  dosya  Dosya       @relation(fields: [dosya_id], references: [id], onDelete: Cascade)
  etiket DosyaEtiketi @relation(fields: [etiket_id], references: [id], onDelete: Cascade)

  @@id([dosya_id, etiket_id])
  @@index([etiket_id])
}

model DosyaYuklemeOturumu {
  id                String      @id @default(uuid()) @db.Uuid
  kullanici_id       String      @db.Uuid
  kaynak_tip         DosyaKaynakTipi
  kaynak_id          String      @db.Uuid
  ad                String
  mime              String
  boyut             Int
  depolama_yolu      String
  durum             DosyaDurumu @default(YUKLENIYOR)
  hata              String?
  son_kullanma       DateTime
  olusturma_zamani   DateTime    @default(now())
  guncelleme_zamani  DateTime    @updatedAt

  @@index([kullanici_id, olusturma_zamani(sort: Desc)])
  @@index([durum, son_kullanma])
}

model DosyaErisimLogu {
  id               BigInt         @id @default(autoincrement())
  dosya_id          String         @db.Uuid
  kullanici_id      String?        @db.Uuid
  tip              DosyaErisimTipi
  request_id        String?
  ip               String?
  user_agent        String?
  zaman            DateTime       @default(now())

  dosya Dosya @relation(fields: [dosya_id], references: [id], onDelete: Cascade)

  @@index([dosya_id, zaman(sort: Desc)])
  @@index([kullanici_id, zaman(sort: Desc)])
  @@index([tip, zaman(sort: Desc)])
}
```

---

## 6. Migration Stratejisi

### F0 — ADR ve isim kararı

- ADR yaz: `Eklenti` kart eki teriminden `Dosya` çekirdek modeline geçiş.
- UI metinlerinde kullanıcıya görünen ad **Dosya** olur.
- Eski audit kayıtlarında `Eklenti` kaynak tipi korunur; aktivite katmanı hem `Eklenti` hem `Dosya` mesajlarını destekler.

### F1 — Yeni tablolar ve katalog

- `Dosya*` tabloları eklenir.
- `IzinKategorisi` enum'una `DOSYA` eklenir.
- `lib/permissions-katalog.ts` içine dosya izinleri eklenir.
- Seed izin matrisi güncellenir.

### F2 — Backfill

- Mevcut `Eklenti` kayıtları için:
  - `Dosya` satırı oluştur.
  - `DosyaSurumu` sürüm 1 oluştur.
  - `DosyaBaglantisi(kaynak_tip=KART, kaynak_id=Eklenti.kart_id)` oluştur.
  - `silindi_mi` ve `silinme_zamani` korunur.
  - `depolama_yolu` mevcut haliyle taşınır.
- Backfill idempotent olmalı. Aynı `Eklenti.id` için tekrar çalışırsa duplicate üretmemeli.

### F3 — Kart eklenti UI geçişi

- `app/(panel)/projeler/[projeId]/eklenti/` modülü yeni `dosyalar` service'ini çağıran compatibility katmanı olur.
- Kart modalındaki ekler listesi `DosyaBaglantisi(kart_id)` üzerinden okunur.
- Eski `Eklenti` tablo yazımı durur.

### F4 — Eski modelin kaldırılması

- Global arama, çöp kutusu, aktivite, bildirim ve kart kapak referansları `Dosya` modeline taşındıktan sonra `Eklenti` modeli kaldırılır.
- Üretimde risk varsa bir release boyunca read-only legacy tablo tutulur.

---

## 7. Klasör Yapısı

```text
app/(panel)/dosyalar/
├── README.md
├── page.tsx
├── schemas.ts
├── services.ts
├── actions.ts
├── hooks/
│   ├── kullan-dosya-listesi.ts
│   ├── kullan-dosya-detay.ts
│   └── kullan-dosya-mutasyonlari.ts
├── components/
│   ├── dosyalar-istemci.tsx
│   ├── dosya-filtre-cubugu.tsx
│   ├── dosya-grid.tsx
│   ├── dosya-tablo.tsx
│   ├── dosya-mobil-kart-listesi.tsx
│   ├── dosya-detay-cekmecesi.tsx
│   ├── dosya-onizleme-paneli.tsx
│   ├── dosya-metadata-formu.tsx
│   ├── dosya-baglanti-listesi.tsx
│   ├── dosya-surum-listesi.tsx
│   └── dosya-toplu-islem-cubugu.tsx
└── helpers/
    ├── dosya-kategori.ts
    ├── dosya-filtre.ts
    └── dosya-onizleme.ts
```

Kart içi görünüm için:

```text
app/(panel)/projeler/[projeId]/dosya/
├── actions.ts      // kart bağlamlı ince wrapper
├── hooks.ts
└── README.md
```

Ortak storage/güvenlik:

```text
lib/dosya-storage.ts
lib/dosya-yetki.ts
lib/dosya-guvenlik.ts
lib/dosya-onizleme.ts
```

---

## 8. API ve Service Planı

Server Action default kalır. REST endpoint yalnız dış callback veya streaming/preview için gerekiyorsa açılır.

| Action | Girdi | Yetki |
|---|---|---|
| `dosyalariListeleEylem` | filtre, sıralama, cursor, limit | `dosya:oku` + kaynak kapsam filtresi |
| `dosyaDetayEylem` | `dosya_id` | `canDosya(..., "dosya:read")` |
| `dosyaYuklemeBaslatEylem` | kaynak, ad, mime, boyut | `dosya:yukle` + kaynak edit/yükleme yetkisi + upload rate limit |
| `dosyaYuklemeOnaylaEylem` | upload session, storage yolu | storage doğrulama + transaction |
| `dosyaIndirUrlEylem` | `dosya_id`, opsiyonel `surum_id` | `dosya:indir` + `canDosya` |
| `dosyaOnizlemeUrlEylem` | `dosya_id` | `dosya:onizle` + `canDosya` |
| `dosyaAdGuncelleEylem` | ad | `dosya:duzenle-ad` + `canDosya(edit)` |
| `dosyaAciklamaGuncelleEylem` | açıklama | `dosya:duzenle-aciklama` + `canDosya(edit)` |
| `dosyaEtiketleriGuncelleEylem` | etiket id/ad listesi | `dosya.etiket:ata` |
| `dosyaBaglantiEkleEylem` | kaynak | `dosya.baglanti:ekle` + hedef kaynak edit |
| `dosyaBaglantiKaldirEylem` | bağlantı id | `dosya.baglanti:kaldir` |
| `dosyaSurumYukleEylem` | dosya id + upload session | `dosya.surum:yukle` |
| `dosyaSilEylem` | dosya id | kendi/baska sil izinleri + kaynak edit |
| `dosyaGeriYukleEylem` | dosya id | `dosya:geri-yukle` |
| `dosyaKaliciSilEylem` | dosya id | sadece makam/super admin + `dosya:kalici-sil` |
| `dosyaTopluIslemEylem` | id listesi + işlem | 50+ kayıt için optimistic yok, batch progress |

### 8.1 Service kuralları

- Tüm girdi Zod ile validate edilir.
- Çoklu yazma transaction içinde yapılır.
- `Dosya` + `DosyaSurumu` + `DosyaBaglantisi` upload onayında tek transaction ile yazılır.
- Dosya upload binary kısmı optimistic değildir; metadata/silme/etiket gibi işlemler `useOptimisticMutation()` kullanır.
- Presigned URL kısa ömürlü olur: upload 5 dakika, download 10 dakika.
- Download/preview öncesi `DosyaErisimLogu` yazılır; mutasyon audit'i ayrıca middleware ile akar.
- Storage hatası DB transaction öncesi yakalanır; DB başarılı storage silme başarısızsa orphan cleanup kuyruğuna bırakılır.

---

## 9. RBAC Planı

### 9.1 Yeni izinler

```ts
DOSYA_OKU: "dosya:oku",
DOSYA_YUKLE: "dosya:yukle",
DOSYA_INDIR: "dosya:indir",
DOSYA_ONIZLE: "dosya:onizle",
DOSYA_AD_DUZENLE: "dosya:duzenle-ad",
DOSYA_ACIKLAMA_DUZENLE: "dosya:duzenle-aciklama",
DOSYA_GIZLILIK_DUZENLE: "dosya:gizlilik-duzenle",
DOSYA_ETIKET_ATA: "dosya.etiket:ata",
DOSYA_ETIKET_YONET: "dosya.etiket:yonet",
DOSYA_BAGLANTI_EKLE: "dosya.baglanti:ekle",
DOSYA_BAGLANTI_KALDIR: "dosya.baglanti:kaldir",
DOSYA_SURUM_YUKLE: "dosya.surum:yukle",
DOSYA_KENDI_SIL: "dosya:kendi-sil",
DOSYA_BASKA_SIL: "dosya:baska-sil",
DOSYA_GERI_YUKLE: "dosya:geri-yukle",
DOSYA_KALICI_SIL: "dosya:kalici-sil",
DOSYA_TOPLU_ISLEM: "dosya:toplu-islem",
DOSYA_GUVENLIK_YONET: "dosya:guvenlik-yonet",
DOSYA_DISA_AKTAR: "dosya:disa-aktar",
```

Mevcut `KART_EKLENTI_*` izinleri bir geçiş dönemi korunur. `permissions-eslesme.ts` içinde eski kart eklenti izinleri yeni dosya izinlerine genişletilir.

### 9.2 Kaynak erişimi

Yeni helper:

```ts
canDosya(kullaniciId, aksiyon, dosyaId)
yetkiZorunluDosya(kullaniciId, aksiyon, dosyaId)
```

Karar mantığı:

- Makam (`SUPER_ADMIN`, `KAYMAKAM`): kaynak kapsam filtresini aşar.
- Normal kullanıcı: dosyanın en az bir bağlantısında erişebildiği proje/liste/kart varsa okuyabilir.
- Yükleyen: dosyayı kendi yüklediği için görebilmez; mutlaka kaynak erişimi gerekir. İstisna: dosya henüz `YUKLENIYOR` durumundaki kendi upload session'ı.
- Silme:
  - Yükleyen + `dosya:kendi-sil` + bağlı kaynakta edit yetkisi.
  - Başkasının dosyası için `dosya:baska-sil` + bağlı kaynakta edit/yönetim yetkisi.
  - Kalıcı silme yalnız makam/super admin.
- Bağlantı ekleme/kaldırma hedef kaynakta edit yetkisi gerektirir.
- Gizlilik `GIZLI` ise `dosya:gizlilik-duzenle` ve `dosya:guvenlik-yonet` harici kullanıcılar metadata detayının bir kısmını göremez.

### 9.3 UI yetki tipi

Tek boolean kullanılmaz.

```ts
export type DosyaYetkileri = {
  listele: boolean;
  yukle: boolean;
  indir: boolean;
  onizle: boolean;
  adDuzenle: boolean;
  aciklamaDuzenle: boolean;
  etiketAta: boolean;
  etiketYonet: boolean;
  baglantiEkle: boolean;
  baglantiKaldir: boolean;
  surumYukle: boolean;
  kendiSil: boolean;
  baskaSil: boolean;
  geriYukle: boolean;
  kaliciSil: boolean;
  topluIslem: boolean;
  disaAktar: boolean;
};
```

---

## 10. Upload ve Güvenlik Hattı

1. İstemci dosya seçer.
2. `dosyaYuklemeBaslatEylem` çağrılır.
3. Server:
   - Oturum ve RBAC kontrol eder.
   - Upload rate limit uygular: 10/dk/kullanıcı.
   - Mime, uzantı, boyut ve kaynak tipini Zod + helper ile doğrular.
   - Storage yolunu üretir: `dosyalar/<yyyy>/<mm>/<dosyaId>/<surumNo>/<nanoid>.<ext>`.
   - `DosyaYuklemeOturumu` oluşturur.
   - Presigned PUT döner.
4. İstemci PUT yapar. AbortController ile iptal edilebilir.
5. `dosyaYuklemeOnaylaEylem` çağrılır.
6. Server:
   - Object stat/head ile boyutu doğrular.
   - Mümkünse magic-byte kontrolü yapar.
   - Mime/uzantı tutarsızlığını reddeder.
   - Hash hesaplama job'ı başlatır veya sync küçük dosyada hesaplar.
   - `Dosya`, `DosyaSurumu`, `DosyaBaglantisi` yazar.
   - Durumu `HAZIR` veya scan bekliyorsa `KARANTINA` yapar.
   - Realtime ve bildirim tetikler.

### 10.1 Mime ve boyut politikası

İlk faz:

| Kategori | Mime örnekleri | Limit |
|---|---|---|
| Görsel | png, jpeg, webp, gif | 25 MB |
| PDF | application/pdf | 50 MB |
| Office | doc/docx/xls/xlsx/ppt/pptx | 50 MB |
| Metin | txt, csv, markdown | 10 MB |
| Arşiv | zip, 7z, tar, gzip | 100 MB, önizleme yok |

SVG özel risk taşır. İlk fazda inline render edilmez; indirme veya sanitize edilmiş text preview ile sınırlanır.

### 10.2 Temizlik

- Süresi geçen `DosyaYuklemeOturumu` kayıtları cron ile temizlenir.
- DB'de olmayan storage objeleri orphan GC ile silinir.
- `silindi_mi=true` dosyalar retention süresi dolduktan sonra kalıcı silme kuyruğuna alınır.
- Storage silme başarısız olursa hata logu + tekrar deneme kuyruğu.

---

## 11. UI ve UX Planı

### 11.1 `/dosyalar` ana ekranı

Desktop:

- Üstte arama + hızlı filtreler.
- Sol veya üst filtre bandı: tür, proje, liste/kart, yükleyen, tarih, boyut, etiket, durum, gizlilik.
- Ana alan:
  - Liste görünümü: TanStack Table + server-side sorting/filtering/pagination.
  - Galeri görünümü: görsel/PDF odaklı grid.
  - Son yüklenenler görünümü.
- Sağ detay çekmecesi: önizleme + metadata + bağlantılar + sürümler + aktivite.

Mobil:

- Tablo yok; dosya kartları listelenir.
- Filtreler alttan Sheet olarak açılır.
- Aksiyonlar icon button + dropdown.
- Hit target minimum 44px.

### 11.2 Görünümler

| Görünüm | Açıklama |
|---|---|
| Tüm Dosyalar | Kullanıcının erişebildiği bütün dosyalar. |
| Benim Yüklediklerim | `yukleyen_id = currentUser`. Kaynak erişimi yine uygulanır. |
| Son Eklenenler | Varsayılan hızlı görünüm. |
| Görseller | `kategori=GORSEL`. Thumbnail grid. |
| Evraklar | PDF + Office + metin dosyaları. |
| Büyük Dosyalar | Boyut eşiği üstü. |
| Bağsız Dosyalar | Upload tamamlanmış ama kaynak bağlantısı olmayan dosyalar; yalnız yetkili roller. |
| Karantinada | Virus scan veya güvenlik doğrulaması bekleyenler. |
| Çöp Kutusu | Soft delete edilmiş dosyalar. |

### 11.3 Dosya detay çekmecesi

Sekmeler:

- **Önizleme:** Türe göre viewer.
- **Bilgiler:** ad, açıklama, mime, boyut, hash, yükleyen, tarih, gizlilik, durum.
- **Bağlantılar:** bağlı proje/liste/kart listesi, karta git/projeye git aksiyonları.
- **Sürümler:** aktif sürüm, eski sürümler, indirme.
- **Aktivite:** upload, rename, açıklama, etiket, indirme, silme olayları.

### 11.4 Aksiyonlar

- Önizle
- İndir
- Adını düzenle
- Açıklama ekle/düzenle
- Etiketle
- Başka kaynağa bağla
- Bağlantıyı kaldır
- Yeni sürüm yükle
- Kopya bağlantı oluştur
- Sil
- Geri yükle
- Kalıcı sil
- Toplu indir
- Toplu etiketle
- Toplu sil
- CSV dışa aktar

---

## 12. Önizleme Stratejisi

| Tür | İlk faz davranışı |
|---|---|
| Görsel | `next/image` veya signed URL ile güvenli viewer; zoom, gerçek boyut, indir. |
| PDF | `<iframe>`/object sandbox veya yeni sekme signed URL; inline script riski değerlendirilir. |
| Text/Markdown/CSV | Server'da boyut limitli text preview; markdown HTML'e çevrilirse DOMPurify zorunlu. |
| Office | Thumbnail yoksa ikon + metadata + indirme; v2'de LibreOffice headless/PDF conversion. |
| Arşiv | İçerik listeleme yok; metadata + indirme. |
| SVG | Inline render yok; sanitize edilmeden gösterilmez. |

Önizleme üretimi uzun sürebileceği için `DosyaIslemeDurumu` ve iptal/yeniden dene mekanizması gerekir.

---

## 13. Arama, Filtreleme ve Sıralama

### 13.1 Arama

`Dosya.arama_vektoru` şu alanlardan oluşur:

- `ad`
- `aciklama`
- dosya etiketleri
- `metin_icerik` (çıkarılmışsa)
- yükleyen ad/soyad için doğrudan join yerine filtre tarafında destek

Global arama:

- `genel-arama` içindeki `eklenti` tipi `dosya` tipine evrilir.
- Eski `eklenti` tipi transition boyunca UI'da "Dosya" olarak gösterilir.
- Arama sonuçları kart/proje bağlantılarını gösterecek şekilde zenginleşir.

### 13.2 Filtreler

| Filtre | Not |
|---|---|
| Arama metni | ad/açıklama/etiket/içerik |
| Kategori | görsel, PDF, Office, tablo, sunum, metin, arşiv |
| Mime/uzantı | teknik filtre |
| Proje | erişilen projeler |
| Liste/Kart | proje seçilince daralır |
| Yükleyen | kullanıcı combobox |
| Tarih aralığı | bugün, bu hafta, bu ay, özel |
| Boyut aralığı | min/max |
| Etiket | çoklu seçim |
| Durum | hazır, yükleniyor, karantina, hatalı |
| Gizlilik | normal, hassas, gizli |
| Silinmiş | normal/çöp kutusu |
| Bağlantı durumu | bağlı/bağsız |

### 13.3 Sıralama

- Yeni eklenen
- Eski eklenen
- Dosya adı
- Boyut
- Tür
- Yükleyen
- Proje
- Son indirme

Server-side sorting/filtering/pagination zorunlu; limit max 50.

---

## 14. Seed Planı

`prisma/seed/tipler.ts` içindeki `ekler` tipi genişletilir:

```ts
ekler?: Array<{
  ad: string;
  mime: string;
  boyut: number;
  yukleyen?: KullaniciAnahtar;
  aciklama?: string;
  etiketler?: string[];
  gizlilik?: "NORMAL" | "HASSAS" | "GIZLI";
  durum?: "HAZIR" | "KARANTINA";
}>;
```

Seed akışı:

- Roller/izinler: yeni `DOSYA_*` izinleri seed edilir.
- Kart seed'leri artık `Dosya`, `DosyaSurumu`, `DosyaBaglantisi` yazar.
- Farklı dosya türleri dağıtılır: PDF karar, görsel saha fotoğrafı, Excel liste, Word tutanak, ZIP arşiv.
- Çöp kutusu testleri için birkaç `silindi_mi=true` dosya eklenir.
- Güvenlik ekranı için bir `KARANTINA` örneği eklenir.
- Storage yolu fake seed path olabilir: `seed/dosyalar/<dosyaId>/<ad>`. E2E upload gerçek MinIO kullanır.

---

## 15. Audit, Aktivite, Bildirim ve Realtime

### 15.1 Audit

Mutasyonlar Prisma middleware ile audit'e düşer:

- `Dosya CREATE/UPDATE/DELETE`
- `DosyaBaglantisi CREATE/DELETE`
- `DosyaEtiketBaglantisi CREATE/DELETE`
- `DosyaSurumu CREATE`

Okuma olayları audit'e değil `DosyaErisimLogu`na yazılır:

- Önizleme
- İndirme
- Dış paylaşım v2

### 15.2 Aktivite mesajları

`aktivite/services.ts` yeni kaynak tiplerini destekler:

- `Dosya`: "dosya yükledi", "dosyanın adını değiştirdi", "açıklama ekledi", "dosyayı sildi".
- `DosyaBaglantisi`: "dosyayı karta bağladı", "dosyanın kart bağlantısını kaldırdı".
- `DosyaSurumu`: "dosyanın yeni sürümünü yükledi".

Legacy `Eklenti` mesajları korunur.

### 15.3 Bildirimler

Yeni bildirim tipi:

- `DOSYA_YUKLENDI`
- `DOSYA_SILINDI`
- `DOSYA_BAGLANDI`
- `DOSYA_ONIZLEME_HAZIR`

Mevcut `EKLENTI_YUKLENDI` transition boyunca alias kalabilir.

### 15.4 Realtime event'leri

```ts
DOSYA_OLUSTUR: "dosya:olustur"
DOSYA_GUNCELLE: "dosya:guncelle"
DOSYA_SIL: "dosya:sil"
DOSYA_GERI_YUKLE: "dosya:geri-yukle"
DOSYA_BAGLANTI_EKLE: "dosya:baglanti-ekle"
DOSYA_BAGLANTI_KALDIR: "dosya:baglanti-kaldir"
DOSYA_ONIZLEME_HAZIR: "dosya:onizleme-hazir"
```

Room stratejisi:

- `room.kart(kartId)` kart içi ekler için.
- `room.proje(projeId)` merkezi dosya listesi invalidation için.
- Kullanıcı özel room'u upload/preview işleme sonucu için.

---

## 16. Çöp Kutusu, Retention ve Kalıcı Silme

- `Dosya.silindi_mi` merkezi soft delete alanıdır.
- Dosya silinince `DosyaBaglantisi` silinmez; geri yükleme bağlamı korunur.
- Kart silinince bağlı dosyalar otomatik silinmez. Dosyanın tek bağlantısı o kart ise "kaynak silinmiş" olarak görünür.
- Kart/proje kalıcı silme sırasında dosya bağlantıları değerlendirilir:
  - Dosyanın başka bağlantısı varsa dosya kalır, bağlantı kalkar.
  - Başka bağlantısı yoksa dosya orphan olur ve yetkili görünümünde "Bağsız" filtresine düşer.
- Kalıcı dosya silme storage objesini ve tüm sürüm objelerini siler.
- Retention default: soft delete sonrası 30 gün.

---

## 17. Test Stratejisi

### 17.1 Unit test

- `dosya-kategori.ts`: mime/uzantı/kategori eşleşmesi.
- `dosya-filtre.ts`: filtre normalize, URL query parse/stringify.
- `dosya-yetki.ts`: kaynak bağlantısı ve makam/personel kararları.
- `dosya-guvenlik.ts`: mime, extension, path, magic-byte kuralları.

### 17.2 Integration test

- Upload başlatma: rate limit, mime reddi, boyut reddi.
- Upload onaylama: transaction ile `Dosya` + `DosyaSurumu` + `DosyaBaglantisi`.
- Listeleme: makam tümünü, personel yalnız eriştiği kaynakları görür.
- Metadata güncelleme: audit ve optimistic rollback.
- Sil/geri yükle/kalıcı sil: DB + storage davranışı.
- Arama: dosya adı/açıklama/etiket.
- Çöp kutusu entegrasyonu.

### 17.3 E2E

3 viewport:

- Mobile 375x667
- Tablet 768x1024
- Desktop 1440x900

Senaryolar:

- Giriş → kart aç → dosya yükle → merkezi `/dosyalar` ekranında gör.
- `/dosyalar` → filtrele → önizle → indir.
- Dosya açıklaması düzenle → aktivite kaydı oluşur.
- Dosya sil → çöp kutusunda gör → geri yükle.
- Yetkisiz kullanıcı dosyayı listede/arama sonucunda göremez.
- Büyük liste virtualization scroll testi.

---

## 18. Faz Faz Uygulama Planı

| Faz | İş | Çıktı |
|---|---|---|
| F0 | ADR + teknik karar | `docs/adr/NNNN-dosya-yonetimi-cekirdek-modeli.md` |
| F1 | Prisma schema + migration + seed izinleri | `Dosya*` tabloları, `DOSYA_*` izinleri |
| F2 | Backfill ve compatibility | Eski `Eklenti` kayıtları yeni modele taşınır |
| F3 | Storage güvenlik helper'ları | `lib/dosya-storage.ts`, `lib/dosya-guvenlik.ts` |
| F4 | Service/action katmanı | `app/(panel)/dosyalar/{schemas,services,actions}.ts` |
| F5 | Kart içi ekler geçişi | Kart modalı yeni dosya modelinden okur/yazar |
| F6 | Merkezi `/dosyalar` MVP | Liste + filtre + detay çekmecesi |
| F7 | Önizleme ve sürüm sekmesi | Görsel/PDF/text preview, sürüm listesi |
| F8 | Çöp kutusu, global arama, aktivite, bildirim | Mevcut sistemler `Dosya` ile entegre |
| F9 | Toplu işlemler ve dışa aktarma | Toplu sil/etiket/indir, CSV export |
| F10 | Test ve dokümantasyon | README, E2E, CHANGELOG |

### 18.1 Modül DONE kriteri

- [ ] Schema yazıldı.
- [ ] Service yazıldı + unit/integration test.
- [ ] Action yazıldı + RBAC kontrolü.
- [ ] Hook'lar TanStack Query ve `useOptimisticMutation()` ile yazıldı.
- [ ] UI mobile-first; 360px screenshot doğrulandı.
- [ ] Desktop table TanStack Table; 100+ kayıt için virtualization.
- [ ] Audit log mutasyonlarda akıyor.
- [ ] `DosyaErisimLogu` preview/download için akıyor.
- [ ] Hata logu action wrapper ile akıyor.
- [ ] Sonner toast ve undo davranışı var.
- [ ] Upload iptal mekanizması var.
- [ ] E2E happy path 3 viewport'ta geçiyor.
- [ ] `app/(panel)/dosyalar/README.md` yazıldı.
- [ ] CHANGELOG güncellendi.

---

## 19. Riskler ve Azaltma

| Risk | Etki | Azaltma |
|---|---|---|
| `Eklenti` → `Dosya` geçişinde eski kart ekleri bozulur | Yüksek | Compatibility katmanı ve backfill testleri |
| Kaynak bazlı RBAC dosya listesinde sızıntı yapar | Yüksek | `canDosya` unit testleri + integration test + global arama filtre testi |
| Storage objesi silinir ama DB kalır veya tersi | Orta | Transaction sırası, orphan cleanup, hata logu |
| SVG/PDF inline önizleme XSS doğurur | Yüksek | SVG inline render yok, PDF sandbox, DOMPurify |
| 1000+ dosya listesinde UI yavaşlar | Orta | Cursor pagination + virtualization + server-side filtre |
| Upload tamamlanmadan kullanıcı sayfayı kapatır | Orta | Upload session TTL + orphan cleanup |
| Virus scan altyapısı ilk fazda yoksa güvenlik boşluğu | Orta | `virus_tarama_durumu` alanı baştan var; prod policy'de scan tamamlanmadan preview/download kapatılabilir |
| Çoklu bağlantı silme semantiği kafa karıştırır | Orta | Detay çekmecesinde bağlantılar açık gösterilir; "dosyayı sil" ile "bu karttan kaldır" ayrılır |

---

## 20. Karar Bekleyen Sorular — KARARA BAĞLANDI

> **Durum:** ADR-0028 ile karara bağlandı (2026-05-06). Detaylar: [docs/adr/0028-dosya-yonetimi-cekirdek-modeli.md](../adr/0028-dosya-yonetimi-cekirdek-modeli.md).

| # | Soru | Karar |
|---|---|---|
| 1 | Dosya bağlantısı kapsamı | **v1: KART + PROJE + LISTE.** Enum `YORUM`/`KONTROL_MADDESI`/`KULLANICI`/`BIRIM` rezerv kalır, UI v2'de açar. |
| 2 | Gizlilik seviyesi | **NORMAL** = kart/proje erişimi olan herkes; **HASSAS** = kart/proje erişimi + `BIRIM_AMIRI` ve üstü; **GIZLI** = yükleyen + `KAYMAKAM`/`SUPER_ADMIN`. |
| 3 | Office önizleme | **v1: indirme fallback.** PDF conversion (LibreOffice) v2. Görsel/PDF/metin tarayıcıda önizlenir. |
| 4 | Retention | **30 gün** soft delete sonrası kalıcı silme. |
| 5 | Dosya etiketi | **Ayrı `DosyaEtiketi` tablosu.** Kart etiketi ≠ dosya etiketi (iş süreci vs evrak sınıflama). |
| 6 | Hash/dedup | **v1: hash baştan saklanır, UI uyarısı/dedup yok.** v2'de "zaten yüklü" akışı. |
| 7 | Virus scan | **v1: ClamAV servisi yok, schema hazır** (`KARANTINA` durumu, `virus_tarama_durumu`). v2'de servis devreye alınınca schema değişmez. |

---

## 21. İlgili Dosyalar

### Mevcut dosya/eklenti akışı

- [prisma/schema.prisma](../../prisma/schema.prisma) — `Eklenti`, `Kart`, `BildirimTipi`
- [lib/storage.ts](../../lib/storage.ts)
- [app/(panel)/projeler/[projeId]/eklenti/actions.ts](../../app/(panel)/projeler/[projeId]/eklenti/actions.ts)
- [app/(panel)/projeler/[projeId]/eklenti/services.ts](../../app/(panel)/projeler/[projeId]/eklenti/services.ts)
- [app/(panel)/projeler/[projeId]/eklenti/hooks.ts](../../app/(panel)/projeler/[projeId]/eklenti/hooks.ts)
- [app/(panel)/projeler/[projeId]/components/kart-modal-ekler-listesi.tsx](../../app/(panel)/projeler/[projeId]/components/kart-modal-ekler-listesi.tsx)

### Entegrasyon noktaları

- [lib/permissions-katalog.ts](../../lib/permissions-katalog.ts)
- [lib/yetki.ts](../../lib/yetki.ts)
- [app/(panel)/genel-arama/services.ts](../../app/(panel)/genel-arama/services.ts)
- [app/(panel)/cop-kutusu/services.ts](../../app/(panel)/cop-kutusu/services.ts)
- [app/(panel)/bildirimler/tetikleyiciler.ts](../../app/(panel)/bildirimler/tetikleyiciler.ts)
- [app/(panel)/projeler/[projeId]/aktivite/services.ts](../../app/(panel)/projeler/[projeId]/aktivite/services.ts)
- [lib/socket-events.ts](../../lib/socket-events.ts)
- [prisma/seed.ts](../../prisma/seed.ts)
- [prisma/seed/tipler.ts](../../prisma/seed/tipler.ts)

### Yeni dosyalar

- `app/(panel)/dosyalar/README.md`
- `app/(panel)/dosyalar/schemas.ts`
- `app/(panel)/dosyalar/services.ts`
- `app/(panel)/dosyalar/actions.ts`
- `app/(panel)/dosyalar/hooks/*`
- `app/(panel)/dosyalar/components/*`
- `lib/dosya-storage.ts`
- `lib/dosya-yetki.ts`
- `lib/dosya-guvenlik.ts`
- `lib/dosya-onizleme.ts`
- `tests/e2e/dosyalar.e2e.ts`

---

## 22. Sonuç

Bu modül yalnız "kart eklentilerini listeleyen ekran" olarak ele alınmamalı. Doğru çekirdek, dosyayı bağımsız bir varlık yapıp kaynak bağlantılarıyla kart/proje/liste bağlamına oturtmaktır. Böylece mevcut kart ekleri korunur, merkezi dosya yöneticisi açılır ve ileride evrak yönetimi, sürümleme, güvenlik taraması, gelişmiş önizleme ve kurumsal retention gibi ihtiyaçlar aynı model üzerinde büyür.

Uygulama onayı verilirse ilk somut adım **F0 ADR + F1 schema/izin migration** olmalı. Kod yazımına başlamadan önce AGENTS.md gereği ilgili Next.js 16 guide'ı `node_modules/next/dist/docs/` altından okunmalı.
