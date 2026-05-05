-- CreateTable
CREATE TABLE "BildirimTercih" (
    "id" BIGSERIAL NOT NULL,
    "kullanici_id" UUID NOT NULL,
    "tip" "BildirimTipi" NOT NULL,
    "in_app_acik" BOOLEAN NOT NULL DEFAULT true,
    "email_acik" BOOLEAN NOT NULL DEFAULT true,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BildirimTercih_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BildirimTercih_kullanici_id_idx" ON "BildirimTercih"("kullanici_id");

-- CreateIndex
CREATE UNIQUE INDEX "BildirimTercih_kullanici_id_tip_key" ON "BildirimTercih"("kullanici_id", "tip");

-- AddForeignKey
ALTER TABLE "BildirimTercih" ADD CONSTRAINT "BildirimTercih_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;
