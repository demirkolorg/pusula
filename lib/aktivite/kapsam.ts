import { db } from "@/lib/db";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import type { AktiviteKapsamFiltresi } from "./tipler";
export { kapsamWhere, kaynakBaglamiWhere } from "./kapsam-where";

function inKosulu(idler: readonly string[]): { in: string[] } | undefined {
  return idler.length > 0 ? { in: [...idler] } : undefined;
}

export async function kapsamBaglamiHazirla(
  kullaniciId: string,
): Promise<AktiviteKapsamFiltresi> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (erisim.makam) {
    return {
      kullaniciId,
      makam: true,
      projeIdleri: null,
      listeIdleri: null,
      kartIdleri: null,
      kontrolListesiIdleri: null,
    };
  }

  const birimKosulu = erisim.birimId
    ? { birim_id: erisim.birimId }
    : { birim_id: { in: [] } };

  const projeler = await db.proje.findMany({
    where: {
      silindi_mi: false,
      OR: [
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        { birimler: { some: birimKosulu } },
        {
          listeler: {
            some: { yetkililer: { some: { kullanici_id: kullaniciId } } },
          },
        },
        { listeler: { some: { birimler: { some: birimKosulu } } } },
        {
          listeler: {
            some: {
              kartlar: {
                some: { yetkililer: { some: { kullanici_id: kullaniciId } } },
              },
            },
          },
        },
        {
          listeler: {
            some: { kartlar: { some: { birimler: { some: birimKosulu } } } },
          },
        },
      ],
    },
    select: { id: true },
  });
  const projeIdleri = projeler.map((p) => p.id);

  const listeler = await db.liste.findMany({
    where: {
      OR: [
        { proje_id: inKosulu(projeIdleri) },
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        { birimler: { some: birimKosulu } },
      ],
    },
    select: { id: true },
  });
  const listeIdleri = listeler.map((l) => l.id);

  const kartlar = await db.kart.findMany({
    where: {
      silindi_mi: false,
      OR: [
        { liste_id: inKosulu(listeIdleri) },
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        { birimler: { some: birimKosulu } },
      ],
    },
    select: { id: true },
  });
  const kartIdleri = kartlar.map((k) => k.id);

  const kontrolListeleri =
    kartIdleri.length > 0
      ? await db.kontrolListesi.findMany({
          where: { kart_id: { in: kartIdleri } },
          select: { id: true },
        })
      : [];

  return {
    kullaniciId,
    makam: false,
    projeIdleri,
    listeIdleri,
    kartIdleri,
    kontrolListesiIdleri: kontrolListeleri.map((k) => k.id),
  };
}
