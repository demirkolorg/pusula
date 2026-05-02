# B-Ç9 — Açık Uç Nokta Sözleşmesi (OpenAPI 3.0)

> **Çıktı No:** B-Ç9
> **Sahip:** Mimar + Arka Uç
> **Öncelik:** YÜKSEK
> **Bağlı Kararlar:** K-010 (Önce Arayüz), B-Ç12 (İzin matrisi), §6.1 etki alanı odaklı uç noktalar
> **Tarih:** 2026-05-01

---

## 1. AMACI

PUSULA REST uç noktalarının **sözleşmeye dayalı** (contract-driven) tanımı. Geliştirici, sınama ve istemci üretimi bu belgeyi temel alır.

## 2. GENEL İLKELER

### 2.1. Sürümleme

- Tüm uç noktalar `/api/v1/...` öneki ile başlar.
- Geriye dönük uyumluluk bozulursa `/api/v2/...` açılır (paralel).

### 2.2. Yanıt Biçimi

Tüm yanıtlar tutarlı bir sarmalayıcı kullanır:

```typescript
// Başarılı
{
  "başarılı": true,
  "veri": <T>,
  "üstveri"?: { toplam, sayfa, sınır }
}

// Başarısız
{
  "başarılı": false,
  "hata": {
    "kod": "İZİN_REDDEDİLDİ",
    "ileti": "Bu eylemi yapma yetkiniz yok.",
    "ayrıntı"?: { ... }
  }
}
```

### 2.3. HTTP Durum Kodları

| Kod | Anlam |
|---|---|
| 200 | Başarılı (GET, PATCH, POST aksiyon) |
| 201 | Oluşturuldu (POST kaynak) |
| 204 | İçerik yok (DELETE) |
| 400 | Doğrulama hatası (Zod) |
| 401 | Yetkilendirilmemiş (oturum yok) |
| 403 | Yasaklandı (izin yok) |
| 404 | Bulunamadı |
| 409 | Çakışma (örn. aynı kullanıcı için ikinci etkin vekâlet) |
| 422 | İşlenemez (iş kuralı ihlali, örn. Maker-Checker) |
| 429 | Çok istek |
| 500 | Sunucu hatası |

### 2.4. Sayfalama

```
GET /api/v1/görevler?sayfa=1&sınır=20&sıra=bitimTarihi:asc
```

Yanıt üstverisi:
```json
{
  "üstveri": { "toplam": 120, "sayfa": 1, "sınır": 20 }
}
```

### 2.5. Süzme

```
GET /api/v1/görevler?birimKimliği=...&durum=ONAY_BEKLİYOR&riskDüzeyi=GECİKTİ
```

### 2.6. Kimlik Doğrulama

- Tüm uç noktalar `Cookie: oturum=...` (better-auth oturum çerezi) ile çağrılır.
- Çerez yoksa `401`.

### 2.7. CSRF Koruması

- POST/PATCH/DELETE çağrılarında `X-CSRF-Token` üst başlığı zorunlu.
- Jeton oturumla ilişkilendirilir.

### 2.8. Hız Sınırlama

- Asgari: 100 istek / dakika / kullanıcı.
- Yazma uç noktaları: 30 istek / dakika / kullanıcı.
- Arama uç noktası: 60 istek / dakika / kullanıcı.

---

## 3. UÇ NOKTALAR DİZİNİ (Etki Alanı Bazlı)

### 3.1. Kimlik & Oturum (better-auth)

| Yöntem | Yol | İzin | Açıklama |
|---|---|---|---|
| POST | `/api/v1/kimlik/giriş` | (genel) | Eposta + parola ile giriş. |
| POST | `/api/v1/kimlik/çıkış` | (oturum) | Oturum sonlandırma. |
| POST | `/api/v1/kimlik/parola-sıfırla` | (genel) | Parola sıfırlama isteği. |
| POST | `/api/v1/kimlik/parola-değiştir` | (oturum) | Yeni parola belirle. |
| GET | `/api/v1/kimlik/ben` | (oturum) | Mevcut kullanıcı bilgisi + roller + izinler. |

