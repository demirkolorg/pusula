-- ADR-0021 — Sistem proje şablonları (seed via data migration).
-- 4 sistem şablonu: bos, klasik, kaymakamlik-onay-akisi, denetim-sureci.
-- Idempotent: sistem_kodu UNIQUE constraint sayesinde ON CONFLICT ile yenilenir.
-- Seed.ts dokunulmadan migration olarak yüklenir (ekibin paralel seed refactor'ı
-- ile çakışmayı önler).

-- =====================================================================
-- 1. ProjeSablonu UPSERT
-- =====================================================================

INSERT INTO "ProjeSablonu" (id, ad, aciklama, kapak_renk, kapak_ikon, sistem_mi, sistem_kodu, olusturma_zamani, guncelleme_zamani)
VALUES
  (gen_random_uuid(), 'Boş Proje', 'Liste yok — sıfırdan kendi yapını kur.',
   'primary', 'folder', TRUE, 'bos', NOW(), NOW()),
  (gen_random_uuid(), 'Klasik Kanban', 'Yapılacak / Devam Ediyor / Bitti — Trello''nun temel akışı.',
   'primary', 'kanban-square', TRUE, 'klasik', NOW(), NOW()),
  (gen_random_uuid(), 'Kaymakamlık Onay Akışı', 'Talep → İnceleme → Onay → Sonuç akışı (resmi yazışma için).',
   'secondary', 'file-check', TRUE, 'kaymakamlik-onay-akisi', NOW(), NOW()),
  (gen_random_uuid(), 'Denetim Süreci', 'Plan → Hazırlık → Saha → Rapor — denetim ekibi için.',
   'tertiary', 'shield-check', TRUE, 'denetim-sureci', NOW(), NOW())
ON CONFLICT (sistem_kodu) DO UPDATE SET
  ad = EXCLUDED.ad,
  aciklama = EXCLUDED.aciklama,
  kapak_renk = EXCLUDED.kapak_renk,
  kapak_ikon = EXCLUDED.kapak_ikon,
  guncelleme_zamani = NOW();

-- =====================================================================
-- 2. SablonListesi — sistem şablonlarına bağlı listeler
-- =====================================================================
-- Her şablon için listeleri sıfırla + yeniden ekle.
-- "Boş" şablonu için liste yok — silinen listeler de boş.

-- Klasik Kanban
DELETE FROM "SablonListesi" WHERE sablon_id = (SELECT id FROM "ProjeSablonu" WHERE sistem_kodu = 'klasik');
INSERT INTO "SablonListesi" (id, sablon_id, ad, sira)
SELECT gen_random_uuid(), id, ad, sira
FROM (SELECT id FROM "ProjeSablonu" WHERE sistem_kodu = 'klasik') s
CROSS JOIN (VALUES
  ('Yapılacak', 'M'),
  ('Devam Ediyor', 'T'),
  ('Bitti', 'X')
) AS l(ad, sira);

-- Kaymakamlık Onay Akışı
DELETE FROM "SablonListesi" WHERE sablon_id = (SELECT id FROM "ProjeSablonu" WHERE sistem_kodu = 'kaymakamlik-onay-akisi');
INSERT INTO "SablonListesi" (id, sablon_id, ad, sira)
SELECT gen_random_uuid(), id, ad, sira
FROM (SELECT id FROM "ProjeSablonu" WHERE sistem_kodu = 'kaymakamlik-onay-akisi') s
CROSS JOIN (VALUES
  ('Talep', 'F'),
  ('İncelemede', 'L'),
  ('Onay Bekliyor', 'R'),
  ('Onaylandı', 'V'),
  ('Reddedildi', 'X')
) AS l(ad, sira);

-- Denetim Süreci
DELETE FROM "SablonListesi" WHERE sablon_id = (SELECT id FROM "ProjeSablonu" WHERE sistem_kodu = 'denetim-sureci');
INSERT INTO "SablonListesi" (id, sablon_id, ad, sira)
SELECT gen_random_uuid(), id, ad, sira
FROM (SELECT id FROM "ProjeSablonu" WHERE sistem_kodu = 'denetim-sureci') s
CROSS JOIN (VALUES
  ('Plan', 'F'),
  ('Hazırlık', 'L'),
  ('Saha', 'R'),
  ('Rapor Yazımı', 'V'),
  ('Tamamlandı', 'X')
) AS l(ad, sira);
