-- AlterTable
ALTER TABLE "Kart" ADD COLUMN     "tamamlandi_mi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tamamlanma_zamani" TIMESTAMP(3),
ADD COLUMN     "tamamlayan_id" UUID;

-- CreateIndex
CREATE INDEX "Kart_liste_id_tamamlandi_mi_idx" ON "Kart"("liste_id", "tamamlandi_mi");

-- AddForeignKey
ALTER TABLE "Kart" ADD CONSTRAINT "Kart_tamamlayan_id_fkey" FOREIGN KEY ("tamamlayan_id") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;
