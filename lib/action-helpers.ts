// Sprint 3 / S3-12 — Action wrapper context için ortak helper'lar.
//
// Codebase'te 17+ action dosyasında aynı `kullaniciIdAl` lokali kopyalanmış;
// 2 dosyada `superAdminZorunlu` aynı pattern'le tekrar yazılmış. Tek nokta
// merkezi.

import { EylemHatasi } from "./action-wrapper";
import { superAdminMi } from "./permissions";
import { HATA_KODU } from "./sonuc";

export type ActionCtx = {
  oturum: { kullaniciId?: string } | null;
};

/**
 * Aktif kullanıcı id'sini döner; oturum yoksa GIRIS_YOK fırlatır.
 * Action `calistir` callback'inin başında çağrılır.
 */
export function kullaniciIdAl(ctx: ActionCtx): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

/**
 * Sadece SUPER_ADMIN rolündeki kullanıcılara izin verir; aksi halde
 * YETKISIZ döner. Audit loglarına WARN seviyesinde yazılır.
 */
export async function superAdminZorunlu(
  kullaniciId: string | null | undefined,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await superAdminMi(kullaniciId))) {
    throw new EylemHatasi(
      "Bu sayfa yalnızca süper yöneticiler içindir.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}
