# ADR-0036 — Birim kavramı sistemden tamamen kaldırıldı

**Tarih:** 2026-05-11
**Durum:** Kabul edildi
**Supersedes:** [ADR-0001 (Kurum/Birim birleştirme)](0001-kurum-birim-birlestirme.md), [ADR-0008 (Birim Paylaşım Saf Modeli)](0008-birim-paylasim-saf-model.md)
**Etkilenen ADR'lar:** [0012](0012-tek-rol-modeli-seviye-kaldirildi.md), [0014](0014-granuler-izin-katalogu.md), [0018](0018-kart-tamamla-ayri-aksiyon.md), [0019](0019-yetkili-mekanizma.md), [0022](0022-birim-makam-iliskisi.md), [0024](0024-sidebar-rbac-katmanlari.md), [0026](0026-davet-akisi.md), [0028](0028-dosya-yonetimi-cekirdek.md), [0033](0033-dead-izinler-karari.md) — birim referansları bu ADR ile geçersiz kılındı.

## Bağlam

ADR-0001 (2026-05-03) `Birim` modelini kaldırıp `Kurum` tek tabloya indirgemişti. Bir gün sonra ADR-0008 (2026-05-04) bu kararı geri çevirip `Kurum → Birim` rename + saf görünürlük modeli getirdi (`ProjeBirimi`, `ListeBirimi`, `KartBirimi` join tabloları). Bu çift eksen — **birim atamaları** ve **kişi atamaları** birlikte — yetki/bildirim katmanını gereksiz karmaşıklaştırdı:

- `lib/yetki.ts` içindeki `canProje/canListe/canKart` her sorguda 4 ayrı OR dalı çalıştırıyor (kişi-yetkili + kart-birim + liste-birim + proje-birim).
- `Kullanici.birim_id` Kural 50a ile rol semantiğine doğrudan bağlandı (BIRIM_AMIRI/PERSONEL zorunlu, makam null). Kayıt formu, davet formu, kullanıcı düzenleme, rol değiştirme akışları tümü bu kuralı doğrulamak zorunda.
- `app/(panel)/bildirimler/tetikleyiciler/_ortak.ts` içindeki `birimUyeleriniTopla()`, bir karta atanmış birimlerin **tüm üyelerine** bildirim yayıyor. Yetkisi olmayan kullanıcılar da bildirim alabiliyor.
- `lib/constants/birim.ts` 511 satırlık katalogla 23 birim kategorisi × ~115 birim tipi taşıyor; gerçek kullanım dar bir alt küme.
- Test fixture'ları (`tests/fixtures/proje.ts` `ortamKur`) her testte bir birim oluşturup kullanıcıyı oraya bağlamak zorunda; birim çıkartılırsa pek çok testin kurulum kodu sadeleşir.

Ürün sahibi kararını netleştirdi: **her şey kişiler üzerinden gitsin**. Kaymakamlığın "birim" yapısı sistemin yetki ve görünürlük modelinde **gizli bir eksen** olmasın; yetkili olan görür, olmayan görmez.

## Karar

`Birim` kavramı şemadan, RBAC'tan, UI'dan, bildirim algoritmasından, seed verilerinden ve testlerden **tamamen kaldırıldı**. Yeni model:

### 1. Görünürlük
Bir kaynağı (proje/liste/kart) **sadece** şu kişiler görebilir:
- Kaynağa veya üst kaynaklarına `*Yetkilisi` join tablosu üzerinden atanmış kişi.
- Makam (`SUPER_ADMIN`, `KAYMAKAM`) — kurumun tüm kaynaklarını görür (filtre atlanır).

Aşağıdan miras (alt liste/karta atanmış kullanıcı, üst proje kabuğunu görür) korunur — yalnızca navigasyon için.

### 2. Rol modeli
3 sistem rolü kalır: `SUPER_ADMIN`, `KAYMAKAM`, `PERSONEL`.

`BIRIM_AMIRI` rolü silindi. Bu role atanmış olan izinler (varsa) `KAYMAKAM` rolüne göç eder; `KAYMAKAM` zaten `*` izinlerini taşıdığı için pratikte no-op.

