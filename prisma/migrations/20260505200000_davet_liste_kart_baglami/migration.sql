-- ADR-0013: davet bağlamı kaynağa göre ayrıldı.
-- Liste'den davet edilen liste yetkilisi olur, kart'tan davet edilen kart
-- yetkilisi olur. Proje davet bağlamı zaten DavetProjeBaglami'da; bu migration
-- liste ve kart için iki yeni tablo ekler.

-- CreateTable
CREATE TABLE "DavetListeBaglami" (
    "id" UUID NOT NULL,
    "davet_id" UUID NOT NULL,
    "liste_id" UUID NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DavetListeBaglami_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DavetKartBaglami" (
    "id" UUID NOT NULL,
    "davet_id" UUID NOT NULL,
    "kart_id" UUID NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DavetKartBaglami_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DavetListeBaglami_liste_id_idx" ON "DavetListeBaglami"("liste_id");

-- CreateIndex
CREATE UNIQUE INDEX "DavetListeBaglami_davet_id_liste_id_key" ON "DavetListeBaglami"("davet_id", "liste_id");

-- CreateIndex
CREATE INDEX "DavetKartBaglami_kart_id_idx" ON "DavetKartBaglami"("kart_id");

-- CreateIndex
CREATE UNIQUE INDEX "DavetKartBaglami_davet_id_kart_id_key" ON "DavetKartBaglami"("davet_id", "kart_id");

-- AddForeignKey
ALTER TABLE "DavetListeBaglami" ADD CONSTRAINT "DavetListeBaglami_davet_id_fkey" FOREIGN KEY ("davet_id") REFERENCES "DavetTokeni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DavetListeBaglami" ADD CONSTRAINT "DavetListeBaglami_liste_id_fkey" FOREIGN KEY ("liste_id") REFERENCES "Liste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DavetKartBaglami" ADD CONSTRAINT "DavetKartBaglami_davet_id_fkey" FOREIGN KEY ("davet_id") REFERENCES "DavetTokeni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DavetKartBaglami" ADD CONSTRAINT "DavetKartBaglami_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
