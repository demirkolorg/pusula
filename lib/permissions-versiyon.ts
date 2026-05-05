import { db } from "./db";

/**
 * ADR-0013: Rol izinleri her güncellendiğinde versiyon +1 artar.
 * JWT içinde taşınan `izinVersiyonu` istemci-tarafı önbellek gating
 * ve cross-tab senkronu için kullanılır. Şu anda 30 dk JWT yenilenmesi
 * üzerine binmiş; v2'de Socket.io broadcast ile gerçek-zamanlı revoke.
 */

/**
 * Tek rolün izin versiyonunu artır.
 * Transaction içinde RolIzin update'iyle birlikte çağrılmalı.
 */
export async function rolIzinVersiyonuArtir(
  tx: Pick<typeof db, "rol">,
  rolId: string,
): Promise<number> {
  const guncel = await tx.rol.update({
    where: { id: rolId },
    data: { izin_versiyonu: { increment: 1 } },
    select: { izin_versiyonu: true },
  });
  return guncel.izin_versiyonu;
}

/**
 * Kullanıcının tüm rollerinden en yüksek izin_versiyonu.
 * Auth callback JWT'ye yazarken bunu kullanır.
 */
export async function kullaniciIzinVersiyonu(
  kullaniciId: string,
): Promise<number> {
  const sonuc = await db.kullaniciRol.findMany({
    where: { kullanici_id: kullaniciId },
    select: { rol: { select: { izin_versiyonu: true } } },
  });
  if (sonuc.length === 0) return 0;
  return sonuc.reduce(
    (max, satir) => Math.max(max, satir.rol.izin_versiyonu),
    0,
  );
}
