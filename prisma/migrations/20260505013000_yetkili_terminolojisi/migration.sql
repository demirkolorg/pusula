-- Kaynak atamaları artık uygulama ve Prisma Client dilinde "yetkili" olarak
-- adlandırılır. Fiziksel tablo/enum adları @@map/@map ile korunur; bu migration
-- mevcut izin ve aktivite verisini yeni terminolojiye taşır.

DO $$
DECLARE
  eski_izin uuid;
  yeni_izin uuid;
BEGIN
  SELECT id INTO eski_izin FROM "Izin" WHERE kod = 'proje:member';
  SELECT id INTO yeni_izin FROM "Izin" WHERE kod = 'proje:authorize';

  IF eski_izin IS NOT NULL AND yeni_izin IS NULL THEN
    UPDATE "Izin"
    SET kod = 'proje:authorize', ad = 'Yetkilileri Yönet'
    WHERE id = eski_izin;
  ELSIF eski_izin IS NOT NULL AND yeni_izin IS NOT NULL THEN
    INSERT INTO "RolIzin" (rol_id, izin_id)
    SELECT rol_id, yeni_izin
    FROM "RolIzin"
    WHERE izin_id = eski_izin
    ON CONFLICT DO NOTHING;

    DELETE FROM "RolIzin" WHERE izin_id = eski_izin;
    DELETE FROM "Izin" WHERE id = eski_izin;

    UPDATE "Izin"
    SET ad = 'Yetkilileri Yönet'
    WHERE id = yeni_izin;
  ELSIF yeni_izin IS NOT NULL THEN
    UPDATE "Izin"
    SET ad = 'Yetkilileri Yönet'
    WHERE id = yeni_izin;
  END IF;
END $$;

UPDATE "aktivite_logu"
SET "kaynak_tip" = 'ProjeYetkilisi'
WHERE "kaynak_tip" = 'ProjeUyesi';

UPDATE "aktivite_logu"
SET "kaynak_tip" = 'ListeYetkilisi'
WHERE "kaynak_tip" = 'ListeUyesi';

UPDATE "aktivite_logu"
SET "kaynak_tip" = 'KartYetkilisi'
WHERE "kaynak_tip" = 'KartUyesi';
