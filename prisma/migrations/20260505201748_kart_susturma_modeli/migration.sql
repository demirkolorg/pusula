-- CreateTable
CREATE TABLE "KartSusturma" (
    "kullanici_id" UUID NOT NULL,
    "kart_id" UUID NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KartSusturma_pkey" PRIMARY KEY ("kullanici_id","kart_id")
);

-- CreateIndex
CREATE INDEX "KartSusturma_kart_id_idx" ON "KartSusturma"("kart_id");

-- AddForeignKey
ALTER TABLE "KartSusturma" ADD CONSTRAINT "KartSusturma_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartSusturma" ADD CONSTRAINT "KartSusturma_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
