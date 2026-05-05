import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kapakEtiketi } from "@/lib/kapak-renk";
import type {
  KartAktiviteleriListele,
  ProjeAktiviteleriListele,
} from "./schemas";

// =====================================================================
// Tipler
// =====================================================================

export type AlanDegisikligi = {
  // TR alan etiketi — örn "Başlık", "Bitiş tarihi", "Liste"
  alan: string;
  // Format'lanmış eski/yeni değer (Date → "04.05.2026 14:30", null → "—",
  // boolean → "Evet"/"Hayır", id → join'lenmiş ad). Uzun metin kısaltılmış.
  eski: string | null;
  yeni: string | null;
};

export type AktiviteOzeti = {
  id: string; // BigInt → string (JSON safe)
  zaman: Date;
  kullanici: { id: string; ad: string; soyad: string } | null;
  kategori:
    | "proje"
    | "liste"
    | "kart"
    | "etiket"
    | "yetkili"
    | "kontrol-listesi"
    | "kontrol-maddesi"
    | "yorum"
    | "eklenti"
    | "hedef-birim"
    | "diger";
  islem: "CREATE" | "UPDATE" | "DELETE";
  // TR-formatlı ana mesaj — örn "kart başlığını değiştirdi"
  mesaj: string;
  // Opsiyonel ikincil bilgi (ad, eski/yeni değer kısa özeti)
  detay: string | null;
  // Kaynak modelin id'si — composite PK olan tablolarda null
  // (KartEtiket, KartYetkilisi, KartBirimi). Tümü sekmesinde inline yorum/ek
  // eşleştirmesi için kullanılır.
  kaynak_id: string | null;
  // UPDATE event'lerinde alan-bazlı diff (eski → yeni). UI 2. satırda gösterir.
  // Anlamsız alanlar (sira, guncelleme_zamani, silindi_mi, arsiv_mi vb.)
  // ana mesajda ifade edildiği için listede yer almaz.
  degisiklikler: AlanDegisikligi[] | null;
};

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: { select: { proje_id: true } },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}

// =====================================================================
// Karta bağlı aktiviteleri çek
// =====================================================================

// Karta dolaylı bağlı kayıtların kaynak_tip'leri.
// JSON içinde "kart_id" alanı bulunan modeller — audit middleware
// yeni_veri/eski_veri'yı select sonucundan alır, bu modellerin tümü
// services.ts'lerde kart_id include ediyor (bkz. yorum/eklenti/etiket
// services).
const KART_ID_ICEREN_TIPLER = [
  "Yorum",
  "Eklenti",
  "KontrolListesi",
  "KartBirimi",
  "KartYetkilisi",
  "KartEtiket",
] as const;

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

