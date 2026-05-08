// Sprint 3 / S3-1 — Aktivite servisi parça dosyası: aktivite listeleme.
// ADR-0032 mega dosya bölmesi.
//
// İçerik:
//   - kartAktiviteleriniListele  — yan panel "Aktivite" sekmesi (cursor)
//   - projeAktiviteleriniListele — proje detay modalı (cursor)

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type {
  KartAktiviteleriListele,
  ProjeAktiviteleriListele,
} from "./schemas";
import {
  type AktiviteOzeti,
  KART_ID_ICEREN_TIPLER,
  kartiBulVeProjeAl,
} from "./services-ortak";
import { zenginlestirVeOzetle } from "./services-zenginlestir";

// =====================================================================
// Karta bağlı aktiviteleri çek
// =====================================================================

export async function kartAktiviteleriniListele(
  birimId: string,
  girdi: KartAktiviteleriListele,
): Promise<AktiviteOzeti[]> {
  await kartiBulVeProjeAl(birimId, girdi.kart_id);

  // KontrolMaddesi karta dolaylı bağlı (kontrol_listesi_id üzerinden) —
  // önce kart'ın kontrol listesi id'lerini topla.
  const klIds = await db.kontrolListesi.findMany({
    where: { kart_id: girdi.kart_id },
    select: { id: true },
  });
  const klIdler = klIds.map((k) => k.id);

  const cursorWhere: Prisma.AktiviteLoguWhereInput | null = girdi.cursor
    ? { id: { lt: BigInt(girdi.cursor) } }
    : null;

  const where: Prisma.AktiviteLoguWhereInput = {
    AND: [
      ...(cursorWhere ? [cursorWhere] : []),
      {
        OR: [
          // Kart kendisi
          { kaynak_tip: "Kart", kaynak_id: girdi.kart_id },
          // kart_id alanı içeren ilişki tabloları
          {
            kaynak_tip: { in: [...KART_ID_ICEREN_TIPLER] },
            OR: [
              { yeni_veri: { path: ["kart_id"], equals: girdi.kart_id } },
              { eski_veri: { path: ["kart_id"], equals: girdi.kart_id } },
            ],
          },
          // KontrolMaddesi — kart'ın kontrol listesi id'leriyle eşleş
          ...(klIdler.length > 0
            ? [
                {
                  kaynak_tip: "KontrolMaddesi",
                  OR: klIdler.flatMap((id) => [
                    {
                      yeni_veri: {
                        path: ["kontrol_listesi_id"],
                        equals: id,
                      } as Prisma.JsonNullableFilter<"AktiviteLogu">,
                    },
                    {
                      eski_veri: {
                        path: ["kontrol_listesi_id"],
                        equals: id,
                      } as Prisma.JsonNullableFilter<"AktiviteLogu">,
                    },
                  ]),
                } satisfies Prisma.AktiviteLoguWhereInput,
              ]
            : []),
        ],
      },
    ],
  };

  const ham = await db.aktiviteLogu.findMany({
    where,
    orderBy: { id: "desc" },
    // limit verilmezse karta bağlı tüm aktiviteler — yan panel sekmelerinde
    // gerçek sayım için tam liste çekilir; cursor ile sayfalama opsiyonel.
    ...(girdi.limit !== undefined ? { take: girdi.limit } : {}),
    select: {
      id: true,
      zaman: true,
      kullanici_id: true,
      islem: true,
      kaynak_tip: true,
      kaynak_id: true,
      yeni_veri: true,
      eski_veri: true,
      diff: true,
    },
  });

  return zenginlestirVeOzetle(ham);
}

// =====================================================================
// Proje aktiviteleri — proje altındaki TÜM kayıtların audit log'u
// =====================================================================
//
// Kapsam: Proje (kendisi), Liste, Kart, Yorum, Eklenti, KontrolListesi,
// KontrolMaddesi, KartEtiket, KartYetkilisi, KartBirimi, ProjeYetkilisi,
// ProjeBirimi, ListeYetkilisi, ListeBirimi, Etiket (tanım).
// "Proje detay sayfasında biri baktığında en küçük hareketi bile görmeli"
// gereksinimi (kullanıcı talebi 2026-05-06).

