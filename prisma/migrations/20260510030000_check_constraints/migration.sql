-- Sprint 5 / S5-4 — CHECK constraint'leri.
--
-- Prisma `@@check` syntax'ı sınırlı; bu kısıtlar manuel SQL ile eklendi
-- (Kontrol Kural 38 istisnası — ADR-0032 ile aynı pattern).
--
-- Amaç: Zod validation server tarafında çalışır ama DB'ye admin/seed/
-- backfill scripti üzerinden veri girerse şema seviyesi defansif kontrol
-- eksik kalıyordu.

-- 1) Kullanici.tc_kimlik_no — 11 hane, ilk hane 0 değil
ALTER TABLE "Kullanici"
  ADD CONSTRAINT "Kullanici_tc_kimlik_no_format_check"
  CHECK ("tc_kimlik_no" IS NULL OR "tc_kimlik_no" ~ '^[1-9][0-9]{10}$');

-- 2) Etiket.renk — hex format (#rrggbb veya #rgb), büyük/küçük harf
ALTER TABLE "Etiket"
  ADD CONSTRAINT "Etiket_renk_hex_check"
  CHECK ("renk" ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$');

-- 3) Birim.logo_url — opsiyonel; doluysa http(s) URL
ALTER TABLE "Birim"
  ADD CONSTRAINT "Birim_logo_url_format_check"
  CHECK ("logo_url" IS NULL OR "logo_url" ~* '^https?://[^\s]+$');

-- 4) Yaygın string alanlar için maksimum uzunluk (DoS / fat-finger
--    önlemi). Zod schema'larda zaten max var; DB seviyesi kontrol eski
--    veriyi de korur.
ALTER TABLE "Kullanici"
  ADD CONSTRAINT "Kullanici_ad_uzunluk_check" CHECK (char_length("ad") <= 200),
  ADD CONSTRAINT "Kullanici_soyad_uzunluk_check" CHECK (char_length("soyad") <= 200),
  ADD CONSTRAINT "Kullanici_email_uzunluk_check" CHECK (char_length("email") <= 254);

ALTER TABLE "Proje"
  ADD CONSTRAINT "Proje_ad_uzunluk_check" CHECK (char_length("ad") <= 200);

ALTER TABLE "Liste"
  ADD CONSTRAINT "Liste_ad_uzunluk_check" CHECK (char_length("ad") <= 120);

ALTER TABLE "Kart"
  ADD CONSTRAINT "Kart_baslik_uzunluk_check" CHECK (char_length("baslik") <= 300);

ALTER TABLE "Etiket"
  ADD CONSTRAINT "Etiket_ad_uzunluk_check" CHECK (char_length("ad") <= 100);
