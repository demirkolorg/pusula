# ADR 0010 — Davet Üzerinden Proje Yetkili Bağlamı

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0004 (güvenlik omurgası), ADR-0005 (resource-level RBAC), ADR-0008 (birim paylaşım modeli)

## Bağlam

Yetkili paneli (kontrol Bölüm V/146) projeye/kişi-bazlı yetki ekleme akışında yalnızca **mevcut kullanıcılar**'ı listeliyordu. Saha gerçeği: kaymakamlığa yeni atanan personel henüz Pusula hesabına sahip değilken bir projeye atanmak isteniyor. Mevcut iki seçenek vardı:

1. Önce `/ayarlar/kullanicilar/davet` üzerinden davet → kullanıcı kabul edip giriş yapsın → operatör projeye geri dönüp kişiyi yetkilendirsin (3 adım, kopuk).
2. Operatör tahminî kullanıcı oluştursun ve projeye atasın (kimlik doğrulama yok, KVKK riskli, parola sıfırlama gerekecek).

Her ikisi de manuel sync gerektirip operasyon yükü çıkarıyor.

## Karar

### 1. Şema: `DavetProjeBaglami` ayrı tablo

`DavetTokeni`'ye gömülü JSON yerine **ayrı bir bağlam tablosu** eklendi:

```prisma
model DavetProjeBaglami {
  id               String             @id @default(uuid()) @db.Uuid
  davet_id         String             @db.Uuid
  proje_id         String             @db.Uuid
  seviye           ProjeYetkiSeviyesi @default(NORMAL)
  olusturma_zamani DateTime           @default(now())

  davet DavetTokeni @relation(fields: [davet_id], references: [id], onDelete: Cascade)
  proje Proje       @relation(fields: [proje_id], references: [id], onDelete: Cascade)

  @@unique([davet_id, proje_id])
  @@index([proje_id])
}
```

**Neden ayrı tablo (JSON kolon değil):**
- FK referans bütünlüğü → silinen proje bağlamı otomatik temizlenir (`onDelete: Cascade`)
- Index'lenebilir → bir proje için bekleyen davetler O(log n) sorgu
- Migration emniyeti → JSON shape değişimi schema-less, izlemesi zor
- Davet expire/use → `DavetTokeni` cascade ile bağlam silinir, sync loop gerekmez

### 2. Akış

1. Operatör `Kişi yetkisi ekle` modalında e-posta yazar, listede sonuç çıkmazsa **"Davet ile ekle: x@y.tr"** CTA görünür.
2. CTA → davet adımı (aynı dialog, mod değişimi): `seviye` seçilir (`NORMAL` varsayılan), gönder.
3. `projeyeDavetGonderEylem` → `davetOlustur(...)` çağırır, `proje_baglamlari: [{ proje_id, seviye }]` argümanı `DavetProjeBaglami.createMany` ile yazılır. Davet maili gönderilir.
4. Kullanıcı 7 gün içinde linke tıklayıp parola belirler → `daveriKabul` action'ı `Kullanici` oluştururken `davet.proje_baglamlari` üzerinde dönüp `ProjeYetkilisi.createMany({ skipDuplicates: true })` ile yetkilendirir. Silinen projeler atlanır (defensiv).
5. Davet expire/iptal/kullanıldı → `DavetProjeBaglami` Cascade ile temizlenir.

### 3. UI prensipleri

- Bekleyen davetler dialog içinde liste olarak görünür, iptal butonu var.
- Kişi sütunu başlığında küçük posta-kutusu rozet + sayı (`MailIcon` + N).
- E-posta formatı algılaması saf helper'da (`yetkili-kisi-ekle-helper.ts`) test edilir.
- Bekleyen davet zaten varken aynı e-postayla yeni davet engellenir (servis seviyesinde).

### 4. İki ayrı yetki kavramı — açıkça ayrılır

Davet form'unda **iki bağımsız alan** vardır; karıştırılmamalıdır:

| Kavram | Tablo | Değerler | Anlamı |
|---|---|---|---|
| **Sistem rolü** | `Rol` | KAYMAKAM, BIRIM_AMIRI, PERSONEL, SUPER_ADMIN | RBAC izin matrisi — kullanıcı sistemde hangi tip işlemleri yapabilir |
| **Proje yetki seviyesi** | `ProjeYetkilisi.seviye` | ADMIN, NORMAL, IZLEYICI | Bu projedeki yetkili rolü — kart/liste oluşturma, üye atama vs. |

