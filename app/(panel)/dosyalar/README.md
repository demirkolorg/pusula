# Dosyalar Modülü

> ADR-0028 — Dosya yönetimi çekirdek modeli. Plan: [docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md](../../../docs/issues/2026-05-06-dosya-yonetimi-modulu-plani.md).

## Amaç

Pusula'da dosyaları **bağımsız çekirdek varlık** olarak yöneten merkezi modül.
Mevcut kart-eki `Eklenti` modeli F4 sonrası bu modülü tüketir; F5'te
geçiş tamamlanınca eski tablo kaldırılır.

Bir dosya birden fazla **kaynağa** (kart, proje, liste) bağlanabilir,
sürümlenebilir, etiketlenebilir, gizlilik seviyesine sahip olabilir
(NORMAL/HASSAS/GIZLI). Storage MinIO'da `pusula-dosyalar` bucket'ında tutulur.

## Yapı

```
app/(panel)/dosyalar/
├── README.md                            — bu dosya
├── page.tsx                             — server component, SSR ilk sayfa
├── schemas.ts                           — 18+ Zod şeması (action contract'ları)
├── services.ts                          — Prisma + business logic
├── services.test.ts                     — integration testler (10 senaryo)
├── actions.ts                           — 19+ server action ("use server")
├── helpers/
│   ├── dosya-filtre.ts                  — URL params ↔ filtre + boyut format
│   └── dosya-filtre.test.ts             — 21 unit test
├── hooks/
│   ├── kullan-dosya-listesi.ts          — useInfiniteQuery (cursor)
│   ├── kullan-dosya-detay.ts            — useQuery
│   └── kullan-dosya-mutasyonlari.ts     — 6 useOptimisticMutation
└── components/
    ├── dosyalar-istemci.tsx             — orchestrator (filtre + tablo + çekmece)
    ├── dosya-filtre-cubugu.tsx          — debounced arama + select'ler
    ├── dosya-tablo.tsx                  — desktop tablo (TanStack uyumlu)
    ├── dosya-mobil-kart-listesi.tsx     — mobile kart liste
    ├── dosya-detay-cekmecesi.tsx        — 4 sekmeli ResponsiveDialog
    ├── dosya-onizleme-paneli.tsx        — tür bazlı render (görsel/PDF/text)
    └── dosya-surum-listesi.tsx          — sürüm listesi + yeni sürüm yükleme
```

E2E test: [`tests/e2e/dosyalar.e2e.ts`](../../../tests/e2e/dosyalar.e2e.ts) —
3 viewport happy path (Kural 17).