// Ortak: ham aktivitelerden id setlerini topla, join'le ve özetle.
// kart + proje servisleri arasında DRY kazanımı (id toplama + map kurulum
// pattern'i tek noktada).
async function zenginlestirVeOzetle(
  ham: Array<{
    id: bigint;
    zaman: Date;
    kullanici_id: string | null;
    islem: string;
    kaynak_tip: string;
    kaynak_id: string | null;
    yeni_veri: unknown;
    eski_veri: unknown;
    diff: unknown;
  }>,
): Promise<AktiviteOzeti[]> {
  const kullaniciIdler = Array.from(
    new Set(ham.map((a) => a.kullanici_id).filter((x): x is string => !!x)),
  );
  const kullanicilar = kullaniciIdler.length
    ? await db.kullanici.findMany({
        where: { id: { in: kullaniciIdler } },
        select: { id: true, ad: true, soyad: true },
      })
    : [];
  const kullaniciMap = new Map(kullanicilar.map((k) => [k.id, k]));

  const etiketIdler = new Set<string>();
  const atananIdler = new Set<string>();
  const birimIdler = new Set<string>();
  const listeIdler = new Set<string>();
  const eklentiIdler = new Set<string>();
  for (const a of ham) {
    if (a.kaynak_tip === "KartEtiket") {
      const ePost = (a.yeni_veri as { etiket_id?: string } | null)?.etiket_id;
      const ePre = (a.eski_veri as { etiket_id?: string } | null)?.etiket_id;
      if (ePost) etiketIdler.add(ePost);
      if (ePre) etiketIdler.add(ePre);
    }
    if (
      a.kaynak_tip === "KartYetkilisi" ||
      a.kaynak_tip === "ProjeYetkilisi" ||
      a.kaynak_tip === "ListeYetkilisi"
    ) {
      const uPost = (a.yeni_veri as { kullanici_id?: string } | null)
        ?.kullanici_id;
      const uPre = (a.eski_veri as { kullanici_id?: string } | null)
        ?.kullanici_id;
      if (uPost) atananIdler.add(uPost);
      if (uPre) atananIdler.add(uPre);
    }
    if (
      a.kaynak_tip === "KartBirimi" ||
      a.kaynak_tip === "ProjeBirimi" ||
      a.kaynak_tip === "ListeBirimi"
    ) {
      const kPost = (a.yeni_veri as { birim_id?: string } | null)?.birim_id;
      const kPre = (a.eski_veri as { birim_id?: string } | null)?.birim_id;
      if (kPost) birimIdler.add(kPost);
      if (kPre) birimIdler.add(kPre);
    }
    const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
    if (diff) {
      const idAlan = (k: string, set: Set<string>) => {
        const e = diff[k]?.eski;
        const y = diff[k]?.yeni;
        if (typeof e === "string") set.add(e);
        if (typeof y === "string") set.add(y);
      };
      idAlan("liste_id", listeIdler);
      idAlan("atanan_id", atananIdler);
      idAlan("tamamlayan_id", atananIdler);
      idAlan("kapak_dosya_id", eklentiIdler);
    }
  }

  const [etiketler, atananlar, birimler, listeler, eklentiAdlar] =
    await Promise.all([
      etiketIdler.size > 0
        ? db.etiket.findMany({
            where: { id: { in: Array.from(etiketIdler) } },
            select: { id: true, ad: true, renk: true },
          })
        : Promise.resolve([]),
      atananIdler.size > 0
        ? db.kullanici.findMany({
            where: { id: { in: Array.from(atananIdler) } },
            select: { id: true, ad: true, soyad: true },
          })
        : Promise.resolve([]),
      birimIdler.size > 0
        ? db.birim.findMany({
            where: { id: { in: Array.from(birimIdler) } },
            select: { id: true, ad: true, kisa_ad: true, tip: true },
          })
        : Promise.resolve([]),
      listeIdler.size > 0
        ? db.liste.findMany({
            where: { id: { in: Array.from(listeIdler) } },
            select: { id: true, ad: true },
          })
        : Promise.resolve([]),
      eklentiIdler.size > 0
        ? db.eklenti.findMany({
            where: { id: { in: Array.from(eklentiIdler) } },
            select: { id: true, ad: true },
          })
        : Promise.resolve([]),
    ]);

  const etiketMap = new Map(etiketler.map((e) => [e.id, e]));
  const atananMap = new Map(atananlar.map((u) => [u.id, u]));
  const birimMap = new Map(
    birimler.map((k) => [k.id, birimGoruntu(k)] as const),
  );
  const listeMap = new Map(listeler.map((l) => [l.id, l.ad] as const));
  const eklentiAdMap = new Map(
    eklentiAdlar.map((e) => [e.id, e.ad] as const),
  );

  const idMaplar: IdMaplar = {
    liste: listeMap,
    kullanici: new Map(atananlar.map((u) => [u.id, `${u.ad} ${u.soyad}`])),
    eklenti: eklentiAdMap,
    birim: birimMap,
  };

  return ham.map((a) =>
    aktiviteOzetle(a, kullaniciMap, etiketMap, atananMap, birimMap, idMaplar),
  );
}

type IdMaplar = {
  liste: Map<string, string>;
  kullanici: Map<string, string>;
  eklenti: Map<string, string>;
  birim: Map<string, string>;
};

function birimGoruntu(k: {
  ad: string | null;
  kisa_ad: string | null;
  tip: string;
}): string {
  return k.kisa_ad ?? k.ad ?? k.tip;
}

// =====================================================================
// TR mesaj üretici — kaynak_tip + islem → kullanıcıya gösterilen metin
// =====================================================================

type HamAktivite = {
  id: bigint;
  zaman: Date;
  kullanici_id: string | null;
  islem: string;
  kaynak_tip: string;
  kaynak_id: string | null;
  yeni_veri: unknown;
  eski_veri: unknown;
  diff: unknown;
};

