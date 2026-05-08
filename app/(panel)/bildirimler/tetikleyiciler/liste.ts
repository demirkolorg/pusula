// Sprint 3 / S3-4 — Liste bildirim tetikleyicileri.

import { db } from "@/lib/db";
import { bildirimUret } from "../services";
import { adSoyad } from "./_ortak";

// Liste silinmeden ÖNCE çağrılmalı: silindikten sonra ListeYetkilisi cascade
// ile temizlenir, alıcı listesi boşalır. Action'da sıralama: önce tetikle,
// sonra delete.
export async function tetikleListeSilindi(opt: {
  listeId: string;
  silenId: string;
}): Promise<void> {
  const liste = await db.liste.findUnique({
    where: { id: opt.listeId },
    select: {
      ad: true,
      proje_id: true,
      yetkililer: { select: { kullanici_id: true } },
    },
  });
  if (!liste) return;
  const aliciIdler = liste.yetkililer
    .map((y) => y.kullanici_id)
    .filter((id) => id !== opt.silenId);
  if (aliciIdler.length === 0) return;
  const silenAdi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.silenId,
    tip: "LISTE_SILINDI",
    baslik: `${silenAdi} yetkili olduğunuz bir listeyi sildi`,
    ozet: liste.ad,
    proje_id: liste.proje_id,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}
