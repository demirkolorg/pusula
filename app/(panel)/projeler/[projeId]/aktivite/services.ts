import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type { KartAktiviteleriListele } from "./schemas";

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
  // Kaynak modelin id'si — composite PK olan tablolarda null
  // (KartEtiket, KartUyesi, KartHedefKurumu). Tümü sekmesinde inline yorum/ek
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
  _kurumId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-kurum (ADR-0007) — kurum kontrolü düştü.
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

  // Etiket / kullanıcı / kurum / liste id'lerini join için topla
  const etiketIdler = new Set<string>();
  const atananIdler = new Set<string>();
  const kurumIdler = new Set<string>();
  const listeIdler = new Set<string>();
  const eklentiIdler = new Set<string>();
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
    // Diff içinden id alanlarını topla (kart taşıma, atan değişimi, kapak)
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

  const [etiketler, atananlar, kurumlar, listeler, eklentiAdlar] = await Promise.all([
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
  const kurumMap = new Map(
    kurumlar.map((k) => [k.id, kurumGoruntu(k)] as const),
  );
  const listeMap = new Map(listeler.map((l) => [l.id, l.ad] as const));
  const eklentiAdMap = new Map(
    eklentiAdlar.map((e) => [e.id, e.ad] as const),
  );

  // Atan kullanıcısı ad/soyad'ı da string olarak hazır olsun (degisiklikler
  // formatlamasında kullanılır)
  const idMaplar: IdMaplar = {
    liste: listeMap,
    kullanici: new Map(atananlar.map((u) => [u.id, `${u.ad} ${u.soyad}`])),
    eklenti: eklentiAdMap,
    kurum: kurumMap,
  };

  return ham.map((a) =>
    aktiviteOzetle(a, kullaniciMap, etiketMap, atananMap, kurumMap, idMaplar),
  );
}

type IdMaplar = {
  liste: Map<string, string>;
  kullanici: Map<string, string>;
  eklenti: Map<string, string>;
  kurum: Map<string, string>;
};

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

// Why: silindi_mi/arsiv_mi diff'in başında özel mesajlara ayrıştırılır
// (çöp kutusuna taşıdı / geri yükledi / arşivledi / arşivden çıkardı), bu
// yüzden bu eşlemenin içinde yer almazlar — aksi halde generic "değiştirdi"
// fallback'ine düşme riski olur.
const KART_ALAN_ETIKETI: Record<string, string> = {
  baslik: "başlığı",
  aciklama: "açıklamayı",
  bitis: "bitiş tarihini",
  baslangic: "başlangıç tarihini",
  kapak_renk: "kapak rengini",
  kapak_dosya_id: "kapak görselini",
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
  // Why: audit middleware findUnique başarısız olursa eskiVeri undefined kalır
  // → diff hesaplanamaz. Bu savunmacı kontrol soft-delete/arşivin yeni_veri
  // değerinden de tespit edilmesini sağlar; diff null olsa bile mesaj doğru.
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  if (diff?.silindi_mi || (diff === null && typeof yeniSilindi === "boolean")) {
    const yeni = diff?.silindi_mi?.yeni ?? yeniSilindi;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı çöp kutusuna taşıdı" : "kartı geri yükledi",
      detay: null,
    };
  }
  if (diff?.arsiv_mi || (diff === null && typeof yeniArsiv === "boolean")) {
    const yeni = diff?.arsiv_mi?.yeni ?? yeniArsiv;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı arşivledi" : "kartı arşivden çıkardı",
      detay: null,
    };
  }
  if (!diff) {
    return { kategori: "kart", mesaj: "kartı güncelledi", detay: null };
  }
  const alanlar = Object.keys(diff);
  if (alanlar.includes("liste_id")) {
    return { kategori: "kart", mesaj: "kartı taşıdı", detay: null };
  }
  if (alanlar.includes("sira")) {
    return { kategori: "kart", mesaj: "kartı yeniden sıraladı", detay: null };
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
  // mesajı yanıltıcı. Sıra-only diff ayrı mesaj alır; ad değişikliği
  // varsa düzenleme olarak gösterilir.
  const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
  const alanlar = diff ? Object.keys(diff) : [];
  if (alanlar.length > 0 && alanlar.every((k) => k === "sira" || k === "guncelleme_zamani")) {
    return { kategori: "kontrol-listesi", mesaj: "kontrol listesini yeniden sıraladı", detay: ad };
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
  // Why: drag-drop ile sıra her hareketinde UPDATE üretir; "güncelledi" mesajı
  // yanıltıcı. Sıra-only diff için ayrı mesaj; metin değişikliği varsa daha
  // spesifik mesaj.
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
  return { kategori: "kontrol-maddesi", mesaj: "kontrol maddesini güncelledi", detay: metin };
}

// Why: Composite-PK ilişki tablolarında (KartUyesi/KartEtiket/KartHedefKurumu)
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

function kartUyesiMesaji(
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
    return { kategori: "uye", mesaj: "üye atadı", detay: ad };
  }
  return { kategori: "uye", mesaj: "üyeyi kaldırdı", detay: ad };
}

function kartIliskisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniTip = jsonAlan<string>(a.yeni_veri, "tip");
  const eskiTip = jsonAlan<string>(a.eski_veri, "tip");
  const tip = yeniTip ?? eskiTip ?? null;
  const tipAd =
    tip === "BLOCKS"
      ? "engelliyor"
      : tip === "RELATES"
        ? "ilişkili"
        : tip === "DUPLICATES"
          ? "tekrarı"
          : null;
  const eklendi = yeniTip ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "iliski", mesaj: "kart ilişkisi kurdu", detay: tipAd };
  }
  return { kategori: "iliski", mesaj: "kart ilişkisini kaldırdı", detay: tipAd };
}

function hedefKurumMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  kurumMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kurum_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kurum_id");
  const kurumId = yeniId ?? eskiId ?? null;
  const ad = kurumId ? kurumMap.get(kurumId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "hedef-kurum", mesaj: "hedef kurum ekledi", detay: ad };
  }
  return { kategori: "hedef-kurum", mesaj: "hedef kurumu kaldırdı", detay: ad };
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
  "eklenme_zamani",
  "silinme_zamani",
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
  ProjeUyesi: {
    seviye: "Yetki seviyesi",
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
  if (alan === "kurum_id" && typeof v === "string") {
    return idMaplar.kurum.get(v) ?? "(kurum)";
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