// Why: silindi_mi/arsiv_mi diff'in başında özel mesajlara ayrıştırılır
// (çöp kutusuna taşıdı / geri yükledi / arşivledi / arşivden çıkardı), bu
// yüzden bu eşlemenin içinde yer almazlar — aksi halde generic "değiştirdi"
// fallback'ine düşme riski olur.
const KART_ALAN_ETIKETI: Record<string, string> = {
  baslik: "kartın başlığı",
  aciklama: "kartın açıklaması",
  bitis: "kartın bitiş tarihi",
  baslangic: "kartın başlangıç tarihi",
  kapak_renk: "kartın kapak rengi",
  kapak_dosya_id: "kartın kapak görseli",
};

function jsonAlan<T = unknown>(j: unknown, alan: string): T | undefined {
  if (j && typeof j === "object" && alan in j) {
    return (j as Record<string, T>)[alan];
  }
  return undefined;
}

function aktiviteOzetle(
  a: HamAktivite,
  kullaniciMap: Map<string, { id: string; ad: string; soyad: string }>,
  etiketMap: Map<string, { id: string; ad: string; renk: string }>,
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
  birimMap: Map<string, string>,
  idMaplar: IdMaplar,
): AktiviteOzeti {
  const islem = (a.islem === "CREATE" || a.islem === "UPDATE" || a.islem === "DELETE"
    ? a.islem
    : "UPDATE") as AktiviteOzeti["islem"];

  const kullanici = a.kullanici_id
    ? kullaniciMap.get(a.kullanici_id) ?? null
    : null;

  const degisiklikler =
    islem === "UPDATE" ? degisiklikleriHazirla(a, idMaplar) : null;

  const ortak = {
    id: a.id.toString(),
    zaman: a.zaman,
    kullanici,
    islem,
    kaynak_id: a.kaynak_id,
    degisiklikler,
  };

  switch (a.kaynak_tip) {
    case "Proje":
      return { ...ortak, ...projeMesaji(a, islem) };
    case "Liste":
      return { ...ortak, ...listeMesaji(a, islem) };
    case "Kart":
      return { ...ortak, ...kartMesaji(a, islem) };
    case "Yorum":
      return { ...ortak, ...yorumMesaji(a, islem) };
    case "Eklenti":
      return { ...ortak, ...eklentiMesaji(a, islem) };
    case "KontrolListesi":
      return { ...ortak, ...kontrolListesiMesaji(a, islem) };
    case "KontrolMaddesi":
      return { ...ortak, ...kontrolMaddesiMesaji(a, islem) };
    case "KartEtiket":
      return { ...ortak, ...kartEtiketMesaji(a, islem, etiketMap) };
    case "KartYetkilisi":
      return { ...ortak, ...kartYetkilisiMesaji(a, islem, atananMap) };
    case "KartBirimi":
      return { ...ortak, ...hedefBirimMesaji(a, islem, birimMap) };
    case "Etiket":
      return { ...ortak, ...etiketTanimMesaji(a, islem) };
    case "ProjeYetkilisi":
      return { ...ortak, ...projeYetkilisiMesaji(a, islem, atananMap) };
    case "ProjeBirimi":
      return { ...ortak, ...projeBirimiMesaji(a, islem, birimMap) };
    case "ListeYetkilisi":
      return { ...ortak, ...listeYetkilisiMesaji(a, islem, atananMap) };
    case "ListeBirimi":
      return { ...ortak, ...listeBirimiMesaji(a, islem, birimMap) };
    default:
      return {
        ...ortak,
        kategori: "diger",
        mesaj: `${a.kaynak_tip} kaydını ${islemAdi(islem)}`,
        detay: null,
      };
  }
}

function islemAdi(i: "CREATE" | "UPDATE" | "DELETE"): string {
  return i === "CREATE" ? "ekledi" : i === "UPDATE" ? "güncelledi" : "sildi";
}

