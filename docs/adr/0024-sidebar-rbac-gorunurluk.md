# ADR-0024 — Sidebar (Yan Menü) RBAC Görünürlük Filtresi

- **Durum:** Kabul edildi
- **Tarih:** 2026-05-06
- **Bağlantılar:** Kural 50 (RBAC), Kural 50a (Makam katmanı), Kural 131 (Saf logic ayrımı), Kural 138 (Granüler yetki tipi), Kural 139 (Saf fonksiyon test ZORUNLU), ADR-0014 (Granüler izin kataloğu), ADR-0005 (Resource-level RBAC)

## Bağlam

`components/app-sidebar.tsx` içindeki `navGroups` dizisi sabit hard-coded haldeydi: tüm 12 menü öğesi her oturumlu kullanıcıya görünüyordu. Sayfaların kendisi `izinVarMi` + `redirect/notFound` ile zaten korunuyordu (kaynak güvenliği OK), fakat sıradan `PERSONEL` rolünde bir kullanıcı bile "Roller", "Hata Logları", "Onay Bekleyenler", "Birimler", "Denetim", "Genel Ayarlar" başlıklarını görüp tıklayınca 404 yiyordu.

Sorunlar:

1. **Kötü UX** — kullanıcı tıklamadan görünür/görünmez ayrımını anlayamıyor; "yetkim yok mu, sayfa silinmiş mi?" belirsizliği.
2. **Minor information disclosure** — başlıklardan yönetim özelliklerinin varlığı sızıyor (örn. saldırgan recon'u).
3. **Ölü link** — `/ayarlar/etiketler` menüde vardı ama `app/(panel)/ayarlar/etiketler/page.tsx` hiç oluşturulmamıştı.
4. **Redundant `NavProjects`** — "Yönetim" → `/ayarlar/kullanicilar`, "Denetim" → `/ayarlar/denetim`. Aynı linkler "Ayarlar" grubunda zaten vardı; iki yerde aynı şey görünüyordu.

## Karar

### K1 — Saf modül + prop-driven sidebar

Yetki haritası ve filtre logic'i React'siz saf modülde tutulur (Kural 131):

- `lib/sidebar-yetki.ts` — `MENU_KODLARI` enum, `MENU_IZIN_HARITASI`, `menuGorunurMu(kod, izinSeti)`, `gorunurMenuKodlari(izinSeti)`.
- `lib/sidebar-yetki.test.ts` — 14 unit test (Kural 139). DOM/jsdom gerektirmez.

`components/app-sidebar.tsx` artık tüm öğe tanımlarını (icon/badge JSX dahil) bir `TUM_GRUPLAR` dizisinde tutar. Server-side hesaplanan `gorunurKodlar: MenuKodu[]` prop'unu alıp `Set<MenuKodu>` üzerinden filtreler.

`app/(panel)/layout.tsx` içinde `kullaniciIzinleriniAl(kullaniciId)` (cache'li) çağırıp sonucu `gorunurMenuKodlari(...)`'dan geçirir, çıkan diziyi prop olarak iletir.

### K2 — İzin haritası: sayfa erişim koşuluyla 1:1 hizalı

Her menü öğesinin gerekli izinleri = ilgili sayfanın `page.tsx` içindeki `izinVarMi` çağrısıyla birebir aynı. Sayfa kuralı değişirse harita da güncellenir.

| Menü | Gerekli İzin | Semantik |
|------|--------------|----------|
| Projeler | `null` | Auth yeterli |
| Tamamlama Onayları | `KART_TAMAMLA` | Tek izin |
| Çöp Kutusu | `null` | Auth yeterli (item bazlı yetki servis seviyesinde) |
| Genel | `AYAR_KURUM_DUZENLE` | Tek izin |
| Bildirim Ayarları | `null` | Auth yeterli (kullanıcı kendi tercihi) |
| Birimler | `BIRIM_YONET` | Legacy alias → genişler (ADR-0014) |
| Kullanıcılar | `KULLANICI_DUZENLE` ∨ `KULLANICI_DAVET` ∨ `KULLANICI_SIL` | OR |
| Onay Bekleyenler | `KULLANICI_ONAYLA` | Tek izin |
| Roller | `ROL_YONET` | Legacy alias → genişler |
| Şablonlar | `null` | Auth yeterli |
| Denetim | `DENETIM_OKU` | Tek izin |
| Hata Logları | `HATA_LOGU_OKU` | Tek izin |

OR semantik: `gereksinim.some((kod) => izinKoduGenislet(kod).some((g) => izinSeti.has(g)))`. Granüler izinlerin (`BIRIM_OLUSTUR`, `ROL_OLUSTUR`, ...) herhangi biri legacy alias'ı (`BIRIM_YONET`, `ROL_YONET`) tetikler — `izinKoduGenislet` (ADR-0014) ile.

Makam (`*` izin set'inde) tüm menüleri açar (Kural 50a).

### K3 — Boş grup gizlenir

Bir kullanıcının "Ayarlar" grubundaki tüm öğeleri yetkisizse grup başlığı (`SidebarGroupLabel`) da render edilmez. Filtre `gruplariFiltrele` içinde `items.length > 0` koşuluyla yapılır.

### K4 — Temizlik

- `app/(panel)/ayarlar/etiketler` route mevcut değildi; sidebar'dan kaldırıldı (ölü link).
- `components/nav-projects.tsx` silindi: redundant ("Yönetim", "Denetim" linkleri "Ayarlar" grubunda zaten var).

### K5 — Güvenlik kapsamı

Bu değişiklik **UX katmanıdır**, kaynak güvenliği DEĞİL. Sayfa erişim koruması her sayfanın kendi `page.tsx`'inde `izinVarMi` + `redirect/notFound` üzerinden devam eder; bir kullanıcı URL'yi bilse bile sayfaya giremez. ADR-0005 (resource-level RBAC) ve V.2 (Kural 146) bu modülden bağımsız çalışır.

## Sonuç

- Yetkisiz kullanıcılar yalnızca yetkili oldukları menüleri görür.
- Sayfa erişim güvenliği değişmedi.
- Test coverage: `gorunurMenuKodlari` ve `menuGorunurMu` için 14 unit test.

## Alternatifler (reddedildi)

- **Sayfa-bazlı 404 ile yetin.** Sorun: kötü UX + minor info disclosure.
- **Client-side `useSession`'dan filter.** Sorun: ilk render'da yanlış flash; cache yok; Kural 21 (Server Component default) ihlali.
- **Her menüyü auth-gated component'e sar.** Sorun: 12 ayrı server-fetch; layout-seviye tek `kullaniciIzinleriniAl` çağrısı (zaten cache'li) daha verimli.
