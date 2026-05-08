# ADR-0031 — Ham `useMutation` kullanım kararları

**Durum:** Onaylandı (Sprint 3 / S3-18 ile yazıldı)
**Tarih:** 2026-05-08
**İlişkili:** Kontrol Kural #108 (`useOptimisticMutation` default), Sprint 3 plan

## Bağlam

Kontrol Kural #108: server-state mutation'ları için `useOptimisticMutation`
default. Çıplak `useMutation` + el yazımı `onMutate` yasak — wrapper
kullanmadan tutarsız rollback olur.

Tarama raporu Sprint 3 / S3-18: codebase'de **9 yerde** ham `useMutation`
kullanılıyor. Plan: "useOptimisticMutation veya gerekçe yorumu" — yani
optimistic'e uygun olmayan akışlar için neden ham kullanıldığı yorumla
açıklanır, optimistic'e uygun olanlar migrate edilir.

## Karar

Ham `useMutation` kullanımı her dosya için aşağıdaki kategorilerden birine
oturur. Kategoriler kararı (migrate / yorum) belirler.

### Kategori A — Optimistic UYGUN DEĞİL (yorum yeterli)

Sayfa yönlendirmesi, dialog kapanışı, response-id alma gibi akışlarda
optimistic update değer katmaz; kullanıcı zaten sonucu beklemek zorunda.

| Dosya | Akış | Karar |
|---|---|---|
| `app/(auth)/kayit/components/kayit-form.tsx` | Yeni hesap → login sayfasına yönlendir | Yorum eklendi |
| `app/(panel)/ayarlar/kullanicilar/components/davet-gonder.tsx` | Davet oluştur → toast + dialog kapanır (response.id gerek) | Yorum gerekiyor |
| `app/(panel)/ayarlar/kullanicilar/components/kullanici-duzenle.tsx` | Form submit → dialog kapanır | Yorum gerekiyor |
| `app/(panel)/ayarlar/kullanicilar/components/kullanicilar-istemci.tsx` | Multi-aksiyon (sil, geri yükle, onayla, reddet) | Karışık — bazıları optimistic (sil), bazıları değil (onayla → audit fetch) |
| `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-ekle-dialog.tsx` | Üye ekle → dialog kapanır | Yorum gerekiyor |
| `app/(panel)/ayarlar/hata-loglari/components/hata-log-istemci.tsx` | "Çözüldü" işaretle → modal close + invalidate | Yorum eklendi |

### Kategori B — Optimistic'e MIGRATE (Sprint 4 takibi)

Bu mutation'lar `useOptimisticMutation` ile uyumlu; kullanıcı eylemini
hemen görmek istiyor (toggle, ekleme/silme).

| Dosya | Akış | Karar |
|---|---|---|
| `app/(panel)/bildirimler/hooks.ts` | "Okundu" işaretle, "tümünü okundu" | **Migrate ZORUNLU** — Sprint 4 |
| `app/(panel)/cop-kutusu/hooks/cop-sorgulari.ts` | Geri yükle, kalıcı sil | Migrate Sprint 4 |
| `app/(panel)/ayarlar/sablonlar/hooks/sablon-sorgulari.ts` | CRUD | Migrate Sprint 4 |

## Sonuçlar

- Bu commit (S3-18): 2 dosyaya gerekçe yorumu eklendi (kayit-form,
  hata-log-istemci). Diğer 4 Kategori A dosyası Sprint 4 başında yorum
  alır.
- Sprint 4 / S4-X (yeni madde): Kategori B'deki 3 dosya
  `useOptimisticMutation`'a migrate edilir. Test pattern: `lib/optimistic.test.tsx`.
- ESLint custom rule olarak ileride: ham `useMutation` import
  edildiğinde uyarı, ADR'a referansla bypass — Sprint 5+ scope.

## Risk

- **Düşük**: yorum eklemek kodu etkilemez. Migrate'ler ayrı sprint'te
  test'le birlikte yapılır.
