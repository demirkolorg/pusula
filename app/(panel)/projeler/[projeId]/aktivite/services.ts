import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kapakEtiketi } from "@/lib/kapak-renk";
import {
  mentionKisiMapiGetir,
  mentionliMetniGorunurYap,
} from "@/lib/mention-server";
import type { MentionKisiMap } from "@/lib/mention-format";
import { idariMesaj } from "@/lib/aktivite/idari-mesaj";
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
  // Bağlam — "hangi proje, hangi liste, hangi kart" — proje aktivite modalı
  // ve detay diyaloğu için. Kart modal'ında kart bilgisi zaten bilindiği için
  // orada null kalır. Liste/kart silinmişse ad null olabilir; id varsa silinmiş
  // kayıt göstergesi UI tarafında "(silinmiş kart)" gibi bir fallback üretir.
  baglam: {
    proje: { id: string; ad: string | null } | null;
    liste: { id: string; ad: string | null } | null;
    kart: { id: string; baslik: string | null } | null;
  } | null;
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
// Public — ana sayfa "Son Aktiviteler" widget'ı da bu fonksiyonu kullanır:
// kullanıcı bağlamına göre filtrelenmiş ham audit kayıtlarını user-friendly
// `AktiviteOzeti[]`'na çevirir (mesaj + diff + baglam çözümü).
export async function zenginlestirVeOzetle(
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
  const yorumMetinleri: string[] = [];
  // Bağlam ID setleri — proje/kart/liste/kontrol-listesi adlarını çekmek için.
  const baglamKartIdler = new Set<string>();
  const baglamListeIdler = new Set<string>();
  const baglamKlIdler = new Set<string>();
  const baglamProjeIdler = new Set<string>();
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
    if (a.kaynak_tip === "Yorum") {
      const icerik =
        jsonAlan<string>(a.yeni_veri, "icerik") ??
        jsonAlan<string>(a.eski_veri, "icerik");
      if (icerik) yorumMetinleri.push(icerik);
    }

    // Bağlam çıkarımı — her aktivitenin "hangi liste, hangi kart" olduğunu
    // ileride join'leyebilmek için ID'leri topla.
    if (a.kaynak_tip === "Kart" && a.kaynak_id) {
      baglamKartIdler.add(a.kaynak_id);
    }
    if (a.kaynak_tip === "Liste" && a.kaynak_id) {
      baglamListeIdler.add(a.kaynak_id);
    }
    if (
      a.kaynak_tip === "Yorum" ||
      a.kaynak_tip === "Eklenti" ||
      a.kaynak_tip === "KontrolListesi" ||
      a.kaynak_tip === "KartEtiket" ||
      a.kaynak_tip === "KartYetkilisi" ||
      a.kaynak_tip === "KartBirimi"
    ) {
      const kid =
        (a.yeni_veri as { kart_id?: string } | null)?.kart_id ??
        (a.eski_veri as { kart_id?: string } | null)?.kart_id;
      if (kid) baglamKartIdler.add(kid);
    }
    if (a.kaynak_tip === "KontrolMaddesi") {
      const klid =
        (a.yeni_veri as { kontrol_listesi_id?: string } | null)
          ?.kontrol_listesi_id ??
        (a.eski_veri as { kontrol_listesi_id?: string } | null)
          ?.kontrol_listesi_id;
      if (klid) baglamKlIdler.add(klid);
    }
    if (a.kaynak_tip === "ListeYetkilisi" || a.kaynak_tip === "ListeBirimi") {
      const lid =
        (a.yeni_veri as { liste_id?: string } | null)?.liste_id ??
        (a.eski_veri as { liste_id?: string } | null)?.liste_id;
      if (lid) baglamListeIdler.add(lid);
    }
    // Proje düzeyi kayıtlar — proje_id JSON path
    if (
      a.kaynak_tip === "Proje" &&
      a.kaynak_id
    ) {
      baglamProjeIdler.add(a.kaynak_id);
    }
    if (
      a.kaynak_tip === "ProjeYetkilisi" ||
      a.kaynak_tip === "ProjeBirimi" ||
      a.kaynak_tip === "Etiket"
    ) {
      const pid =
        (a.yeni_veri as { proje_id?: string } | null)?.proje_id ??
        (a.eski_veri as { proje_id?: string } | null)?.proje_id;
      if (pid) baglamProjeIdler.add(pid);
    }
  }

  // KontrolMaddesi'ler için kontrol_listesi → kart_id eşleşmesi:
  // önce ilgili KontrolListesi'leri çekerek kart_id'leri öğren, sonra
  // o kart_id'leri baglamKartIdler'a ekle (kart adını da çekebilelim).
  const kontrolListesiKartMap = new Map<string, string>();
  if (baglamKlIdler.size > 0) {
    const klKayitlar = await db.kontrolListesi.findMany({
      where: { id: { in: Array.from(baglamKlIdler) } },
      select: { id: true, kart_id: true },
    });
    for (const kl of klKayitlar) {
      kontrolListesiKartMap.set(kl.id, kl.kart_id);
      baglamKartIdler.add(kl.kart_id);
    }
  }

  // Bağlam liste ID'lerini, kartların liste_id'leriyle birleştirmeden
  // önce kartları çekmemiz gerek. Önce kartlar, sonra kartın liste_id
  // dahil edip o ID'leri de listeIdler'a ekle ve listeleri çek.
  const baglamKartlar =
    baglamKartIdler.size > 0
      ? await db.kart.findMany({
          where: { id: { in: Array.from(baglamKartIdler) } },
          select: { id: true, baslik: true, liste_id: true },
        })
      : [];
  for (const k of baglamKartlar) {
    baglamListeIdler.add(k.liste_id);
  }

  const [
    etiketler,
    atananlar,
    birimler,
    listeler,
    eklentiAdlar,
    baglamListeler,
    yorumMentionKisiMap,
  ] = await Promise.all([
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
      baglamListeIdler.size > 0
        ? db.liste.findMany({
            where: { id: { in: Array.from(baglamListeIdler) } },
            select: { id: true, ad: true, proje_id: true },
          })
        : Promise.resolve([]),
      mentionKisiMapiGetir(yorumMetinleri),
    ]);

  // Bağlam listelerinden çıkan proje_id'leri proje fetch setine ekle ve
  // proje kayıtlarını çek (kart→liste→proje zinciri için).
  for (const l of baglamListeler) {
    baglamProjeIdler.add(l.proje_id);
  }
  const baglamProjeler =
    baglamProjeIdler.size > 0
      ? await db.proje.findMany({
          where: { id: { in: Array.from(baglamProjeIdler) } },
          select: { id: true, ad: true },
        })
      : [];

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

  const baglamMaplari: BaglamMaplari = {
    kart: new Map(baglamKartlar.map((k) => [k.id, k])),
    liste: new Map(baglamListeler.map((l) => [l.id, l])),
    proje: new Map(baglamProjeler.map((p) => [p.id, p])),
    kontrolListesi: kontrolListesiKartMap,
  };

  return ham.map((a) =>
    aktiviteOzetle(
      a,
      kullaniciMap,
      etiketMap,
      atananMap,
      birimMap,
      idMaplar,
      baglamMaplari,
      yorumMentionKisiMap,
    ),
  );
}

