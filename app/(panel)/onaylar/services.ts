import { db } from "@/lib/db";
import { kullaniciIzinleriniAl } from "@/lib/permissions";
import type { BekleyenOnerileriListele } from "./schemas";

// ADR-0019/PR-3 — Bekleyen tamamlama önerileri (kart + madde).
// Yetkili kullanıcının erişim hakkı olan tüm projelerden bekleyen önerileri
// döner. Makam (SUPER_ADMIN/KAYMAKAM) tüm projeleri görür; diğer KART_TAMAMLA
// izinli kullanıcı sadece üye olduğu projeleri görür.

const VARSAYILAN_LIMIT = 50;

export type BekleyenKartOzeti = {
  id: string;
  baslik: string;
  liste_id: string;
  liste_ad: string;
  proje_id: string;
  proje_ad: string;
  tamamlanma_oneri_zamani: Date;
  oneren: { id: string; ad: string; soyad: string } | null;
  // Onay sırasında sert blok için frontend'in bilmesi gereken alan.
  madde_toplam: number;
  madde_tamamlanan: number;
};

export type BekleyenMaddeOzeti = {
  id: string;
  metin: string;
  kontrol_listesi_id: string;
  kontrol_listesi_ad: string;
  kart_id: string;
  kart_baslik: string;
  proje_id: string;
  proje_ad: string;
  tamamlanma_oneri_zamani: Date;
  oneren: { id: string; ad: string; soyad: string } | null;
};

export type BekleyenOnerilerSonuc<T> = {
  oğeler: T[];
  // Bir sonraki sayfa cursor'u; null = son sayfa.
  sonrakiCursor: { zaman: Date; id: string } | null;
};

// Kullanıcının erişim WHERE clause'unu üretir; makam atlar.
async function kullaniciKaynakErisimi(kullaniciId: string): Promise<{
  birimId: string | null;
  makam: boolean;
}> {
  const [k, izinler] = await Promise.all([
    db.kullanici.findUnique({
      where: { id: kullaniciId },
      select: { birim_id: true },
    }),
    kullaniciIzinleriniAl(kullaniciId),
  ]);
  return { birimId: k?.birim_id ?? null, makam: izinler.has("*") };
}

