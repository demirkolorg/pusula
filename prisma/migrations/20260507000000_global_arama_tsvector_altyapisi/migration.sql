-- ADR-0017 — Global Arama Altyapısı
-- tsvector kolonları + Türkçe tsconfig + pg_trgm fuzzy + trigger + GIN index + backfill
-- Kaynak: docs/adr/0017-global-arama-tsvector.md

-- ============================================================
-- 1. Extension'lar
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- 2. Türkçe tsconfig (pusula_turkish)
-- ============================================================
-- Snowball Türkçe stemmer + unaccent + custom stop-word listesi.
-- Postgres yerleşik 'turkish' config'i unaccent ve stop-word'leri içermez.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'pusula_turkish'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION pusula_turkish (COPY = turkish);

    -- unaccent: ç→c, ş→s, ı→i, ö→o, ü→u, ğ→g (arama için ASCII normalleştirme)
    ALTER TEXT SEARCH CONFIGURATION pusula_turkish
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, turkish_stem;
  END IF;
END$$;

-- ============================================================
-- 3. AlterTable — arama_vektoru kolonları (9 tablo)
-- ============================================================

ALTER TABLE "Birim" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Eklenti" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Etiket" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Kart" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "KontrolMaddesi" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Kullanici" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Liste" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Proje" ADD COLUMN "arama_vektoru" tsvector;
ALTER TABLE "Yorum" ADD COLUMN "arama_vektoru" tsvector;

-- ============================================================
-- 4. Trigger fonksiyonları (insert/update'te tsvector hesapla)
-- ============================================================
-- Ağırlık: A = ana alan (başlık/ad), B = gövde (açıklama/metin)
-- coalesce → NULL alanlar boş string olsun, tsvector hesabı patlamasın.

-- Kart: baslik (A) + aciklama (B)
CREATE OR REPLACE FUNCTION arama_vektoru_kart_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.baslik, '')), 'A') ||
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.aciklama, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER kart_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF baslik, aciklama ON "Kart"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_kart_guncelle();

-- Yorum: icerik (A)
CREATE OR REPLACE FUNCTION arama_vektoru_yorum_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.icerik, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER yorum_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF icerik ON "Yorum"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_yorum_guncelle();

-- KontrolMaddesi: metin (A)
CREATE OR REPLACE FUNCTION arama_vektoru_madde_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.metin, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER madde_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF metin ON "KontrolMaddesi"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_madde_guncelle();

-- Eklenti: ad (A) — dosya adı
CREATE OR REPLACE FUNCTION arama_vektoru_eklenti_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.ad, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER eklenti_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad ON "Eklenti"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_eklenti_guncelle();

-- Kullanici: ad + soyad + email + unvan (A)
CREATE OR REPLACE FUNCTION arama_vektoru_kullanici_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish',
      coalesce(NEW.ad, '') || ' ' ||
      coalesce(NEW.soyad, '') || ' ' ||
      coalesce(NEW.email, '') || ' ' ||
      coalesce(NEW.unvan, '')
    ), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER kullanici_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad, soyad, email, unvan ON "Kullanici"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_kullanici_guncelle();

-- Birim: ad + kisa_ad (A)
CREATE OR REPLACE FUNCTION arama_vektoru_birim_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish',
      coalesce(NEW.ad, '') || ' ' || coalesce(NEW.kisa_ad, '')
    ), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER birim_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad, kisa_ad ON "Birim"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_birim_guncelle();

-- Etiket: ad (A)
CREATE OR REPLACE FUNCTION arama_vektoru_etiket_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.ad, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER etiket_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad ON "Etiket"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_etiket_guncelle();

-- Proje: ad (A) + aciklama (B)
CREATE OR REPLACE FUNCTION arama_vektoru_proje_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.ad, '')), 'A') ||
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.aciklama, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER proje_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad, aciklama ON "Proje"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_proje_guncelle();

-- Liste: ad (A)
CREATE OR REPLACE FUNCTION arama_vektoru_liste_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.ad, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER liste_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad ON "Liste"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_liste_guncelle();

