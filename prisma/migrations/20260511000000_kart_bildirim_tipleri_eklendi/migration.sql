-- Kullanıcı isteği — kart başlık/açıklama değişikliği ve kart oluşturma
-- için bildirim tipleri eklendi. Pusula başlangıçta bunları spam riski
-- sayıyordu; artık opt-in (action tetikleyicilerinden çağrılabiliyor).
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_OLUSTURULDU';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_BASLIK_DEGISTI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_ACIKLAMA_DEGISTI';
-- Yetkili çıkarma kanalları — proje için zaten vardı, kart/liste eklendi.
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'KART_YETKILI_CIKARILDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'LISTE_UYE_EKLENDI';
ALTER TYPE "BildirimTipi" ADD VALUE IF NOT EXISTS 'LISTE_UYE_CIKARILDI';
