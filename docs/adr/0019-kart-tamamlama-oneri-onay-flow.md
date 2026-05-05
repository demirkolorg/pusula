# ADR 0019 — Kart ve Madde Tamamlama: Öneri/Onay Flow

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0018 (kart tamamlama yetkisi + sert blok). PR-1'de yetkisiz kullanıcı için disabled buton vardı; PR-2 burada belgelenen "öneri" akışını ekler.

## Bağlam

ADR-0018'de kart bütünü tamamlama yetkisi default olarak SUPER_ADMIN ve KAYMAKAM'a verildi. BIRIM_AMIRI ve PERSONEL kart kapatamaz. Bu durum operasyonel bir sorun yarattı:

- Kart yetkilisi olarak iş yapan personel "iş bittiğini" bildirmek için yorum yazmak zorunda kalır.
- Yorumun yetkili tarafından okunması/değerlendirilmesi belirsiz; "iş bitti" sinyali sistem içinde dolaşmaz.
- Audit log'da iş bitirme niyeti ile gerçek tamamlama farklı kayıtlar olur — sorumluluk netliği kaybolur.

Aynı sorun kontrol listesi maddesi düzeyinde de geçerli: madde'ye atanmış personel "yaptım" diyebilmeli ama izinsiz işaretleyememeli.

## Karar

### 1. State machine (4 durum)

```
                ┌─────────────────────────────────────┐
                │                                     │
                v                                     │
  ┌─────► [YOK] ─────────► [BEKLIYOR] ──Onayla──► [tamamlandi_mi=true, durum=YOK]
  │       (varsayılan)        │
  │                           │
  │                       Reddet
  │                           │
  │                           v
  └────── [REDDEDILDI] ◄──────┘
       (yeni öneri verilemez,
        bir sonraki "kapat"
        denemesi yine BEKLIYOR'a
        geçer — sıfırlama)
```

Enum: `TamamlanmaOneriDurumu { YOK, BEKLIYOR, REDDEDILDI }`.

- **YOK** — Öneri yok. Yetkili kullanıcı `tamamlandi_mi`'yi doğrudan değiştirebilir (PR-1 davranışı).
- **BEKLIYOR** — Yetkisiz kullanıcı önerdi, yetkili kullanıcının onay/red kararı bekleniyor. Kart `tamamlandi_mi=false` olarak kalır.
- **REDDEDILDI** — Öneri yetkili tarafından reddedildi. Sebep `tamamlanma_red_sebebi` alanında. Kullanıcı yeni öneri verebilir → tekrar BEKLIYOR'a döner.
- **ONAYLI durumu YOK** — Onay = `tamamlandi_mi=true` + `durum=YOK` + `oneren_id=null` + `oneri_zamani=null`. Tek atomic transaction.

### 2. Veri modeli

`Kart` ve `KontrolMaddesi`'ne aynı 4 alan eklenir:

```prisma
tamamlanma_oneri_durumu  TamamlanmaOneriDurumu @default(YOK)
tamamlanma_oneren_id     String?               @db.Uuid
tamamlanma_oneri_zamani  DateTime?
tamamlanma_red_sebebi    String?
```

Index: `@@index([liste_id, tamamlanma_oneri_durumu])` (kart için), `@@index([kontrol_listesi_id, tamamlanma_oneri_durumu])` (madde için) — yetkililerin "bekleyen onaylar" listesini hızlı sorgulayabilmesi için.

### 3. Server action'lar (6 adet)

**Kart:**
- `kartTamamlamaOneriEylem(id)` — kullanıcı `kart:read` + kart üyesi olabilir; izin gerekmez. Durum geçişi: YOK/REDDEDILDI → BEKLIYOR.
- `kartTamamlamaOnayEylem(id)` — `KART_TAMAMLA` + `kart:tamamla` ZORUNLU. BEKLIYOR → tamamlandi_mi=true. Sert blok (kontrol listesi yarım) burada da geçerli.
- `kartTamamlamaReddetEylem(id, sebep)` — `KART_TAMAMLA` + `kart:tamamla` ZORUNLU. BEKLIYOR → REDDEDILDI.

**Madde:** Aynı imza ile 3 action (madde için).

### 4. Yetki kuralları

| Aksiyon | Global izin | Resource yetki | Durum koşulu |
|---------|-------------|----------------|--------------|
| Öneri ver | yok | `kart:read` (kart üyeliği) | durum YOK veya REDDEDILDI; `tamamlandi_mi=false` |
| Onayla | `KART_TAMAMLA` | `kart:tamamla` | durum BEKLIYOR; kontrol listesi tam |
| Reddet | `KART_TAMAMLA` | `kart:tamamla` | durum BEKLIYOR |

`kart:read` aksiyonu mevcut `canKart` policy'sinde var; öneri verme için ek izin kodu gerekmez. Bu çok önemli: kart görmeye yetkili herkes "yaptım" diyebilir; sadece üst karar veren tamamlar.

### 5. Toggle UI 4 modu

`oneriDurumuHesapla()` saf helper UI moduna karar verir:

```ts
type ToggleModu =
  | { tip: "aktif" }              // tamamlandi_mi=true VEYA yetki var → standart toggle
  | { tip: "onerilebilir" }       // yetki yok + durum YOK/REDDEDILDI → öneri ver
  | { tip: "onerildi"; oneren }   // durum BEKLIYOR → bilgi (onayla butonu sadece yetkilide)
  | { tip: "reddedildi"; sebep }  // durum REDDEDILDI → uyarı (yeniden öner)
```

**Görsel:**
- `aktif` → ADR-0018'deki yeşil yuvarlak/boş daire (mevcut).
- `onerilebilir` → boş daire + tooltip "Tamamlandığını bildir".
- `onerildi` (yetkisiz kullanıcı için) → sarı yarım daire (`<CircleDashed>`) + tooltip "Onay bekleniyor: {oneren_ad}".
- `onerildi` (yetkili kullanıcı için) → sarı yarım daire + tıklayınca KartModal açılır + banner görünür.
- `reddedildi` → kırmızı kontur dairesi + tooltip "Reddedildi: {sebep}". Tıklamak yeni öneri verir → BEKLIYOR'a döner.

### 6. KartModal banner

`durum === BEKLIYOR && yetki var` ise modal başlığının altında banner:

```
┌──────────────────────────────────────────────────────┐
│ ⓘ {oneren_ad} bu kartın tamamlandığını bildirdi     │
│   {oneri_zamani}                                     │
│   [✓ Onayla]  [✗ Reddet]                             │
└──────────────────────────────────────────────────────┘
```

Reddet tıklamasında küçük dialog: "Red sebebi (opsiyonel)" + max 500 karakter.

### 7. Bildirim tetikleyicileri

3 yeni bildirim tipi:
- `KART_TAMAMLAMA_ONERILDI` — kart yetkililerine + KART_TAMAMLA izinli proje üyelerine.
- `KART_TAMAMLAMA_ONAYLANDI` — öneren kullanıcıya.
- `KART_TAMAMLAMA_REDDEDILDI` — öneren kullanıcıya (red sebebi mesajda).

Madde için aynı 3 tip (`MADDE_TAMAMLAMA_*`).

### 8. Audit log

Her geçiş audit'e düşer (Kural 42 + 116). 6A formatı:
- "X, '{kart_baslik}' kartının tamamlandığını bildirdi (öneri)"
- "Y, '{kart_baslik}' kartı için X'in tamamlama önerisini onayladı"
- "Y, '{kart_baslik}' kartı için X'in tamamlama önerisini reddetti: {sebep}"

### 9. Realtime echo

Mevcut `KART_GUNCELLE` event'i kullanılır (yeni event eklenmez); `kart_id` ile cache invalidate edilir.

### 10. Optimistic UI

3 mutation da `useOptimisticMutation` ile (Kural 107). Onay sırasında kontrol listesi yarım blok'u client'ta da hesaplanır (server reddedersen rollback).

### 11. PR-1 davranışından farklar

| Senaryo (PR-1) | Senaryo (PR-2) |
|----------------|----------------|
| Yetkisiz tıklama → toast.uyari "Yetkiniz yok" | Yetkisiz tıklama → öneri verilir, durum BEKLIYOR'a geçer |
| Disabled (gri) buton | Boş daire (önerilebilir) |
| — | Sarı yarım daire (önerilmiş) |
| — | Kırmızı kontur (reddedilmiş) |

## Sonuçlar

### Olumlu
- "İş bittiğini bildirme" sistem içinde net bir aksiyon — yorum yığını içinde kaybolmaz.
- Audit izi tam: kim önerdi, kim onayladı/reddetti, hangi sebeple.
- Yetkili kullanıcıya in-app bildirim → unutulma riski azalır.
- Kart ve madde aynı pattern → tek zihinsel model.
- State machine basit (3 enum + flag) — karmaşık iş akışı motoru gereksiz.

### Olumsuz / Risk
- 4 yeni alan × 2 tablo + 3 yeni enum değeri + 6 yeni server action → migration ve RBAC senaryosu büyür.
- Reddedildi durumu silinmez (history korunur). DB'de uzun vadede `tamamlanma_red_sebebi` text alanı şişebilir; v2'de retention politikası gerekebilir.
- Yetkili kullanıcının "bekleyen önerilerim" listesi UI'da yok — bildirim merkezi üzerinden ulaşır. Ayrı bir "Onay Bekleyenler" sayfası v2.

## Migration etkisi

Tek migration:
1. `TamamlanmaOneriDurumu` enum oluştur.
2. `Kart` ve `KontrolMaddesi`'ne 4 alan ekle (defaults ile mevcut kayıtları YOK durumuna sok).
3. `Kart_tamamlanma_oneren_id_fkey`, `KontrolMaddesi_tamamlanma_oneren_id_fkey` FK.
4. 2 yeni index.
5. `BildirimTipi` enum'una 6 yeni değer (kart×3 + madde×3).

```bash
bun prisma migrate dev --name kart_tamamlama_oneri_flow
```

## İlgili kurallar

- ADR-0018 (önkoşul).
- Kural 42 — Audit middleware bypass yasak.
- Kural 50 + V.2 — Resource-level RBAC.
- Kural 107-116 — Optimistic UI mutation.
- Kural 138 — Granüler yetki tipi (KartModal `kartTamamla` prop'u + öneri durumu birlikte yönetilir).