-- ============================================================
-- 5. GIN index — tsvector için (Prisma'nın oluşturacağı default tipli, manual GIN)
-- ============================================================

CREATE INDEX "Birim_arama_vektoru_idx" ON "Birim" USING GIN ("arama_vektoru");
CREATE INDEX "Eklenti_arama_vektoru_idx" ON "Eklenti" USING GIN ("arama_vektoru");
CREATE INDEX "Etiket_arama_vektoru_idx" ON "Etiket" USING GIN ("arama_vektoru");
CREATE INDEX "Kart_arama_vektoru_idx" ON "Kart" USING GIN ("arama_vektoru");
CREATE INDEX "KontrolMaddesi_arama_vektoru_idx" ON "KontrolMaddesi" USING GIN ("arama_vektoru");
CREATE INDEX "Kullanici_arama_vektoru_idx" ON "Kullanici" USING GIN ("arama_vektoru");
CREATE INDEX "Liste_arama_vektoru_idx" ON "Liste" USING GIN ("arama_vektoru");
CREATE INDEX "Proje_arama_vektoru_idx" ON "Proje" USING GIN ("arama_vektoru");
CREATE INDEX "Yorum_arama_vektoru_idx" ON "Yorum" USING GIN ("arama_vektoru");

-- ============================================================
-- 6. pg_trgm GIN index — fuzzy fallback için (yazım hatası toleransı)
-- ============================================================
-- Birincil sorgu boş döndüğünde similarity() ile fuzzy match.

CREATE INDEX "Kart_baslik_trgm_idx" ON "Kart" USING GIN (baslik gin_trgm_ops);
CREATE INDEX "Yorum_icerik_trgm_idx" ON "Yorum" USING GIN (icerik gin_trgm_ops);
CREATE INDEX "KontrolMaddesi_metin_trgm_idx" ON "KontrolMaddesi" USING GIN (metin gin_trgm_ops);
CREATE INDEX "Eklenti_ad_trgm_idx" ON "Eklenti" USING GIN (ad gin_trgm_ops);
CREATE INDEX "Kullanici_ad_trgm_idx" ON "Kullanici" USING GIN (ad gin_trgm_ops);
CREATE INDEX "Kullanici_soyad_trgm_idx" ON "Kullanici" USING GIN (soyad gin_trgm_ops);
CREATE INDEX "Birim_ad_trgm_idx" ON "Birim" USING GIN (ad gin_trgm_ops);
CREATE INDEX "Etiket_ad_trgm_idx" ON "Etiket" USING GIN (ad gin_trgm_ops);
CREATE INDEX "Proje_ad_trgm_idx" ON "Proje" USING GIN (ad gin_trgm_ops);
CREATE INDEX "Liste_ad_trgm_idx" ON "Liste" USING GIN (ad gin_trgm_ops);

-- ============================================================
-- 7. Backfill — mevcut kayıtların arama_vektoru'larını doldur
-- ============================================================
-- Trigger UPDATE OF ile filter'lı, backfill'de devreye girmediği için
-- hesabı bir kerelik açıkça yapıyoruz. Trigger logic'i ile aynı formül.

UPDATE "Kart" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(baslik, '')), 'A') ||
  setweight(to_tsvector('pusula_turkish', coalesce(aciklama, '')), 'B')
WHERE "arama_vektoru" IS NULL;

UPDATE "Yorum" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(icerik, '')), 'A')
WHERE "arama_vektoru" IS NULL;

UPDATE "KontrolMaddesi" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(metin, '')), 'A')
WHERE "arama_vektoru" IS NULL;

UPDATE "Eklenti" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(ad, '')), 'A')
WHERE "arama_vektoru" IS NULL;

UPDATE "Kullanici" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish',
    coalesce(ad, '') || ' ' ||
    coalesce(soyad, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(unvan, '')
  ), 'A')
WHERE "arama_vektoru" IS NULL;

UPDATE "Birim" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish',
    coalesce(ad, '') || ' ' || coalesce(kisa_ad, '')
  ), 'A')
WHERE "arama_vektoru" IS NULL;

UPDATE "Etiket" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(ad, '')), 'A')
WHERE "arama_vektoru" IS NULL;

UPDATE "Proje" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(ad, '')), 'A') ||
  setweight(to_tsvector('pusula_turkish', coalesce(aciklama, '')), 'B')
WHERE "arama_vektoru" IS NULL;

UPDATE "Liste" SET "arama_vektoru" =
  setweight(to_tsvector('pusula_turkish', coalesce(ad, '')), 'A')
WHERE "arama_vektoru" IS NULL;