### 3.2. Birim & Kullanıcı

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/birimler` | `birim.üye.oku` |
| POST | `/api/v1/birimler` | `birim.oluştur` |
| PATCH | `/api/v1/birimler/{kimlik}` | `birim.düzenle` |
| DELETE | `/api/v1/birimler/{kimlik}` | `birim.sil` |
| GET | `/api/v1/birimler/{kimlik}/üyeler` | `birim.üye.oku` |
| GET | `/api/v1/kullanıcılar` | `birim.üye.oku` |
| POST | `/api/v1/kullanıcılar` | `kullanıcı.oluştur` |
| GET | `/api/v1/kullanıcılar/{kimlik}` | `birim.üye.oku` |
| PATCH | `/api/v1/kullanıcılar/{kimlik}` | `kullanıcı.düzenle` (bağlam) |
| POST | `/api/v1/kullanıcılar/{kimlik}/devre-dışı` | `kullanıcı.devre_dışı_bırak` |
| GET | `/api/v1/kullanıcılar/{kimlik}/iş-yükü` | `birim.üye.oku` |

### 3.3. Proje

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/projeler` | `proje.oku.üye_olduğu` veya `proje.oku.tümü` |
| POST | `/api/v1/projeler` | `proje.oluştur` |
| GET | `/api/v1/projeler/{kimlik}` | `proje.oku.üye_olduğu` |
| PATCH | `/api/v1/projeler/{kimlik}` | `proje.düzenle` |
| DELETE | `/api/v1/projeler/{kimlik}` | `proje.düzenle` (yumuşak) |
| GET | `/api/v1/projeler/{kimlik}/üyeler` | `proje.oku.üye_olduğu` |
| POST | `/api/v1/projeler/{kimlik}/üye-davet` | `proje.üye_ekle` |
| POST | `/api/v1/projeler/{kimlik}/üyelik-istekleri/{istekKimliği}/onayla` | `proje.üye_onayla` |
| POST | `/api/v1/projeler/{kimlik}/üyelik-istekleri/{istekKimliği}/reddet` | `proje.üye_onayla` |
| POST | `/api/v1/projeler/{kimlik}/kapatma-iste` | `proje.kapatma_iste` |
| POST | `/api/v1/projeler/{kimlik}/kapat` | `proje.kapat` |
| POST | `/api/v1/projeler/{kimlik}/arşivle` | `proje.arşivle` |
| GET | `/api/v1/projeler/{kimlik}/dosya-havuzu` | `proje.oku.üye_olduğu` |
| GET | `/api/v1/projeler/{kimlik}/ilerleme` | `proje.oku.üye_olduğu` |

