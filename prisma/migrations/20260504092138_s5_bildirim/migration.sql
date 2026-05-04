-- CreateEnum
CREATE TYPE "BildirimTipi" AS ENUM ('YORUM_MENTION', 'KART_UYE_ATAMA', 'MADDE_ATAMA', 'BITIS_YAKLASIYOR', 'BITIS_GECTI', 'YORUM_EKLENDI', 'EKLENTI_YUKLENDI');

-- CreateTable
CREATE TABLE "Bildirim" (
    "id" BIGSERIAL NOT NULL,
    "alici_id" UUID NOT NULL,
    "ureten_id" UUID,
    "tip" "BildirimTipi" NOT NULL,
    "kaynak_tip" TEXT,
    "kaynak_id" UUID,
    "kart_id" UUID,
    "proje_id" UUID,
    "baslik" TEXT NOT NULL,
    "ozet" TEXT,
    "meta" JSONB,
    "okundu_mu" BOOLEAN NOT NULL DEFAULT false,
    "okuma_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bildirim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bildirim_alici_id_okundu_mu_olusturma_zamani_idx" ON "Bildirim"("alici_id", "okundu_mu", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "Bildirim_alici_id_olusturma_zamani_idx" ON "Bildirim"("alici_id", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "Bildirim_kart_id_idx" ON "Bildirim"("kart_id");

-- AddForeignKey
ALTER TABLE "Bildirim" ADD CONSTRAINT "Bildirim_alici_id_fkey" FOREIGN KEY ("alici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bildirim" ADD CONSTRAINT "Bildirim_ureten_id_fkey" FOREIGN KEY ("ureten_id") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;
