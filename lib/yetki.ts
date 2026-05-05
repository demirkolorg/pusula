// Resource-level RBAC.
//
// Sistem rolleri genel izinleri verir; kaynak yetkilileri ise hangi proje,
// liste ve karta erisilecegini belirler. Yetki asagi miras kalir, yukari
// sadece navigasyon kabugu acilir.

import { db } from "./db";
import { EylemHatasi } from "./action-wrapper";
import { HATA_KODU } from "./sonuc";
import { kullaniciIzinleriniAl } from "./permissions";

export type ProjeAksiyon =
  | "proje:read"
  | "proje:edit"
  | "proje:delete"
  | "proje:authorize";

export type ListeAksiyon = "liste:read" | "liste:create" | "liste:edit" | "liste:delete";

export type KartAksiyon = "kart:read" | "kart:edit" | "kart:delete" | "kart:tasi" | "kart:create";

const SEVIYE_IZINLERI: Record<
  "ADMIN" | "NORMAL" | "IZLEYICI",
  Set<ProjeAksiyon | ListeAksiyon | KartAksiyon>
> = {
  ADMIN: new Set([
    "proje:read", "proje:edit", "proje:delete", "proje:authorize",
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
      yetkililer: {
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
            { yetkililer: { some: { kullanici_id: kullaniciId } } },
            { birimler: { some: birimWhere } },
            {
              kartlar: {
                some: { yetkililer: { some: { kullanici_id: kullaniciId } } },
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

  const yetkili = proje.yetkililer[0];
  if (yetkili && SEVIYE_IZINLERI[yetkili.seviye].has(aksiyon)) return true;

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
      proje: {
        select: {
          yetkililer: {
            where: { kullanici_id: kullaniciId },
            select: { seviye: true },
            take: 1,
          },
          birimler: {
            where: birimWhere,
            select: { birim_id: true },
            take: 1,
          },
        },
      },
      yetkililer: {
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
            { yetkililer: { some: { kullanici_id: kullaniciId } } },
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

  const projeYetkili = liste.proje.yetkililer[0];
  const projeYetkisiVar =
    !!projeYetkili && SEVIYE_IZINLERI[projeYetkili.seviye].has(aksiyon);
  const projeBirimYetkili = liste.proje.birimler.length > 0;
  const listeDogruYetkili =
    liste.yetkililer.length > 0 || liste.birimler.length > 0;

  if (aksiyon === "liste:read") {
    return (
      !!projeYetkili ||
      projeBirimYetkili ||
      listeDogruYetkili ||
      liste.kartlar.length > 0
    );
  }

  if (aksiyon === "liste:delete") {
    return !!projeYetkili && SEVIYE_IZINLERI[projeYetkili.seviye].has(aksiyon);
  }

  return projeYetkisiVar || projeBirimYetkili || listeDogruYetkili;
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
      liste: {
        select: {
          yetkililer: {
            where: { kullanici_id: kullaniciId },
            select: { kullanici_id: true },
            take: 1,
          },
          birimler: {
            where: birimWhere,
            select: { birim_id: true },
            take: 1,
          },
          proje: {
            select: {
              yetkililer: {
                where: { kullanici_id: kullaniciId },
                select: { seviye: true },
                take: 1,
              },
              birimler: {
                where: birimWhere,
                select: { birim_id: true },
                take: 1,
              },
            },
          },
        },
      },
      yetkililer: {
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

  const projeYetkili = kart.liste.proje.yetkililer[0];
  const projeYetkisiVar =
    !!projeYetkili && SEVIYE_IZINLERI[projeYetkili.seviye].has(aksiyon);
  const projeBirimYetkili = kart.liste.proje.birimler.length > 0;
  const listeDogruYetkili =
    kart.liste.yetkililer.length > 0 || kart.liste.birimler.length > 0;
  const kartDogruYetkili =
    kart.yetkililer.length > 0 || kart.birimler.length > 0;

  if (aksiyon === "kart:read") {
    return (
      !!projeYetkili ||
      projeBirimYetkili ||
      listeDogruYetkili ||
      kartDogruYetkili
    );
  }

  if (aksiyon === "kart:delete") {
    return !!projeYetkili && SEVIYE_IZINLERI[projeYetkili.seviye].has(aksiyon);
  }

  return (
    projeYetkisiVar ||
    projeBirimYetkili ||
    listeDogruYetkili ||
    kartDogruYetkili
  );
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