### 3.4. Görev

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/görevler` | (kullanıcı) — sonuçlar yetkiye göre süzülür |
| POST | `/api/v1/görevler` | `görev.oluştur` |
| GET | `/api/v1/görevler/{kimlik}` | bağlam (görünürlük) |
| PATCH | `/api/v1/görevler/{kimlik}` | `görev.düzenle.kendi` veya `görev.düzenle.tümü` |
| DELETE | `/api/v1/görevler/{kimlik}` | `görev.sil` (yumuşak) |
| POST | `/api/v1/görevler/{kimlik}/ata` | `görev.ata` |
| POST | `/api/v1/görevler/{kimlik}/yeniden-ata` | `görev.yeniden_ata` |
| POST | `/api/v1/görevler/{kimlik}/iptal` | `görev.iptal` |
| POST | `/api/v1/görevler/{kimlik}/onaya-sun` | `görev.onaya_sun` |
| POST | `/api/v1/görevler/{kimlik}/onayla` | `görev.onayla` + Maker-Checker |
| POST | `/api/v1/görevler/{kimlik}/reddet` | `görev.reddet` (gerekçe zorunlu) |
| POST | `/api/v1/görevler/{kimlik}/altgörev` | `görev.altgörev.oluştur` |
| GET | `/api/v1/görevler/{kimlik}/bağlılıklar` | bağlam |
| POST | `/api/v1/görevler/{kimlik}/bağlılıklar` | `görev.bağlılık.düzenle` |
| DELETE | `/api/v1/görevler/{kimlik}/bağlılıklar/{bağlıKimlik}` | `görev.bağlılık.düzenle` |
| POST | `/api/v1/görevler/{kimlik}/izle` | `görev.izle` |
| DELETE | `/api/v1/görevler/{kimlik}/izle` | `görev.izle` |
| GET | `/api/v1/görevler/{kimlik}/izleyiciler` | bağlam |
| POST | `/api/v1/görevler/toplu-işlem` | `görev.toplu.işlem` |

### 3.5. Yorum & Derkenar

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/görevler/{kimlik}/yorumlar` | bağlam |
| POST | `/api/v1/görevler/{kimlik}/yorumlar` | `yorum.oluştur` |
| PATCH | `/api/v1/yorumlar/{kimlik}` | `yorum.düzenle.kendi` |
| DELETE | `/api/v1/yorumlar/{kimlik}` | `yorum.sil.kendi` veya `yorum.sil.tümü` |
| GET | `/api/v1/görevler/{kimlik}/derkenarlar` | bağlam |
| POST | `/api/v1/görevler/{kimlik}/derkenarlar` | `derkenar.oluştur` |
| PATCH | `/api/v1/derkenarlar/{kimlik}` | `derkenar.düzenle.kendi` veya `.tümü` |
| POST | `/api/v1/derkenarlar/{kimlik}/sabitle` | `derkenar.sabitle` |
| DELETE | `/api/v1/derkenarlar/{kimlik}/sabitle` | `derkenar.sabitle` |
| POST | `/api/v1/derkenarlar/{kimlik}/çöz` | `derkenar.düzenle.kendi` (ENGEL için) |
| GET | `/api/v1/derkenarlar/{kimlik}/sürümler` | `derkenar.sürüm.oku` |

### 3.6. Vekâlet

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/vekâletler` | `vekâlet.oku.tümü` (veya kendi) |
| POST | `/api/v1/vekâletler` | `vekâlet.oluştur` |
| POST | `/api/v1/vekâletler/{kimlik}/geri-al` | `vekâlet.geri_al.kendi` veya `.tümü` |

### 3.7. Bildirim & İzleyici

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/bildirimler` | `bildirim.oku.kendi` |
| GET | `/api/v1/bildirimler/sayım` | `bildirim.oku.kendi` |
| POST | `/api/v1/bildirimler/{kimlik}/oku` | `bildirim.oku.kendi` |
| POST | `/api/v1/bildirimler/tümünü-oku` | `bildirim.oku.kendi` |
| GET | `/api/v1/bildirim-tercihi` | `bildirim.tercih.düzenle` |
| PATCH | `/api/v1/bildirim-tercihi` | `bildirim.tercih.düzenle` |
| POST | `/api/v1/anlık-bildirim/abone` | (oturum) — VAPID kayıt |

### 3.8. Dosya

| Yöntem | Yol | İzin |
|---|---|---|
| POST | `/api/v1/dosyalar/yükleme-isteği` | `dosya.yükle` (imzalı bağlantı al) |
| POST | `/api/v1/dosyalar` | `dosya.yükle` (üstveri kaydet) |
| GET | `/api/v1/dosyalar/{kimlik}/indirme-bağlantısı` | `dosya.indir` |
| DELETE | `/api/v1/dosyalar/{kimlik}` | `dosya.sil.kendi` veya `.tümü` |

