# ADR-0030 — Eklenti tablosu drop planı

**Durum:** Önerildi (Sprint 2 / S2-16 tarafından yazıldı, drop Sprint 3+
sonrasında uygulanır)
**Tarih:** 2026-05-08
**İlişkili:** ADR-0028 (Dosya yönetimi çekirdek modeli)

## Bağlam

ADR-0028 ile `Eklenti` tablosu yerine `Dosya` + `DosyaSurumu` +
`DosyaBaglantisi` üçlüsüne geçildi. F4 itibarıyla yeni yüklemeler Dosya
modeline yapılır; F5'te eski Eklenti compatibility wrapper'ı yeni servise
delege etti.

Sprint 2'de:
- **S2-14**: `kart/kapak/services.ts` ve `projeler/[projeId]/services.ts`
  içinde `db.eklenti.*` referansları `db.dosya.*`'a taşındı.
- **S2-15**: `aktivite/services.ts` eklenti id eşleştirmesini Dosya'dan
  okuyor (backfill scripti zaten Eklenti id'lerini Dosya tablosuna
  kopyaladı).

Geriye `prisma/seed.ts`, `prisma/scripts/backfill-eklenti-dosya.ts` (+
test) ve `lib/audit-kaynak-etiket.ts` kalıyor — son üçü transitional
araç ve audit lookup'ı; Eklenti tablosu kaldırıldığında bunlar da
sadeleşir.

## Karar

Eklenti tablosu **3 fazlı** silme planı ile drop edilecek.

### Faz 1 — Hazırlık (Sprint 2 sonu, **TAMAMLANDI** S2-14/S2-15 ile)

- [x] Tüm `db.eklenti.*` runtime referansları kaldırıldı (kapak +
      aktivite). `compatibility/eklenti/services.ts` zaten Dosya'ya
      delege ediyordu.
- [x] Backfill scripti (prisma/scripts/backfill-eklenti-dosya.ts) eski
      Eklenti satırlarını Dosya + DosyaSurumu + DosyaBaglantisi olarak
      kopyaladı.

### Faz 2 — Read-only + Gözlem (Sprint 3, ~2 hafta)

- [ ] `Eklenti` tablosuna `INSERT/UPDATE/DELETE` engelleme: production
      DB'de ROLE bazlı revoke veya ROW-level RLS. Geliştirici notu:
      uygulama kodu zaten yazmıyor; bu adım defansif.
- [ ] Audit log'a `kaynak_tip = "Eklenti"` yazımı izleme (Pino üzerinden
      counter). 2 hafta sıfır yazım gözlenirse Faz 3 onaylanır.
- [ ] Yedekleme doğrulaması: Eklenti tablosunun son backup'ı ayrı
      storage'da (rollback için).

### Faz 3 — Drop migration (Sprint 4 başında)

```sql
-- 20260601000000_drop_eklenti/migration.sql
-- Önkoşul: Faz 2 tamamlandı, son 2 haftada Eklenti tablosuna yazma yok.
-- Yedekleme: production backup'ı `eklenti_archive_2026_06.sql` adıyla
-- WORM storage'da.

-- Bağımlılıklar: Eklenti'ye referans veren tek kod yolu yok (S2-14/S2-15
-- ile temizlendi). Kart.kapak_dosya_id artık Dosya.id'ye işaret eder
-- (FK constraint Dosya.id ile kurulu — backfill sonrası).
DROP TABLE "Eklenti";
```

Schema.prisma'dan `model Eklenti` bloğu kaldırılır + `Kart.eklentiler`
relation field'ı kaldırılır + `Kullanici.eklentiler` ve benzeri inverse
relation alanları temizlenir.

### Rollback

Drop sonrası rollback için:
1. Backup dosyasından (`eklenti_archive_2026_06.sql`) `pg_restore` ile
   tablo geri yüklenir.
2. Schema.prisma'da Eklenti modeli geri eklenir.
3. Backfill scripti tersine çalıştırılır (Dosya → Eklenti map; bu
   çalışmıyor çünkü ADR-0028 sonrası yeni Dosya kayıtları farklı şemaya
   sahip — pratikte sadece "eski 2026 öncesi snapshot'a dön" anlamına
   gelir, gerçek rollback'siz).

**Pragmatik rollback yok**: Faz 2 gözlem süresi yeterli olmazsa Faz 3
ertelenir.

## Sonuçlar

- Schema sadeleşir (1 model, ~8 ilgili relation).
- `prisma/scripts/backfill-eklenti-dosya.ts` ve testi geçiş aracı olarak
  kalır (rollback senaryosu için referans), Sprint 5'te tamamen silinir.
- `lib/audit-kaynak-etiket.ts` içindeki Eklenti label'ı korunur —
  geçmiş audit log'larda `kaynak_tip="Eklenti"` satırları yıllarca
  yaşar.

## Risk

- **Düşük**: Compatibility wrapper kaldırılması her durumda yapılmalı;
  Faz 2 gözlem süresi false-positive durumda Faz 3'ü erteler.
- Backup dosyasının erişilebilir olduğunun doğrulanması Faz 3 öncesi
  ZORUNLU.

## Plan Maddesi

- Tarama raporu Sprint 2 / S2-16 — drop planı yazıldı (bu doküman).
- Faz 2 ve Faz 3 maddeleri Sprint 3 ve Sprint 4 dashboard'larına
  eklenmeli.
