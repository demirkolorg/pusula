// Sprint 3 / S3-16 — Oturum (NextAuth session.user) için tip-güvenli helper.
//
// 17+ dosyada `oturum.user as { id: string }` cast'i tekrar ediyordu;
// Kontrol Kural 36 `as` cast yasak. NextAuth session.user tipi `Session
// type` türetilmesi gerekiyor — bu helper güvenli erişim sağlar.

import { auth } from "@/auth";

export type OturumKullanicisi = {
  id: string;
  email?: string | null;
  birimId?: string | null;
  roller?: string[];
  izinler?: string[];
  izinVersiyonu?: number;
};

/**
 * Aktif oturumun kullanıcı bilgisini döner; oturum yoksa null.
 * `auth()` çağrısının dönüşünü cast'siz şekilde sarmalar.
 */
export async function aktifOturumKullanicisi(): Promise<OturumKullanicisi | null> {
  const oturum = await auth();
  if (!oturum?.user) return null;
  const u = oturum.user as Record<string, unknown>;
  if (typeof u.id !== "string" || u.id.length === 0) return null;
  return {
    id: u.id,
    email: typeof u.email === "string" ? u.email : null,
    birimId: typeof u.birimId === "string" ? u.birimId : null,
    roller: Array.isArray(u.roller) ? (u.roller as string[]) : undefined,
    izinler: Array.isArray(u.izinler) ? (u.izinler as string[]) : undefined,
    izinVersiyonu:
      typeof u.izinVersiyonu === "number" ? u.izinVersiyonu : undefined,
  };
}

/**
 * Aktif kullanıcı id'sini döner; oturum yoksa null.
 * Sayfa-server-component'lerinde `redirect("/giris")` öncesi kontrol için
 * yaygın kullanım pattern'i.
 */
export async function aktifKullaniciId(): Promise<string | null> {
  const k = await aktifOturumKullanicisi();
  return k?.id ?? null;
}