export async function bekleyenKartOnerileri(
  kullaniciId: string,
  girdi: BekleyenOnerileriListele,
): Promise<BekleyenOnerilerSonuc<BekleyenKartOzeti>> {
  const erisim = await kullaniciKaynakErisimi(kullaniciId);
  const limit = girdi.limit ?? VARSAYILAN_LIMIT;

  // Erişim filtresi — kart bazlı görünürlük (proje üyeliği, liste üyeliği,
  // kart üyeliği veya birim eşleşmesi). Makam'lar tümünü görür.
  const erisimWhere = erisim.makam
    ? {}
    : {
        OR: [
          {
            liste: {
              proje: {
                yetkililer: { some: { kullanici_id: kullaniciId } },
              },
            },
          },
          {
            liste: {
              yetkililer: { some: { kullanici_id: kullaniciId } },
            },
          },
          { yetkililer: { some: { kullanici_id: kullaniciId } } },
          ...(erisim.birimId
            ? [
                {
                  liste: {
                    proje: {
                      birimler: { some: { birim_id: erisim.birimId } },
                    },
                  },
                },
                {
                  liste: { birimler: { some: { birim_id: erisim.birimId } } },
                },
                {
                  birimler: { some: { birim_id: erisim.birimId } },
                },
              ]
            : []),
        ],
      };

  const cursor =
    girdi.cursorZaman && girdi.cursorId
      ? {
          OR: [
            { tamamlanma_oneri_zamani: { lt: girdi.cursorZaman } },
            {
              tamamlanma_oneri_zamani: girdi.cursorZaman,
              id: { lt: girdi.cursorId },
            },
          ],
        }
      : {};

  const kartlar = await db.kart.findMany({
    where: {
      tamamlanma_oneri_durumu: "BEKLIYOR",
      silindi_mi: false,
      arsiv_mi: false,
      ...(girdi.projeId ? { liste: { proje_id: girdi.projeId } } : {}),
      AND: [erisimWhere, cursor],
    },
    orderBy: [
      { tamamlanma_oneri_zamani: "desc" },
      { id: "desc" },
    ],
    take: limit + 1,
    select: {
      id: true,
      baslik: true,
      liste_id: true,
      tamamlanma_oneri_zamani: true,
      tamamlanma_oneren_id: true,
      liste: {
        select: {
          ad: true,
          proje: { select: { id: true, ad: true } },
        },
      },
      oneren: { select: { id: true, ad: true, soyad: true } },
      kontrol_listeleri: {
        select: {
          maddeler: { select: { tamamlandi_mi: true } },
        },
      },
    },
  });

  const fazla = kartlar.length > limit;
  const dilimli = fazla ? kartlar.slice(0, limit) : kartlar;
  const son = dilimli[dilimli.length - 1];
  const sonrakiCursor =
    fazla && son && son.tamamlanma_oneri_zamani
      ? { zaman: son.tamamlanma_oneri_zamani, id: son.id }
      : null;

  return {
    oğeler: dilimli.map((k) => {
      const tum = k.kontrol_listeleri.flatMap((kl) => kl.maddeler);
      return {
        id: k.id,
        baslik: k.baslik,
        liste_id: k.liste_id,
        liste_ad: k.liste.ad,
        proje_id: k.liste.proje.id,
        proje_ad: k.liste.proje.ad,
        // Server BEKLIYOR filtresi sonrası null gelmemesi gerekir; ama tip
        // Date | null olduğu için defansif fallback (asla tetiklenmemeli).
        tamamlanma_oneri_zamani: k.tamamlanma_oneri_zamani ?? new Date(),
        oneren: k.oneren ? { id: k.oneren.id, ad: k.oneren.ad, soyad: k.oneren.soyad } : null,
        madde_toplam: tum.length,
        madde_tamamlanan: tum.filter((m) => m.tamamlandi_mi).length,
      };
    }),
    sonrakiCursor,
  };
}

