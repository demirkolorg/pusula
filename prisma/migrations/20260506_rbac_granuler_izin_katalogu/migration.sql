-- ADR-0014: Granüler izin kataloğu
-- 1. Izin.alt_kategori kolonu eklenir (UI accordion alt-grup başlığı için)
-- 2. Eski 20 geniş izin kodu KORUNUR — `lib/permissions-eslesme.ts` ile geri uyum
--    sağlanır. Kullanıcılar eski kodları taşıyan rolleri çalıştırırsa sistem
--    bunları yeni granüler kümeye otomatik genişletir.
-- 3. Yeni izinleri seed.ts upsert'leyecek (migration veriyi yazmaz).

ALTER TABLE "Izin" ADD COLUMN "alt_kategori" TEXT;
CREATE INDEX "Izin_alt_kategori_idx" ON "Izin"("alt_kategori");
