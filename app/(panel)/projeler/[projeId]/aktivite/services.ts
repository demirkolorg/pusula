import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type { KartAktiviteleriListele } from "./schemas";

// =====================================================================
// Tipler
// =====================================================================

export type AktiviteOzeti = {
  id: string; // BigInt → string (JSON safe)
  zaman: Date;
  kullanici: { id: string; ad: string; soyad: string } | null;
  kategori:
    | "kart"
    | "etiket"
    | "uye"
    | "kontrol-listesi"
    | "kontrol-maddesi"
    | "yorum"
    | "eklenti"
    | "iliski"
    | "hedef-kurum"
    | "diger";
  islem: "CREATE" | "UPDATE" | "DELETE";
  // TR-formatlı ana mesaj — örn "kart başlığını değiştirdi"
  mesaj: string;
  // Opsiyonel ikincil bilgi (ad, eski/yeni değer kısa özeti)
  detay: string | null;
};

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function kartiBulVeProjeAl(
  kurumId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: { select: { proje_id: true, proje: { select: { kurum_id: true } } } },
    },
  });
  if (!k || k.liste.proje.kurum_id !== kurumId) {
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
  "KartHedefKurumu",
  "KartUyesi",
  "KartEtiket",
] as const;

export async function kartAktiviteleriniListele(
  kurumId: string,
  girdi: KartAktiviteleriListele,
): Promise<AktiviteOzeti[]> {
  await kartiBulVeProjeAl(kurumId, girdi.kart_id);

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
          // KartIliskisi — iki yön
          {
            kaynak_tip: "KartIliskisi",
            OR: [
              { yeni_veri: { path: ["kart_a_id"], equals: girdi.kart_id } },
              { yeni_veri: { path: ["kart_b_id"], equals: girdi.kart_id } },
              { eski_veri: { path: ["kart_a_id"], equals: girdi.kart_id } },
              { eski_veri: { path: ["kart_b_id"], equals: girdi.kart_id } },
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
    take: girdi.limit,
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

  // Kullanıcı bilgileri tek seferde — N+1 yasak (Kural 43)
  const kullaniciIdler = Array.from(
    new Set(
      ham.map((a) => a.kullanici_id).filter((x): x is string => !!x),
    ),
  );
  const kullanicilar = kullaniciIdler.length
    ? await db.kullanici.findMany({
        where: { id: { in: kullaniciIdler } },
        select: { id: true, ad: true, soyad: true },
      })
    : [];
  const kullaniciMap = new Map(kullanicilar.map((k) => [k.id, k]));

  // Etiket / kullanıcı / kurum id'lerini join için topla
  const etiketIdler = new Set<string>();
  const atananIdler = new Set<string>();
  const kurumIdler = new Set<string>();
  for (const a of ham) {
    if (a.kaynak_tip === "KartEtiket") {
      const ePost = (a.yeni_veri as { etiket_id?: string } | null)?.etiket_id;
      const ePre = (a.eski_veri as { etiket_id?: string } | null)?.etiket_id;
      if (ePost) etiketIdler.add(ePost);
      if (ePre) etiketIdler.add(ePre);
    }
    if (a.kaynak_tip === "KartUyesi") {
      const uPost = (a.yeni_veri as { kullanici_id?: string } | null)
        ?.kullanici_id;
      const uPre = (a.eski_veri as { kullanici_id?: string } | null)
        ?.kullanici_id;
      if (uPost) atananIdler.add(uPost);
      if (uPre) atananIdler.add(uPre);
    }
    if (a.kaynak_tip === "KartHedefKurumu") {
      const kPost = (a.yeni_veri as { kurum_id?: string } | null)?.kurum_id;
      const kPre = (a.eski_veri as { kurum_id?: string } | null)?.kurum_id;
      if (kPost) kurumIdler.add(kPost);
      if (kPre) kurumIdler.add(kPre);
    }
  }

  const [etiketler, atananlar, kurumlar] = await Promise.all([
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
    kurumIdler.size > 0
      ? db.kurum.findMany({
          where: { id: { in: Array.from(kurumIdler) } },
          select: { id: true, ad: true, kisa_ad: true, tip: true },
        })
      : Promise.resolve([]),
  ]);
  const etiketMap = new Map(etiketler.map((e) => [e.id, e]));
  const atananMap = new Map(atananlar.map((u) => [u.id, u]));
  const kurumMap = new Map(
    kurumlar.map((k) => [k.id, kurumGoruntu(k)] as const),
  );

  return ham.map((a) =>
    aktiviteOzetle(a, kullaniciMap, etiketMap, atananMap, kurumMap),
  );
}

function kurumGoruntu(k: {
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

const KART_ALAN_ETIKETI: Record<string, string> = {
  baslik: "başlığı",
  aciklama: "açıklamayı",
  bitis: "bitiş tarihini",
  baslangic: "başlangıç tarihini",
  kapak_renk: "kapak rengini",
  kapak_dosya_id: "kapak görselini",
  arsiv_mi: "arşiv durumunu",
  silindi_mi: "silme durumunu",
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
  kurumMap: Map<string, string>,
): AktiviteOzeti {
  const islem = (a.islem === "CREATE" || a.islem === "UPDATE" || a.islem === "DELETE"
    ? a.islem
    : "UPDATE") as AktiviteOzeti["islem"];

  const kullanici = a.kullanici_id
    ? kullaniciMap.get(a.kullanici_id) ?? null
    : null;

  const ortak = {
    id: a.id.toString(),
    zaman: a.zaman,
    kullanici,
    islem,
  };

  switch (a.kaynak_tip) {
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
    case "KartUyesi":
      return { ...ortak, ...kartUyesiMesaji(a, islem, atananMap) };
    case "KartIliskisi":
      return { ...ortak, ...kartIliskisiMesaji(a, islem) };
    case "KartHedefKurumu":
      return { ...ortak, ...hedefKurumMesaji(a, islem, kurumMap) };
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
  if (!diff) {
    return { kategori: "kart", mesaj: "kartı güncelledi", detay: null };
  }
  const alanlar = Object.keys(diff);
  // Soft-delete özel
  if (alanlar.includes("silindi_mi")) {
    const yeni = diff.silindi_mi?.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı çöp kutusuna taşıdı" : "kartı geri yükledi",
      detay: null,
    };
  }
  if (alanlar.includes("arsiv_mi")) {
    const yeni = diff.arsiv_mi?.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı arşivledi" : "kartı arşivden çıkardı",
      detay: null,
    };
  }
  if (alanlar.includes("liste_id") || alanlar.includes("sira")) {
    return { kategori: "kart", mesaj: "kartı taşıdı", detay: null };
  }
  // Genel alan değişikliği
  const onemli = alanlar.find((k) => KART_ALAN_ETIKETI[k]);
  if (onemli) {
    return {
      kategori: "kart",
      mesaj: `kartın ${KART_ALAN_ETIKETI[onemli]} değiştirdi`,
      detay: null,
    };
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
  // UPDATE içinde silindi_mi=true varsa → silme
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  if (diff?.silindi_mi?.yeni === true) {
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
  // soft delete
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  if (diff?.silindi_mi?.yeni === true || islem === "DELETE") {
    return {
      kategori: "eklenti",
      mesaj: "dosyayı sildi",
      detay: jsonAlan<string>(a.eski_veri, "ad") ?? null,
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
  // UPDATE — tamamlandi_mi'ye özel mesaj
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni === true;
    return {
      kategori: "kontrol-maddesi",
      mesaj: yeni ? "kontrol maddesini tamamladı" : "kontrol maddesini geri açtı",
      detay: metin,
    };
  }
  return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesini güncelledi", detay: metin };
}

function kartEtiketMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  etiketMap: Map<string, { id: string; ad: string; renk: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const etiketId =
    jsonAlan<string>(a.yeni_veri, "etiket_id") ??
    jsonAlan<string>(a.eski_veri, "etiket_id") ??
    null;
  const ad = etiketId ? etiketMap.get(etiketId)?.ad ?? null : null;
  if (islem === "CREATE") {
    return { kategori: "etiket", mesaj: "etiket ekledi", detay: ad };
  }
  return { kategori: "etiket", mesaj: "etiketi kaldırdı", detay: ad };
}

function kartUyesiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const uId =
    jsonAlan<string>(a.yeni_veri, "kullanici_id") ??
    jsonAlan<string>(a.eski_veri, "kullanici_id") ??
    null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  if (islem === "CREATE") {
    return { kategori: "uye", mesaj: "üye atadı", detay: ad };
  }
  return { kategori: "uye", mesaj: "üyeyi kaldırdı", detay: ad };
}

function kartIliskisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const tip =
    jsonAlan<string>(a.yeni_veri, "tip") ??
    jsonAlan<string>(a.eski_veri, "tip") ??
    null;
  const tipAd =
    tip === "BLOCKS"
      ? "engelliyor"
      : tip === "RELATES"
        ? "ilişkili"
        : tip === "DUPLICATES"
          ? "tekrarı"
          : null;
  if (islem === "CREATE") {
    return { kategori: "iliski", mesaj: "kart ilişkisi kurdu", detay: tipAd };
  }
  return { kategori: "iliski", mesaj: "kart ilişkisini kaldırdı", detay: tipAd };
}

function hedefKurumMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  kurumMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const kurumId =
    jsonAlan<string>(a.yeni_veri, "kurum_id") ??
    jsonAlan<string>(a.eski_veri, "kurum_id") ??
    null;
  const ad = kurumId ? kurumMap.get(kurumId) ?? null : null;
  if (islem === "CREATE") {
    return { kategori: "hedef-kurum", mesaj: "hedef kurum ekledi", detay: ad };
  }
  return { kategori: "hedef-kurum", mesaj: "hedef kurumu kaldırdı", detay: ad };
}

function kisalt(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
