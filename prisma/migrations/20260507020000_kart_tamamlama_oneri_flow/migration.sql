-- ADR-0019 — Kart ve madde tamamlama öneri/onay flow.
-- 4 yeni alan × 2 tablo + 1 enum + 6 BildirimTipi değeri + 2 FK + 2 index.

-- 1. TamamlanmaOneriDurumu enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TamamlanmaOneriDurumu') THEN
    CREATE TYPE "TamamlanmaOneriDurumu" AS ENUM ('YOK', 'BEKLIYOR', 'REDDEDILDI');
  END IF;
END $$;

-- 2. BildirimTipi enum'una 6 yeni değer (kart×3 + madde×3).
-- ALTER TYPE ADD VALUE IF NOT EXISTS — Postgres 9.6+ destekler.
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_TAMAMLAMA_ONERILDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_TAMAMLAMA_ONAYLANDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_TAMAMLAMA_REDDEDILDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'MADDE_TAMAMLAMA_ONERILDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'MADDE_TAMAMLAMA_ONAYLANDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'MADDE_TAMAMLAMA_REDDEDILDI';

-- 3. Kart tablosuna 4 alan
ALTER TABLE "Kart"
  ADD COLUMN IF NOT EXISTS "tamamlanma_oneri_durumu" "TamamlanmaOneriDurumu" NOT NULL DEFAULT 'YOK',
  ADD COLUMN IF NOT EXISTS "tamamlanma_oneren_id" UUID,
  ADD COLUMN IF NOT EXISTS "tamamlanma_oneri_zamani" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tamamlanma_red_sebebi" TEXT;

-- 4. KontrolMaddesi tablosuna aynı 4 alan
ALTER TABLE "KontrolMaddesi"
  ADD COLUMN IF NOT EXISTS "tamamlanma_oneri_durumu" "TamamlanmaOneriDurumu" NOT NULL DEFAULT 'YOK',
  ADD COLUMN IF NOT EXISTS "tamamlanma_oneren_id" UUID,
  ADD COLUMN IF NOT EXISTS "tamamlanma_oneri_zamani" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tamamlanma_red_sebebi" TEXT;

-- 5. FK'ler — öneren_id → Kullanici.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Kart_tamamlanma_oneren_id_fkey'
      AND table_name = 'Kart'
  ) THEN
    ALTER TABLE "Kart"
      ADD CONSTRAINT "Kart_tamamlanma_oneren_id_fkey"
      FOREIGN KEY ("tamamlanma_oneren_id") REFERENCES "Kullanici"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'KontrolMaddesi_tamamlanma_oneren_id_fkey'
      AND table_name = 'KontrolMaddesi'
  ) THEN
    ALTER TABLE "KontrolMaddesi"
      ADD CONSTRAINT "KontrolMaddesi_tamamlanma_oneren_id_fkey"
      FOREIGN KEY ("tamamlanma_oneren_id") REFERENCES "Kullanici"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. Index'ler — yetkililerin "bekleyen onaylar" sorgularını hızlandırmak için.
CREATE INDEX IF NOT EXISTS "Kart_liste_id_tamamlanma_oneri_durumu_idx"
  ON "Kart"("liste_id", "tamamlanma_oneri_durumu");

CREATE INDEX IF NOT EXISTS "KontrolMaddesi_kontrol_listesi_id_tamamlanma_oneri_durumu_idx"
  ON "KontrolMaddesi"("kontrol_listesi_id", "tamamlanma_oneri_durumu");
