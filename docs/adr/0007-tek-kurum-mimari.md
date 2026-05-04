# ADR 0007 — Tek Kurum (Single-Tenant) Mimarisine Geçiş

**Tarih:** 2026-05-04
**Durum:** Kabul edildi
**Bağlam:** ADR-0001 (kurum-birim birleştirme), ADR-0005 (resource-level RBAC)

## Bağlam

Pusula şu ana kadar "ilçe yönetimi için bir kaymakamlık + birden fazla kurum" şeklinde **çoklu-kurum (multi-tenant)** olarak tasarlanmıştı. Service katmanı her sorguda `where: { kurum_id: kurumId }` filtresi, erişim helper'ları `xxx.kurum_id !== kurumId` reddi uyguluyordu.

Ürün sahibi bu modeli sadeleştirme kararı aldı: **sistem tek bir kuruma hizmet edecek, kurum içinde birden çok birim olacak.** Çoklu kurum gereksinimi öngörülmüyor.

## Karar

Runtime veri filtreleri olarak **`kurum_id` izolasyonu kaldırılır.** Sistem artık tek-kurum varsayımıyla çalışır.

### Kaldırılan
- Service katmanında `where: { kurum_id: kurumId }` filtreleri
- Erişim doğrulama helper'larında (`projeyeErisimDogrula`, `kartiBulVeProjeAl`, `eklentiyiBul`, `yorumuBul`, `kontrolListesiBulVeKart`, `iliskiBul` vb.) `xxx.kurum_id !== kurumId` reddi
- `app/(panel)/projeler/[projeId]/page.tsx`, `app/(panel)/kartlar/[kartId]/page.tsx`, `app/(panel)/projeler/[projeId]/liste/page.tsx` içinde kurum-tabanlı 404 reddi
- Socket-server `KART_KATIL` event'inde kurum izolasyonu koşulu
- `kullanicilariListele` action'ında opsiyonel `kurumId` filtresi
- `projeyeUyeEkle`'de "başka kuruma ait kullanıcı eklenemez" reddi (önceden ADR-0007 öncesi audit'te düşürülmüştü)
- `digerKurum`/`digerKullanici` cross-tenant test senaryoları → tek-kurum davranışına çevrildi veya kaldırıldı

### Korunan (Bilinçli)
- **Schema kolonları**: `Kullanici.kurum_id`, `Proje.kurum_id`, `Kurum` tablosu — gelecekte multi-tenant'a dönmek gerekirse hazırlık. Ayrıca:
  - `Kurum` tablosu hâlâ aktif olarak `KartHedefKurumu` (kart → hedef kurum eşlemesi) için kullanılır
  - `Kullanici.kurum_id` audit log'da hangi kurumun verisi olduğunu kaydetmek için tutulur
- **`Kullanici.create` ve `Proje.create`** çağrılarında `kurum_id` parametresi atanmaya devam eder (oturumdaki tek kurumun ID'si)
- **`lib/yetki.ts` makam katmanı kurum match koşulu** — `proje.kurum_id === kullanici.kurum_id`. Tek-kurum varsayımında bu her zaman true; ama koşul "kurum izolasyonu döndüğünde tek nokta tamir" sağlar
- **Audit middleware**'de kurum_id propagation
- **`yetkiZorunlu*` ve `canProje`/`canKart` resource-level RBAC** — proje üyeliği seviyesinde erişim hâlâ ZORUNLU (ADR-0005 / Kural V.2)
- **`SeansBilgisi.kurumId`** alanı — bilgi olarak tutulur, aktif filtreleme için kullanılmaz

## Sonuç

### Olumlu
- Service katmanında ~30 koşul azaldı, kod basitleşti
- Cross-tenant edge case test senaryoları kaldırıldı, test maliyeti düştü
- Aday kullanıcı sorgusu (üye atama) sistem genelinden sonuç döner — UX'in beklediği davranış

### Risk
- Multi-tenant'a dönüş: Schema kolonları korunduğu için filtre eklemek "where ekle, kontrol koşulunu yaz" işidir; tablo migration gerektirmez
- Erişim güvenliği: Resource-level RBAC (`canProje`/`canKart`/`canListe`) **tek başına yeterli izolasyon sağlar** — kullanıcı projeye/karta üye değilse erişemez; kurum filtresi aslında "ekstra güvenlik katmanı" idi, çıkması RBAC'ın doğru çalışması koşuluyla güvenli

### Etki Alanı
20+ dosya, ~30 değişiklik:
- `app/(panel)/projeler/services.ts`
- `app/(panel)/projeler/[projeId]/services.ts`
- `app/(panel)/projeler/[projeId]/{uye,etiket,eklenti,yorum,kontrol-listesi,iliski,kapak,aktivite}/services.ts`
- `app/(panel)/projeler/[projeId]/kart-hedef.ts`
- `app/(panel)/ayarlar/kullanicilar/services.ts`
- `app/(panel)/{kartlar/[kartId],projeler/[projeId],projeler/[projeId]/liste}/page.tsx`
- `socket-server/index.ts`
- İlgili test dosyaları

## Uyumluluk

- Kural V.2 (resource-level RBAC) **hâlâ geçerli** ve uygulanır
- Kural 50a (makam katmanı) — anlam değişti: `KAYMAKAM/SUPER_ADMIN` artık "kurumun tamamına erişir" değil "tüm sistemin tamamına erişir" anlamı taşır (tek kurum olduğu için pratikte aynı)
- Kural 146 (resource-level zorunlu) — değişmedi, hâlâ geçerli
