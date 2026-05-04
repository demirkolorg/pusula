// Resource-level RBAC.
//
// Kaynak gorunurlugu birim paylasimi ve dogrudan uye atamasi uzerinden
// kurulur. Makam rolleri tum kaynaklari gorur.

import { db } from "./db";
import { EylemHatasi } from "./action-wrapper";
import { HATA_KODU } from "./sonuc";
import { kullaniciIzinleriniAl } from "./permissions";

export type ProjeAksiyon =
  | "proje:read"
  | "proje:edit"
  | "proje:delete"
  | "proje:uye-yonet";

export type ListeAksiyon = "liste:read" | "liste:create" | "liste:edit" | "liste:delete";

export type KartAksiyon = "kart:read" | "kart:edit" | "kart:delete" | "kart:tasi" | "kart:create";

const SEVIYE_IZINLERI: Record<
  "ADMIN" | "NORMAL" | "IZLEYICI",
  Set<ProjeAksiyon | ListeAksiyon | KartAksiyon>
> = {
  ADMIN: new Set([
    "proje:read", "proje:edit", "proje:delete", "proje:uye-yonet",
    "liste:read", "liste:create", "liste:edit", "liste:delete",
    "kart:read", "kart:create", "kart:edit", "kart:delete", "kart:tasi",
  ]),
  NORMAL: new Set([
    "proje:read", "proje:edit",
    "liste:read", "liste:create", "liste:edit",
    "kart:read", "kart:create", "kart:edit", "kart:tasi",
  ]),
  IZLEYICI: new Set(["proje:read", "liste:read", "kart:read"]),
};

type ErisimBilgisi = {
  birimId: string | null;
  makam: boolean;
};

export async function kullaniciErisimBilgisi(
  kullaniciId: string,
): Promise<ErisimBilgisi> {
  const [kullanici, izinler] = await Promise.all([
    db.kullanici.findUnique({
      where: { id: kullaniciId },
      select: { birim_id: true },
    }),
    kullaniciIzinleriniAl(kullaniciId),
  ]);

  return {
    birimId: kullanici?.birim_id ?? null,
    makam: izinler.has("*"),
  };
}

export async function canProje(
  kullaniciId: string,
  aksiyon: ProjeAksiyon,
  projeId: string,
): Promise<boolean> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  const birimWhere = erisim.birimId
    ? { birim_id: erisim.birimId }
    : { birim_id: { in: [] } };
  const proje = await db.proje.findUnique({
    where: { id: projeId },
    select: {
      silindi_mi: true,
      uyeler: {
        where: { kullanici_id: kullaniciId },
        select: { seviye: true },
      },
      birimler: {
        where: birimWhere,
        select: { birim_id: true },
        take: 1,
      },
      listeler: {
        where: {
          OR: [
            { uyeler: { some: { kullanici_id: kullaniciId } } },
            { birimler: { some: birimWhere } },
            {
              kartlar: {
                some: { uyeler: { some: { kullanici_id: kullaniciId } } },
              },
            },
            {
              kartlar: {
                some: { birimler: { some: birimWhere } },
              },
            },
          ],
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!proje) return false;
  if (proje.silindi_mi && aksiyon !== "proje:read") return false;
  if (erisim.makam) return true;

  const uye = proje.uyeler[0];
  if (uye && SEVIYE_IZINLERI[uye.seviye].has(aksiyon)) return true;

  return (
    aksiyon === "proje:read" &&
    (proje.birimler.length > 0 || proje.listeler.length > 0)
  );
}

export async function canListe(
  kullaniciId: string,
  aksiyon: ListeAksiyon,
  listeId: string,
): Promise<boolean> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  const birimWhere = erisim.birimId
    ? { birim_id: erisim.birimId }
    : { birim_id: { in: [] } };
  const liste = await db.liste.findUnique({
    where: { id: listeId },
    select: {
      proje_id: true,
      uyeler: {
        where: { kullanici_id: kullaniciId },
        select: { kullanici_id: true },
        take: 1,
      },
      birimler: {
        where: birimWhere,
        select: { birim_id: true },
        take: 1,
      },
      kartlar: {
        where: {
          OR: [
            { uyeler: { some: { kullanici_id: kullaniciId } } },
            { birimler: { some: birimWhere } },
          ],
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!liste) return false;
  if (erisim.makam) return true;

  if (aksiyon === "liste:read") {
    if (liste.uyeler.length > 0 || liste.birimler.length > 0) return true;
    // Saf model: alt karta dogrudan atama varsa liste kabugu gorunur
    if (liste.kartlar.length > 0) return true;
    return false;
  }

  return canProje(kullaniciId, "proje:edit", liste.proje_id);
}

export async function canKart(
  kullaniciId: string,
  aksiyon: KartAksiyon,
  kartId: string,
): Promise<boolean> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  const birimWhere = erisim.birimId
    ? { birim_id: erisim.birimId }
    : { birim_id: { in: [] } };
  const kart = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      silindi_mi: true,
      liste_id: true,
      uyeler: {
        where: { kullanici_id: kullaniciId },
        select: { kullanici_id: true },
        take: 1,
      },
      birimler: {
        where: birimWhere,
        select: { birim_id: true },
        take: 1,
      },
    },
  });

  if (!kart) return false;
  if (kart.silindi_mi && aksiyon !== "kart:read") return false;
  if (erisim.makam) return true;

  if (aksiyon === "kart:read") {
    // Saf model: kart sadece dogrudan atananlara gorunur
    if (kart.uyeler.length > 0 || kart.birimler.length > 0) return true;
    return false;
  }

  const liste = await db.liste.findUnique({
    where: { id: kart.liste_id },
    select: { proje_id: true },
  });
  if (!liste) return false;
  return canProje(kullaniciId, "proje:edit", liste.proje_id);
}

export async function yetkiZorunluProje(
  kullaniciId: string | null | undefined,
  aksiyon: ProjeAksiyon,
  projeId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canProje(kullaniciId, aksiyon, projeId))) {
    throw new EylemHatasi(
      "Bu projeye erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}

export async function yetkiZorunluListe(
  kullaniciId: string | null | undefined,
  aksiyon: ListeAksiyon,
  listeId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canListe(kullaniciId, aksiyon, listeId))) {
    throw new EylemHatasi(
      "Bu listeye erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}

export async function yetkiZorunluKart(
  kullaniciId: string | null | undefined,
  aksiyon: KartAksiyon,
  kartId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canKart(kullaniciId, aksiyon, kartId))) {
    throw new EylemHatasi(
      "Bu karta erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}
