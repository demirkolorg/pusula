# ADR 0020 — Tamamlama Önerisi Retention Politikası

**Tarih:** 2026-05-06
**Durum:** Kabul edildi
**Bağlam:** ADR-0019 (öneri/onay flow). REDDEDILDI durumundaki kart ve maddelerde `tamamlanma_red_sebebi` text alanı süresiz tutuluyor; uzun vadede DB şişer ve KVKK perspektifinden gereksiz veri saklama olur.

## Bağlam

ADR-0019'un "Olumsuz / Risk" bölümünde belirtildiği üzere:

> Reddedildi durumu silinmez (history korunur). DB'de uzun vadede `tamamlanma_red_sebebi` text alanı şişebilir; v2'de retention politikası gerekebilir.

Risk maddeleri:
1. **Veritabanı şişmesi** — 1000 reddedildiğinde sebep ortalama 100 karakter ise yıl başına ~100KB; ölçek büyüdükçe binler katı. Index gerekmiyor ama VACUUM/storage maliyeti artar.
2. **KVKK** — Red sebebi kişisel veri içerebilir (örn. "Murat henüz teslim etmedi"). Amaç dışında saklama riski.
3. **UI gürültüsü** — Eski (örn. 6 ay önce) reddedilmiş öneri toggle'ında "yeniden bildir" tooltip'i hala duruyor; kullanıcı şaşırır.

## Karar

### 1. Retention süresi: 90 gün

REDDEDILDI durumunda olan kart ve madde için **`tamamlanma_oneri_zamani` 90 günden eskiyse**:
- `tamamlanma_oneri_durumu` → `YOK`
- `tamamlanma_oneren_id` → `NULL`
- `tamamlanma_oneri_zamani` → `NULL`
- `tamamlanma_red_sebebi` → `NULL`

Sonuç: kart/madde "ilk kez bildiriliyormuş gibi" temiz duruma döner. Audit log'da geçmişte reddedildiği zaten kayıtlı (Kural 42); silinen sadece denormalize edilmiş alanlar.

90 gün niçin? Türkiye'de yaygın "üç ay" uzaklığı; ne çok uzun (KVKK risk) ne çok kısa (kullanıcı gözden kaçırırsa kaybolma). Operasyonel ihtiyaca göre `RETENTION_GUN` env değişkeni ile ayarlanabilir.

### 2. BEKLIYOR durumu temizlenmez

Bekleyen öneriler aktiftir; süre kavramı yok. Kullanıcı veya yetkili görmeden silinmemeli.

### 3. Tamamlanmış kart/madde dokunulmaz

`tamamlandi_mi=true` durumdaysa zaten `tamamlanma_oneri_durumu=YOK`. Retention bu kayıtlara dokunmaz.

### 4. Cron endpoint

`/api/cron/oneri-retention` — günde bir kez (`0 3 * * *` Türkiye gece 3'te). CRON_SECRET koruması (Kural V.3/147).

İşlem:
```ts
const esik = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
await db.kart.updateMany({
  where: {
    tamamlanma_oneri_durumu: "REDDEDILDI",
    tamamlanma_oneri_zamani: { lt: esik },
  },
  data: {
    tamamlanma_oneri_durumu: "YOK",
    tamamlanma_oneren_id: null,
    tamamlanma_oneri_zamani: null,
    tamamlanma_red_sebebi: null,
  },
});
// Madde için de aynı.
```

Tek transaction değil — `updateMany` zaten atomic per-row; iki ayrı tablo arası tutarlılık gerekmiyor (her bir kayıt bağımsız).

### 5. Audit log

Retention'ın AktiviteLogu'na ayrı bir kaydı YAZILMIYOR. Sebebi:
- 1000+ kayıt birden temizlenirse audit log da şişer.
- Audit zaten orijinal "reddedildi" kaydını korur; zaman geçince retention'ın varlığı sistem davranışıdır, kullanıcı aksiyonu değil.
- Logger ile metrik yazılır: `logger.info({ kartTemizlendi, maddeTemizlendi }, "[cron] retention")`.

### 6. Saf helper

`oneriRetention(db, simdi, esikGun)` — saf service fonksiyonu (Kural 131). Test edilebilir; cron endpoint'i bunu çağırır.

## Sonuçlar

### Olumlu
- KVKK uyumlu — kişisel veri içerebilen `tamamlanma_red_sebebi` 90 gün sonra silinir.
- DB hacmi sabit kalır (sadece BEKLIYOR + tamamlanmamış kayıtlar büyüyebilir).
- UI eski reddedilmiş öneri görselini göstermez; kullanıcı kafası karışmaz.
- Cron pattern mevcut (`bildirim-bitis`) ile aynı; iş yükü düşük.

### Olumsuz / Risk
- Yetkili kullanıcı 90+ gün sonra "neden reddedildi?" diye sorduğunda red sebebi DB'de yok; sadece audit log'da var. Audit log UI'sı arama özelliği ile destekler (zaten var).
- env değişkeni ile değiştirilebilir olması, operasyonel hata riski (örn. `RETENTION_GUN=1` yanlış set edilirse 1 günde silinir). `oneriRetention` helper'ı min 7 gün, max 365 gün clamp eder.
- Cron çalışmazsa veriler birikir — zaten `bildirim-bitis` aynı tehdit altında, monitoring ile çözülür (Faz 6 metrikler).

## Rollback

Retention'ı kapatmak için: `vercel.json`'dan `oneri-retention` cron'unu sil + env'den CRON_SECRET silmeden bırak. Cron çalışmazsa veriler birikmeye devam eder; manuel temizlik gerekirse SQL ile yapılabilir.

## İlgili kurallar

- Kural V.3/147 — public POST endpoint güvenlik hattı (CRON_SECRET).
- Kural 42 — Audit log korunur (orijinal red kaydı silinmez).
- Kural 131 — Saf iş mantığı `<modül>-helper` veya servis fonksiyonu.

## Frekans tablosu (ileri ayar için)

| RETENTION_GUN | DB hacim büyüme/yıl (1000 öneri/yıl) | UI temiz | KVKK |
|---------------|---------------------------------------|---------|------|
| 30 | ~100KB | Çok temiz | İyi |
| **90 (default)** | ~300KB | Dengeli | İyi |
| 180 | ~600KB | Yavaş | Orta |
| 365 | ~1.2MB | Yavaş | Sınır |

Default 90 gün — operasyonel deneyim sonrası revize edilebilir.
