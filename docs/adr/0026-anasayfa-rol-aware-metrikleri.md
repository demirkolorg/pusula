# ADR-0026 — Ana Sayfa Rol-Aware Metrikleri ve Makam KPI Şeridi

- **Tarih:** 2026-05-06
- **Durum:** Kabul edildi
- **İlgili kural:** Kontrol Bölüm A/Kural 50a (makam katmanı), Bölüm S (rol-bazlı veri)
- **İlgili ADR:** ADR-0001 (rol mimarisi), ADR-0024 (sidebar RBAC), ADR-0025 (onay bekleyenler)

## Bağlam

Ana sayfada 4 metrik kartı ("Açık Görevim", "Geciken", "Bu Hafta", "Bekleyen Davet") **kişisel** odaklı tasarlanmıştı. PERSONEL ve BIRIM_AMIRI rolleri için anlamlı; ancak **KAYMAKAM/SUPER_ADMIN** (makam) için problem:

- Makam tipik olarak **kart yetkilisi olmaz** → "Açık Görevim" daima 0
- "Bu Hafta — Sen" sayacı 0 → bilgi taşımıyor
- "Bekleyen Davet — Gelen" çoğu zaman 0 → boş ekran hissi
- Makamın aslında izleyeceği şeyler (sistem sağlığı, bekleyen onaylar, kritik hatalar) ana sayfada **yok**

Sonuç: Makam giriş yaptığında ana sayfa "0 0 0 0" gösteriyor; **aksiyon alabileceği bilgi yok**.

## Karar

İki katmanlı çözüm:

### Faz 1 — Mevcut 4 kart rol-aware

`AnaSayfaMetrik` şemasına `kapsam: "kisisel" | "sistem"` alanı eklendi. Servis `kullaniciErisimBilgisi(kullaniciId).makam` flag'ine göre dallanır:

| Kart | Kişisel kapsam | Sistem kapsam |
|------|----------------|---------------|
| Açık Görevim → "Sistemde Açık" | `yetkililer.some(...)` filtresiyle bana atanan | Sistemdeki tüm aktif kartlar |
| Geciken | Kişisel açık + bitiş geçmiş | Sistem açık + bitiş geçmiş |
| Bu Hafta | Bana atanan + ekstra tamamladıklarım | Sadece "Takım" satırı (sistem geneli) |
| Bekleyen Davet | Gelen + Giden ayrımı | Tek sayı: aktif tüm davetler |

Ek olarak `bekleyenDavetTum` alanı eklendi — kişisel modda gelen+giden toplamı, sistem modda tek aktif davet sayısı.

### Faz 2 — Makam KPI Şeridi

Ana sayfada metrik şeridinin **üstünde**, sadece makam görenlerin gördüğü 4 kartlık ek şerit:

| Kart | Hesap |
|------|-------|
| Aktif Proje | `Proje.count({ silindi_mi: false })` |
| Aktif Kullanıcı (7g) | `Kullanici.count({ silindi_mi:false, aktif:true, son_giris_zamani >= now-7g })` |
| Onay Bekleyen | `Kullanici.count({ silindi_mi:false, onay_durumu: BEKLIYOR })` |
| Kritik Hata (24sa) | `HataLogu.count({ zaman >= now-24sa, seviye IN [FATAL, ERROR], cozuldu_mu: false })` |

Servis `makamKpisiniGetir(kullaniciId)` non-makam için **null** döner; `page.tsx` mount'u `{makamKpi && <MakamKpiSeridi kpi={makamKpi} />}` ile koşullu yapar. Yetki kontrolü servis seviyesinde — UI sadece görünmesin diye değil, veri sızmasın diye de kapatır.

## Kapsam Dışı (Faz 3 reddedildi)

BIRIM_AMIRI için ayrı bir "birim modu" (örn. "Birimimde Açık Görev") **eklenmedi**. Birim amiri PERSONEL ile aynı kişisel kapsamı görür. Bu karar bilinçli — gelecekte ihtiyaç olursa ayrı ADR ile genişletilir.

## Sonuçlar

### Olumlu
- Makam ana sayfası **artık aksiyon alınabilir bilgi taşıyor** (bekleyen onay, kritik hata)
- Mevcut PERSONEL deneyimi **birebir korundu** — UI bayrağı `kapsam` ile ayrıldı
- Tek `AnaSayfaMetrik` şeması — bileşen iki ayrı tip yönetmiyor
- Servis seviyesinde yetki ile veri sızıntısı engellendi

### Olumsuz / Riskler
- Makam'da `Kart.count({ silindi_mi:false, ... })` tüm tabloyu tarayabilir. Mevcut `(silindi_mi)` index'i karşılıyor; binlerce kart sınırını aşarsa partial index gerekir. İlk dalga MVP yükünde (binler/onbinler), sorun değil.
- "Bekleyen Davet" makam'da tıklanamıyor; aktif davet listesi sayfası ileride ayrı bir ADR ile (Davetler Yönetimi).

## Test Planı

`app/(panel)/ana-sayfa/services.test.ts` içinde:

- **Faz 1**: kişisel kapsamda `kapsam === "kisisel"`, `bekleyenDavetTum = gelen + giden`
- **Makam kapsamı**: `kapsam === "sistem"`, kart yetkilisi olmadan tüm açık + geciken sayılır, davet'te `bekleyenDavetTum` doğru, gelen/giden 0
- **makamKpisiniGetir**: non-makam null; aktif proje silinmiş hariç; son 7 gün giriş kullanıcısı; BEKLIYOR onay; FATAL/ERROR + çözülmemiş + son 24sa filtresi

Toplam 8 yeni test eklendi, 29 test geçti.

## Referanslar

- [app/(panel)/ana-sayfa/schemas.ts](../../app/(panel)/ana-sayfa/schemas.ts) — `kapsam` alanı + `MakamKpi`
- [app/(panel)/ana-sayfa/services.ts](../../app/(panel)/ana-sayfa/services.ts) — `kisiselMetrikler`, `makamMetrikleri`, `makamKpisiniGetir`
- [app/(panel)/ana-sayfa/components/metrik-kartlari.tsx](../../app/(panel)/ana-sayfa/components/metrik-kartlari.tsx) — rol-aware başlık/altyazı
- [app/(panel)/ana-sayfa/components/makam-kpi-seridi.tsx](../../app/(panel)/ana-sayfa/components/makam-kpi-seridi.tsx) — KPI şeridi
- [lib/yetki.ts](../../lib/yetki.ts) — `kullaniciErisimBilgisi` (`makam: boolean`)
