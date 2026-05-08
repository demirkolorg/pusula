# ADR-0032 — Mega dosya bölme planı (Sprint 3 / S3-1..S3-6)

**Durum:** Planlandı (Sprint 3 / S3-1..S3-6 — uygulama Sprint 4'te)
**Tarih:** 2026-05-08
**İlişkili:** Tarama raporu Sprint 3, Kontrol Kural #29 (max 400 satır,
800 hard limit), Kural U.1 (UI ↔ logic ayrımı)

## Bağlam

Tarama raporu Sprint 3'ün 5 mega dosya + 1 büyük kanban component
identify etti. Her biri Kural #29'un 800 satır hard limit'ini aşıyor:

| Dosya | Satır | Plan'a göre bölme |
|---|---|---|
| `app/(panel)/projeler/[projeId]/aktivite/services.ts` | 1756 | `services/listele.ts`, `services/zenginlestir.ts`, `services/ozet.ts` |
| `app/(panel)/projeler/[projeId]/services.ts` | 1350 | `services/kart.ts`, `services/liste.ts`, `services/arsiv.ts` |
| `lib/permissions-katalog.ts` | 1214 | `permissions-katalog/{proje,kart,dosya,bildirim}.ts` |
| `app/(panel)/bildirimler/tetikleyiciler.ts` | 1082 | `tetikleyiciler/{kart,liste,proje,davet,kontrol-listesi,etiket,dosya}.ts` + barrel |
| `app/(panel)/dosyalar/services.ts` | 985 | `services/upload.ts`, `services/etiket.ts`, `services/baglanti.ts`, `services/listele.ts` |
| `app/(panel)/projeler/[projeId]/components/kanban-pano.tsx` | 814 | `kanban-pano.tsx` (UI) + `use-kanban-pano.ts` (DnD logic); dosya-seviyesi `eslint-disable` kaldır |

Toplam **7201 satır** dağıtılacak; ortalama hedef dosya 300-450 satır
(Kural #29 hedef aralığı).

## Karar

Bölme uygulaması **Sprint 4 başında** her dosya için ayrı atomik commit
ile yapılır. Bu ADR plan-level seviyede S3-1..S3-6'nın kapsamını
dökümante eder; uygulama scope'u test'lerin geçerken kalmasını
gerektirdiği için hassas.

### Bölme metodu (her mega dosya için)

1. **Keşif**: dosyayı oku, mantıksal sınırları (export grupları, alt-domain'ler) belirle.
2. **Yeni dizin yapısı**: `<original-base>/services/<modul>.ts` veya
   `<original-base>/<modul>.ts` ile parça dosyaları oluştur.
3. **Re-export barrel**: orijinal dosyayı barrel'e dönüştür (1 satırlık
   `export * from "./services/modul"`) — çağıran taraflar etkilenmez.
4. **Type check**: `bun x tsc --noEmit` sıfır hata.
5. **Test**: ilgili test dosyaları (varsa) geçer. Yoksa critical-path
   action testi.
6. **Lint**: 0 yeni warning. `eslint-disable` comment'leri kaldırılırsa
   underlying violation çözülmüş olmalı (kanban-pano).

### Sprint 4 atomik commit sırası

| # | Madde | Tahmini süre | Risk |
|---|---|---|---|
| 1 | S3-6 kanban-pano (UI/logic) | 1.5h | Orta — eslint-disable çözüm DnD pattern'i değiştirebilir |
| 2 | S3-5 permissions-katalog (saf veri) | 0.5h | Düşük — kategori bazlı re-export |
| 3 | S3-4 tetikleyiciler (kategori barrel) | 1h | Düşük |
| 4 | S3-3 dosyalar/services | 1h | Orta — DosyaBaglantisi, Etiket cross-modül |
| 5 | S3-2 projeler/[projeId]/services | 1.5h | Yüksek — kart/liste/arşiv interdep |
| 6 | S3-1 aktivite/services | 2h | Yüksek — 1756 satır, en karmaşık |

Toplam **~7.5 saat** dedicated refactor scope.

## Sonuçlar

- Sprint 3 dashboard 13/19 madde olarak kapanır (S3-1..S3-6 plan-level
  tamam, uygulama Sprint 4'te).
- Sprint 4 ilk 2 günde mega dosya bölme dedicated session.
- Yeni kod yazarken bu dosyalara yeni satır eklemek yerine doğrudan yeni
  modül dosyasına yazılır (bölme öncesi büyütmemek için disiplin).

## Risk

- **Orta**: barrel re-export yanlış yapılırsa import path bozulur.
  Çözüm: her bölme commit'inde tüm test çalıştırılır.
- Kanban-pano dosya-seviyesi eslint-disable kaldırıldığında React
  Compiler kuralı yeni violation gösterebilir; UI/logic ayırma sırasında
  setState pattern'leri T.4 (idempotent setter) ile uyumlu olmalı.
