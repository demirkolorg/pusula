import type { AktiviteGunluguFiltre } from "../schemas";
import type { AktiviteBaglamSecenekleri } from "../services";

export const TUMU = "__tumu__";

export function filtreTemizle(
  filtre: AktiviteGunluguFiltre,
): AktiviteGunluguFiltre {
  return { limit: filtre.limit, kapsam: "tum" };
}

export function islemSecimi(
  deger: string | null,
): AktiviteGunluguFiltre["islem"] | undefined {
  if (deger === "CREATE" || deger === "UPDATE" || deger === "DELETE") {
    return deger;
  }
  return undefined;
}

export function kapsamSecimi(
  deger: string | null,
): AktiviteGunluguFiltre["kapsam"] {
  return deger === "benim" ? "benim" : "tum";
}

export function secimDegeri(deger: string | null): string | undefined {
  if (!deger || deger === TUMU) return undefined;
  return deger;
}

export function kapsamEtiketi(
  kapsam: AktiviteGunluguFiltre["kapsam"],
): string {
  return kapsam === "benim" ? "Sadece benim" : "Tüm ekip";
}

export function islemEtiketi(
  islem: AktiviteGunluguFiltre["islem"],
): string {
  if (islem === "CREATE") return "Yeni kayıt";
  if (islem === "UPDATE") return "Güncelleme";
  if (islem === "DELETE") return "Silme";
  return "Tüm işlemler";
}

export function baglamEtiketi(
  id: string | undefined,
  varsayilan: string,
  secenekler: ReadonlyArray<{ id: string; ad: string }>,
): string {
  return secenekler.find((s) => s.id === id)?.ad ?? varsayilan;
}

export function kartEtiketi(
  id: string | undefined,
  secenekler: AktiviteBaglamSecenekleri,
): string {
  return secenekler.kartlar.find((k) => k.id === id)?.baslik ?? "Tüm kartlar";
}