// Proje kendisinin CRUD'u — proje aktivite logu kapsamında.
function projeMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "proje", mesaj: "projeyi oluşturdu", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "proje", mesaj: "projeyi sildi", detay: ad };
  }
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  if (diff?.silindi_mi) {
    const yeni = diff.silindi_mi.yeni;
    return {
      kategori: "proje",
      mesaj: yeni ? "projeyi çöp kutusuna taşıdı" : "projeyi geri yükledi",
      detay: ad,
    };
  }
  if (diff === null && yeniSilindi === true) {
    return { kategori: "proje", mesaj: "projeyi çöp kutusuna taşıdı", detay: ad };
  }
  if (diff?.arsiv_mi) {
    const yeni = diff.arsiv_mi.yeni;
    return {
      kategori: "proje",
      mesaj: yeni ? "projeyi arşivledi" : "projeyi arşivden çıkardı",
      detay: ad,
    };
  }
  if (diff === null && yeniArsiv === true) {
    return { kategori: "proje", mesaj: "projeyi arşivledi", detay: ad };
  }
  if (diff?.ad) {
    return { kategori: "proje", mesaj: "projenin adını değiştirdi", detay: ad };
  }
  if (diff?.aciklama) {
    return { kategori: "proje", mesaj: "projenin açıklamasını değiştirdi", detay: ad };
  }
  if (diff?.yildiz_mi) {
    const yeni = diff.yildiz_mi.yeni;
    return {
      kategori: "proje",
      mesaj: yeni ? "projeyi yıldızladı" : "projenin yıldızını kaldırdı",
      detay: ad,
    };
  }
  if (diff?.kapak_renk || diff?.simge) {
    return { kategori: "proje", mesaj: "projenin görünümünü değiştirdi", detay: ad };
  }
  return { kategori: "proje", mesaj: "projeyi güncelledi", detay: ad };
}

// Liste — proje altındaki kanban listesi.
function listeMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "liste", mesaj: "liste ekledi", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "liste", mesaj: "listeyi sildi", detay: ad };
  }
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  if (diff?.silindi_mi) {
    const yeni = diff.silindi_mi.yeni;
    return {
      kategori: "liste",
      mesaj: yeni ? "listeyi çöp kutusuna taşıdı" : "listeyi geri yükledi",
      detay: ad,
    };
  }
  if (diff === null && yeniSilindi === true) {
    return { kategori: "liste", mesaj: "listeyi çöp kutusuna taşıdı", detay: ad };
  }
  if (diff?.arsiv_mi) {
    const yeni = diff.arsiv_mi.yeni;
    return {
      kategori: "liste",
      mesaj: yeni ? "listeyi arşivledi" : "listeyi arşivden çıkardı",
      detay: ad,
    };
  }
  if (diff === null && yeniArsiv === true) {
    return { kategori: "liste", mesaj: "listeyi arşivledi", detay: ad };
  }
  // Sıra-only güncelleme — drag-drop gürültüsünü temiz mesaja çevir.
  const alanlar = diff ? Object.keys(diff) : [];
  const yardimciAlanlar = new Set(["sira", "guncelleme_zamani"]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return { kategori: "liste", mesaj: "listeyi yeniden sıraladı", detay: ad };
    }
  }
  if (diff?.ad) {
    return { kategori: "liste", mesaj: "listenin adını değiştirdi", detay: ad };
  }
  return { kategori: "liste", mesaj: "listeyi güncelledi", detay: ad };
}

// Etiket tanımı (proje düzeyi) — KartEtiket'ten farklı, etiket havuzu CRUD.
function etiketTanimMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "etiket", mesaj: "etiket tanımı ekledi", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "etiket", mesaj: "etiket tanımını sildi", detay: ad };
  }
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  if (diff?.ad) {
    return { kategori: "etiket", mesaj: "etiketin adını değiştirdi", detay: ad };
  }
  if (diff?.renk) {
    return { kategori: "etiket", mesaj: "etiketin rengini değiştirdi", detay: ad };
  }
  return { kategori: "etiket", mesaj: "etiketi güncelledi", detay: ad };
}

// Proje yetkilisi (kullanıcı) — KartYetkilisi'yle aynı görsel kategori.
function projeYetkilisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kullanici_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kullanici_id");
  const uId = yeniId ?? eskiId ?? null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "yetkili", mesaj: "projeye kullanıcı yetkilisi ekledi", detay: ad };
  }
  return { kategori: "yetkili", mesaj: "projeden kullanıcı yetkilisini kaldırdı", detay: ad };
}

