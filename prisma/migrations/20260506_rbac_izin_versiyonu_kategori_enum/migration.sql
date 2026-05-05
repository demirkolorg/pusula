-- ADR-0013: RBAC yönetim paneli altyapısı
-- 1. Rol.izin_versiyonu kolonu eklenir (default 1, NOT NULL — downtime yok)
-- 2. Izin.kategori String → IzinKategorisi enum dönüşümü

-- 1. izin_versiyonu kolonu
ALTER TABLE "Rol" ADD COLUMN "izin_versiyonu" INTEGER NOT NULL DEFAULT 1;

-- 2. IzinKategorisi enum oluştur
CREATE TYPE "IzinKategorisi" AS ENUM (
  'PROJE',
  'LISTE',
  'KART',
  'KULLANICI',
  'BIRIM',
  'ROL',
  'AUDIT',
  'AYAR'
);

-- 3. Mevcut string değerleri enum'a dönüştür
-- Önce yeni kolon ekle
ALTER TABLE "Izin" ADD COLUMN "kategori_yeni" "IzinKategorisi";

-- Eski string değerleri yeni enum'a maple
UPDATE "Izin" SET "kategori_yeni" = CASE
  WHEN "kategori" = 'proje' THEN 'PROJE'::"IzinKategorisi"
  WHEN "kategori" = 'liste' THEN 'LISTE'::"IzinKategorisi"
  WHEN "kategori" = 'kart' THEN 'KART'::"IzinKategorisi"
  WHEN "kategori" = 'kullanici' THEN 'KULLANICI'::"IzinKategorisi"
  WHEN "kategori" = 'birim' THEN 'BIRIM'::"IzinKategorisi"
  WHEN "kategori" = 'rol' THEN 'ROL'::"IzinKategorisi"
  WHEN "kategori" = 'audit' THEN 'AUDIT'::"IzinKategorisi"
  WHEN "kategori" = 'ayar' THEN 'AYAR'::"IzinKategorisi"
  ELSE 'AYAR'::"IzinKategorisi"
END;

-- Eski index'i drop et, eski kolonu drop et, yeni kolonu rename
DROP INDEX IF EXISTS "Izin_kategori_idx";
ALTER TABLE "Izin" DROP COLUMN "kategori";
ALTER TABLE "Izin" RENAME COLUMN "kategori_yeni" TO "kategori";

-- NOT NULL kısıtı + index
ALTER TABLE "Izin" ALTER COLUMN "kategori" SET NOT NULL;
CREATE INDEX "Izin_kategori_idx" ON "Izin"("kategori");
