-- ADR-0012: Proje yetkilisinde seviye kavramı kaldırıldı.
-- Sistem rolü (RBAC) tek otorite kaynağı; ProjeYetkilisi sadece "kişi-proje
-- bağlantısı" tutar. IZLEYICI seviyesi ve davet bağlamı seviyesi de elenir.
--
-- Veri kaybı bilinçli: 10 ProjeUyesi.seviye + 1 DavetProjeBaglami.seviye değeri
-- atılır. Yetkili olma durumu korunur (kayıtlar silinmez).

-- AlterTable
ALTER TABLE "DavetProjeBaglami" DROP COLUMN "seviye";

-- AlterTable
ALTER TABLE "ProjeUyesi" DROP COLUMN "seviye";

-- DropEnum
DROP TYPE "ProjeUyeSeviye";
