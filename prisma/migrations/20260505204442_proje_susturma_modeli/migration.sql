-- CreateTable
CREATE TABLE "ProjeSusturma" (
    "kullanici_id" UUID NOT NULL,
    "proje_id" UUID NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjeSusturma_pkey" PRIMARY KEY ("kullanici_id","proje_id")
);

-- CreateIndex
CREATE INDEX "ProjeSusturma_proje_id_idx" ON "ProjeSusturma"("proje_id");

-- AddForeignKey
ALTER TABLE "ProjeSusturma" ADD CONSTRAINT "ProjeSusturma_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjeSusturma" ADD CONSTRAINT "ProjeSusturma_proje_id_fkey" FOREIGN KEY ("proje_id") REFERENCES "Proje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
