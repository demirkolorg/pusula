# ADR 0014 — Granüler İzin Kataloğu

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0013 (RBAC yönetim paneli) — bu ADR ADR-0013'teki 20 izinlik geniş kataloğun yetersizliğini gidermek için geliştirilmiştir; ADR-0013'ün altyapısı (Rol, RolIzin, izin_versiyonu, son-admin guard) aynen geçerli.

## Bağlam

ADR-0013 ile gelen 20 izin "çatı izin" (`kart:edit`, `liste:edit`, `proje:edit`) seviyesinde kalıyordu. Bu seviye gerçek operasyonu yansıtmıyor:

- **`kart:edit`** tek izin, oysa kart üzerinde 30'a yakın atomik aksiyon var (başlık, açıklama, kapak rengi, kapak görseli, başlangıç tarihi, bitiş tarihi, tamamlandı, etiket atama, üye atama, yorum yazma, eklenti yükleme, kontrol maddesi ekleme/işaretleme, ilişki kurma, vb.). "Kart düzenleyen" ile "kapak görseli atayabilen" aynı yetki sayılamaz.
- **`liste:edit`** ile "liste başlığı değiştir" ile "listeye birim atayan" arasında ciddi yetki farkı vardır.
- **Liste yetkilileri yönet** ve **kart yetkilileri yönet** izinleri kataloğda hiç yoktu — sadece `proje:authorize` vardı.
- Yorum, eklenti, kontrol listesi, etiket gibi yan modüller `kart:edit` çatısı altında gizlenmişti. "Bu kullanıcı kartı düzenleyebilsin ama yorum atamasın" gibi gerçek senaryolar imkansızdı.
- Açıklamalar Pusula jargonu ile uyumsuzdu ("kullanıcı atama ve birim paylaşımı" → kuruluş **yetkili kişi/birim** terminolojisini kullanır).

## Karar

### 1. Granüler izin seti — 60+ atomik izin

İzinler **modül × alt-kategori × aksiyon** üçlüsünde tanımlanır. Modül kategori (DB enum), alt-kategori UI'da accordion alt-grup başlığı.

```
KART
├── temel        — başlık, açıklama, sil, geri-yükle, arşivle, taşı, kopyala, tamamlandı
├── kapak        — kapak rengi, kapak görseli (eklentiden atama)
├── tarih        — başlangıç, bitiş, tamamlandı işareti
├── etiket       — karta etiket ekle/kaldır
├── yorum        — listele/oku, yaz, kendi yorumunu düzenle, kendi yorumunu sil, başkasının yorumunu sil
├── eklenti      — listele, yükle, indir, kendi eklentini sil, başkasının eklentisini sil
├── kontrol      — kontrol listesi oluştur/sil, madde ekle, madde işaretle, madde sil
├── yetkili      — yetkili kişi/birim atama
└── ilişki       — bağlantılı kart kurma/kaldırma

LISTE
├── temel        — oluştur, başlık, sil, geri-yükle, arşivle, sırala
└── yetkili      — yetkili kişi/birim atama

PROJE
├── temel        — oluştur, ad/açıklama düzenle, kapak (renk/ikon), yıldız, arşivle, sil, geri-yükle, sırala
└── yetkili      — yetkili kişi/birim atama, davet gönderme

KULLANICI
├── davet        — davet gönder, daveti iptal et, daveti yeniden gönder
├── onay         — bekleyen kullanıcıyı onayla / reddet
└── yonetim      — kullanıcı bilgilerini düzenle, sil, geri yükle, parolasını sıfırla

BIRIM
└── yonetim      — oluştur, düzenle, hiyerarşi, sil, geri yükle

ROL
└── yonetim      — rol oluştur, düzenle, izin ata, sil, çoğalt, kullanıcılara rol ata

AUDIT
└── inceleme     — denetim logu, hata logu (görüntüleme + dışa-aktarma + çözüldü işaretleme)

AYAR
└── sistem       — kurum bilgileri, sistem ayarları
```

### 2. İzin kodu konvansiyonu

Format: `<modul>:<aksiyon>` veya `<modul>.<altkategori>:<aksiyon>` (alt kategori "temel"se öneksiz).

Örnekler:
```
proje:olustur
proje:duzenle-ad
proje:duzenle-aciklama
proje:duzenle-kapak-renk
proje:duzenle-kapak-ikon
proje:yildizla
proje:arsivle
proje:sil
proje:geri-yukle
proje.yetkili:listele
proje.yetkili:kisi-ata
proje.yetkili:kisi-cikar
proje.yetkili:birim-ata
proje.yetkili:birim-cikar
proje.yetkili:davet-gonder
```

Kod **kebab-case fiil** içerir (Türkçe). UI'da görünmez — sadece kategori başlığı + insan-okunur ad gösterilir.

### 3. Eski izin kodlarının geri uyumu (eşleme katmanı)

Mevcut kod `proje:create`, `kart:edit` gibi izinleri çağırıyor. Hepsini bir gecede güncellemek riskli — eski kodları geri uyumlu tutuyoruz:

`lib/permissions-eslesme.ts`:
```ts
// Eski geniş izin → yeni granüler izin alt-listesi.
// `izinVarMi(uid, "kart:edit")` → eski koda göre, granüler izinlerden HERHANGİ
// BİRİNE sahipse OK (kullanıcı en azından bir alanı düzenleyebiliyor).
export const ESKI_YENI_ESLEME = {
  "proje:create": ["proje:olustur"],
  "proje:edit": [
    "proje:duzenle-ad",
    "proje:duzenle-aciklama",
    "proje:duzenle-kapak-renk",
    "proje:duzenle-kapak-ikon",
    "proje:yildizla",
  ],
  "proje:delete": ["proje:sil", "proje:arsivle"],
  "proje:authorize": [
    "proje.yetkili:kisi-ata",
    "proje.yetkili:kisi-cikar",
    "proje.yetkili:birim-ata",
    "proje.yetkili:birim-cikar",
    "proje.yetkili:davet-gonder",
  ],
  "kart:create": ["kart:olustur"],
  "kart:edit": [
    "kart:duzenle-baslik",
    "kart:duzenle-aciklama",
    "kart.kapak:renk",
    "kart.kapak:gorsel",
    "kart.tarih:baslangic",
    "kart.tarih:bitis",
    "kart.tarih:tamamlandi",
    "kart.etiket:ata",
    "kart.etiket:cikar",
  ],
  // ...
};
```

`izinVarMi(uid, "kart:edit")` çağrısı **eski kodu görünce eşlemedeki granüler izinlerden HERHANGİ BİRİNE** sahipse `true` döner. Mevcut server action'lar değişmeden çalışır. Yavaş yavaş action'lardaki çağrılar **doğru spesifik izine** geçirilebilir.

### 4. Schema değişikliği

`Izin.alt_kategori String?` kolonu eklenir. UI'da accordion'lar:
- **Üst seviye:** Kategori (PROJE, LISTE, KART, ...)
- **Alt seviye:** alt_kategori ("temel", "kapak", "tarih", "yetkili", "yorum", ...) — null olanlar "Genel" başlığı altında.

`IzinKategorisi` enum genişletilir: yeni değerler eklenmez (kategoriyi modül seviyesinde tutuyoruz). Alt-kategori string olarak — UI'da insan-okunur etiket için `ALT_KATEGORI_BASLIKLARI` map.

### 5. Liste & kart yetkilileri yönet izinleri

ADR-0013'te eksikti. Eklenenler:

```
liste.yetkili:listele
liste.yetkili:kisi-ata
liste.yetkili:kisi-cikar
liste.yetkili:birim-ata
liste.yetkili:birim-cikar
kart.yetkili:listele
kart.yetkili:kisi-ata
kart.yetkili:kisi-cikar
kart.yetkili:birim-ata
kart.yetkili:birim-cikar
```

### 6. Açıklamalar Pusula jargonuyla uyumlu

Tuna'dan gelen "kullanıcı atama ve birim paylaşımı" gibi cümleler kaldırıldı. Pusula terminolojisi:
- ✗ "kullanıcı atama" → ✓ "yetkili kişi atama"
- ✗ "birim paylaşımı" → ✓ "yetkili birim ekleme"
- ✗ "Yetkilileri Yönet" → ✓ "Projeye yetkili kişi/birim ekleme ve çıkarma"

### 7. Sistem rolleri için yeniden hesaplanan default izinler

| Rol | İzin Sayısı | Strateji |
|---|---|---|
| `SUPER_ADMIN` | tümü | full granüler |
| `KAYMAKAM` | tümü (sistem ayarı + rol yönetimi opsiyonel) | tüm operasyonel + okuma; sistem ayarı SUPER_ADMIN'e özgü |
| `BIRIM_AMIRI` | proje/liste/kart oluştur+düzenle+yetkili-ata, davet, kullanıcı düzenle (kendi birimi) | yönetim hariç |
| `PERSONEL` | kart oluştur, başlık/açıklama/tarih/tamamlandı, yorum yaz/düzenle, eklenti yükle, kontrol madde işaretle | "iş yapan" kişi |

## Sonuçlar

**Olumlu**
- "Yorum atayabilen ama kart silemeyen" gibi gerçek senaryolar mümkün
- Liste/kart yetkili yönetimi ayrı izin → Pusula gerçek mimarisi yansıtılıyor
- UI accordion ile kullanıcı kafası karışmaz (alt-kategori grupları)
- Eski kodlar `ESKI_YENI_ESLEME` ile çalışmaya devam → migration sıkıntısız

**Olumsuz / takas**
- 60+ izin checkbox UI'da fazla görünebilir → "Tümünü Seç" + arama + accordion ile yönetilir
- Eski kod hâlâ `kart:edit` çağırıyor → spesifik izin için yeniden yazma fırsatı, zaman içinde
- Migration: tüm rollerin izin tablosu yeniden seedlenmeli (sistem rollerinde)

## İlgili kurallar

- Kural 138 (Granüler yetki tipi — boolean yasak): bu ADR onun veri-modeli karşılığıdır
- Kural 50, 50a, 146 (RBAC + resource-level): aynı çift kontrol devam eder
- ADR-0005, ADR-0012, ADR-0013 ile birlikte okunur

## İlgili dosyalar

- [`lib/permissions-katalog.ts`](../../lib/permissions-katalog.ts) — yeni katalog
- [`lib/permissions-eslesme.ts`](../../lib/permissions-eslesme.ts) — eski/yeni geri uyum
- [`lib/permissions.ts`](../../lib/permissions.ts) — `izinVarMi` eşleme'yi kullanır
- [`prisma/schema.prisma`](../../prisma/schema.prisma) — `Izin.alt_kategori`
- [`prisma/migrations/...`](../../prisma/migrations/) — yeni migration
- [`prisma/seed.ts`](../../prisma/seed.ts) — yeni `VARSAYILAN_ROL_IZINLERI`
