-- ADR-0018 — Kart tamamlama: alanlar + index + izin kodu rename.
-- IF NOT EXISTS / WHERE NOT EXISTS guard'ları ile idempotent — bazı dev DB'lerde
-- alanlar `db push` ile zaten oluşturulmuş olabilir; production'da temiz uygulanır.

-- 1. Kart tablosuna alanlar
ALTER TABLE "Kart"
  ADD COLUMN IF NOT EXISTS "tamamlandi_mi" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tamamlanma_zamani" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tamamlayan_id" UUID;

-- 2. FK: Kart.tamamlayan_id → Kullanici.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Kart_tamamlayan_id_fkey'
      AND table_name = 'Kart'
  ) THEN
    ALTER TABLE "Kart"
      ADD CONSTRAINT "Kart_tamamlayan_id_fkey"
      FOREIGN KEY ("tamamlayan_id") REFERENCES "Kullanici"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Index — sıkça filtrelenen (liste içinde tamamlanmış kartlar)
CREATE INDEX IF NOT EXISTS "Kart_liste_id_tamamlandi_mi_idx"
  ON "Kart"("liste_id", "tamamlandi_mi");

-- 4. İzin kodu rename: kart.tarih:tamamlandi → kart:tamamla
-- Mevcut RolIzin referansları korunur (yalnızca Izin.kod string'i değişir).
-- Eski kayıt yoksa hiçbir şey yapmaz.
UPDATE "Izin"
SET "kod" = 'kart:tamamla',
    "alt_kategori" = NULL
WHERE "kod" = 'kart.tarih:tamamlandi';
