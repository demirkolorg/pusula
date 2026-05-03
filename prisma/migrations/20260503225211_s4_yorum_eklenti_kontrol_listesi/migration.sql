-- CreateTable
CREATE TABLE "Yorum" (
    "id" UUID NOT NULL,
    "kart_id" UUID NOT NULL,
    "yazan_id" UUID NOT NULL,
    "icerik" TEXT NOT NULL,
    "duzenlendi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "yanit_yorum_id" UUID,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Yorum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eklenti" (
    "id" UUID NOT NULL,
    "kart_id" UUID NOT NULL,
    "yukleyen_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "depolama_yolu" TEXT NOT NULL,
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Eklenti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KontrolListesi" (
    "id" UUID NOT NULL,
    "kart_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "sira" TEXT NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KontrolListesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KontrolMaddesi" (
    "id" UUID NOT NULL,
    "kontrol_listesi_id" UUID NOT NULL,
    "metin" TEXT NOT NULL,
    "tamamlandi_mi" BOOLEAN NOT NULL DEFAULT false,
    "tamamlama_zamani" TIMESTAMP(3),
    "tamamlayan_id" UUID,
    "atanan_id" UUID,
    "bitis" TIMESTAMP(3),
    "sira" TEXT NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KontrolMaddesi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Yorum_kart_id_silindi_mi_olusturma_zamani_idx" ON "Yorum"("kart_id", "silindi_mi", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "Yorum_yazan_id_idx" ON "Yorum"("yazan_id");

-- CreateIndex
CREATE INDEX "Eklenti_kart_id_silindi_mi_olusturma_zamani_idx" ON "Eklenti"("kart_id", "silindi_mi", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "KontrolListesi_kart_id_sira_idx" ON "KontrolListesi"("kart_id", "sira");

-- CreateIndex
CREATE INDEX "KontrolMaddesi_kontrol_listesi_id_sira_idx" ON "KontrolMaddesi"("kontrol_listesi_id", "sira");

-- CreateIndex
CREATE INDEX "KontrolMaddesi_atanan_id_idx" ON "KontrolMaddesi"("atanan_id");

-- AddForeignKey
ALTER TABLE "Yorum" ADD CONSTRAINT "Yorum_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yorum" ADD CONSTRAINT "Yorum_yazan_id_fkey" FOREIGN KEY ("yazan_id") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yorum" ADD CONSTRAINT "Yorum_yanit_yorum_id_fkey" FOREIGN KEY ("yanit_yorum_id") REFERENCES "Yorum"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Eklenti" ADD CONSTRAINT "Eklenti_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eklenti" ADD CONSTRAINT "Eklenti_yukleyen_id_fkey" FOREIGN KEY ("yukleyen_id") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontrolListesi" ADD CONSTRAINT "KontrolListesi_kart_id_fkey" FOREIGN KEY ("kart_id") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontrolMaddesi" ADD CONSTRAINT "KontrolMaddesi_kontrol_listesi_id_fkey" FOREIGN KEY ("kontrol_listesi_id") REFERENCES "KontrolListesi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontrolMaddesi" ADD CONSTRAINT "KontrolMaddesi_tamamlayan_id_fkey" FOREIGN KEY ("tamamlayan_id") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontrolMaddesi" ADD CONSTRAINT "KontrolMaddesi_atanan_id_fkey" FOREIGN KEY ("atanan_id") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;
