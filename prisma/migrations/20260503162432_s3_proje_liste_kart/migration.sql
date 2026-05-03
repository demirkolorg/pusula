-- CreateEnum
CREATE TYPE "ProjeUyeSeviye" AS ENUM ('ADMIN', 'NORMAL', 'IZLEYICI');

-- CreateEnum
CREATE TYPE "KartIliskiTipi" AS ENUM ('BLOCKS', 'RELATES', 'DUPLICATES');

-- CreateTable
CREATE TABLE "Proje" (
    "id" UUID NOT NULL,
    "kurum_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "kapak_renk" TEXT,
    "kapak_dosya_id" UUID,
    "yildizli_mi" BOOLEAN NOT NULL DEFAULT false,
    "arsiv_mi" BOOLEAN NOT NULL DEFAULT false,
    "arsiv_zamani" TIMESTAMP(3),
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "sira" TEXT NOT NULL,
    "olusturan_id" UUID,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjeUyesi" (
    "proje_id" UUID NOT NULL,
    "kullanici_id" UUID NOT NULL,
    "seviye" "ProjeUyeSeviye" NOT NULL DEFAULT 'NORMAL',
    "eklenme_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjeUyesi_pkey" PRIMARY KEY ("proje_id","kullanici_id")
);

-- CreateTable
CREATE TABLE "Liste" (
    "id" UUID NOT NULL,
    "proje_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "sira" TEXT NOT NULL,
    "arsiv_mi" BOOLEAN NOT NULL DEFAULT false,
    "wip_limit" INTEGER,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kart" (
    "id" UUID NOT NULL,
    "liste_id" UUID NOT NULL,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT,
    "sira" TEXT NOT NULL,
    "kapak_renk" TEXT,
    "kapak_dosya_id" UUID,
    "baslangic" TIMESTAMP(3),
    "bitis" TIMESTAMP(3),
    "arsiv_mi" BOOLEAN NOT NULL DEFAULT false,
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "olusturan_id" UUID,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etiket" (
    "id" UUID NOT NULL,
    "proje_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "renk" TEXT NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Etiket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KartEtiket" (
    "kart_id" UUID NOT NULL,
    "etiket_id" UUID NOT NULL,

    CONSTRAINT "KartEtiket_pkey" PRIMARY KEY ("kart_id","etiket_id")
);

-- CreateTable
CREATE TABLE "KartUyesi" (
    "kart_id" UUID NOT NULL,
    "kullanici_id" UUID NOT NULL,
    "eklenme_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KartUyesi_pkey" PRIMARY KEY ("kart_id","kullanici_id")
);

-- CreateTable
CREATE TABLE "KartIliskisi" (
    "id" UUID NOT NULL,
    "kart_a_id" UUID NOT NULL,
    "kart_b_id" UUID NOT NULL,
    "tip" "KartIliskiTipi" NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "olusturan_id" UUID,

    CONSTRAINT "KartIliskisi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proje_kurum_id_silindi_mi_arsiv_mi_idx" ON "Proje"("kurum_id", "silindi_mi", "arsiv_mi");

-- CreateIndex
CREATE INDEX "Proje_kurum_id_sira_idx" ON "Proje"("kurum_id", "sira");

-- CreateIndex
CREATE INDEX "ProjeUyesi_kullanici_id_idx" ON "ProjeUyesi"("kullanici_id");

-- CreateIndex
CREATE INDEX "Liste_proje_id_sira_idx" ON "Liste"("proje_id", "sira");

-- CreateIndex
CREATE INDEX "Liste_proje_id_arsiv_mi_idx" ON "Liste"("proje_id", "arsiv_mi");

-- CreateIndex
CREATE INDEX "Kart_liste_id_sira_idx" ON "Kart"("liste_id", "sira");

-- CreateIndex
CREATE INDEX "Kart_liste_id_silindi_mi_arsiv_mi_idx" ON "Kart"("liste_id", "silindi_mi", "arsiv_mi");

-- CreateIndex
CREATE INDEX "Kart_bitis_idx" ON "Kart"("bitis");

-- CreateIndex
CREATE INDEX "Etiket_proje_id_idx" ON "Etiket"("proje_id");

-- CreateIndex
CREATE UNIQUE INDEX "Etiket_proje_id_ad_key" ON "Etiket"("proje_id", "ad");

-- CreateIndex
CREATE INDEX "KartEtiket_etiket_id_idx" ON "KartEtiket"("etiket_id");

-- CreateIndex
CREATE INDEX "KartUyesi_kullanici_id_idx" ON "KartUyesi"("kullanici_id");

-- CreateIndex
CREATE INDEX "KartIliskisi_kart_b_id_tip_idx" ON "KartIliskisi"("kart_b_id", "tip");

-- CreateIndex
CREATE UNIQUE INDEX "KartIliskisi_kart_a_id_kart_b_id_tip_key" ON "KartIliskisi"("kart_a_id", "kart_b_id", "tip");

-- AddForeignKey
ALTER TABLE "Proje" ADD CONSTRAINT "Proje_kurum_id_fkey" FOREIGN KEY ("kurum_id") REFERENCES "Kurum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proje" ADD CONSTRAINT "Proje_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjeUyesi" ADD CONSTRAINT "ProjeUyesi_proje_id_fkey" FOREIGN KEY ("proje_id") REFERENCES "Proje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjeUyesi" ADD CONSTRAINT "ProjeUyesi_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liste" ADD CONSTRAINT "Liste_proje_id_fkey" FOREIGN KEY ("proje_id") REFERENCES "Proje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kart" ADD CONSTRAINT "Kart_liste_id_fkey" FOREIGN KEY ("liste_id") REFERENCES "Liste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etiket" ADD CONSTRAINT "Etiket_proje_id_fkey" FOREIGN KEY ("proje_id") REFERENCES "Proje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartEtiket" ADD CONSTRAINT "KartEtiket_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartEtiket" ADD CONSTRAINT "KartEtiket_etiket_id_fkey" FOREIGN KEY ("etiket_id") REFERENCES "Etiket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartUyesi" ADD CONSTRAINT "KartUyesi_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartUyesi" ADD CONSTRAINT "KartUyesi_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartIliskisi" ADD CONSTRAINT "KartIliskisi_kart_a_id_fkey" FOREIGN KEY ("kart_a_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartIliskisi" ADD CONSTRAINT "KartIliskisi_kart_b_id_fkey" FOREIGN KEY ("kart_b_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
