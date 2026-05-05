# ADR 0017 — Global Arama: tsvector + pg_trgm + Komut Paleti

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** `docs/plan.md` Bölüm 1.5/A (çekirdek arama ilkesi), Sprint S6, ADR-0004 (güvenlik omurgası), ADR-0005 (resource-level RBAC), ADR-0014 (granüler izin kataloğu).

## Bağlam

Plan'ın 1.5/A bölümünde "tek arama kutusundan kart, yorum, kontrol maddesi, eklenti, kullanıcı, birim, etiket, audit log, proje adı — hepsi aranabilir" çekirdek ilkesi var. S6 sprint'inin global search ayağı bu ADR ile somutlaşır. Üç temel soru:

1. **İndeksleme stratejisi:** kolon-per-tablo `tsvector` mi, materialized view (`ArananIcerik`) mi, harici motor (Meilisearch/Typesense) mi?
2. **Yetki filtreleme:** Postgres RLS mi, app-level join mi?
3. **Yazım hatası toleransı:** sadece tsvector mi, `pg_trgm` fuzzy fallback eklenir mi?

## Karar

### 1) İndeksleme: kolon-per-tablo `tsvector` + UNION ALL sorgu

Her aranabilir tabloya `arama_vektoru tsvector` kolonu eklenir. Postgres trigger ile insert/update'te otomatik güncellenir. GIN index ile sorgu hızlı.

Sorgu zamanında ilgili tablolar `UNION ALL` ile birleşir, tip bazlı gruplandırma uygulama katmanında yapılır.

**Aranabilir kaynaklar (9 tip — v1):**

| # | Tablo | İndekslenen alanlar | Yetki kaynağı |
|---|-------|---------------------|---------------|
| 1 | `Kart` | `baslik` (A), `aciklama` (B) | proje yetkilisi |
| 2 | `Yorum` | `icerik` (A) | kart üzerinden proje yetkilisi |
| 3 | `KontrolMaddesi` | `metin` (A) | kart üzerinden proje yetkilisi |
| 4 | `Eklenti` | `ad` (dosya adı) (A) | kart üzerinden proje yetkilisi |
| 5 | `Kullanici` | `ad`, `soyad`, `email`, `unvan` (A) | herkes (sadece public alanlar) |
| 6 | `Birim` | `ad`, `kisa_ad` (A) | herkes |
| 7 | `Etiket` | `ad` (A) | proje yetkilisi |
| 8 | `Proje` | `ad` (A), `aciklama` (B) | proje yetkilisi |
| 9 | `Liste` | `ad` (A) | proje yetkilisi |

**`AktiviteLogu` v2'ye ertelendi:** çok yüksek yazma hacmi (her DB değişikliği), JSON alanları üzerinde tsvector güncel tutmak pahalı, ayrıca sadece `audit:read` izni olanlara açık. v1.1'de partition + cold storage tasarımı netleştikten sonra eklenecek. Plan 1.5/A "audit log dahil" hedefi v2'ye ertelendi (küçük scope kararı, kullanıcı onayıyla).

`ts_rank` ağırlıkları: A (başlık/ad) > B (gövde/açıklama). Sonuç sıralaması: rank DESC, sonra `guncelleme_zamani DESC`.

### 2) Materialized view DEĞİL

Materialized view (`ArananIcerik`) reddedildi. Gerekçeler:
- **Refresh ops yükü:** kayıt değişiminde `REFRESH MATERIALIZED VIEW CONCURRENTLY` zaman alır; trigger yerine cron pattern → arama freshness 1-5 dk gecikir, plan 1.5/A "anlık" diyor.
- **Storage ikileme:** her kayıt iki yere yazılır (orijinal + view); küçük-orta veri için gereksiz.
- **Schema esnekliği:** kaynak tablo değiştiğinde view'i yeniden oluşturmak migration karmaşıklığı yaratır.

Trade-off: 10-tablo UNION sorgusu kolon-per-tablo'da query planner için daha karmaşık, ama her bir tablo GIN ile O(log n)'de filtrelenip 50-200 satır döndürdüğünden toplam latency hâlâ kabul edilebilir (< 100ms p95 hedefi).