export async function bekleyenMaddeOnerileri(
  kullaniciId: string,
  girdi: BekleyenOnerileriListele,
): Promise<BekleyenOnerilerSonuc<BekleyenMaddeOzeti>> {
  const erisim = await kullaniciKaynakErisimi(kullaniciId);
  const limit = girdi.limit ?? VARSAYILAN_LIMIT;

  // Madde için erişim parent karta bakılır.
  const kartErisim = erisim.makam
    ? {}
    : {
        kontrol_listesi: {
          kart: {
            OR: [
              {
                liste: {
                  proje: {
                    yetkililer: { some: { kullanici_id: kullaniciId } },
                  },
                },
              },
              {
                liste: {
                  yetkililer: { some: { kullanici_id: kullaniciId } },
                },
              },
              { yetkililer: { some: { kullanici_id: kullaniciId } } },
              ...(erisim.birimId
                ? [
                    {
                      liste: {
                        proje: {
                          birimler: { some: { birim_id: erisim.birimId } },
                        },
                      },
                    },
                    {
                      liste: {
                        birimler: { some: { birim_id: erisim.birimId } },
                      },
                    },
                    { birimler: { some: { birim_id: erisim.birimId } } },
                  ]
                : []),
            ],
            silindi_mi: false,
          },
        },
      };

  const cursor =
    girdi.cursorZaman && girdi.cursorId
      ? {
          OR: [
            { tamamlanma_oneri_zamani: { lt: girdi.cursorZaman } },
            {
              tamamlanma_oneri_zamani: girdi.cursorZaman,
              id: { lt: girdi.cursorId },
            },
          ],
        }
      : {};

  const maddeler = await db.kontrolMaddesi.findMany({
    where: {
      tamamlanma_oneri_durumu: "BEKLIYOR",
      ...(girdi.projeId
        ? {
            kontrol_listesi: {
              kart: { liste: { proje_id: girdi.projeId } },
            },
          }
        : {}),
      AND: [kartErisim, cursor],
    },
    orderBy: [
      { tamamlanma_oneri_zamani: "desc" },
      { id: "desc" },
    ],
    take: limit + 1,
    select: {
      id: true,
      metin: true,
      kontrol_listesi_id: true,
      tamamlanma_oneri_zamani: true,
      kontrol_listesi: {
        select: {
          ad: true,
          kart_id: true,
          kart: {
            select: {
              baslik: true,
              liste: {
                select: {
                  proje: { select: { id: true, ad: true } },
                },
              },
            },
          },
        },
      },
      oneren: { select: { id: true, ad: true, soyad: true } },
    },
  });

  const fazla = maddeler.length > limit;
  const dilimli = fazla ? maddeler.slice(0, limit) : maddeler;
  const son = dilimli[dilimli.length - 1];
  const sonrakiCursor =
    fazla && son && son.tamamlanma_oneri_zamani
      ? { zaman: son.tamamlanma_oneri_zamani, id: son.id }
      : null;

  return {
    oğeler: dilimli.map((m) => ({
      id: m.id,
      metin: m.metin,
      kontrol_listesi_id: m.kontrol_listesi_id,
      kontrol_listesi_ad: m.kontrol_listesi.ad,
      kart_id: m.kontrol_listesi.kart_id,
      kart_baslik: m.kontrol_listesi.kart.baslik,
      proje_id: m.kontrol_listesi.kart.liste.proje.id,
      proje_ad: m.kontrol_listesi.kart.liste.proje.ad,
      tamamlanma_oneri_zamani: m.tamamlanma_oneri_zamani ?? new Date(),
      oneren: m.oneren ? { id: m.oneren.id, ad: m.oneren.ad, soyad: m.oneren.soyad } : null,
    })),
    sonrakiCursor,
  };
}

// Sidebar badge için sayım — SUM(kart) + SUM(madde) tek query iki count.
// Sayım hızlı ve sık çağrıldığı için ayrı endpoint; pagination yok.
export async function bekleyenOneriSayimi(
  kullaniciId: string,
): Promise<{ kart: number; madde: number }> {
  const erisim = await kullaniciKaynakErisimi(kullaniciId);

  // Erişim filtresi yine; ama sadece count olduğu için orderBy/select gereksiz.
  const kartErisimWhere = erisim.makam
    ? {}
    : {
        OR: [
          { liste: { proje: { yetkililer: { some: { kullanici_id: kullaniciId } } } } },
          { liste: { yetkililer: { some: { kullanici_id: kullaniciId } } } },
          { yetkililer: { some: { kullanici_id: kullaniciId } } },
          ...(erisim.birimId
            ? [
                {
                  liste: {
                    proje: { birimler: { some: { birim_id: erisim.birimId } } },
                  },
                },
                {
                  liste: { birimler: { some: { birim_id: erisim.birimId } } },
                },
                { birimler: { some: { birim_id: erisim.birimId } } },
              ]
            : []),
        ],
      };

  const [kart, madde] = await Promise.all([
    db.kart.count({
      where: {
        tamamlanma_oneri_durumu: "BEKLIYOR",
        silindi_mi: false,
        arsiv_mi: false,
        AND: [kartErisimWhere],
      },
    }),
    db.kontrolMaddesi.count({
      where: {
        tamamlanma_oneri_durumu: "BEKLIYOR",
        kontrol_listesi: {
          kart: {
            silindi_mi: false,
            AND: [kartErisimWhere],
          },
        },
      },
    }),
  ]);
  return { kart, madde };
}