// Proje birimi — KartBirimi'yle aynı görsel kategori (hedef-birim).
function projeBirimiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  birimMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "birim_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "birim_id");
  const birimId = yeniId ?? eskiId ?? null;
  const ad = birimId ? birimMap.get(birimId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "hedef-birim", mesaj: "projeye birim yetkilisi ekledi", detay: ad };
  }
  return { kategori: "hedef-birim", mesaj: "projeden birim yetkilisini kaldırdı", detay: ad };
}

// Liste yetkilisi (kullanıcı).
function listeYetkilisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kullanici_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kullanici_id");
  const uId = yeniId ?? eskiId ?? null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "yetkili", mesaj: "listeye kullanıcı yetkilisi ekledi", detay: ad };
  }
  return { kategori: "yetkili", mesaj: "listeden kullanıcı yetkilisini kaldırdı", detay: ad };
}

// Liste birimi.
function listeBirimiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  birimMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "birim_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "birim_id");
  const birimId = yeniId ?? eskiId ?? null;
  const ad = birimId ? birimMap.get(birimId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "hedef-birim", mesaj: "listeye birim yetkilisi ekledi", detay: ad };
  }
  return { kategori: "hedef-birim", mesaj: "listeden birim yetkilisini kaldırdı", detay: ad };
}

function kartMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    return {
      kategori: "kart",
      mesaj: "kartı oluşturdu",
      detay: jsonAlan<string>(a.yeni_veri, "baslik") ?? null,
    };
  }
  if (islem === "DELETE") {
    return {
      kategori: "kart",
      mesaj: "kartı sildi",
      detay: jsonAlan<string>(a.eski_veri, "baslik") ?? null,
    };
  }
  // UPDATE — diff'e bak, hangi alan değişti
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  // Why: silme/geri yükleme mesajı eski VE yeni değerin birlikte değiştiğini
  // gerektirir. Diff varsa dümdüz oradan oku. Diff yoksa (audit middleware
  // findUnique başarısızlığı, vb.) son çare olarak yeni_veri.silindi_mi=true
  // tek yönlü "silme" tespitine izin ver — `silindi_mi: false` her kartın
  // varsayılan alan değeri olduğundan bu durumdan "geri yükledi" SONUCU
  // ÇIKARILAMAZ ve bu savunma yola uygulanmaz (yanlış pozitif yaratır).
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  const yeniTamam = jsonAlan<boolean>(a.yeni_veri, "tamamlandi_mi");
  if (diff?.silindi_mi) {
    const yeni = diff.silindi_mi.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı çöp kutusuna taşıdı" : "kartı geri yükledi",
      detay: null,
    };
  }
  if (diff === null && yeniSilindi === true) {
    return { kategori: "kart", mesaj: "kartı çöp kutusuna taşıdı", detay: null };
  }
  if (diff?.arsiv_mi) {
    const yeni = diff.arsiv_mi.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı arşivledi" : "kartı arşivden çıkardı",
      detay: null,
    };
  }
  if (diff === null && yeniArsiv === true) {
    return { kategori: "kart", mesaj: "kartı arşivledi", detay: null };
  }
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı tamamladı" : "kartı tekrar açtı",
      detay: null,
    };
  }
  if (diff === null && yeniTamam === true) {
    return { kategori: "kart", mesaj: "kartı tamamladı", detay: null };
  }
  if (!diff) {
    return { kategori: "kart", mesaj: "kartı güncelledi", detay: null };
  }
  const alanlar = Object.keys(diff);
  if (alanlar.includes("liste_id")) {
    return { kategori: "kart", mesaj: "kartı taşıdı", detay: null };
  }
  // Sıra-only güncelleme — drag-drop gürültüsünü temiz mesaja çevir.
  // tamamlanma_zamani / tamamlayan_id, tamamlandi_mi yan etkisi olarak
  // yazılır — diff'te kalsa bile yardımcı kabul edilir.
  const yardimciAlanlar = new Set([
    "sira",
    "guncelleme_zamani",
    "tamamlanma_zamani",
    "tamamlayan_id",
  ]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return { kategori: "kart", mesaj: "kartı yeniden sıraladı", detay: null };
    }
  }
  // KART_ALAN_ETIKETI'nde tanımlı ilk anlamlı alanı seç. null → değer / değer →
  // null geçişi anlamsal olarak ekleme/kaldırma; daha açık mesaj üret.
  // noUncheckedIndexedAccess: lookup `string | undefined` döndürür → null guard.
  for (const alan of alanlar) {
    const etiket = KART_ALAN_ETIKETI[alan];
    if (!etiket) continue;
    const eski = diff[alan]?.eski;
    const yeni = diff[alan]?.yeni;
    const eskiBos = eski === null || eski === undefined || eski === "";
    const yeniBos = yeni === null || yeni === undefined || yeni === "";
    if (eskiBos && !yeniBos) {
      return { kategori: "kart", mesaj: `${etiket} ekledi`, detay: null };
    }
    if (!eskiBos && yeniBos) {
      return { kategori: "kart", mesaj: `${etiket} kaldırdı`, detay: null };
    }
    return { kategori: "kart", mesaj: `${etiket} değiştirdi`, detay: null };
  }
  return { kategori: "kart", mesaj: "kartı güncelledi", detay: null };
}

function yorumMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    const ic = jsonAlan<string>(a.yeni_veri, "icerik") ?? "";
    return { kategori: "yorum", mesaj: "yorum yazdı", detay: kisalt(ic, 80) };
  }
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  // Yorum tek yönlü silinir — UI'da geri yükleme yok, bu yüzden silindi_mi
  // değişikliği = silme. Diff null savunması da yeni_veri'den tespit eder.
  if (diff?.silindi_mi?.yeni === true) {
    return { kategori: "yorum", mesaj: "yorumunu sildi", detay: null };
  }
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  if (diff === null && yeniSilindi === true) {
    return { kategori: "yorum", mesaj: "yorumunu sildi", detay: null };
  }
  if (diff?.icerik) {
    return { kategori: "yorum", mesaj: "yorumunu düzenledi", detay: null };
  }
  if (islem === "DELETE") {
    return { kategori: "yorum", mesaj: "yorumunu sildi", detay: null };
  }
  return { kategori: "yorum", mesaj: "yorumunu güncelledi", detay: null };
}

function eklentiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    return {
      kategori: "eklenti",
      mesaj: "dosya yükledi",
      detay: jsonAlan<string>(a.yeni_veri, "ad") ?? null,
    };
  }
  // soft delete — diff varsa ondan, yoksa yeni_veri'den tespit et (savunma)
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  if (
    diff?.silindi_mi?.yeni === true ||
    islem === "DELETE" ||
    (diff === null && yeniSilindi === true)
  ) {
    return {
      kategori: "eklenti",
      mesaj: "dosyayı sildi",
      detay:
        jsonAlan<string>(a.eski_veri, "ad") ??
        jsonAlan<string>(a.yeni_veri, "ad") ??
        null,
    };
  }
  // Rename — yeni "dosya yeniden adlandır" özelliği eklendiğinde tetiklenir.
  if (diff?.ad) {
    return {
      kategori: "eklenti",
      mesaj: "dosyanın adını değiştirdi",
      detay: jsonAlan<string>(a.yeni_veri, "ad") ?? null,
    };
  }
  return { kategori: "eklenti", mesaj: "dosyayı güncelledi", detay: null };
}

function kontrolListesiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "kontrol-listesi", mesaj: "kontrol listesi ekledi", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "kontrol-listesi", mesaj: "kontrol listesini sildi", detay: ad };
  }
  // Why: drag-drop sıralama her hareket için audit UPDATE üretir; "düzenledi"
  // mesajı yanıltıcı. Sıra-only diff ayrı mesaj alır; tamamlanma /
  // ad değişikliği için ayrı spesifik mesajlar.
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  const yeniTamam = jsonAlan<boolean>(a.yeni_veri, "tamamlandi_mi");
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni;
    return {
      kategori: "kontrol-listesi",
      mesaj: yeni ? "kontrol listesini tamamladı" : "kontrol listesini tekrar açtı",
      detay: ad,
    };
  }
  if (diff === null && yeniTamam === true) {
    return { kategori: "kontrol-listesi", mesaj: "kontrol listesini tamamladı", detay: ad };
  }
  const alanlar = diff ? Object.keys(diff) : [];
  const yardimciAlanlar = new Set([
    "sira",
    "guncelleme_zamani",
    "tamamlanma_zamani",
    "tamamlayan_id",
  ]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return { kategori: "kontrol-listesi", mesaj: "kontrol listesini yeniden sıraladı", detay: ad };
    }
  }
  if (diff?.ad) {
    return { kategori: "kontrol-listesi", mesaj: "kontrol listesinin adını değiştirdi", detay: ad };
  }
  return { kategori: "kontrol-listesi", mesaj: "kontrol listesini düzenledi", detay: ad };
}

function kontrolMaddesiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const metin =
    jsonAlan<string>(a.yeni_veri, "metin") ??
    jsonAlan<string>(a.eski_veri, "metin") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesi ekledi", detay: metin };
  }
  if (islem === "DELETE") {
    return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesini sildi", detay: metin };
  }
  // UPDATE — tamamlandi_mi'ye özel mesaj (en güçlü sinyal, önce gelir)
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni === true;
    return {
      kategori: "kontrol-maddesi",
      mesaj: yeni ? "kontrol maddesini tamamladı" : "kontrol maddesini geri açtı",
      detay: metin,
    };
  }
  // Why: drag-drop ile sıra her hareketinde UPDATE üretir; "güncelledi" mesajı
  // yanıltıcı. Sıra-only diff için ayrı mesaj.
  const alanlar = diff ? Object.keys(diff) : [];
  const yardimciAlanlar = new Set(["sira", "guncelleme_zamani", "tamamlama_zamani", "tamamlayan_id"]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesini yeniden sıraladı", detay: metin };
    }
  }
  if (diff?.metin) {
    return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesinin metnini değiştirdi", detay: metin };
  }
  if (diff?.atanan_id) {
    const yeni = diff.atanan_id.yeni;
    if (yeni === null || yeni === undefined) {
      return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesinin sorumlusunu kaldırdı", detay: metin };
    }
    return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesinin sorumlusunu değiştirdi", detay: metin };
  }
  if (diff?.bitis) {
    const yeni = diff.bitis.yeni;
    if (yeni === null || yeni === undefined) {
      return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesinin bitiş tarihini kaldırdı", detay: metin };
    }
    return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesinin bitiş tarihini değiştirdi", detay: metin };
  }
  return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesini güncelledi", detay: metin };
}

// Why: Composite-PK ilişki tablolarında (KartYetkilisi/KartEtiket/KartBirimi)
// idempotent ekleme için `upsert` kullanılıyor. Audit middleware geçmişte
// upsert'i UPDATE olarak loglardı; bu yüzden yeni ekleme bile "kaldırıldı"
// görünüyordu. Bu fonksiyonlar artık islem yerine veri varlığına bakar:
// yeni_veri'de kayıt id'si varsa ekleme, yalnız eski_veri'de varsa kaldırma.
// Audit middleware artık doğru CREATE yazıyor (lib/audit-middleware.ts), ama
// bu kontrol geçmiş yanlış kayıtları da otomatik düzeltir.
function kartEtiketMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  etiketMap: Map<string, { id: string; ad: string; renk: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "etiket_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "etiket_id");
  const etiketId = yeniId ?? eskiId ?? null;
  const ad = etiketId ? etiketMap.get(etiketId)?.ad ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "etiket", mesaj: "etiket ekledi", detay: ad };
  }
  return { kategori: "etiket", mesaj: "etiketi kaldırdı", detay: ad };
}

function kartYetkilisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kullanici_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kullanici_id");
  const uId = yeniId ?? eskiId ?? null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "yetkili", mesaj: "yetki verdi", detay: ad };
  }
  return { kategori: "yetkili", mesaj: "yetkiyi kaldırdı", detay: ad };
}

function hedefBirimMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  birimMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "birim_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "birim_id");
  const birimId = yeniId ?? eskiId ?? null;
  const ad = birimId ? birimMap.get(birimId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "hedef-birim", mesaj: "birim ekledi", detay: ad };
  }
  return { kategori: "hedef-birim", mesaj: "birimi kaldırdı", detay: ad };
}