export async function projeAktiviteleriniListele(
  _birimId: string,
  girdi: ProjeAktiviteleriListele,
): Promise<AktiviteOzeti[]> {
  // Why: Proje silinmişse bile audit log okunabilmeli — sadece varlık
  // kontrolü yapıyoruz (yetki katmanı action'da yapılır).
  const proje = await db.proje.findUnique({
    where: { id: girdi.proje_id },
    select: { id: true },
  });
  if (!proje) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  // Proje altındaki tüm liste/kart/kontrol-listesi id'lerini topla.
  // Sıra önemli: önce listeler, sonra kartlar (liste_id'ye göre), sonra
  // kontrol listeleri (kart_id'ye göre).
  const listeler = await db.liste.findMany({
    where: { proje_id: girdi.proje_id },
    select: { id: true },
  });
  const listeIdler = listeler.map((l) => l.id);

  const kartlar =
    listeIdler.length > 0
      ? await db.kart.findMany({
          where: { liste_id: { in: listeIdler } },
          select: { id: true },
        })
      : [];
  const kartIdler = kartlar.map((k) => k.id);

  const kontrolListeleri =
    kartIdler.length > 0
      ? await db.kontrolListesi.findMany({
          where: { kart_id: { in: kartIdler } },
          select: { id: true },
        })
      : [];
  const klIdler = kontrolListeleri.map((kl) => kl.id);

  const cursorWhere: Prisma.AktiviteLoguWhereInput | null = girdi.cursor
    ? { id: { lt: BigInt(girdi.cursor) } }
    : null;

  const orKosullari: Prisma.AktiviteLoguWhereInput[] = [
    // Proje kendisi
    { kaynak_tip: "Proje", kaynak_id: girdi.proje_id },
    // Etiket (proje düzeyi tanımlar) — proje_id JSON path
    {
      kaynak_tip: "Etiket",
      OR: [
        { yeni_veri: { path: ["proje_id"], equals: girdi.proje_id } },
        { eski_veri: { path: ["proje_id"], equals: girdi.proje_id } },
      ],
    },
    // ProjeYetkilisi
    {
      kaynak_tip: "ProjeYetkilisi",
      OR: [
        { yeni_veri: { path: ["proje_id"], equals: girdi.proje_id } },
        { eski_veri: { path: ["proje_id"], equals: girdi.proje_id } },
      ],
    },
    // ProjeBirimi
    {
      kaynak_tip: "ProjeBirimi",
      OR: [
        { yeni_veri: { path: ["proje_id"], equals: girdi.proje_id } },
        { eski_veri: { path: ["proje_id"], equals: girdi.proje_id } },
      ],
    },
  ];

  if (listeIdler.length > 0) {
    orKosullari.push(
      { kaynak_tip: "Liste", kaynak_id: { in: listeIdler } },
      // ListeYetkilisi / ListeBirimi — liste_id JSON path
      {
        kaynak_tip: { in: ["ListeYetkilisi", "ListeBirimi"] },
        OR: listeIdler.flatMap((id) => [
          {
            yeni_veri: {
              path: ["liste_id"],
              equals: id,
            } as Prisma.JsonNullableFilter<"AktiviteLogu">,
          },
          {
            eski_veri: {
              path: ["liste_id"],
              equals: id,
            } as Prisma.JsonNullableFilter<"AktiviteLogu">,
          },
        ]),
      },
    );
  }

  if (kartIdler.length > 0) {
    orKosullari.push(
      { kaynak_tip: "Kart", kaynak_id: { in: kartIdler } },
      // kart_id alanı içeren ilişki tabloları
      {
        kaynak_tip: { in: [...KART_ID_ICEREN_TIPLER] },
        OR: kartIdler.flatMap((id) => [
          {
            yeni_veri: {
              path: ["kart_id"],
              equals: id,
            } as Prisma.JsonNullableFilter<"AktiviteLogu">,
          },
          {
            eski_veri: {
              path: ["kart_id"],
              equals: id,
            } as Prisma.JsonNullableFilter<"AktiviteLogu">,
          },
        ]),
      },
    );
  }

  if (klIdler.length > 0) {
    orKosullari.push({
      kaynak_tip: "KontrolMaddesi",
      OR: klIdler.flatMap((id) => [
        {
          yeni_veri: {
            path: ["kontrol_listesi_id"],
            equals: id,
          } as Prisma.JsonNullableFilter<"AktiviteLogu">,
        },
        {
          eski_veri: {
            path: ["kontrol_listesi_id"],
            equals: id,
          } as Prisma.JsonNullableFilter<"AktiviteLogu">,
        },
      ]),
    });
  }

  const where: Prisma.AktiviteLoguWhereInput = {
    AND: [...(cursorWhere ? [cursorWhere] : []), { OR: orKosullari }],
  };

  const limit = girdi.limit ?? 200;
  const ham = await db.aktiviteLogu.findMany({
    where,
    orderBy: { id: "desc" },
    take: limit,
    select: {
      id: true,
      zaman: true,
      kullanici_id: true,
      islem: true,
      kaynak_tip: true,
      kaynak_id: true,
      yeni_veri: true,
      eski_veri: true,
      diff: true,
    },
  });

  return zenginlestirVeOzetle(ham);
}
