-- ADR-0009 — Arşiv Sistem Listesi
-- Adımlar:
--   1. ListeTipi enum'u oluştur
--   2. Liste'ye `tip` kolonu (default NORMAL)
--   3. Kart'a `arsiv_oncesi_liste_id` ve `arsiv_zamani` kolonları
--   4. Index'ler (proje_id, tip) + partial unique (proje_id) WHERE tip='ARSIV'
--   5. Mevcut her projeye Arşiv listesi seed et (sira='ZZZZ')
--   6. Mevcut arsiv_mi=true kartları her projenin Arşiv listesine taşı,
--      arsiv_oncesi_liste_id'yi eski liste_id ile doldur

-- 1) Enum
CREATE TYPE "ListeTipi" AS ENUM ('NORMAL', 'ARSIV');

-- 2) Liste.tip kolonu
ALTER TABLE "Liste"
  ADD COLUMN "tip" "ListeTipi" NOT NULL DEFAULT 'NORMAL';

-- 3) Kart yardımcı kolonları
ALTER TABLE "Kart"
  ADD COLUMN "arsiv_oncesi_liste_id" UUID;
ALTER TABLE "Kart"
  ADD COLUMN "arsiv_zamani" TIMESTAMP(3);

-- 4) Index'ler
CREATE INDEX "Liste_proje_id_tip_idx" ON "Liste" ("proje_id", "tip");

-- Her projede sadece TEK Arşiv listesi olabilir (partial unique)
CREATE UNIQUE INDEX "Liste_proje_id_arsiv_unique"
  ON "Liste" ("proje_id")
  WHERE "tip" = 'ARSIV';

-- 5) Mevcut her projeye Arşiv listesi seed et (silinmemişler için)
-- sira = 'ZZZZ' — LexoRank en sona ekleme garantisi
INSERT INTO "Liste" ("id", "proje_id", "ad", "sira", "tip", "arsiv_mi", "olusturma_zamani", "guncelleme_zamani")
SELECT
  gen_random_uuid(),
  p."id",
  'Arşiv',
  'ZZZZ',
  'ARSIV',
  FALSE,
  NOW(),
  NOW()
FROM "Proje" p
WHERE p."silindi_mi" = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM "Liste" arsiv_l
    WHERE arsiv_l."proje_id" = p."id" AND arsiv_l."tip" = 'ARSIV'
  );

-- 6) Mevcut arsiv_mi=true kartları her projenin Arşiv listesine taşı
-- arsiv_oncesi_liste_id = eski liste_id (geri yükleme için)
UPDATE "Kart" k
SET
  "liste_id" = arsiv_l."id",
  "arsiv_oncesi_liste_id" = k."liste_id",
  "arsiv_zamani" = COALESCE(k."guncelleme_zamani", NOW())
FROM "Liste" eski_l, "Liste" arsiv_l
WHERE k."liste_id" = eski_l."id"
  AND k."arsiv_mi" = TRUE
  AND eski_l."tip" = 'NORMAL'
  AND arsiv_l."proje_id" = eski_l."proje_id"
  AND arsiv_l."tip" = 'ARSIV';
