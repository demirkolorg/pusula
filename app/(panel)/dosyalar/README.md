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
├── README.md           — bu dosya
├── schemas.ts          — 18 Zod şeması (server action contract'ları)
├── services.ts         — Prisma + business logic (yuklemeBaslat/onayla,
│                          listele, detay, indir/onizle, metadata,
│                          etiket, bağlantı, sürüm, sil/restore/purge)
├── services.test.ts    — integration testler (10 senaryo)
└── actions.ts          — 19 server action ("use server")
```

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

## Sonraki Adımlar (F5+)

- **F5** — Kart eklenti UI'sı bu modüle geçer; eski `Eklenti` yazımı durur.
- **F6** — Merkezi `/dosyalar` sayfası MVP (TanStack Query hook'lar + UI bileşenleri).
- **F7** — Önizleme paneli + sürüm sekmesi.
- **F8** — Çöp kutusu, global arama, aktivite, bildirim entegrasyonu.
- **F9** — Toplu işlemler, CSV dışa aktarma.
- **F10** — E2E test, dokümantasyon.