### 3.9. Arama

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/arama?s={sorgu}&sınıf={tümü\|projeler\|görevler\|derkenarlar\|dosyalar}` | `arama.kullan` |

### 3.10. Kalıp & Yinelenen & Atama Kuralı

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/görev-kalıpları` | `dizge.kalıp_yönet` (oku) |
| POST | `/api/v1/görev-kalıpları` | `dizge.kalıp_yönet` |
| PATCH | `/api/v1/görev-kalıpları/{kimlik}` | `dizge.kalıp_yönet` |
| DELETE | `/api/v1/görev-kalıpları/{kimlik}` | `dizge.kalıp_yönet` |
| GET | `/api/v1/yinelenen-kurallar` | `dizge.kalıp_yönet` |
| POST | `/api/v1/yinelenen-kurallar` | `dizge.kalıp_yönet` |
| GET | `/api/v1/atama-kuralları` | `dizge.atama_kuralı_yönet` |
| POST | `/api/v1/atama-kuralları` | `dizge.atama_kuralı_yönet` |

### 3.11. Tatil Takvimi

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/tatiller?yıl=2026` | (oturum) |
| POST | `/api/v1/tatiller` | `dizge.tatil_yönet` |
| DELETE | `/api/v1/tatiller/{kimlik}` | `dizge.tatil_yönet` |

### 3.12. Denetim & Hata

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/denetim-günlüğü?varlık=Görev&kimlik=...` | `dizge.denetim` |
| GET | `/api/v1/denetim-günlüğü/kullanıcı/{kullanıcıKimliği}` | `dizge.denetim` |
| POST | `/api/v1/hata-günlüğü` | (oturum) — Çekirdek Hata Gözlemcisi |
| GET | `/api/v1/hata-günlüğü` | `dizge.denetim` |

### 3.13. İzin Denetimi (Ön Yüz)

| Yöntem | Yol | İzin |
|---|---|---|
| POST | `/api/v1/izin-denet` | (oturum) — toplu izin sorgusu |

### 3.14. Gösterge Paneli

| Yöntem | Yol | İzin |
|---|---|---|
| GET | `/api/v1/gösterge-paneli/özet` | (oturum) — role göre veri döner |
| GET | `/api/v1/gösterge-paneli/onay-bekleyenler` | `görev.onayla` |
| GET | `/api/v1/gösterge-paneli/gecikmiş` | (oturum) |
| GET | `/api/v1/gösterge-paneli/birim-ilerlemesi` | `rapor.oku.birim` |

---

## 4. ÖRNEK UÇ NOKTA SÖZLEŞMELERİ (OpenAPI 3.0 Parçalar)

### 4.1. POST /api/v1/görevler

**Açıklama:** Yeni görev oluştur.

**İzin:** `görev.oluştur`

**İstek Gövdesi (Zod şeması ile):**

```typescript
GörevOluşturİsteği = z.object({
  başlık: z.string().min(3).max(200),
  açıklama: z.string().max(10_000).optional(),
  projeKimliği: z.string().cuid().nullable(),
  üstKimliği: z.string().cuid().nullable(),
  birimKimliği: z.string().cuid(),
  atananKimliği: z.string().cuid().optional(),
  görünürlük: z.enum(['ÖZEL', 'BİRİM']).default('BİRİM'),
  öncelik: z.enum(['DÜŞÜK', 'OLAĞAN', 'YÜKSEK', 'KRİTİK']).default('OLAĞAN'),
  bitimTarihi: z.string().datetime().optional(),
  başlangıçTarihi: z.string().datetime().optional(),
  etiketler: z.array(z.string()).optional(),
  kalıpKimliği: z.string().cuid().optional(),
})
```

**Yanıt 201:**

```json
{
  "başarılı": true,
  "veri": {
    "kimlik": "ckl1...",
    "başlık": "...",
    "durum": "YAPILACAK",
    "ilerleme": 0,
    "riskDüzeyi": "OLAĞAN",
    "oluşturulmaTarihi": "2026-05-01T10:00:00Z",
    ...
  }
}
```

**Olası Hatalar:**
- 400 — doğrulama (Zod)
- 403 — `görev.oluştur` izni yok
- 422 — `üstKimliği` 2. düzeydeki bir göreve işaret ediyor (3. düzey yasak)
- 422 — `kalıpKimliği` etkin değil
- 422 — `bitimTarihi` resmi tatil veya geçmiş

