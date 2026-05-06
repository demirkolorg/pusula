# ADR-0025 — Onay Bekleyen Kayıtlar Kullanıcılar Sayfasına Entegre Edildi

- **Durum:** Kabul edildi
- **Tarih:** 2026-05-06
- **Bağlantılar:** ADR-0001 (Self-register akışı), ADR-0024 (Sidebar RBAC görünürlüğü), Kural 50 (RBAC), Kural 56/107-116 (Optimistic UI), Kural 131/139 (Saf logic + test)

## Bağlam

Self-register ile gelen kullanıcı kayıtları (`Kullanici.onay_durumu = BEKLIYOR`) ayrı bir sayfada (`/ayarlar/onay-bekleyenler`) kart-listesi olarak yönetiliyordu. Aynı zamanda `/ayarlar/kullanicilar` sayfasında DataTable üzerinde kalıcı kullanıcılar listeleniyordu — fakat bu liste BEKLIYOR durumundaki kayıtları sadece "Pasif" olarak gösteriyor, onay/reddet aksiyonu sunmuyordu.

Sorunlar:

1. **Bilişsel yük** — Yönetici "yeni gelen kullanıcı + mevcut kullanıcı" akışı için iki ayrı sayfa arasında geçiş yapmak zorunda.
2. **Yanıltıcı durum etiketi** — Kullanıcı listesi BEKLIYOR'u "Pasif" gösteriyordu; aslında kullanıcı pasif değil, onay sırasında.
3. **Bağlam kaybı** — Onay-bekleyenler kart-listesinde kullanıcının önceki giriş geçmişi/rolü yok; kullanıcılar sayfasında onay/reddet butonu yok. Aynı kişiyi farklı sayfalardan iki kez aramak gerekiyordu.

## Karar

### K1 — Onay bekleyen kayıtlar kullanıcılar listesinde

`kullanicilariListele` zaten `silindi_mi=false` filtresi ile çalışıyordu; BEKLIYOR ve REDDEDILDI olanlar zaten dönüyor ama UI bunu özel bir durum olarak göstermiyordu. Servis tipine `onay_durumu`, `red_sebebi`, `onay_zamani` alanları eklendi (`select` genişletildi).

### K2 — Saf durum helper'ı

`app/(panel)/ayarlar/kullanicilar/durum-helper.ts` (Kural 131):

```ts
export function kullaniciDurumu(g: { aktif: boolean; onay_durumu: KullaniciOnayDurumu | null }):
  "AKTIF" | "BEKLIYOR" | "REDDEDILDI" | "PASIF"
```

Öncelik: `BEKLIYOR > REDDEDILDI > AKTIF/PASIF (aktif flag'i)`. `aktif=false + ONAYLANDI` kombinasyonu = **manuel pasif** (operatör tarafından devre dışı bırakılmış onaylı kullanıcı). `durum-helper.test.ts` 6 unit test ile her dalı doğrular (Kural 139).

### K3 — Satır içi Onayla/Reddet (optimistic)

DataTable "Eylem" kolonu kullanıcının durumuna göre butonları dallandırır:

- **BEKLIYOR** → `Onayla` + `Reddet` (yetki: `KULLANICI_ONAYLA`)
- Diğer → `Düzenle` + `Sil` (yetki: `KULLANICI_DUZENLE` / `KULLANICI_SIL`)

`useOptimisticMutation` (Kural 108):

- `onaylaMut`: cache'te satırı `onay_durumu=ONAYLANDI, aktif=true, red_sebebi=null` ile günceller.
- `reddetMut`: `onay_durumu=REDDEDILDI, aktif=false, red_sebebi=<sebep>`. Sebep ≥ 2 karakter (server Zod refine).

Aktif sayfa exact key'i optimistic için, `ekInvalidate: [["kullanicilar"]]` ile diğer sayfalama/arama cache'leri tazelenir.

### K4 — Sidebar menüsü kaldırıldı

`MENU_KODLARI.AYAR_ONAY_BEKLEYENLER` ve `MENU_IZIN_HARITASI`'ndaki karşılığı kaldırıldı. `KULLANICI_ONAYLA` artık `AYAR_KULLANICILAR` menü görünürlüğünü tetikler (4'lü OR; ADR-0024 K2 tablosunun güncellemesi). Sadece onay yetkisi olan operatör de Kullanıcılar menüsünü görür.

