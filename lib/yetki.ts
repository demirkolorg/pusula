// Resource-level RBAC (ADR-0005, ADR-0008, ADR-0012).
//
// İki katmanlı yetki:
//   1. Sistem rolü izinleri (lib/permissions.ts) — kullanıcı bu TIP işlemi
//      yapabilir mi (örn. PROJE_SIL).
//   2. Kaynak erişimi (bu modül) — bu kullanıcı bu kaynağa (proje/liste/kart)
//      erişebilir mi.
//
// ADR-0012 ile "ProjeYetkilisi.seviye" kaldırıldı: yetkilinin proje-içi rolü
// yok; yetkili olmak == projeye erişimi var. Aksiyon kararı sistem rolünden
// gelir (action wrapper'larda yetkiZorunlu + yetkiZorunluProje birlikte).
// Yetki aşağı miras kalır (proje→liste→kart), yukarı sadece navigasyon kabuğu.

import { cache } from "react";
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

// ADR-0018 — `kart:tamamla` ayrı aksiyon: düzenleyebilen herkes kapatamaz.
// Kaynak-bazlı kontrol mevcut canKart davranışını paylaşır (kart erişim
// kümesi + makam atlatma); sistem-rolü izni (KART_TAMAMLA) action wrapper'da
// `yetkiZorunlu` ile kontrol edilir, iki katman gereklidir.
export type KartAksiyon =
  | "kart:read"
  | "kart:edit"
  | "kart:delete"
  | "kart:tasi"
  | "kart:create"
  | "kart:tamamla";

type ErisimBilgisi = {
  birimId: string | null;
  makam: boolean;
};

// Sprint 2 / S2-2 — request-scoped cache. canProje/canListe/canKart
// neredeyse her API isteğinde çağrılıyor; React `cache()` aynı request
// içinde tek hesaplama yapar (DB roundtrip 1× kalır).
async function _kullaniciErisimBilgisi(
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

export const kullaniciErisimBilgisi = cache(_kullaniciErisimBilgisi);

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
        select: { kullanici_id: true },
        take: 1,
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

  const projeYetkili = proje.yetkililer.length > 0;
  const projeBirimYetkili = proje.birimler.length > 0;

  // Proje yetkilisi olan veya birimi atanmış olan: tüm aksiyonlar (sistem rolü
  // izniyle birlikte action wrapper'da kontrol edilir, burada erişim katmanı).
  if (projeYetkili || projeBirimYetkili) return true;

  // Aşağıdan miras: sadece read için kabuk gösterilir (alt liste/kart bağı).
  return aksiyon === "proje:read" && proje.listeler.length > 0;
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
            select: { kullanici_id: true },
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

  const projeYetkili = liste.proje.yetkililer.length > 0;
  const projeBirimYetkili = liste.proje.birimler.length > 0;
  const listeDogruYetkili =
    liste.yetkililer.length > 0 || liste.birimler.length > 0;

  if (aksiyon === "liste:read") {
    return (
      projeYetkili ||
      projeBirimYetkili ||
      listeDogruYetkili ||
      liste.kartlar.length > 0
    );
  }

  // Mutasyonlar (create/edit/delete): proje-yetkili veya proje-birim veya
  // doğrudan liste-yetkili kullanıcı yapabilir. Sistem rolü izni ayrıca action
  // wrapper'da yetkiZorunlu ile kontrol edilir.
  return projeYetkili || projeBirimYetkili || listeDogruYetkili;
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
                select: { kullanici_id: true },
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

  const projeYetkili = kart.liste.proje.yetkililer.length > 0;
  const projeBirimYetkili = kart.liste.proje.birimler.length > 0;
  const listeDogruYetkili =
    kart.liste.yetkililer.length > 0 || kart.liste.birimler.length > 0;
  const kartDogruYetkili =
    kart.yetkililer.length > 0 || kart.birimler.length > 0;

  return (
    projeYetkili ||
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
