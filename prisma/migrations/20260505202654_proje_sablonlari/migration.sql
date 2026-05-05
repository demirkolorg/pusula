-- CreateTable
CREATE TABLE "ProjeSablonu" (
    "id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "kapak_renk" TEXT,
    "kapak_ikon" TEXT,
    "sistem_mi" BOOLEAN NOT NULL DEFAULT false,
    "sistem_kodu" TEXT,
    "olusturan_id" UUID,
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjeSablonu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SablonListesi" (
    "id" UUID NOT NULL,
    "sablon_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "sira" TEXT NOT NULL,
    "wip_limit" INTEGER,

    CONSTRAINT "SablonListesi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjeSablonu_sistem_kodu_key" ON "ProjeSablonu"("sistem_kodu");

-- CreateIndex
CREATE INDEX "ProjeSablonu_sistem_mi_idx" ON "ProjeSablonu"("sistem_mi");

-- CreateIndex
CREATE INDEX "ProjeSablonu_silindi_mi_idx" ON "ProjeSablonu"("silindi_mi");

-- CreateIndex
CREATE INDEX "ProjeSablonu_olusturan_id_idx" ON "ProjeSablonu"("olusturan_id");

-- CreateIndex
CREATE INDEX "SablonListesi_sablon_id_sira_idx" ON "SablonListesi"("sablon_id", "sira");

-- AddForeignKey
ALTER TABLE "ProjeSablonu" ADD CONSTRAINT "ProjeSablonu_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SablonListesi" ADD CONSTRAINT "SablonListesi_sablon_id_fkey" FOREIGN KEY ("sablon_id") REFERENCES "ProjeSablonu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
