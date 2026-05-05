-- CreateTable
CREATE TABLE "ProjeZiyareti" (
    "kullanici_id" UUID NOT NULL,
    "proje_id" UUID NOT NULL,
    "son_ziyaret" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjeZiyareti_pkey" PRIMARY KEY ("kullanici_id","proje_id")
);

-- CreateIndex
CREATE INDEX "ProjeZiyareti_kullanici_id_son_ziyaret_idx" ON "ProjeZiyareti"("kullanici_id", "son_ziyaret" DESC);

-- CreateIndex
CREATE INDEX "ProjeZiyareti_proje_id_idx" ON "ProjeZiyareti"("proje_id");

-- AddForeignKey
ALTER TABLE "ProjeZiyareti" ADD CONSTRAINT "ProjeZiyareti_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjeZiyareti" ADD CONSTRAINT "ProjeZiyareti_proje_id_fkey" FOREIGN KEY ("proje_id") REFERENCES "Proje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