### 4.2. POST /api/v1/görevler/{kimlik}/onaya-sun

**İzin:** `görev.onaya_sun`

**Bağlam:** `kullanıcı.kimlik == görev.atananKimliği`

**İstek Gövdesi:** boş veya isteğe bağlı not.

**Yanıt 200:**

```json
{
  "başarılı": true,
  "veri": {
    "kimlik": "ckl1...",
    "durum": "ONAY_BEKLİYOR",
    ...
  }
}
```

**Yan Etkiler:**
- Olay: `GÖREV_ONAYA_SUNULDU`
- Bildirim: ilgili müdüre
- Denetim günlüğü kaydı

### 4.3. POST /api/v1/görevler/{kimlik}/onayla

**İzin:** `görev.onayla`

**Bağlam:**
- `kullanıcı.kimlik != görev.atananKimliği` (Maker-Checker)
- `kullanıcı.birim == görev.birim` veya YÖNETİCİ
- `görev.durum == ONAY_BEKLİYOR`

**Yanıt 200:**

```json
{ "başarılı": true, "veri": { "durum": "ONAYLANDI", ... } }
```

**Olası Hatalar:**
- 422 — Maker-Checker ihlali
- 422 — durum `ONAY_BEKLİYOR` değil

### 4.4. POST /api/v1/görevler/{kimlik}/reddet

**İzin:** `görev.reddet`

**İstek Gövdesi:**

```typescript
GörevReddetİsteği = z.object({
  gerekçe: z.string().min(10).max(2000),
  düzeltmeOlarakDerkenarOluştur: z.boolean().default(true),
})
```

**Yanıt 200:**

```json
{
  "başarılı": true,
  "veri": {
    "durum": "DÜZELTME",
    "redGerekçesi": "..."
  }
}
```

**Yan Etkiler:**
- Otomatik UYARI tipinde derkenar oluşturulur (eğer `düzeltmeOlarakDerkenarOluştur=true`).
- Memura bildirim.

### 4.5. POST /api/v1/görevler/{kimlik}/bağlılıklar

**İstek Gövdesi:**

```typescript
BağlılıkEkleİsteği = z.object({
  bağlıOlduğuGörevKimliği: z.string().cuid(),
  tip: z.enum(['ENGELLER']).default('ENGELLER'),
})
```

**Doğrulama:**
- Aynı görev bağımlılığa eklenemez.
- Yönlü döngüsüz çizge kontrolü; döngü oluşuyorsa `422 DÖNGÜ_TESPİT_EDİLDİ`.

### 4.6. POST /api/v1/projeler/{kimlik}/üye-davet

**İstek Gövdesi:**

```typescript
ÜyeDavetİsteği = z.object({
  davetEdilenKimliği: z.string().cuid(),
  projedekiRol: z.enum(['ÜYE', 'GÖZLEMCİ']).default('ÜYE'),
})
```

**Davranış:**
- Davet edilen kullanıcı **proje sahibi birim** ile aynı birimden ise → doğrudan `ProjeÜyesi` oluştur.
- Farklı birim ise → `ProjeÜyelikİsteği` (BEKLİYOR) oluştur, hedef birim müdürüne bildirim.

**Yanıt 200/201:**

```json
{
  "başarılı": true,
  "veri": {
    "tip": "DOĞRUDAN_ÜYELİK" veya "ONAY_BEKLİYOR",
    "üyelikKimliği"?: "...",
    "isteğKimliği"?: "..."
  }
}
```

### 4.7. POST /api/v1/vekâletler

**İstek Gövdesi:**

```typescript
VekâletOluşturİsteği = z.object({
  alanKimliği: z.string().cuid(),
  başlangıçTarihi: z.string().datetime(),
  bitişTarihi: z.string().datetime(),
  kapsam: z.array(z.string()).nullable().optional(),  // izin anahtarları, null = tüm
  gerekçe: z.string().max(500).optional(),
})
.refine((d) => d.bitişTarihi > d.başlangıçTarihi, { message: 'Bitiş başlangıçtan sonra olmalı' })
```