**Form akışı:**
- "Sistem kimliği" bölümü: **Sistem rolü (zorunlu)** + **Atanacak birim** (makam rolü hariç zorunlu, `lib/kullanici-rol-politikasi.ts` validate eder)
- "Bu projedeki yetki" bölümü: **Proje yetki seviyesi** (ADMIN/NORMAL — IZLEYICI davet'te yok)

**Why iki ayrı alan:** Kullanıcı sisteme `PERSONEL` rolüyle girer (RBAC için zemin), ama bu projede `ADMIN` olabilir (proje-içi yönetim için). Bunlar bağımsız boyutlardır.

**Bug fix (2026-05-05):** İlk sürümde davet form'u sadece "proje yetki seviyesi" gösteriyordu, sistem rolü `null` geçiyordu → kabul eden kullanıcı **rolsüz** sisteme giriyordu (RBAC ihlali). Düzeltildi: `projeyeDavetGonderSemasi.rol_id` zorunlu, default `PERSONEL`. Makam rolü seçilirse birim alanı gizlenir + null geçer.

### 5. Yetki katmanları (Bölüm V/146)

Davet gönderme `IZIN_KODLARI.KULLANICI_DAVET` **ve** `IZIN_KODLARI.PROJE_YETKILI_YONET` izinlerini birlikte ister. Ek olarak kaynak-bazlı `yetkiZorunluProje(..., 'proje:authorize', proje_id)` çağrılır. Yani:
- `KULLANICI_DAVET` olmayan: davet gönderemez.
- `PROJE_YETKILI_YONET` olmayan: o projeye yetkili atayamaz.
- `proje:authorize` testi geçmeyen: kendi yetkisi olmayan projeye dahi davet gönderemez.

### 6. Rate limit (Bölüm V/147)

Mevcut `davetLimiter` (3/dk/kullanıcı) `proje-davet:` scope'uyla ayrı kova üzerinden tüketilir. Aynı kullanıcı global davet ile proje-bağlamlı daveti karıştırmasın — limit ayrı tutulur ki proje-davet flood'u global daveti tüketmesin.

## Sonuçlar

### Pozitif
- Tek modal, tek akış: operatör yetkililer panelinden çıkmadan davet + atama yapabilir.
- Davet expire olursa proje yetkisi de otomatik temizlenir; senkronizasyon loop'u yok.
- Çoklu proje bağlamı destekli (ileride `Toplu davet` özelliği için temel hazır).

### Negatif / Takas
- `DavetTokeni` artık birden çok modülden referans alıyor (kullanıcı yönetimi + proje yetkili). Bu yatay coupling kabul edilebilir çünkü tablo zaten cross-cutting.
- Service `davetOlustur` çağırma yetkisi proje yetkili modülünden import ediliyor — modül sınırının yumuşak geçişi var; bu, küçük tek-tenant ürün için pragmatik tercih.

### Genişlemeler (v2)
- Aynı dialogda "Birim ata" + "Rol ata" alanları → davet üzerinde rol/birim de bağlanabilir (servis tarafında destekli, UI henüz exposing etmiyor).
- Bekleyen davetler `Bildirim Merkezi`'nde davet gönderene "X kabul etti / etmedi" sinyali (S5).

## İlgili Dosyalar

- `prisma/schema.prisma` — `DavetProjeBaglami` modeli
- `prisma/migrations/20260505123212_davet_proje_baglami/`
- `app/(panel)/ayarlar/kullanicilar/services.ts` — `davetOlustur`, `projeBekleyenDavetleriListele`, `projeDavetBaglamiKaldir`
- `app/(panel)/ayarlar/kullanicilar/schemas.ts` — `davetGonderSemasi.proje_baglamlari`
- `app/(auth)/davet/actions.ts` — kabul flow `proje_baglamlari → ProjeYetkilisi`
- `app/(panel)/projeler/[projeId]/yetkili/actions.ts` — `projeyeDavetGonderEylem`, `projeBekleyenDavetleriEylem`, `projeDavetIptalEylem`
- `app/(panel)/projeler/[projeId]/yetkili/yetkili-adaptor.ts` — `davetAdaptor`
- `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-ekle-dialog.tsx` — UI
- `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-ekle-helper.ts` — saf logic + test
