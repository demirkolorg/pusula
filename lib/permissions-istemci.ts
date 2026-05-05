"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { ROL_KODLARI } from "./roller";
import type { IzinKodu } from "./permissions";

/**
 * ADR-0013: İstemci tarafı yetki hook'ları.
 * Server tarafında `izinVarMi/yetkiZorunlu` kullanılır; bu hook'lar
 * sadece UI görünürlüğü için (buton, menü, sekme).
 *
 * GÜVENLİK NOTU: Hiçbir UI gating güvenlik sınırı değildir. Server
 * action'lar her zaman `await yetkiZorunlu(...)` çağırır.
 */

function makamMi(roller: string[] | undefined): boolean {
  if (!roller) return false;
  return (
    roller.includes(ROL_KODLARI.SUPER_ADMIN) ||
    roller.includes(ROL_KODLARI.KAYMAKAM)
  );
}

/**
 * Custom hook — kullanıcının izin setini cachle hesaplar.
 * Makam rolleri için Set(['*']), diğerleri için session.user.izinler.
 */
function useIzinSeti(): Set<string> | null {
  const { data, status } = useSession();
  return useMemo(() => {
    if (status !== "authenticated" || !data?.user) return null;
    const kullanici = data.user;
    if (makamMi(kullanici.roller)) {
      return new Set<string>(["*"]);
    }
    return new Set<string>(kullanici.izinler ?? []);
  }, [data, status]);
}

/**
 * Kullanıcının verilen izne sahip olup olmadığını döner.
 * Yüklenme/oturum yoksa false.
 */
export function useIzin(izin: IzinKodu | string): boolean {
  const set = useIzinSeti();
  if (!set) return false;
  if (set.has("*")) return true;
  return set.has(izin);
}

/**
 * En az bir izne sahipse true. Boş listede false döner.
 */
export function useHerhangiBirIzin(
  izinler: ReadonlyArray<IzinKodu | string>,
): boolean {
  const set = useIzinSeti();
  if (!set) return false;
  if (set.has("*")) return izinler.length > 0;
  return izinler.some((i) => set.has(i));
}

/**
 * Tüm izinlere sahipse true. Boş listede false döner.
 */
export function useTumIzinler(
  izinler: ReadonlyArray<IzinKodu | string>,
): boolean {
  const set = useIzinSeti();
  if (!set) return false;
  if (izinler.length === 0) return false;
  if (set.has("*")) return true;
  return izinler.every((i) => set.has(i));
}

/**
 * Belirli bir sistem rolüne sahip mi?
 */
export function useRol(rolKodu: string | string[]): boolean {
  const { data, status } = useSession();
  return useMemo(() => {
    if (status !== "authenticated" || !data?.user?.roller) return false;
    const hedef = Array.isArray(rolKodu) ? rolKodu : [rolKodu];
    return hedef.some((r) => data.user.roller!.includes(r));
  }, [data, status, rolKodu]);
}
