# ADR 0008 — Birim Paylaşım Modeli ve Saf Görünürlük

**Tarih:** 2026-05-04
**Durum:** Kabul edildi
**Bağlam:** ADR-0001 (kurum-birim birleştirme), ADR-0005 (resource-level RBAC), ADR-0007 (tek kurum mimari) — bu ADR ADR-0007'yi **supersede eder**.

## Bağlam

ADR-0007'de "tek kurum, schema kolonları multi-tenant'a dönüş için korunur" kararı alınmıştı. Sonradan ürün sahibi mimari netleştirdi: **kurum kavramı tamamen kalkacak, sadece birim olacak**. Sistem tek bir kuruma (Tekman Kaymakamlığı) hizmet verir; içeride birimler düz liste hâlinde tutulur, hiyerarşi yoktur.

Bunun yanında "yanlış anlaşılan multi-tenant filtre" izleri (`where: { kurum_id: kurumId }`) ve `Proje.kurum_id` tekil FK temizlenmek istendi. Eski model bir projeyi tek bir kuruma bağlıyordu; yeni modelde **bir kaynak (proje/liste/kart) birden çok birime ve/veya kişiye paylaşılabilir**.

## Karar

### 1. Şema dönüşümü

- `Kurum` → `Birim` (tablo, enum, index, FK isimleri yeniden adlandırıldı; veri kaybı yok)
- `Proje.kurum_id` (tekil) **kaldırıldı**, yerine **çoklu** `ProjeBirimi` join tablosu eklendi
- Yeni: `ListeBirimi`, `ListeUyesi`, `KartBirimi` (eski `KartHedefKurumu` rename)
- `Kullanici.birim_id` artık **nullable** (`SUPER_ADMIN`, `KAYMAKAM` gibi makam kullanıcılarda null)
- Migration: [`20260504165000_birim_paylasim_modeli`](../../prisma/migrations/20260504165000_birim_paylasim_modeli/migration.sql) — eski `Proje.kurum_id` değerleri `ProjeBirimi`'ye taşındı.

### 2. Görünürlük modeli — Saf paylaşım

Bir kaynağı **sadece** şu kişiler görebilir:
- **Doğrudan üye** olarak atananlar (proje/liste/kart üyeliği)
- **Birimi atanmış** olanlar (proje/liste/kart birim ataması üzerinden)
- **Makam** (`SUPER_ADMIN`, `KAYMAKAM`) — sistem genelinde tüm kaynakları görür

Eski "atama yoksa proje/liste'den devral" fallback'i **kaldırıldı**. Yani:
- Proje görünürlüğü için proje düzeyinde atama gerekir (veya alt liste/kart üzerinden bir bağlantı)
- Liste görünürlüğü için liste düzeyinde atama gerekir (veya alt karta atama)
- Kart görünürlüğü için kart düzeyinde atama gerekir

İstisna: alt seviyede atama varsa üst kabuk (proje/liste) sadece o atanmış öğeleri içerecek şekilde görünür — UI gezintisi için zorunlu.

### 3. Otomatik atama (oluşturmada)

Yeni proje/liste/kart oluşturulduğunda **otomatik olarak**:
- Oluşturan kullanıcı `*Uyesi` tablosuna eklenir
- Kullanıcının birimi (varsa) `*Birimi` tablosuna eklenir

Bu sayede saf model katı uygulansa bile yeni oluşturulan kaynaklar oluşturanın ekibine anında görünür.

### 4. Servis ve UI uçları

- `app/(panel)/projeler/[projeId]/paylasim.ts` — proje ve liste için birim+kişi CRUD
- `app/(panel)/projeler/[projeId]/kart-birim.ts` — kart birim CRUD (eski `kart-hedef.ts` yerine)
- UI: `proje-paylasim-popover.tsx`, `liste-paylasim-popover.tsx`, ortak `birim-paylasim-listesi.tsx`
- `app/(panel)/ayarlar/birimler/` — birim envanteri yönetimi (eski `kurumlar/` yerine)

### Kaldırılan

- ADR-0007'nin "Korunan" listesindeki `Kurum` tablosu, `Kullanici.kurum_id`, `Proje.kurum_id` — şema seviyesinde temizlendi
- `lib/yetki.ts` `canListe`/`canKart` "atama yoksa devral" fallback'leri
- `services.ts` `listeGorunurlukWhere`/`kartGorunurlukWhere` "boş atama → görünür" OR koşulları
- `lib/constants/kurum.ts`, `app/(panel)/ayarlar/kurumlar/`, `tests/e2e/kurum-crud.e2e.ts`

### Korunan

- Resource-level RBAC ilkesi (Kural V.2 / ADR-0005) — değişmedi, bu ADR onun saf uygulanmasını netleştirir
- `kullaniciErisimBilgisi.makam` — sistem rolü olanlar tüm kaynakları görür (`izinler.has("*")`)

## Sonuç

### Olumlu

- Veri modeli niyetle eşleşti — bir görev birden çok birime/kişiye atanabilir
- Çoklu-tenant filtre kalıntıları tamamen temizlendi
- Saf görünürlük: kullanıcı atanmadığı yeri **görmez**, KVKK ile uyumlu

### Risk

- **Eski liste/kart kayıtları**: migration sırasında otomatik atama yapılmadı; eğer prod'da atamasız kalmış kayıt varsa yeni kuralda görünmez. MVP öncesi data temiz olduğundan kabul edilebilir.
- **Makam dışında "tüm projeleri gör" yok**: sadece `SUPER_ADMIN`/`KAYMAKAM` atlatabilir. `BIRIM_AMIRI` için bile birim ataması zorunlu (Kural 50a).

### Etki Alanı

- Şema + 1 migration
- `lib/yetki.ts`, `app/(panel)/projeler/[projeId]/services.ts`
- 4 yeni paylaşım UI bileşeni
- `app/(panel)/ayarlar/birimler/` (yeni klasör), eski `kurumlar/` silindi
- 26 test dosyası, 319 test — tümü geçiyor

## Uyumluluk

- Kural V.2 (resource-level RBAC) — değişmedi, bu ADR uygulamasını berkitir
- Kural 50a (makam katmanı) — geçerli
- ADR-0005 — geçerli
- **ADR-0007 — supersede edildi**: "schema kolonları korunur" maddesi artık geçerli değil; kolonlar düştü