v2 eskalasyonu: yük artarsa Meilisearch self-host devreye alınır (plan 1.5/A'da öngörülmüş).

### 3) Türkçe stemmer + pg_trgm fuzzy

- `tsconfig`: Postgres `simple` config'i Türkçe morfolojiye uygun değil; özel `turkish` config oluşturulur (Snowball Türkçe stemmer + custom stop-word listesi: "ve", "ile", "için", "bir", "bu", "şu", "o", "ki", "de", "da", "mi", "mı", "mu", "mü").
- **Birincil sorgu:** `arama_vektoru @@ plainto_tsquery('turkish', $sorgu)` — tam/yarı kelime eşleşmesi.
- **Fuzzy fallback:** birincil sorgu boş döndüğünde `pg_trgm` extension'ı ile `similarity(alan, $sorgu) > 0.3` eşiği. Yazım hatası toleransı (örn. "yetkilı" → "yetkili").
- **Trigger:** birincil sonuç < 5 olduğunda fuzzy ekle; performans için `pg_trgm` GIN ayrı index.

### 4) Yetki filtresi: app-level join (RLS DEĞİL)

Mevcut `lib/yetki.ts` (resource-level RBAC, ADR-0005) ile uyumlu olması için yetki filtresi **uygulama katmanında** uygulanır. Postgres RLS reddedildi:
- RLS Prisma ile sürtünmeli (RLS policy'leri schema'da yönetilemez, manuel SQL gerekir → Kural 38/39 ihlali).
- Mevcut `kullanicininErisilebilirProjeleri(kullaniciId)` helper'ı zaten subquery döndürüyor → arama sorgusunda `WHERE kart.proje_id IN (...)` clause'u natural fit.

**Akış:**
```sql
SELECT id, baslik, ts_rank(arama_vektoru, q) AS rank, 'KART' AS tip
FROM "Kart"
WHERE arama_vektoru @@ plainto_tsquery('turkish', $1) AS q
  AND silindi_mi = false
  AND proje_id IN (SELECT proje_id FROM "ProjeYetkilisi" WHERE kullanici_id = $2 ...)
UNION ALL ...
ORDER BY rank DESC LIMIT 50;
```

**SUPER_ADMIN/KAYMAKAM atlama:** `Kontrol Kural 50a` gereği bu roller yetki filtresini bypass eder; uygulama katmanında `if (oturum.makamMi) erişilebilirProjeFiltresi yok` koşulu.

### 5) UI: shadcn `<CommandDialog>` + Cmd/Ctrl+K + Cmd/Ctrl+Space

- **Tetikleyici:** klavye kısayolu çift bind — `Cmd/Ctrl+K` ve `Cmd/Ctrl+Space` ikisi de aynı dialog'u açar.
- **Komponent:** `components/komut-paleti.tsx`, shadcn `<CommandDialog>` üstüne. Mobilde `Sheet` (Kontrol Kural 13).
- **Debounce:** 250ms (TanStack Query `staleTime: 30s`, `keepPreviousData: true`).
- **Sonuç gruplandırma:** tip başlıklarıyla ("Kartlar", "Yorumlar", "Kullanıcılar"...). Her grup max 5 sonuç + "Daha fazla göster" linki.
- **Vurgulama:** server-side `ts_headline` ile `<mark>` tag'leri; client'ta DOMPurify ile sanitize (Kontrol Kural 70).
- **Seçim:** sonuç tıklanınca kaynak sayfasına `router.push` (kart için modal açıcı query param).

### 6) Throttle (rate limit)

Arama endpoint'i için **30 sorgu/dakika/kullanıcı** (Kontrol Kural 73/147). Debounce sayesinde tetiklenmiyor olsa da kötü niyetli istemci için zorunlu.

## Sonuçlar

- **Mimari:** kolon-per-tablo + UNION ALL + GIN + pg_trgm fallback. Materialized view ve harici motor ertelendi.
- **Yetki:** app-level, mevcut `lib/yetki.ts` ile.
- **i18n:** Postgres custom `turkish` tsconfig + stop-word listesi.
- **UI:** Cmd/Ctrl+K + Cmd/Ctrl+Space, shadcn CommandDialog.
- **Throttle:** 30/dk/kullanıcı.

## İlgili Kurallar

- **Kontrol Kural 38/39** — Prisma migrate, manuel SQL yasak (trigger + extension için tek istisna: migration içinde `prisma.$executeRawUnsafe` ile schema seviyesi).
- **Kontrol Kural 71** — `Prisma.sql` template literal (raw query güvenliği).
- **Kontrol Kural 90** — 5 katman (`schemas → services → actions → hooks → components`).
- **Kontrol Kural 139** — saf helper test zorunlu (`arama-helper.test.ts`).
- **Kontrol Kural 70** — `ts_headline` highlight DOMPurify ile sanitize.
- **Kontrol Kural 73/147** — 30/dk throttle.
- **Kontrol Kural 50a** — SUPER_ADMIN/KAYMAKAM birim/proje filtresi bypass.

## Migration Sırası

1. `pg_trgm` ve `unaccent` extension oluştur
2. Custom `turkish_search` tsconfig
3. 10 tabloya `arama_vektoru tsvector` kolonu
4. Trigger function `arama_vektoru_guncelle_<tablo>()` (insert/update'te)
5. GIN index `idx_<tablo>_arama` (tsvector) + `idx_<tablo>_trgm` (pg_trgm)
6. Mevcut kayıtları doldurmak için tek seferlik `UPDATE ... SET arama_vektoru = to_tsvector(...)`

## Açık Sorular (v2)

- Audit log çok büyürse arama listesinden çıkarılabilir (sadece `audit:read` izniyle).
- Saved search / arama geçmişi (kişiye özel) v1.1.
- Arama sonucu içinden filtreleme (tarih, kullanıcı, proje) v1.1.