type IdMaplar = {
  liste: Map<string, string>;
  kullanici: Map<string, string>;
  eklenti: Map<string, string>;
  birim: Map<string, string>;
};

// Bağlam map'leri — her aktivitenin "hangi proje, hangi liste, hangi kart"
// bağlamını üretmek için. Aktivite kaydının kendisinden veya ilişki
// tablosundan kart_id / liste_id / proje_id çıkarılır, bu map'lerden ad
// bilgisi alınır.
type BaglamMaplari = {
  kart: Map<string, { id: string; baslik: string | null; liste_id: string }>;
  // Liste detayı: ad + proje_id (kart→liste→proje zinciri için)
  liste: Map<string, { id: string; ad: string | null; proje_id: string }>;
  proje: Map<string, { id: string; ad: string | null }>;
  // KontrolListesi.id → kart_id eşleşmesi (KontrolMaddesi → kart bağlamı için)
  kontrolListesi: Map<string, string>;
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

// Public — ana sayfa servisi `aktiviteLogu.findMany` sonucunu doğrudan
// `zenginlestirVeOzetle` fonksiyonuna geçirebilsin diye export edilir.
export type HamAktivite = {
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
  // ADR-0023 — Tiptap doc + denormalize plaintext. Audit mesajında plaintext
  // değişikliğini referans alıyoruz; doc her edit'te değişir ama "anlamlı"
  // değişim metnin kendisi (ikisi tutarlı: services tek bir transaction'da
  // her ikisini birden yazar). aciklama_dokuman değişimi mesajdan çıkarıldı
  // (her keypress audit gibi gürültü olur).
  aciklama_metin: "kartın açıklaması",
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

// Liste id'sinden proje özeti çıkar (kart→liste→proje zinciri).
function projeOzeti(
  listeId: string | null | undefined,
  baglam: BaglamMaplari,
): { id: string; ad: string | null } | null {
  if (!listeId) return null;
  const l = baglam.liste.get(listeId);
  if (!l) return null;
  const p = baglam.proje.get(l.proje_id);
  return p ? { id: p.id, ad: p.ad } : { id: l.proje_id, ad: null };
}

// Aktivite kaydının proje, kart_id ve liste_id bağlamını çöz — yorumun ait
// olduğu kart, kartın bulunduğu liste, listenin ait olduğu proje vb.
// Composite-PK ilişki tablolarında JSON'dan, Kart/Liste/Proje için kaynak_id
// veya yeni_veri/eski_veri'den okur. Silinmiş kayıt → ad null → UI fallback.
function baglamCoz(
  a: HamAktivite,
  baglam: BaglamMaplari,
): AktiviteOzeti["baglam"] {
  const tip = a.kaynak_tip;

  // Doğrudan Proje kaydı — kaynak_id proje id'si.
  if (tip === "Proje" && a.kaynak_id) {
    const p = baglam.proje.get(a.kaynak_id);
    return {
      proje: p ?? { id: a.kaynak_id, ad: null },
      liste: null,
      kart: null,
    };
  }

  // Diğer proje düzeyi (yetkili/birim/etiket) — JSON'dan proje_id
  if (tip === "ProjeYetkilisi" || tip === "ProjeBirimi" || tip === "Etiket") {
    const projeId =
      jsonAlan<string>(a.yeni_veri, "proje_id") ??
      jsonAlan<string>(a.eski_veri, "proje_id") ??
      null;
    if (!projeId) return null;
    const p = baglam.proje.get(projeId);
    return {
      proje: p ?? { id: projeId, ad: null },
      liste: null,
      kart: null,
    };
  }

  // Doğrudan Kart kaydı — kaynak_id zaten kart id'si.
  if (tip === "Kart" && a.kaynak_id) {
    const k = baglam.kart.get(a.kaynak_id);
    if (k) {
      const l = baglam.liste.get(k.liste_id);
      return {
        proje: projeOzeti(k.liste_id, baglam),
        liste: l ? { id: l.id, ad: l.ad } : null,
        kart: { id: k.id, baslik: k.baslik },
      };
    }
    // Kart silinmişse — id biliniyor ama ad yok
    return {
      proje: null,
      liste: null,
      kart: { id: a.kaynak_id, baslik: null },
    };
  }

  // Doğrudan Liste kaydı — kart bağlamı yok
  if (tip === "Liste" && a.kaynak_id) {
    const l = baglam.liste.get(a.kaynak_id);
    return {
      proje: l ? projeOzeti(a.kaynak_id, baglam) : null,
      liste: l ? { id: l.id, ad: l.ad } : { id: a.kaynak_id, ad: null },
      kart: null,
    };
  }

  // Liste-bağlı ilişkiler — JSON'dan liste_id
  if (tip === "ListeYetkilisi" || tip === "ListeBirimi") {
    const listeId =
      jsonAlan<string>(a.yeni_veri, "liste_id") ??
      jsonAlan<string>(a.eski_veri, "liste_id") ??
      null;
    if (!listeId) return null;
    const l = baglam.liste.get(listeId);
    return {
      proje: l ? projeOzeti(listeId, baglam) : null,
      liste: l ? { id: l.id, ad: l.ad } : { id: listeId, ad: null },
      kart: null,
    };
  }

  // Kart-bağlı kayıtlar (Yorum, Eklenti, KontrolListesi, KartEtiket,
  // KartYetkilisi, KartBirimi) — JSON'dan kart_id
  let kartId: string | null = null;
  if (KART_ID_ICEREN_TIPLER.includes(tip as never)) {
    kartId =
      jsonAlan<string>(a.yeni_veri, "kart_id") ??
      jsonAlan<string>(a.eski_veri, "kart_id") ??
      null;
  } else if (tip === "KontrolMaddesi") {
    // KontrolMaddesi → kontrol_listesi_id → kart_id (dolaylı)
    const klId =
      jsonAlan<string>(a.yeni_veri, "kontrol_listesi_id") ??
      jsonAlan<string>(a.eski_veri, "kontrol_listesi_id") ??
      null;
    if (klId) kartId = baglam.kontrolListesi.get(klId) ?? null;
  }

  if (!kartId) return null;
  const k = baglam.kart.get(kartId);
  if (!k) {
    return {
      proje: null,
      liste: null,
      kart: { id: kartId, baslik: null },
    };
  }
  const l = baglam.liste.get(k.liste_id);
  return {
    proje: projeOzeti(k.liste_id, baglam),
    liste: l ? { id: l.id, ad: l.ad } : null,
    kart: { id: k.id, baslik: k.baslik },
  };
}

function aktiviteOzetle(
  a: HamAktivite,
  kullaniciMap: Map<string, { id: string; ad: string; soyad: string }>,
  etiketMap: Map<string, { id: string; ad: string; renk: string }>,
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
  birimMap: Map<string, string>,
  idMaplar: IdMaplar,
  baglamMaplari: BaglamMaplari,
  yorumMentionKisiMap: MentionKisiMap,
): AktiviteOzeti {
  const islem = (a.islem === "CREATE" || a.islem === "UPDATE" || a.islem === "DELETE"
    ? a.islem
    : "UPDATE") as AktiviteOzeti["islem"];

  const kullanici = a.kullanici_id
    ? kullaniciMap.get(a.kullanici_id) ?? null
    : null;

  const degisiklikler =
    islem === "UPDATE" ? degisiklikleriHazirla(a, idMaplar) : null;

  const baglam = baglamCoz(a, baglamMaplari);

  const ortak = {
    id: a.id.toString(),
    zaman: a.zaman,
    kullanici,
    islem,
    kaynak_id: a.kaynak_id,
    degisiklikler,
    baglam,
  };

  switch (a.kaynak_tip) {
    case "Proje":
      return { ...ortak, ...projeMesaji(a, islem) };
    case "Liste":
      return { ...ortak, ...listeMesaji(a, islem) };
    case "Kart":
      return { ...ortak, ...kartMesaji(a, islem) };
    case "Yorum":
      return { ...ortak, ...yorumMesaji(a, islem, yorumMentionKisiMap) };
    case "Eklenti":
      return { ...ortak, ...eklentiMesaji(a, islem) };
    case "Dosya":
      // ADR-0028 — yeni Dosya modeli; eklentiMesaji ile aynı kategori/cümle
      // (UI ve translation parite). Backfill sonrası eski Eklenti event'leri
      // de bu üretici akışa düştüğünde aynı görünür.
      return { ...ortak, ...eklentiMesaji(a, islem) };
    case "DosyaSurumu":
      return { ...ortak, ...dosyaSurumuMesaji(a, islem) };
    case "DosyaBaglantisi":
      return { ...ortak, ...dosyaBaglantisiMesaji(a, islem) };
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
      {
        const idari = idariMesaj(a, islem);
        if (idari) return { ...ortak, ...idari };
      }
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
    return {
      kategori: "kart",
      mesaj: "kartın listesini değiştirdi",
      detay: null,
    };
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
  mentionKisiMap: MentionKisiMap,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    const ic = jsonAlan<string>(a.yeni_veri, "icerik") ?? "";
    return {
      kategori: "yorum",
      mesaj: "yorum yazdı",
      detay: kisalt(mentionliMetniGorunurYap(ic, mentionKisiMap), 80),
    };
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

// ADR-0028 — Dosya sürüm ve bağlantı aktivite mesajları.
function dosyaSurumuMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const surumNo = jsonAlan<number>(a.yeni_veri, "surum_no");
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return {
      kategori: "eklenti",
      mesaj: surumNo
        ? `dosyanın yeni sürümünü (v${surumNo}) yükledi`
        : "dosyanın yeni sürümünü yükledi",
      detay: ad,
    };
  }
  return {
    kategori: "eklenti",
    mesaj: "dosya sürümünü güncelledi",
    detay: ad,
  };
}

function dosyaBaglantisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const kaynakTip =
    jsonAlan<string>(a.yeni_veri, "kaynak_tip") ??
    jsonAlan<string>(a.eski_veri, "kaynak_tip") ??
    null;
  const tipMetin =
    kaynakTip === "KART"
      ? "karta"
      : kaynakTip === "LISTE"
        ? "listeye"
        : kaynakTip === "PROJE"
          ? "projeye"
          : "kaynağa";
  if (islem === "CREATE") {
    return {
      kategori: "eklenti",
      mesaj: `dosyayı ${tipMetin} bağladı`,
      detay: null,
    };
  }
  if (islem === "DELETE") {
    return {
      kategori: "eklenti",
      mesaj: `dosyanın ${tipMetin.replace("a", "")} bağlantısını kaldırdı`,
      detay: null,
    };
  }
  return { kategori: "eklenti", mesaj: "dosya bağlantısını güncelledi", detay: null };
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
    // ADR-0023 — `aciklama_metin` denormalize alanı; denetim diyaloğu metin
    // farkını gösterir. `aciklama_dokuman` (Tiptap JSON) ham objedir,
    // anlamlı diff için plaintext yeterli.
    aciklama_metin: "Açıklama",
    aciklama_dokuman: "Açıklama (zengin metin)",
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
