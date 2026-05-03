-- Türkçe karakter destekli, büyük/küçük harf duyarsız arama için yardımcılar.
-- Tablolardaki arama (kurumlar, kullanıcılar, hata logu, denetim logu) bu
-- helper'ı kullanır; aranan kelime ile hedef sütun aynı kurala göre normalize
-- edilir, sonra LIKE eşleşmesi yapılır.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- pusula_norm: Türkçe duyarlı normalize.
--  1. Türkçe'ye özgü harf eşleştirmeleri (İ/I/ı, ş, ç, ğ, ü, ö) önce ASCII'ye çevrilir.
--  2. unaccent kalan tüm aksanları temizler.
--  3. lower() büyük/küçük harf farkını kaldırır.
-- IMMUTABLE: aynı girdiye her zaman aynı çıktıyı verir, indeksleme uygundur.
CREATE OR REPLACE FUNCTION pusula_norm(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(
    unaccent(
      translate(
        coalesce(input, ''),
        'İIıŞşÇçĞğÜüÖö',
        'iiisscCgGuUoO'
      )
    )
  );
$$;
