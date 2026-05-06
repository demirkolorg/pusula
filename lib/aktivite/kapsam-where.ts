import type { Prisma } from "@prisma/client";
import type { AktiviteKapsamFiltresi } from "./tipler";

const KART_ID_ICEREN_TIPLER = [
  "Yorum",
  "Eklenti",
  "KontrolListesi",
  "KartBirimi",
  "KartYetkilisi",
  "KartEtiket",
] as const;

function jsonEslesme(
  alan: string,
  idler: readonly string[],
): Prisma.AktiviteLoguWhereInput[] {
  if (idler.length === 0) return [];
  return idler.flatMap((id) => [
    {
      yeni_veri: {
        path: [alan],
        equals: id,
      },
    },
    {
      eski_veri: {
        path: [alan],
        equals: id,
      },
    },
  ]);
}

export function kapsamWhere(
  baglam: AktiviteKapsamFiltresi,
): Prisma.AktiviteLoguWhereInput {
  if (baglam.makam) return {};

  const or: Prisma.AktiviteLoguWhereInput[] = [
    { kullanici_id: baglam.kullaniciId },
  ];

  const projeIdleri = baglam.projeIdleri ?? [];
  const listeIdleri = baglam.listeIdleri ?? [];
  const kartIdleri = baglam.kartIdleri ?? [];
  const kontrolListesiIdleri = baglam.kontrolListesiIdleri ?? [];

  if (projeIdleri.length > 0) {
    or.push(
      { kaynak_tip: "Proje", kaynak_id: { in: projeIdleri } },
      {
        kaynak_tip: { in: ["Etiket", "ProjeYetkilisi", "ProjeBirimi"] },
        OR: jsonEslesme("proje_id", projeIdleri),
      },
    );
  }

  if (listeIdleri.length > 0) {
    or.push(
      { kaynak_tip: "Liste", kaynak_id: { in: listeIdleri } },
      {
        kaynak_tip: { in: ["ListeYetkilisi", "ListeBirimi"] },
        OR: jsonEslesme("liste_id", listeIdleri),
      },
    );
  }

  if (kartIdleri.length > 0) {
    or.push(
      { kaynak_tip: "Kart", kaynak_id: { in: kartIdleri } },
      {
        kaynak_tip: { in: [...KART_ID_ICEREN_TIPLER] },
        OR: jsonEslesme("kart_id", kartIdleri),
      },
    );
  }

  if (kontrolListesiIdleri.length > 0) {
    or.push({
      kaynak_tip: "KontrolMaddesi",
      OR: jsonEslesme("kontrol_listesi_id", kontrolListesiIdleri),
    });
  }

  return { OR: or };
}