function kisalt(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// =====================================================================
// Diff → Alan değişikliği listesi
// =====================================================================

// Anlamsız alanlar (UI'a gösterilmez): zamanlar, sıralama, sistem flag'leri
const YOKSAY_ALANLAR = new Set([
  "olusturma_zamani",
  "guncelleme_zamani",
  "tamamlama_zamani",
  "tamamlanma_zamani",
  "tamamlayan_id",
  "eklenme_zamani",
  "silinme_zamani",
  "arsiv_zamani",
  "arsiv_oncesi_liste_id",
  "sira",
  // Bu alanlar ana mesajda zaten ifade ediliyor, çift göstermeyelim
  "silindi_mi",
  "arsiv_mi",
  "tamamlandi_mi",
  "duzenlendi_mi",
  // Anti-noise: meta-alanlar
  "id",
  "kart_id",
  "proje_id",
  "kontrol_listesi_id",
  "olusturan_id",
]);

// Kaynak tip + alan adı → TR etiket
const ALAN_ETIKETI: Record<string, Record<string, string>> = {
  Proje: {
    ad: "Ad",
    aciklama: "Açıklama",
    kapak_renk: "Kapak rengi",
    simge: "Simge",
    yildiz_mi: "Yıldız",
  },
  Liste: {
    ad: "Ad",
  },
  Kart: {
    baslik: "Başlık",
    aciklama: "Açıklama",
    bitis: "Bitiş tarihi",
    baslangic: "Başlangıç tarihi",
    kapak_renk: "Kapak rengi",
    kapak_dosya_id: "Kapak görseli",
    liste_id: "Liste",
  },
  Yorum: {
    icerik: "İçerik",
  },
  Eklenti: {
    ad: "Dosya adı",
  },
  KontrolListesi: {
    ad: "Ad",
  },
  KontrolMaddesi: {
    metin: "Metin",
    atanan_id: "Atanan",
    bitis: "Bitiş",
    tamamlayan_id: "Tamamlayan",
  },
  Etiket: {
    ad: "Ad",
    renk: "Renk",
  },
  ProjeYetkilisi: {
    // ADR-0012: seviye kaldırıldı.
  },
};

function degisiklikleriHazirla(
  a: HamAktivite,
  idMaplar: IdMaplar,
): AlanDegisikligi[] | null {
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  if (!diff) return null;

  const tipEtiketleri = ALAN_ETIKETI[a.kaynak_tip] ?? {};
  const sonuc: AlanDegisikligi[] = [];

  for (const [alan, deger] of Object.entries(diff)) {
    if (YOKSAY_ALANLAR.has(alan)) continue;
    // Sadece bilinen anlamlı alanları göster — meta-alanları gizle
    const etiket = tipEtiketleri[alan];
    if (!etiket) continue;
    sonuc.push({
      alan: etiket,
      eski: degerFormatla(alan, deger.eski, idMaplar),
      yeni: degerFormatla(alan, deger.yeni, idMaplar),
    });
  }
  return sonuc.length > 0 ? sonuc : null;
}

function degerFormatla(
  alan: string,
  v: unknown,
  idMaplar: IdMaplar,
): string | null {
  if (v === null || v === undefined || v === "") return null;

  // Id alanları → ad join
  if (alan === "liste_id" && typeof v === "string") {
    return idMaplar.liste.get(v) ?? "(silinmiş liste)";
  }
  if (
    (alan === "atanan_id" || alan === "tamamlayan_id" || alan === "olusturan_id" || alan === "yukleyen_id") &&
    typeof v === "string"
  ) {
    return idMaplar.kullanici.get(v) ?? "(kullanıcı)";
  }
  if (alan === "kapak_dosya_id" && typeof v === "string") {
    return idMaplar.eklenti.get(v) ?? "(görsel)";
  }
  if (alan === "kapak_renk" && typeof v === "string") {
    return kapakEtiketi(v) ?? v;
  }
  if (alan === "birim_id" && typeof v === "string") {
    return idMaplar.birim.get(v) ?? "(birim)";
  }

  // Boolean
  if (typeof v === "boolean") return v ? "Evet" : "Hayır";

  // Tarih (ISO string veya Date)
  if (v instanceof Date) return TARIH_FORMAT.format(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return TARIH_FORMAT.format(d);
  }

  // Number
  if (typeof v === "number") return String(v);

  // String — TAM gösterim (modal'da kırpma yok; istemci truncate ister
  // sadece liste UI bağlamında uygular).
  if (typeof v === "string") return v;

  // Fallback: JSON — yine tam
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

// Kural 8: dd.MM.yyyy HH:mm, Europe/Istanbul
const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});
