-- Tekman Kaymakamligi tek hizmet kapsamidir; aktif veri modeli birim ve
-- kaynak paylasimi uzerinden calisir. Bu migration eski Kurum tablosundaki
-- birim envanterini veri kaybi olmadan Birim modeline tasir.

ALTER TYPE "KurumTipi" ADD VALUE IF NOT EXISTS 'OZEL_KALEM';

ALTER TYPE "KurumKategorisi" RENAME TO "BirimKategorisi";
ALTER TYPE "KurumTipi" RENAME TO "BirimTipi";

ALTER TABLE "Kurum" RENAME TO "Birim";
ALTER TABLE "Birim" RENAME CONSTRAINT "Kurum_pkey" TO "Birim_pkey";
ALTER INDEX IF EXISTS "Kurum_kategori_idx" RENAME TO "Birim_kategori_idx";
ALTER INDEX IF EXISTS "Kurum_tip_idx" RENAME TO "Birim_tip_idx";
ALTER INDEX IF EXISTS "Kurum_silindi_mi_idx" RENAME TO "Birim_silindi_mi_idx";

ALTER TABLE "DavetTokeni" RENAME COLUMN "kurum_id" TO "birim_id";
CREATE INDEX IF NOT EXISTS "DavetTokeni_birim_id_idx" ON "DavetTokeni"("birim_id");

ALTER TABLE "Kullanici" DROP CONSTRAINT IF EXISTS "Kullanici_kurum_id_fkey";
ALTER INDEX IF EXISTS "Kullanici_kurum_id_idx" RENAME TO "Kullanici_birim_id_idx";
ALTER TABLE "Kullanici" RENAME COLUMN "kurum_id" TO "birim_id";
ALTER TABLE "Kullanici" ALTER COLUMN "birim_id" DROP NOT NULL;
ALTER TABLE "Kullanici"
  ADD CONSTRAINT "Kullanici_birim_id_fkey"
  FOREIGN KEY ("birim_id") REFERENCES "Birim"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "Kullanici"
SET "birim_id" = NULL
WHERE "id" IN (
  SELECT kr."kullanici_id"
  FROM "KullaniciRol" kr
  INNER JOIN "Rol" r ON r."id" = kr."rol_id"
  WHERE r."kod" IN ('SUPER_ADMIN', 'KAYMAKAM')
);

CREATE TABLE "ProjeBirimi" (
  "proje_id" UUID NOT NULL,
  "birim_id" UUID NOT NULL,
  "eklenme_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjeBirimi_pkey" PRIMARY KEY ("proje_id", "birim_id")
);

INSERT INTO "ProjeBirimi" ("proje_id", "birim_id")
SELECT "id", "kurum_id"
FROM "Proje"
WHERE "kurum_id" IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE "Proje" DROP CONSTRAINT IF EXISTS "Proje_kurum_id_fkey";
DROP INDEX IF EXISTS "Proje_kurum_id_silindi_mi_arsiv_mi_idx";
DROP INDEX IF EXISTS "Proje_kurum_id_sira_idx";
ALTER TABLE "Proje" DROP COLUMN "kurum_id";
CREATE INDEX IF NOT EXISTS "Proje_silindi_mi_arsiv_mi_idx" ON "Proje"("silindi_mi", "arsiv_mi");
CREATE INDEX IF NOT EXISTS "Proje_sira_idx" ON "Proje"("sira");

CREATE INDEX "ProjeBirimi_birim_id_idx" ON "ProjeBirimi"("birim_id");
ALTER TABLE "ProjeBirimi"
  ADD CONSTRAINT "ProjeBirimi_proje_id_fkey"
  FOREIGN KEY ("proje_id") REFERENCES "Proje"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjeBirimi"
  ADD CONSTRAINT "ProjeBirimi_birim_id_fkey"
  FOREIGN KEY ("birim_id") REFERENCES "Birim"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ListeUyesi" (
  "liste_id" UUID NOT NULL,
  "kullanici_id" UUID NOT NULL,
  "eklenme_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListeUyesi_pkey" PRIMARY KEY ("liste_id", "kullanici_id")
);

CREATE INDEX "ListeUyesi_kullanici_id_idx" ON "ListeUyesi"("kullanici_id");
ALTER TABLE "ListeUyesi"
  ADD CONSTRAINT "ListeUyesi_liste_id_fkey"
  FOREIGN KEY ("liste_id") REFERENCES "Liste"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListeUyesi"
  ADD CONSTRAINT "ListeUyesi_kullanici_id_fkey"
  FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ListeBirimi" (
  "liste_id" UUID NOT NULL,
  "birim_id" UUID NOT NULL,
  "eklenme_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListeBirimi_pkey" PRIMARY KEY ("liste_id", "birim_id")
);

CREATE INDEX "ListeBirimi_birim_id_idx" ON "ListeBirimi"("birim_id");
ALTER TABLE "ListeBirimi"
  ADD CONSTRAINT "ListeBirimi_liste_id_fkey"
  FOREIGN KEY ("liste_id") REFERENCES "Liste"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListeBirimi"
  ADD CONSTRAINT "ListeBirimi_birim_id_fkey"
  FOREIGN KEY ("birim_id") REFERENCES "Birim"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KartHedefKurumu" RENAME TO "KartBirimi";
ALTER TABLE "KartBirimi" RENAME COLUMN "kurum_id" TO "birim_id";
ALTER TABLE "KartBirimi" RENAME CONSTRAINT "KartHedefKurumu_pkey" TO "KartBirimi_pkey";
ALTER TABLE "KartBirimi" RENAME CONSTRAINT "KartHedefKurumu_kart_id_fkey" TO "KartBirimi_kart_id_fkey";
ALTER TABLE "KartBirimi" RENAME CONSTRAINT "KartHedefKurumu_kurum_id_fkey" TO "KartBirimi_birim_id_fkey";
ALTER INDEX IF EXISTS "KartHedefKurumu_kurum_id_idx" RENAME TO "KartBirimi_birim_id_idx";

UPDATE "Izin"
SET "kod" = 'birim:manage',
    "ad" = 'Birim yönetimi'
WHERE "kod" = 'kurum:manage';

UPDATE "Rol"
SET "kod" = 'BIRIM_AMIRI',
    "ad" = 'Birim Amiri'
WHERE "kod" = 'KURUM_AMIRI';

UPDATE "aktivite_logu"
SET "kaynak_tip" = 'Birim'
WHERE "kaynak_tip" = 'Kurum';

UPDATE "aktivite_logu"
SET "kaynak_tip" = 'KartBirimi'
WHERE "kaynak_tip" = 'KartHedefKurumu';