Bağımlı altyapı (F3 helper'ları):

- [`lib/dosya-storage.ts`](../../../lib/dosya-storage.ts) — bucket, yol üreteci, presigned URL
- [`lib/dosya-guvenlik.ts`](../../../lib/dosya-guvenlik.ts) — mime/uzantı/boyut/magic-byte
- [`lib/dosya-yetki.ts`](../../../lib/dosya-yetki.ts) — `canDosya` resource-level RBAC
- [`lib/dosya-onizleme.ts`](../../../lib/dosya-onizleme.ts) — tür bazlı render stratejisi
- [`lib/dosya-kategori.ts`](../../../lib/dosya-kategori.ts) — MIME → DosyaKategori eşleştirme

## Yetki Modeli

`lib/dosya-yetki.ts` `canDosya(kullaniciId, aksiyon, dosyaId)` 12 aksiyonu
karara bağlar:

| Aksiyon | Sistem izni | Kaynak gereği |
|---|---|---|
| `dosya:read` | DOSYA_OKU | bağlı kaynaklardan birine erişim |
| `dosya:download` | DOSYA_INDIR | aynı |
| `dosya:preview` | DOSYA_ONIZLE | aynı |
| `dosya:edit-meta` | DOSYA_AD_DUZENLE / DOSYA_ACIKLAMA_DUZENLE | aynı |
| `dosya:edit-gizlilik` | DOSYA_GIZLILIK_DUZENLE | aynı |
| `dosya:tag` | DOSYA_ETIKET_ATA | aynı |
| `dosya:link-add` | DOSYA_BAGLANTI_EKLE | hedef kaynakta edit |
| `dosya:link-remove` | DOSYA_BAGLANTI_KALDIR | hedef kaynakta edit |
| `dosya:version-add` | DOSYA_SURUM_YUKLE | aynı |
| `dosya:delete` (yükleyen) | DOSYA_KENDI_SIL | yükleyen |
| `dosya:delete` (başkası) | DOSYA_BASKA_SIL | bağlı kaynakta edit |
| `dosya:restore` | DOSYA_GERI_YUKLE | aynı |
| `dosya:purge` | DOSYA_KALICI_SIL | yalnız makam |

**Gizlilik kuralı:** `NORMAL` → kaynak erişimi yeterli. `HASSAS` → BIRIM_AMIRI ve üstü.
`GIZLI` → yükleyen + makam (KAYMAKAM/SUPER_ADMIN).

**Makam atlatması:** SUPER_ADMIN ve KAYMAKAM rolleri kaynak ve gizlilik
filtresini aşar.

## Server Action'lar

19 action — hepsi `lib/action-wrapper.ts` `eylem()` ile sarılı (audit
context, hata logu, request_id propagation otomatik):

```ts
import {
  dosyalariListeleEylem,
  dosyaDetayEylem,
  dosyaYuklemeBaslatEylem,
  dosyaYuklemeOnaylaEylem,
  dosyaSurumYuklemeBaslatEylem,
  dosyaSurumYuklemeOnaylaEylem,
  dosyaIndirEylem,
  dosyaOnizlemeEylem,
  dosyaAdGuncelleEylem,
  dosyaAciklamaGuncelleEylem,
  dosyaGizlilikGuncelleEylem,
  dosyaEtiketleriGuncelleEylem,
  dosyaEtiketiOlusturEylem,
  dosyaEtiketiSilEylem,
  dosyaBaglantiEkleEylem,
  dosyaBaglantiKaldirEylem,
  dosyaSilEylem,
  dosyaGeriYukleEylem,
  dosyaKaliciSilEylem,
} from "@/app/(panel)/dosyalar/actions";
```

## Upload Akışı

1. **Client** `dosyaYuklemeBaslatEylem({ kaynak_tip, kaynak_id, ad, mime, boyut })`
   - Server: Zod validate, mime/uzantı tutarlılık, kategori boyut limiti,
     kaynak edit yetkisi, rate limit (10/dk/kullanıcı).
   - Server: `DosyaYuklemeOturumu` kaydı + presigned PUT URL (5 dk TTL).
   - Dönüş: `{ oturum_id, upload_url, depolama_yolu, son_kullanma }`
2. **Client** binary'yi `upload_url`'e PUT eder (AbortController ile iptal edilebilir).
3. **Client** `dosyaYuklemeOnaylaEylem({ oturum_id })`
   - Server: storage stat ile boyut doğrulama; kategori limiti tekrar.
   - Server: `Dosya` + `DosyaSurumu(surum_no=1)` + `DosyaBaglantisi` tek transaction.
   - Dönüş: `{ id }`

Sürüm yükleme aynı pattern'i izler — `dosyaSurumYuklemeBaslatEylem` /
`dosyaSurumYuklemeOnaylaEylem` mevcut Dosya'ya yeni sürüm ekler, aktif
sürüm referansını günceller.

## Listeleme

Server-side filtre + cursor pagination (max 50 satır, Kural 97):

```ts
await dosyalariListeleEylem({
  arama: "tutanak",
  kategori: "PDF",
  proje_id: "...",
  yukleyen_id: "...",
  durum: "HAZIR",
  gizlilik: "NORMAL",
  silinmis: false,
  baglantisiz: false,
  boyut_min: 1024,
  boyut_max: 50_000_000,
  tarih_baslangic: new Date("2026-01-01"),
  siralama: "yeni-eklenen",
  cursor: "...",
  limit: 50,
});
```

Kapsam filtresi otomatik: makam değilse kullanıcının erişebildiği
proje/liste/kart bağlantısı olan dosyalar + kendi yüklediği orphan
dosyalar.

## Faz Tamamlanma Durumu

| Faz | Durum | Çıktı |
|---|---|---|
| F0 | ✅ | ADR-0028 |
| F1 | ✅ | Schema + 2 migration + 19 izin |
| F2 | ✅ | Eklenti → Dosya idempotent backfill (`prisma/scripts/backfill-eklenti-dosya.ts`) |
| F3 | ✅ | Storage + güvenlik + yetki + önizleme helper'ları (lib/dosya-*.ts) |
| F4 | ✅ | Service + action katmanı (19 action, 18+ şema) |
| F5 | ✅ | Kart eklenti UI compatibility wrapper |
| F6 | ✅ | Merkezi `/dosyalar` sayfası MVP |
| F7 | ✅ | Önizleme paneli + sürüm sekmesi (4 sekmeli detay çekmecesi) |
| F8 | ✅ | Çöp kutusu Dosya tablosuna bağlandı + realtime sabitleri |
| F8b | ✅ | Aktivite anlatı + bildirim tipleri + global arama |
| F9 | ✅ | Bildirim tetikleyicileri (DOSYA_YUKLENDI/SILINDI/BAGLANDI) |
| F10 | ✅ | E2E test (3 viewport) + bu README |

## v2 Geliştirmeleri

- **Office önizleme**: LibreOffice headless ile PDF conversion (Plan 12)
- **Virüs taraması**: ClamAV servisi (`KARANTINA` durumu zaten F1'de hazır)
- **Toplu işlemler**: Toplu sil/etiket/indir + CSV dışa aktarma
- **Hash dedup**: Aynı binary 2. yüklenince UI uyarısı + bağlantı önerisi
- **Kaynak tipleri**: YORUM, KONTROL_MADDESI, KULLANICI, BIRIM (enum'da rezerv)
- **Markdown önizleme**: DOMPurify ile sanitize edilmiş HTML render
