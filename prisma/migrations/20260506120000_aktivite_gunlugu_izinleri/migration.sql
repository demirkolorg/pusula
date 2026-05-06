-- Aktivite gunlugu okuma izinleri.
-- Audit veri modeli degismez; sadece izin katalog satirlari ve varsayilan
-- sistem rol atamalari idempotent sekilde guncellenir.

INSERT INTO "Izin" ("id", "kod", "ad", "aciklama", "kategori", "alt_kategori")
VALUES
  (
    gen_random_uuid(),
    'aktivite:oku',
    'Aktivite Günlüğünü Görüntüle',
    'Yetki kapsamındaki operasyon aktivitelerini makam dostu akış olarak okuma',
    'AUDIT'::"IzinKategorisi",
    NULL
  ),
  (
    gen_random_uuid(),
    'aktivite:disa-aktar',
    'Aktivite Günlüğünü Dışa Aktar',
    'Yetki kapsamındaki aktivite akışını CSV olarak dışa aktarma',
    'AUDIT'::"IzinKategorisi",
    NULL
  )
ON CONFLICT ("kod") DO UPDATE SET
  "ad" = EXCLUDED."ad",
  "aciklama" = EXCLUDED."aciklama",
  "kategori" = EXCLUDED."kategori",
  "alt_kategori" = EXCLUDED."alt_kategori";

INSERT INTO "RolIzin" ("rol_id", "izin_id")
SELECT r."id", i."id"
FROM "Rol" r
CROSS JOIN "Izin" i
WHERE r."kod" IN ('SUPER_ADMIN', 'KAYMAKAM', 'BIRIM_AMIRI', 'PERSONEL')
  AND i."kod" = 'aktivite:oku'
ON CONFLICT DO NOTHING;

INSERT INTO "RolIzin" ("rol_id", "izin_id")
SELECT r."id", i."id"
FROM "Rol" r
CROSS JOIN "Izin" i
WHERE r."kod" IN ('SUPER_ADMIN', 'KAYMAKAM')
  AND i."kod" = 'aktivite:disa-aktar'
ON CONFLICT DO NOTHING;

DELETE FROM "RolIzin" ri
USING "Rol" r, "Izin" i
WHERE ri."rol_id" = r."id"
  AND ri."izin_id" = i."id"
  AND r."kod" = 'KAYMAKAM'
  AND i."kod" IN ('audit:oku', 'audit:disa-aktar');
