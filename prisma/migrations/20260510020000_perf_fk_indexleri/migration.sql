-- Sprint 2 / S2-4 — Performans için eksik FK + sık-erişilen kolon index'leri.
--
-- BU MIGRATION'DA İSTİSNA: kontrol Kural 38 "manuel SQL yasak" pratiğinden
-- sapma. Sebep: partial index'ler (WHERE clause) Prisma `@@index` syntax'ı
-- ile temsil edilemez; raw SQL zorunludur.
--
-- PRODUCTION DEPLOY NOTU (CONCURRENTLY):
-- Migration dosyası `migrate dev` uyumu için standart `CREATE INDEX` kullanır.
-- Production'da büyük tablolarda exclusive lock'tan kaçınmak için ops ekibi:
--   1. Bu dosyadaki `CREATE INDEX` satırlarını manuel olarak
--      `CREATE INDEX CONCURRENTLY IF NOT EXISTS` ile çalıştırır
--      (`psql -d $DATABASE_URL -f migration.sql` transaction dışında).
--   2. Migration'ı uygulanmış olarak işaretler:
--      `bun x prisma migrate resolve --applied 20260510020000_perf_fk_indexleri`
-- MVP veritabanı küçük olduğu için dev/test'te düz CREATE INDEX yeterli.

-- 1. KullaniciRol.atayan_id (FK index yok)
-- "Kim kime hangi rolü verdi" denetim sorguları için.
CREATE INDEX "KullaniciRol_atayan_id_idx"
  ON "KullaniciRol"("atayan_id");

-- 2. Yorum.yanit_yorum_id (FK index yok)
-- Yorum yanıt zinciri (thread) sorgularını hızlandırır.
CREATE INDEX "Yorum_yanit_yorum_id_idx"
  ON "Yorum"("yanit_yorum_id");

-- 3. KontrolMaddesi.bitis
-- Bitiş tarihine göre cron bildirim ve "yakında dolacak" widget'ı.
CREATE INDEX "KontrolMaddesi_bitis_idx"
  ON "KontrolMaddesi"("bitis");

-- 4. KontrolMaddesi(atanan_id, bitis) composite
-- "Atandığım, yakında bitecek maddeler" kullanıcı bazlı dashboard sorgusu.
CREATE INDEX "KontrolMaddesi_atanan_id_bitis_idx"
  ON "KontrolMaddesi"("atanan_id", "bitis");

-- 5. BildirimMailKuyrugu — sadece BEKLIYOR satırları için partial.
-- Cron her 5 dk'da bekleyen satırları sorgular; tabloda biriken
-- GONDERILDI/BASARISIZ satırları sorguyu yavaşlatmamalı.
CREATE INDEX "BildirimMailKuyrugu_bekleyen_idx"
  ON "BildirimMailKuyrugu"("olusturma_zamani")
  WHERE "durum" = 'BEKLIYOR';

-- 6. DosyaYuklemeOturumu — bekleyen/expired upload oturumları için partial.
-- Orphan cleanup cron'u sadece YUKLENIYOR durumdaki oturumları kontrol eder
-- (tamamlananlar son_kullanma karşılaştırmasından muaf).
CREATE INDEX "DosyaYuklemeOturumu_expired_idx"
  ON "DosyaYuklemeOturumu"("son_kullanma")
  WHERE "durum" = 'YUKLENIYOR';
