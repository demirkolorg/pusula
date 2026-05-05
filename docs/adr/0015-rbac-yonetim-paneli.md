# ADR 0015 — RBAC Yönetim Paneli (Rol & İzin)

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0004 (güvenlik omurgası), ADR-0005 (resource-level RBAC), ADR-0012 (tek rol modeli — proje seviyesi kaldırıldı). Bu ADR ADR-0012'nin tek otorite kararını UI seviyesine taşır.

## Bağlam

Pusula'nın yetki altyapısı server tarafında güçlü:

- `Rol`, `Izin`, `RolIzin`, `KullaniciRol` tabloları var ([prisma/schema.prisma](../../prisma/schema.prisma))
- 20 izin kodu kategorize ([lib/permissions.ts](../../lib/permissions.ts))
- Server-side `izinVarMi/yetkiZorunlu` + kaynak-bazlı `canProje/canListe/canKart` (ADR-0005)
- 4 sistem rolü seed'de tanımlı

Eksik olan **yönetim arayüzü ve invalidasyon altyapısı**:

1. UI'dan yeni rol oluşturulamıyor — sadece seed'le tanımlanıyor
2. Mevcut rolün izinleri çalışma anında düzenlenemiyor
3. Kullanıcıya rol ataması için UI yok
4. İzin değişikliği oturum açık kullanıcıya yansımıyor (JWT eski kalıyor)
5. Client tarafında `usePermission()` hook'u yok — buton/menü görünürlüğü için her sayfa session'a bakıp manuel kontrol ediyor
6. Son admin koruması yok — kullanıcı kendi rolünden `rol:manage` izinini çıkarabilir → kilitlenme

## Karar

### 1. Tek otorite + iki katmanlı yetki (ADR-0012 doğrultusunda)

**Aksiyon yetkisi sistem izninden gelir** (`IZIN_KODLARI`). RBAC paneli **sadece sistem izinleri** matrisini yönetir. Kaynak erişimi (`canProje/canListe/canKart`) ayrı katman, paneli ilgilendirmez.

UI'da bu net açıklanır: "Rol, KULLANICININ NE TÜR İŞLEMLER YAPABİLECEĞİNİ belirler. Hangi proje/kart/birim'e ulaşabileceği ayrıca tanımlanır."

### 2. İzin kataloğu = kod sabiti, rol = DB

`IZIN_KODLARI` sabiti ([lib/permissions.ts](../../lib/permissions.ts)) source of truth. DB'deki `Izin` tablosu seed sırasında `upsert` ile bu sabitten doldurulur. **UI'dan yeni izin oluşturulmaz** — yeni izin ihtiyacı `IZIN_KODLARI`'na kod ekleme + migration gerektirir.

Roller DB'de canlı tanımlıdır, UI'dan oluşturulabilir/düzenlenebilir.

### 3. Sistem rolü kilitleme

`Rol.sistem_rolu = true` olan kayıtlar:

- **Ad ve kod kilitli** — düzenlenemez, kopyalanabilir (yeni rol şablonu olarak)
- **İzinleri düzenlenebilir** — KAYMAKAM rolüne yeni izin verilebilir/çıkarılabilir
- **Silinemez** — sistem rolü kaldırılamaz

Sistem rolleri: `SUPER_ADMIN`, `KAYMAKAM`, `BIRIM_AMIRI`, `PERSONEL`.

### 4. JWT invalidasyon: `Rol.izin_versiyonu`

`Rol` tablosuna `izin_versiyonu Int @default(1)` kolonu eklenir. Rolün izinleri her güncellendiğinde versiyon `+1` artar. JWT payload'a şu eklenir:

```ts
session.user.izinler: string[]      // izin kodları (cache key + client gating için)
session.user.izinVersiyonu: number  // kullanıcının her rolünden en yüksek versiyon
```

**Senkronizasyon:** Frontend her `useSession()` veya server component her `auth()` çağrısında. Ayrıca admin paneline geri dönüldüğünde otomatik refresh tetikler. JWT 30 dk session strategy ile zaten yenileniyor — ek refresh endpoint'ine MVP'de gerek yok.

### 5. Last-admin / last-kaymakam koruması

Server action'da rolün izinlerini güncelleme veya rolü silme/çoğaltma sırasında:

- Eğer kullanıcının kendisi `rol:manage` izninden mahrum kalacaksa → reddet ("Kendi yetkinizden 'rol:manage' çıkaramazsınız")
- Eğer son `SUPER_ADMIN` rolü silinmek isteniyorsa → reddet
- Eğer son `KAYMAKAM` rolü silinmek isteniyorsa → reddet

### 6. Yetki sınırı: yalnız SUPER_ADMIN ve KAYMAKAM yönetebilir

`IZIN_KODLARI.ROL_YONET` izni varsayılan olarak yalnızca SUPER_ADMIN ve KAYMAKAM rollerinde bulunur. UI sayfaları (`/ayarlar/roller`) `await yetkiZorunlu(uid, IZIN_KODLARI.ROL_YONET)` ile korunur.

### 7. Mobile-first

Roller listesi mobilde card-list, desktop'ta tablo (Kural 15). İzin matrisi mobilde accordion + arama, desktop'ta accordion + 2 kolon checkbox grid.

## Dosya Düzeni

```
app/(panel)/ayarlar/roller/
├── page.tsx                              # Liste — mobile card / desktop tablo
├── components/
│   ├── rol-listesi.tsx
│   ├── rol-mini-kart.tsx                 # mobile card
│   ├── rol-form-dialog.tsx               # yeni rol oluştur
│   ├── rol-cogalt-dialog.tsx
│   └── rol-sil-onay.tsx
├── [rolId]/
│   ├── page.tsx                          # Detay + izin matrisi
│   └── components/
│       ├── rol-detay-formu.tsx
│       ├── izin-matrisi.tsx
│       ├── izin-matrisi-helper.ts        # saf logic + test
│       ├── izin-kategori-grup.tsx
│       └── kaydetme-cubugu.tsx
├── schemas.ts
├── services.ts
├── services.test.ts
├── actions.ts
├── hooks/
│   ├── rol-sorgulari.ts
│   └── rol-sorgulari.test.tsx
└── README.md

lib/
├── permissions.ts                        # genişletildi — KATEGORI_BASLIKLARI, IZIN_ACIKLAMALARI, VARSAYILAN_ROL_IZINLERI
├── permissions-istemci.ts                # YENİ — usePermission hooks
└── permissions-versiyon.ts               # YENİ — versiyon artırma helper

components/
└── yetki-koru.tsx                        # YENİ — <YetkiKoru izin="...">
```

## Migration

`20260506_rbac_izin_versiyonu` — `Rol.izin_versiyonu Int @default(1)` ekler. Mevcut kayıtlar `1` ile başlar. Idempotent, downtime yok.

## Sonuçlar

**Olumlu**

- Sistem yöneticileri çalışma anında rol/izin güncelleyebilir
- Kullanıcı-rol ataması UI'da yapılabilir
- Audit log her değişikliği yakalar (mevcut middleware) — diff "eklenen/kaldırılan izinler" olarak görünür
- Client'ta `usePermission()` ile tek satır yetki kontrolü
- Last-admin koruması ile kilitlenme imkansız
- Mobile-first uygulama → mobilde de RBAC yönetimi mümkün

**Olumsuz / takas**

- JWT 30 dk yenilenene kadar kullanıcı eski izin setiyle çalışmaya devam edebilir. Acil revoke için kullanıcının çıkış-giriş yapması gerekir. **MVP için kabul edilebilir** — gerçek-zamanlı revoke v2 (`/api/oturum/yenile` endpoint'i + Socket.io broadcast).
- İzin kataloğu kod-sabiti olduğundan yeni izin için deploy gerekir. **Kabul edilebilir** — izin "sistemin yapabildiği işler" listesi, çalışma anında değişmemeli.

## İlgili Kurallar (kontrol skill)

- Kural 6 (Türkçe identifier), 9-15 (mobile-first), 19 (mikro bileşen), 22 (RHF + Zod), 23 (TanStack Query)
- Kural 49-50 (Zod + RBAC her action başında), 50a (makam katmanı), 53 (try/catch + HataLogu)
- Kural 107-116 (optimistic UI — izin checkbox toggle anında görünür)
- Kural 131 (saf logic ayrımı — `izin-matrisi-helper.ts`), 138 (granüler yetki tipi), 139 (saf fonksiyon test zorunlu)
- Kural 146 (resource-level RBAC zorunlu — UI bunu açıklar)

## İlgili ADR

- ADR-0004 — Güvenlik omurgası
- ADR-0005 — Resource-level RBAC
- ADR-0012 — Tek rol modeli, proje seviyesi kaldırıldı
