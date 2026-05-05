-- DropForeignKey
ALTER TABLE "KartIliskisi" DROP CONSTRAINT "KartIliskisi_kart_a_id_fkey";

-- DropForeignKey
ALTER TABLE "KartIliskisi" DROP CONSTRAINT "KartIliskisi_kart_b_id_fkey";

-- DropTable
DROP TABLE "KartIliskisi";

-- DropEnum
DROP TYPE "KartIliskiTipi";