**İş Kuralları:**
- Aynı `kullanıcı.kimlik` (devreden) için etkin başka vekâlet varsa → `409 ÇAKIŞMA`.
- Devreden, vekâleten alan biri ise → `422 ALT_VEKÂLET_YASAK`.
- Maksimum süre 90 gün.

**Yanıt 201:**

```json
{
  "başarılı": true,
  "veri": {
    "kimlik": "...",
    "durum": "ETKİN",
    ...
  }
}
```

### 4.8. POST /api/v1/dosyalar/yükleme-isteği

İmzalı yükleme bağlantısı al (S3 / MinIO).

**İstek:**

```typescript
Yüklemeİsteği = z.object({
  dosyaAdı: z.string().max(255),
  içerikTipi: z.string(),
  boyut: z.number().int().max(50_000_000),  // 50 MB
  görevKimliği: z.string().cuid().nullable(),
  projeKimliği: z.string().cuid().nullable(),
})
```

**Yanıt 200:**

```json
{
  "başarılı": true,
  "veri": {
    "yüklemeURL": "https://s3...?imza=...",
    "dosyaKimliği": "...",
    "geçerlilikSn": 600
  }
}
```

**Akış:**
1. İstemci bu uç noktayı çağırır.
2. Dönen URL'ye doğrudan PUT ile dosyayı yükler.
3. POST `/api/v1/dosyalar` çağrısı ile üstveriyi kaydeder.

### 4.9. GET /api/v1/arama

**Sorgu Parametreleri:**

```
s         (zorunlu)  arama metni
sınıf     (opsiyonel) tümü | projeler | görevler | derkenarlar | dosyalar
sınır     (opsiyonel) varsayılan 20
sayfa     (opsiyonel) varsayılan 1
```

**Yanıt 200:**

```json
{
  "başarılı": true,
  "veri": {
    "projeler": [{ "kimlik", "ad", "öneöz" }, ...],
    "görevler": [{ "kimlik", "başlık", "durum", "bitimTarihi" }, ...],
    "derkenarlar": [{ "kimlik", "görevKimliği", "tip", "öneöz" }, ...],
    "dosyalar": [{ "kimlik", "dosyaAdı", "boyut" }, ...]
  },
  "üstveri": {
    "sürelerMs": { "tümü": 184 }
  }
}
```

**İlgililik Sıralaması:**
- Tam metin arama puanı (PostgreSQL `ts_rank`).
- Yetki süzgeci sonradan uygulanır.

### 4.10. POST /api/v1/görevler/toplu-işlem

**İstek Gövdesi:**

```typescript
Topluİşlemİsteği = z.object({
  görevKimlikleri: z.array(z.string().cuid()).min(1).max(100),
  işlem: z.discriminatedUnion('tip', [
    z.object({ tip: z.literal('ATA'), atananKimliği: z.string().cuid() }),
    z.object({ tip: z.literal('DURUM_DEĞİŞTİR'), yeniDurum: z.enum([...]) }),
    z.object({ tip: z.literal('ETİKET_EKLE'), etiketKimlikleri: z.array(z.string().cuid()) }),
    z.object({ tip: z.literal('SİL') }),
    z.object({ tip: z.literal('BİTİM_TARİHİ_GÜNCELLE'), bitimTarihi: z.string().datetime() }),
  ]),
})
```

**Davranış:**
- Tek `topluİşlemKimliği` oluşturulur.
- Her görev için **ayrı** izin denetimi yapılır.
- Yetkisiz görevler atlanır; raporda listelenir.
- Tüm denetim kayıtlarına `topluİşlemKimliği` eklenir → toplu geri al.

**Yanıt 200:**

```json
{
  "başarılı": true,
  "veri": {
    "topluİşlemKimliği": "...",
    "başarılı": ["k1", "k2"],
    "atlanan": [{ "görevKimliği": "k3", "neden": "İZİN_REDDEDİLDİ" }],
    "geriAlURL": "/api/v1/görevler/toplu-işlem/{topluİşlemKimliği}/geri-al"
  }
}
```

