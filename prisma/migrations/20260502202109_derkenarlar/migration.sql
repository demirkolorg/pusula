-- CreateEnum
CREATE TYPE "DerkenarTipi" AS ENUM ('KARAR', 'UYARI', 'ENGEL', 'BILGI', 'NOT');

-- CreateTable
CREATE TABLE "derkenarlar" (
    "id" TEXT NOT NULL,
    "tip" "DerkenarTipi" NOT NULL,
    "baslik" TEXT,
    "icerik" TEXT NOT NULL,
    "gorevId" TEXT NOT NULL,
    "yazarId" TEXT NOT NULL,
    "sabitlendi" BOOLEAN NOT NULL DEFAULT false,
    "cozuldu" BOOLEAN NOT NULL DEFAULT false,
    "cozulmeTarihi" TIMESTAMP(3),
    "surum" INTEGER NOT NULL DEFAULT 1,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" TIMESTAMP(3) NOT NULL,
    "silinmeTarihi" TIMESTAMP(3),

    CONSTRAINT "derkenarlar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "derkenarlar_gorevId_idx" ON "derkenarlar"("gorevId");

-- AddForeignKey
ALTER TABLE "derkenarlar" ADD CONSTRAINT "derkenarlar_gorevId_fkey" FOREIGN KEY ("gorevId") REFERENCES "gorevler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derkenarlar" ADD CONSTRAINT "derkenarlar_yazarId_fkey" FOREIGN KEY ("yazarId") REFERENCES "kullanicilar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
