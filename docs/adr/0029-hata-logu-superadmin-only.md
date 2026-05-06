# ADR-0029 — Hata Logu Erişimi: Yalnızca SUPER_ADMIN

- **Durum:** Kabul edildi
- **Tarih:** 2026-05-06
- **Bağlantılar:** Kural 50 (RBAC her action başında), Kural 59 (Hassas alan maskeleme), Kural 67 (Hardcoded secret yasak), ADR-0014 (Granüler izin kataloğu), ADR-0024 (Sidebar RBAC görünürlük), ADR-0027 (Aktivite Günlüğü — denetim sayfasının SUPER_ADMIN'e sınırlanması)

## Bağlam

`/ayarlar/hata-loglari` modülü `HataLogu` tablosunu yüzeyler. Bu kayıtlar:

- **Frontend exception'ları** — sayfa stack trace'i, bileşen path'leri, kullanıcı oturum bağlamı.
- **Backend hataları** — Prisma exception'ları (bazıları SQL fragmenti içerebilir), Server Action stack'leri, request body'leri (`istek_govdesi`), istek başlıkları (`istek_basliklari` — Authorization/Cookie maskelenmiş olsa da User-Agent, IP, request_id varsayılan açık).
- **HTTP meta** — yol, metod, durum kodu, IP, User-Agent.
- **Çözüldü işaretleme + not** — operasyonel takip.

Bu içerik **idari değil teknik forensik veridir**. KAYMAKAM gibi idari rolün operasyonel iş akışında bu sayfaya bakma gereği yok; içerik ise hassas (fail eden tablolar/sütunlar, internal yol yapısı, request gövdeleri) — incident response sırasında bile yönetici yerine sistem yöneticisinin (SUPER_ADMIN) işidir.

ADR-0027 aynı mantığı `/ayarlar/denetim` (ham audit log) için uyguladı: forensik denetim yüzeyi SUPER_ADMIN'e sınırlandı, kullanıcı/makam aktivite ihtiyacı `/aktivite-gunlugu` sayfasıyla karşılandı. Aynı mantık hata logu için de geçerli — ancak hata logu için ayrı bir "kullanıcı odaklı" karşılığı yok: sistem hataları idari rolün ihtiyacı değil.

Mevcut durum (değişiklik öncesi):

- `HATA_LOGU_OKU` ve `HATA_LOGU_COZULDU_ISARETLE` izinleri SUPER_ADMIN ve KAYMAKAM rollerinde kayıtlıydı ([lib/permissions-katalog.ts](../../lib/permissions-katalog.ts)).
- Sidebar `Hata Logları` menüsü `HATA_LOGU_OKU` izniyle koşulluydu (ADR-0024); KAYMAKAM rolüne menü görünüyordu.
- `hataCozumIsaretle` action'ında yetki kontrolü yanlış izinle (`HATA_LOGU_OKU`) yapılıyordu — bu bir bug; doğrusu `HATA_LOGU_COZULDU_ISARETLE`.

## Karar

### K1 — KAYMAKAM rolünden hata logu izinlerini çıkar

`VARSAYILAN_ROL_IZINLERI[ROL_KODLARI.KAYMAKAM]` listesinden iki izin de kaldırıldı:

- `IZIN_KODLARI.HATA_LOGU_OKU`
- `IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE`

İzin kataloğunda iki izin de **korunur** (tanım + kategori + UI eşleşmeleri); sadece varsayılan rol ataması değişti. SUPER_ADMIN rolü `TUM_IZIN_KODLARI` ile zaten her iki izni alır — değişiklik gerekmez.

### K2 — `hataCozumIsaretle` yetki bug'ı düzeltildi

Action içindeki `yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.HATA_LOGU_OKU)` çağrısı `IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE` olarak düzeltildi. K1 sonrası SUPER_ADMIN yine her iki izne sahip olduğundan davranış değişmez; ancak doğru iznin doğru action'a bağlanması RBAC tutarlılığı gereği zorunlu (Kural 50).

### K3 — Sidebar menüsü ve sayfa erişimi

`lib/sidebar-yetki.ts` `MENU_IZIN_HARITASI[AYAR_HATA_LOGLARI] = [HATA_LOGU_OKU]` haritası **değişmez**. K1 sonrası KAYMAKAM rolü `HATA_LOGU_OKU` iznini taşımadığı için sidebar'da menü öğesi otomatik gizlenir (ADR-0024 K2). `Hata Logları` artık sadece SUPER_ADMIN'e (ve `*` izin set'i taşıyan makam test hesaplarına) görünür.

`app/(panel)/ayarlar/hata-loglari/page.tsx` `izinVarMi(kullaniciId, HATA_LOGU_OKU)` koşulunu zaten uyguluyor; ek değişiklik gerekmez.

### K4 — Kaynak güvenliği bağımsız çalışır

K1 sayfa görünürlüğünü ve action'ları RBAC üzerinden kapatır. Hata logu kayıtlarının kendisi `HataLogu` tablosunda bağımsız tutulmaya devam eder (DB seviyesinde kısıtlama yok — gerek de yok, app-layer RBAC yeterli; ADR-0005 resource-level RBAC tartışması burada uygulanmaz çünkü hata logu tablosu bir kullanıcı-kaynak ilişkisi taşımaz, sistem-geneli forensik veridir).

### K5 — Migration / seed davranışı

`prisma/seed.ts` `VARSAYILAN_ROL_IZINLERI`'ni okuyup `RolIzni` tablosunu doldurur. Üretim DB'sinde KAYMAKAM rolüne daha önce atanmış `RolIzni` satırları olduğu için seed yeniden çalıştırılmadan eski izinler kalır. Yayına alma yordamı:

1. Kod merge edilir.
2. Seed yeniden çalıştırılır (`bun run prisma/seed.ts`) — KAYMAKAM rolünden iki `RolIzni` satırı temizlenir.
3. Eğer üretimde özel-tanımlı bir rol bu izinleri taşıyorsa SUPER_ADMIN'e geçirilir veya bilinçli istisna olarak `docs/adr/` altına yazılır.

Seed'in `RolIzni` upsert davranışı VARSAYILAN_ROL_IZINLERI değişiminde kaldırılan izinleri silip silmediği kontrol edilmeli; silmiyorsa manuel cleanup migration script'i gerekir. (Bu ADR sadece kararı kayıt altına alır; uygulama detayı tekrar yayın aşamasında doğrulanır.)

## Sonuç

- KAYMAKAM rolü hata logu sayfasını ve action'larını artık görmez/çağıramaz.
- SUPER_ADMIN rolünde değişiklik yok — tüm CRUD (oku + çözüldü işaretle) erişimi devam eder.
- `hataCozumIsaretle` doğru izinle korunur (RBAC tutarlılığı).
- Sidebar menüsü otomatik gizlenir (ADR-0024 katmanı).

## Alternatifler (reddedildi)

- **KAYMAKAM'a sadece okuma bırak, çözüldü işaretlemeyi SUPER_ADMIN'e bırak.** Reddedildi: ham hata gövdeleri/stack'ler idari rolde anlamlı operasyonel veri sunmuyor; sadece okuma bile hassas içeriği yüzeyler.
- **İzni tamamen kaldır, sayfayı sadece env-gate ile aç.** Reddedildi: izin sistemi tek tutarlı yetki katmanı; özel switch'ler bakım yükü ve audit boşluğu yaratır.
- **Yeni "DEVOPS" rolü tanımla, hata logunu oraya bağla.** Reddedildi: rol enflasyonu (Kural 12 — tek rol modeli, ADR-0012); ihtiyaç oluştuğunda SUPER_ADMIN dışında bir grup için ek izin atama mekanizması zaten var (özel rol tanımı UI üzerinden).