---

## 5. HATALAR KATALOĞU

| Hata Kodu | Açıklama |
|---|---|
| `İZİN_REDDEDİLDİ` | Kullanıcının istenen eylem için yetkisi yok. |
| `OTURUM_BULUNAMADI` | Kimlik doğrulama gerekli. |
| `DOĞRULAMA_HATASI` | Zod doğrulama başarısız. |
| `KAYNAK_BULUNAMADI` | İstenen kayıt yok veya yumuşak silinmiş. |
| `ÇAKIŞMA` | Benzersizlik veya iş kuralı çakışması. |
| `MAKER_CHECKER_İHLALİ` | Aynı kişi yapan-doğrulayan olmaya çalışıyor. |
| `DURUM_GEÇİŞSİZ` | Kayıt mevcut durumdan istenen duruma geçemez. |
| `DÖNGÜ_TESPİT_EDİLDİ` | Bağlılık eklemesi döngü oluşturuyor. |
| `MAX_DERİNLİK_AŞIM` | Görev hiyerarşisinde 2 düzey aşımı. |
| `KİLİTLİ_KAYIT` | İşleme kapalı (örn. ONAYLANDI görev silinemez). |
| `ALT_VEKÂLET_YASAK` | Vekâleten alan vekâlet veremez. |
| `KAPSAM_DIŞI` | Vekâlet kapsamı bu eylemi içermiyor. |
| `İŞ_YÜKÜ_ESHIGI_AŞILDI` | Atanmaya çalışılan kişi aşırı yüklü (uyarı seviyesinde). |
| `GERÇEK_ZAMAN_HATA` | Beklenmeyen sunucu hatası (Sentry'ye iletilir). |

---

## 6. OLAY YOLU İLE ETKİLEŞİM

Her başarılı yazma uç noktası ilgili olayı yayımlar:

| Uç Nokta | Olay |
|---|---|
| POST /görevler | `GÖREV_OLUŞTURULDU` |
| POST /görevler/{}/ata | `GÖREV_ATANDI` |
| POST /görevler/{}/onaya-sun | `GÖREV_ONAYA_SUNULDU` |
| POST /görevler/{}/onayla | `GÖREV_ONAYLANDI` |
| POST /görevler/{}/reddet | `GÖREV_REDDEDİLDİ` |
| (zamanlayıcı) | `GÖREV_GECİKTİ` |
| POST /derkenarlar | `DERKENAR_OLUŞTURULDU` |
| POST /derkenarlar/{}/sabitle | `DERKENAR_SABİTLENDİ` |
| POST /dosyalar | `DOSYA_YÜKLENDİ` |
| POST /vekâletler | `VEKÂLET_OLUŞTURULDU` |
| (zamanlayıcı) | `VEKÂLET_SÜRESİ_DOLDU` |

Olay sözlüğü ve yük şemaları **B-Ç10**'da belirtilecek.

---

## 7. SÜRÜMLEME & DEPRECATION

- `/api/v1/...` desteklendiği sürece geriye dönük uyumlu.
- Bozucu değişiklik → `/api/v2/...` paralel.
- Eski sürüm en az 6 ay desteklenir, `Sunset` üst başlığı ile.

---

## 8. OPENAPI ŞEMA DOSYASI

Tam OpenAPI 3.0 YAML/JSON şeması ileride [openapi.yaml](openapi.yaml) dosyasında yer alacak. Bu belgenin amacı **insan-okunur sözleşme**dir; makine-okunur eşdeğer üretimi planlanan sıradaki adımdır (Zod → OpenAPI dönüşüm jeneratörü).

---

## 9. SIRADAKİ ÇIKTIYA GEÇİŞ

Açık uç nokta sözleşmesi, **B-Ç10 Olay Sözlüğü** için yan etki + yük tarifinin temelini sağlar.

**Bir sonraki çıktı: B-Ç10 — Olay Sözlüğü (yük şemaları + dinleyiciler).**
