-- CreateEnum
CREATE TYPE "MailKuyruguDurumu" AS ENUM ('BEKLIYOR', 'GONDERILDI', 'BASARISIZ');

-- CreateTable
CREATE TABLE "BildirimMailKuyrugu" (
    "id" BIGSERIAL NOT NULL,
    "alici_id" UUID NOT NULL,
    "tip" "BildirimTipi" NOT NULL,
    "baslik" TEXT NOT NULL,
    "ozet" TEXT,
    "kart_id" UUID,
    "proje_id" UUID,
    "durum" "MailKuyruguDurumu" NOT NULL DEFAULT 'BEKLIYOR',
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gonderim_zamani" TIMESTAMP(3),
    "hata" TEXT,

    CONSTRAINT "BildirimMailKuyrugu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BildirimMailKuyrugu_durum_olusturma_zamani_idx" ON "BildirimMailKuyrugu"("durum", "olusturma_zamani");

-- CreateIndex
CREATE INDEX "BildirimMailKuyrugu_alici_id_durum_idx" ON "BildirimMailKuyrugu"("alici_id", "durum");

-- AddForeignKey
ALTER TABLE "BildirimMailKuyrugu" ADD CONSTRAINT "BildirimMailKuyrugu_alici_id_fkey" FOREIGN KEY ("alici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;