### 3. Şema değişiklikleri
- `model Birim` silindi.
- `model ProjeBirimi`, `model ListeBirimi`, `model KartBirimi` silindi.
- `Kullanici.birim_id` kolonu + index silindi.
- `DavetTokeni.birim_id` kolonu + index silindi.
- `enum BirimKategorisi` (23 değer), `enum BirimTipi` (~115 değer) silindi.
- `enum IzinKategorisi.BIRIM` değeri silindi.
- `enum DosyaKaynakTipi.BIRIM` değeri silindi.

### 4. İzin kataloğu temizliği
11 izin kodu silindi: `BIRIM_OLUSTUR`, `BIRIM_DUZENLE`, `BIRIM_HIYERARSI`, `BIRIM_SIL`, `BIRIM_GERI_YUKLE`, `PROJE_YETKILI_BIRIM_ATA`, `PROJE_YETKILI_BIRIM_CIKAR`, `LISTE_YETKILI_BIRIM_ATA`, `LISTE_YETKILI_BIRIM_CIKAR`, `KART_YETKILI_BIRIM_ATA`, `KART_YETKILI_BIRIM_CIKAR`. Eski geri-uyum alias'ı `BIRIM_YONET` da silindi.

### 5. Form akışı
Kayıt ve davet formlarından birim alanı çıkarıldı. Kullanıcı sadece ad/soyad/email/telefon/parola ile kayıt olur; davet sadece email + rol içerir.

### 6. Veri stratejisi
Dev ortamı `prisma migrate reset --force` ile sıfırlanır; seed birimsiz yeniden yazıldı (kullanıcılar doğrudan ad/soyad/email/rol ile, projeler/kartlar sadece kişi atamaları ile).

## Sonuçlar

### Olumlu
- `lib/yetki.ts` her sorguda 4 yerine 1 OR dalı çalıştırır → ~%40-60 daha az DB roundtrip.
- Bildirim algoritması netleşir: yetkisi olan haber alır, olmayan almaz. "Birim üzerinden sızdırılan bildirim" sorunu yok.
- Kayıt/davet UX 1 adım kısalır.
- Test fixture'ları sadeleşir (`ortamKur` artık `birimOlustur` yapmaz).
- 511 satır kullanılmayan kod silinir (`lib/constants/birim.ts`).
- ADR-0001 ile ADR-0008 arasındaki çelişki çözülür.

### Olumsuz / Risk
- **Davranış değişikliği:** Birim üzerinden bildirim alan kullanıcılar artık almaz. Bu kasıtlı — yeni model gereği yetkili olanlar bildirim alır.
- **Aktivite günlüğü planı askıya alındı:** [`docs/issues/2026-05-06-aktivite-gunlugu-plani.md`](../issues/2026-05-06-aktivite-gunlugu-plani.md) birim-bazlı kapsam motoru içeriyordu. Yeniden tasarlanacak (kapsam dışı).
- **Kurum içi raporlama:** "Hangi birim kaç kart aldı" gibi rapor kullanım talebi gelirse, kişi metadatası (örneğin `Kullanici.unvan` veya yeni `gorev` alanı) üzerinden inşa edilmeli. Bu ADR raporlama özelliği eklemiyor.

## Geri Alma

Bu ADR'nin geri alınması için:
1. Yeni bir ADR ile bu karar supersede edilir.
2. Schema'ya `Birim` ve join tabloları yeniden eklenir (yeni migration).
3. RBAC `lib/yetki.ts` birim OR dalları geri yazılır.
4. UI'da birim CRUD modülü yeniden inşa edilir.

Geri alma maliyeti yüksek olduğundan, alternatif "birim raporlama" ihtiyacı kişi metadatası üzerinden çözülmeye çalışılmalı.

## İlgili Kurallar

- **Kural 50a (kontrol/SKILL.md)** — Bu ADR ile güncellendi: makam katmanı validation artık tüm rollerde aynı şekilde uygulanır, birim zorunluluğu yok.
- **Kural 50, 146** (Resource-level RBAC) — sadeleşmiş kişi-bazlı kontrol kalır.
