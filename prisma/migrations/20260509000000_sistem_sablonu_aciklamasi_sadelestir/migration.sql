-- ADR-0021 — Sistem şablonu açıklamalarını sadeleştir.
--
-- Sebep: Açıklama satırları liste isimlerini içeriyordu (örn. "Yapılacak /
-- Devam Ediyor / Bitti — Trello'nun temel akışı."). Şablon seçim UI'ında
-- liste isimleri zaten chip olarak gösterildiğinden açıklama tekrar
-- ediyordu. Yeni açıklamalar şablonun amacını anlatır, liste isimlerini
-- içermez.
--
-- Idempotent: WHERE sistem_kodu eşleşmesi → sadece sistem şablonları etkilenir.

UPDATE "ProjeSablonu"
SET aciklama = 'Trello''nun temel akışı — yapılacaklardan bitenlere.',
    guncelleme_zamani = NOW()
WHERE sistem_kodu = 'klasik';

UPDATE "ProjeSablonu"
SET aciklama = 'Resmi yazışma için onay akışı — talepten sonuca.',
    guncelleme_zamani = NOW()
WHERE sistem_kodu = 'kaymakamlik-onay-akisi';

UPDATE "ProjeSablonu"
SET aciklama = 'Denetim ekibi için saha çalışma akışı.',
    guncelleme_zamani = NOW()
WHERE sistem_kodu = 'denetim-sureci';
