-- ADR-0023 — Kart açıklamasını Tiptap (ProseMirror) zengin metin formatına geçir.
--
-- Yapı:
--   aciklama (String, kaldırıldı)
--   ↓
--   aciklama_dokuman  (Json?)   — ProseMirror doc JSON (TiptapDokuman tipi)
--   aciklama_metin    (String?) — denormalize plaintext, server'da türetilir
--
-- Plaintext alanı:
--   • Kart liste/kanban özetinde line-clamp-2 render
--   • Audit diff (mevcut LCS sistem aynen çalışır)
--   • Full-text search (tsvector trigger bu kolonu okur)
--
-- Migration stratejisi:
--   "db reset + seed" akışı onaylandığı için dönüştürme adımı YOK. Eski
--   `aciklama` kolonu boşaltılarak drop edilir, yeni iki kolon eklenir,
--   tsvector trigger yeni kolona bağlanır.

-- ============================================================
-- 1. Tsvector trigger'ı eski kolondan ayır (drop'tan ÖNCE — bağımlılık)
-- ============================================================

DROP TRIGGER IF EXISTS kart_arama_vektoru_trigger ON "Kart";

-- ============================================================
-- 2. Şema değişikliği
-- ============================================================

ALTER TABLE "Kart" DROP COLUMN "aciklama";
ALTER TABLE "Kart" ADD COLUMN "aciklama_dokuman" JSONB;
ALTER TABLE "Kart" ADD COLUMN "aciklama_metin" TEXT;

-- ============================================================
-- 3. Tsvector trigger'ı yeni plaintext kolona bağla
-- ============================================================

CREATE OR REPLACE FUNCTION arama_vektoru_kart_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.baslik, '')), 'A') ||
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.aciklama_metin, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER kart_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF baslik, aciklama_metin ON "Kart"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_kart_guncelle();
