-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('YONETICI', 'BIRIM_MUDURU', 'PERSONEL');

-- CreateEnum
CREATE TYPE "GorevDurumu" AS ENUM ('YAPILACAK', 'SURUYOR', 'ONAY_BEKLIYOR', 'ONAYLANDI', 'DUZELTME', 'IPTAL');

-- CreateEnum
CREATE TYPE "OncelikDuzeyi" AS ENUM ('DUSUK', 'ORTA', 'YUKSEK', 'KRITIK');

-- CreateTable
CREATE TABLE "kullanicilar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'PERSONEL',
    "birimId" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "kullanicilar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oturumlar" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "oturumlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hesaplar" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hesaplar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dogrulamalar" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dogrulamalar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birimler" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "mudurId" TEXT,
    "ustBirimId" TEXT,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "birimler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeler" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "birimId" TEXT NOT NULL,
    "olusturanId" TEXT NOT NULL,
    "baslangicTarihi" TIMESTAMP(3),
    "bitisTarihi" TIMESTAMP(3),
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" TIMESTAMP(3) NOT NULL,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "projeler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gorevler" (
    "id" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT,
    "durum" "GorevDurumu" NOT NULL DEFAULT 'YAPILACAK',
    "oncelik" "OncelikDuzeyi" NOT NULL DEFAULT 'ORTA',
    "projeId" TEXT NOT NULL,
    "atananId" TEXT,
    "olusturanId" TEXT NOT NULL,
    "ustGorevId" TEXT,
    "baslangicTarihi" TIMESTAMP(3),
    "bitisTarihi" TIMESTAMP(3),
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" TIMESTAMP(3) NOT NULL,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "gorevler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yorumlar" (
    "id" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "gorevId" TEXT NOT NULL,
    "yazarId" TEXT NOT NULL,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" TIMESTAMP(3) NOT NULL,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "yorumlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosyalar" (
    "id" TEXT NOT NULL,
    "dosyaAdi" TEXT NOT NULL,
    "dosyaYolu" TEXT NOT NULL,
    "icerikTuru" TEXT NOT NULL,
    "boyutBayt" INTEGER NOT NULL,
    "gorevId" TEXT NOT NULL,
    "yukleyenId" TEXT NOT NULL,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "dosyalar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etkinlik_gunlugu" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelKimlik" TEXT NOT NULL,
    "eylem" TEXT NOT NULL,
    "eskiDeger" JSONB,
    "yeniDeger" JSONB,
    "eyleyenId" TEXT,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etkinlik_gunlugu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kullanici_izin_istisnalari" (
    "id" TEXT NOT NULL,
    "kullaniciId" TEXT NOT NULL,
    "izinAnahtari" TEXT NOT NULL,
    "verildi" BOOLEAN NOT NULL,
    "aciklama" TEXT,
    "olusturanId" TEXT NOT NULL,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kullanici_izin_istisnalari_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kullanicilar_email_key" ON "kullanicilar"("email");

-- CreateIndex
CREATE UNIQUE INDEX "oturumlar_token_key" ON "oturumlar"("token");

-- CreateIndex
CREATE UNIQUE INDEX "birimler_ad_key" ON "birimler"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "kullanici_izin_istisnalari_kullaniciId_izinAnahtari_key" ON "kullanici_izin_istisnalari"("kullaniciId", "izinAnahtari");

-- AddForeignKey
ALTER TABLE "kullanicilar" ADD CONSTRAINT "kullanicilar_birimId_fkey" FOREIGN KEY ("birimId") REFERENCES "birimler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oturumlar" ADD CONSTRAINT "oturumlar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "kullanicilar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hesaplar" ADD CONSTRAINT "hesaplar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "kullanicilar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birimler" ADD CONSTRAINT "birimler_ustBirimId_fkey" FOREIGN KEY ("ustBirimId") REFERENCES "birimler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeler" ADD CONSTRAINT "projeler_birimId_fkey" FOREIGN KEY ("birimId") REFERENCES "birimler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gorevler" ADD CONSTRAINT "gorevler_projeId_fkey" FOREIGN KEY ("projeId") REFERENCES "projeler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gorevler" ADD CONSTRAINT "gorevler_atananId_fkey" FOREIGN KEY ("atananId") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gorevler" ADD CONSTRAINT "gorevler_olusturanId_fkey" FOREIGN KEY ("olusturanId") REFERENCES "kullanicilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gorevler" ADD CONSTRAINT "gorevler_ustGorevId_fkey" FOREIGN KEY ("ustGorevId") REFERENCES "gorevler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yorumlar" ADD CONSTRAINT "yorumlar_gorevId_fkey" FOREIGN KEY ("gorevId") REFERENCES "gorevler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yorumlar" ADD CONSTRAINT "yorumlar_yazarId_fkey" FOREIGN KEY ("yazarId") REFERENCES "kullanicilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosyalar" ADD CONSTRAINT "dosyalar_gorevId_fkey" FOREIGN KEY ("gorevId") REFERENCES "gorevler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etkinlik_gunlugu" ADD CONSTRAINT "etkinlik_gunlugu_eyleyenId_fkey" FOREIGN KEY ("eyleyenId") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kullanici_izin_istisnalari" ADD CONSTRAINT "kullanici_izin_istisnalari_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "kullanicilar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kullanici_izin_istisnalari" ADD CONSTRAINT "kullanici_izin_istisnalari_olusturanId_fkey" FOREIGN KEY ("olusturanId") REFERENCES "kullanicilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
