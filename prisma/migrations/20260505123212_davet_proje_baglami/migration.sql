-- CreateTable
CREATE TABLE "DavetProjeBaglami" (
    "id" UUID NOT NULL,
    "davet_id" UUID NOT NULL,
    "proje_id" UUID NOT NULL,
    "seviye" "ProjeUyeSeviye" NOT NULL DEFAULT 'NORMAL',
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DavetProjeBaglami_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DavetProjeBaglami_proje_id_idx" ON "DavetProjeBaglami"("proje_id");

-- CreateIndex
CREATE UNIQUE INDEX "DavetProjeBaglami_davet_id_proje_id_key" ON "DavetProjeBaglami"("davet_id", "proje_id");

-- AddForeignKey
ALTER TABLE "DavetProjeBaglami" ADD CONSTRAINT "DavetProjeBaglami_davet_id_fkey" FOREIGN KEY ("davet_id") REFERENCES "DavetTokeni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DavetProjeBaglami" ADD CONSTRAINT "DavetProjeBaglami_proje_id_fkey" FOREIGN KEY ("proje_id") REFERENCES "Proje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