### K5 — Eski URL davranışı

`/ayarlar/onay-bekleyenler` sayfası `redirect("/ayarlar/kullanicilar")` stub'ına indirildi (`page.tsx`). `components/onay-bekleyenler-istemci.tsx` ve servisteki `bekleyenKullanicilariListele` + `bekleyenKullanicilariListeleEylem` silindi (dead code, Kural 88 kapsamında). Yer-imleri/eski paylaşılan linkler kırılmadan, bir sonraki major sürümde stub da kaldırılabilir.

### K6 — Bekleyenleri keşfedilebilir kıl

Onay bekleyenleri kullanıcı listesine eklemek tek başına yeterli değil; alfabetik sıralı 50+ kullanıcı arasında 2-3 bekleyen kayıt sayfa 2/3'e düşüp gözden kaçabiliyor. Üç katmanlı çözüm:

1. **Sıralama:** `orderBy: [{ onay_durumu: "asc" }, { ad }, { soyad }]`. Prisma enum ASC: `BEKLIYOR < ONAYLANDI < REDDEDILDI` (alfabetik şans eseri istenen önceliği veriyor) — bekleyenler listenin başında.
2. **Sayaç chip:** `kullanicilariListele` response'u `bekleyenSayisi` (filtreden bağımsız `COUNT WHERE onay_durumu='BEKLIYOR'`) döner. UI'da arama kutusunun yanında `Onay Bekleyen [N]` butonu — sadece sayı > 0 ve kullanıcının `KULLANICI_ONAYLA` izni varsa görünür.
3. **Filtre toggle:** Aynı butona tıklayınca `onay_durumu='BEKLIYOR'` server filtresi aktif olur — sadece bekleyenler listelenir, sayfa 1'e döner. Tekrar tıklayınca filtre kalkar. "Filtreleri temizle" toggle'ı da resetler.

`schemas.ts:kullaniciListeSemasi`'ne `onay_durumu: z.enum([...]).optional()` eklendi; `services.ts` filter where'ında `if (girdi.onay_durumu) where.onay_durumu = girdi.onay_durumu`.

### K7 — Audit & test

- `services.test.ts`: `kullanicilariListele` için BEKLIYOR/ONAYLANDI/REDDEDILDI satır testleri + sıralama (BEKLIYOR'lar üstte) + `onay_durumu` filtresi + `bekleyenSayisi` testleri eklendi; `bekleyenKullanicilariListele` testleri silindi.
- `sidebar-yetki.test.ts`: "Kullanıcılar menüsü 4 izinden herhangi biriyle görünür" testi (ONAYLA dahil).
- `durum-helper.test.ts`: 6 unit test (her dal + null geriye dönük uyumluluk).
- `tests/e2e/kayit-onay-giris.e2e.ts`: yetki E2E akışı `/ayarlar/kullanicilar` üzerinden, satır içi Onayla butonu + optimistic durum geçişi.

## Sonuç

- Tek sayfada birleşik kullanıcı yönetimi; bağlam kaybı yok.
- Onay/reddet aksiyonu satır içi (Kural 11 — 44px hit target korunur).
- Sayfa erişim güvenliği değişmedi; her aksiyon kendi `KULLANICI_*` iznini kontrol etmeye devam ediyor.

## Alternatifler (reddedildi)

- **İki sayfayı bırak, kullanıcılar sayfasına filtre toggle ekle.** Sorun: yönetici hâlâ iki yerden bakmak zorunda; kart-listesi vs DataTable tutarsız UX. Ana sorun çözülmüyor.
- **Ayrı bir "BEKLIYOR" segment'i oluştur (üstte ayrı liste, altta diğerleri).** Sorun: pagination + arama davranışı bozulur; satır içi sıralama tutarsızlaşır. Tek liste + durum kolonu daha sade.
- **Onay-bekleyenler sayfasını kaldırmadan sadece kullanıcılar sayfasına aksiyon ekle.** Sorun: aynı işi yapan iki UI; bakım maliyeti. Kural 88 (dead code yasak) ile çelişir.
