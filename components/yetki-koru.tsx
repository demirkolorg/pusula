"use client";

import type { ReactNode } from "react";
import { useHerhangiBirIzin, useTumIzinler } from "@/lib/permissions-istemci";
import type { IzinKodu } from "@/lib/permissions";

type YetkiKoruProps = {
  /** Tek izin kodu — kullanıcı bu izne sahipse children render. */
  izin?: IzinKodu | string;
  /** Verilen izinlerden en az birine sahipse children render. */
  herhangi?: ReadonlyArray<IzinKodu | string>;
  /** Tüm izinlere sahipse children render. */
  tumu?: ReadonlyArray<IzinKodu | string>;
  /** Yetkisiz durumda gösterilecek alternatif (default: null). */
  alternatif?: ReactNode;
  children: ReactNode;
};

/**
 * ADR-0013: İstemci tarafı yetki kapısı bileşeni.
 *
 * Kullanım:
 * <YetkiKoru izin="rol:manage">
 *   <Button>Rol Oluştur</Button>
 * </YetkiKoru>
 *
 * GÜVENLİK NOTU: Bu bileşen sadece UI görünürlüğü içindir.
 * Server action her zaman `await yetkiZorunlu(...)` çağırır.
 */
export function YetkiKoru({
  izin,
  herhangi,
  tumu,
  alternatif = null,
  children,
}: YetkiKoruProps) {
  const tekIzin = useHerhangiBirIzin(izin ? [izin] : []);
  const herhangiVar = useHerhangiBirIzin(herhangi ?? []);
  const tumuVar = useTumIzinler(tumu ?? []);

  if (izin && tekIzin) return <>{children}</>;
  if (herhangi && herhangiVar) return <>{children}</>;
  if (tumu && tumuVar) return <>{children}</>;

  return <>{alternatif}</>;
}
