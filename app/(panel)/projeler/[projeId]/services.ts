import { ListeTipi, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { presignedDownload } from "@/lib/storage";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import type {
  KartArsiv,
  KartGuncelle,
  KartOlustur,
  KartTasi,
  ListeGuncelle,
  ListeOlustur,
  ListeSira,
} from "./schemas";

// ADR-0009 — Arşiv sistem listesi.
// `ARSIV_LISTESI_SIRA` LexoRank'in "Z" prefix sona ekleme garantisi;
// NORMAL listeler arasındaki yeni sıralar bunun öncesini üretir.
const ARSIV_LISTESI_SIRA = "ZZZZ";
const ARSIV_LISTESI_AD = "Arşiv";

export async function arsivListesiniSagla(projeId: string): Promise<string> {
  const mevcut = await db.liste.findFirst({
    where: { proje_id: projeId, tip: ListeTipi.ARSIV },
    select: { id: true },
  });
  if (mevcut) return mevcut.id;
  const yeni = await db.liste.create({
    data: {
      proje_id: projeId,
      ad: ARSIV_LISTESI_AD,
      sira: ARSIV_LISTESI_SIRA,
      tip: ListeTipi.ARSIV,
    },
    select: { id: true },
  });
  return yeni.id;
}

// ============================================================
// Tipler
// ============================================================

export type KartKapakOzeti = {
  url: string;
  mime: string;
};

export type ListeKartOzeti = {
  id: string;
  baslik: string;
  aciklama: string | null;
  sira: string;
  kapak_renk: string | null;
  // Eklenti'den ayarlanmış görsel kapak — server-side presigned URL.
  // Hem renk hem görsel doluysa görsel öncelikli (services kapak ayarlanırken
  // renk null'lar). KartMini bu nesneyi varsa <img> ile, yoksa kapak_renk
  // varsa renkli div ile, ikisi de yoksa kapak göstermez.
  kapak: KartKapakOzeti | null;
  bitis: Date | null;
  arsiv_mi: boolean;
  silindi_mi: boolean;
  yetkili_sayisi: number;
  etiket_sayisi: number;
  yorum_sayisi: number;
  ek_sayisi: number;
  madde_toplam: number;
  madde_tamamlanan: number;
};

export type ListeOzeti = {
  id: string;
  proje_id: string;
  ad: string;
  sira: string;
  // ADR-0009 — sistem ARSIV listesi UI'da farklı render edilir.
  tip: ListeTipi;
  arsiv_mi: boolean;
  wip_limit: number | null;
  kartlar: ListeKartOzeti[];
};

export type ProjeDetayOzeti = {
  id: string;
  ad: string;
  aciklama: string | null;
  kapak_renk: string | null;
  kapak_ikon: string | null;
  yildizli_mi: boolean;
  arsiv_mi: boolean;
  silindi_mi: boolean;
  listeler: ListeOzeti[];
};

type KaynakErisimi = {
  kullaniciId: string;
  birimId: string | null;
  makam: boolean;
};

async function kaynakErisimi(kullaniciId: string): Promise<KaynakErisimi> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  return { kullaniciId, birimId: erisim.birimId, makam: erisim.makam };
}

function listeGorunurlukWhere(
  erisim: KaynakErisimi,
): Prisma.ListeWhereInput {
  if (erisim.makam) return { arsiv_mi: false };
  // Yetki asagi iner: proje yetkilisi butun listeleri, liste yetkilisi o
  // listeyi, kart yetkilisi ise liste kabugunu gorur.
  const kartKosullari: Prisma.KartWhereInput[] = [
    { yetkililer: { some: { kullanici_id: erisim.kullaniciId } } },
  ];
  if (erisim.birimId) {
    kartKosullari.push({ birimler: { some: { birim_id: erisim.birimId } } });
  }
  const kosullar: Prisma.ListeWhereInput[] = [
    { proje: { yetkililer: { some: { kullanici_id: erisim.kullaniciId } } } },
    { yetkililer: { some: { kullanici_id: erisim.kullaniciId } } },
    { kartlar: { some: { OR: kartKosullari } } },
  ];
  if (erisim.birimId) {
    kosullar.push({ proje: { birimler: { some: { birim_id: erisim.birimId } } } });
    kosullar.push({ birimler: { some: { birim_id: erisim.birimId } } });
  }
  return { arsiv_mi: false, OR: kosullar };
}

function kartGorunurlukWhere(
  erisim: KaynakErisimi,
): Prisma.KartWhereInput {
  if (erisim.makam) return { silindi_mi: false, arsiv_mi: false };
  // Yetki asagi iner: proje yetkilisi tum kartlari, liste yetkilisi listenin
  // kartlarini, kart yetkilisi ise sadece karti gorur.
  const kosullar: Prisma.KartWhereInput[] = [
    {
      liste: {
        proje: {
          yetkililer: { some: { kullanici_id: erisim.kullaniciId } },
        },
      },
    },
    {
      liste: {
        yetkililer: { some: { kullanici_id: erisim.kullaniciId } },
      },
    },
    { yetkililer: { some: { kullanici_id: erisim.kullaniciId } } },
  ];
  if (erisim.birimId) {
    kosullar.push({
      liste: {
        proje: { birimler: { some: { birim_id: erisim.birimId } } },
      },
    });
    kosullar.push({
      liste: { birimler: { some: { birim_id: erisim.birimId } } },
    });
    kosullar.push({ birimler: { some: { birim_id: erisim.birimId } } });
  }
  return { silindi_mi: false, arsiv_mi: false, OR: kosullar };
}

// ============================================================
// Yetkilendirme yardımcıları
// ============================================================

async function projeyeErisimDogrula(
  _birimId: string,
  projeId: string,
): Promise<void> {
  // Tek-birim (ADR-0007) — birim eşleşme reddi düştü; varlık + soft-delete kontrolü.
  const p = await db.proje.findUnique({
    where: { id: projeId },
    select: { silindi_mi: true },
  });
  if (!p || p.silindi_mi) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }
}

async function listeyiBulVeProjeAl(
  _birimId: string,
  listeId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const l = await db.liste.findUnique({
    where: { id: listeId },
    select: { proje_id: true },
  });
  if (!l) {
    throw new EylemHatasi("Liste bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: l.proje_id };
}

async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ liste_id: string; proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste_id: true,
      liste: { select: { proje_id: true } },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { liste_id: k.liste_id, proje_id: k.liste.proje_id };
}

// ============================================================
// Proje detayı (pano + liste görünümü ortak veri)
// ============================================================

export async function projeDetayiniGetir(
  kullaniciId: string,
  projeId: string,
): Promise<ProjeDetayOzeti> {
  await projeyeErisimDogrula(kullaniciId, projeId);
  const erisim = await kaynakErisimi(kullaniciId);

  const proje = await db.proje.findUnique({
    where: { id: projeId },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      kapak_ikon: true,
      yildizli_mi: true,
      arsiv_mi: true,
      silindi_mi: true,
      listeler: {
        where: listeGorunurlukWhere(erisim),
        orderBy: { sira: "asc" },
        select: {
          id: true,
          proje_id: true,
          ad: true,
          sira: true,
          tip: true,
          arsiv_mi: true,
          wip_limit: true,
          kartlar: {
            where: kartGorunurlukWhere(erisim),
            orderBy: { sira: "asc" },
            select: {
              id: true,
              baslik: true,
              aciklama: true,
              sira: true,
              kapak_renk: true,
              kapak_dosya_id: true,
              bitis: true,
              arsiv_mi: true,
              silindi_mi: true,
              _count: {
                select: {
                  yetkililer: true,
                  etiketler: true,
                  yorumlar: true,
                  eklentiler: true,
                },
              },
              // Why: kart-mini'deki "tamamlanan/toplam" rozeti için —
              // KontrolMaddesi Kart'a iki seviye uzakta, _count doğrudan
              // ulaşamaz. Tek query'de tüm maddelerin yalnızca
              // `tamamlandi_mi` alanını çek, JS'te topla (N+1 yok).
              kontrol_listeleri: {
                select: {
                  maddeler: { select: { tamamlandi_mi: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!proje) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  // Kapak görselleri — kart_kapak_dosya_id'leri toplu çek, presigned URL üret.
  // N+1 yerine tek query + paralel presign (Kural 43).
  const kapakIdler = Array.from(
    new Set(
      proje.listeler.flatMap((l) =>
        l.kartlar.map((k) => k.kapak_dosya_id).filter((x): x is string => !!x),
      ),
    ),
  );
  const kapakDosyalar = kapakIdler.length
    ? await db.eklenti.findMany({
        where: { id: { in: kapakIdler }, silindi_mi: false },
        select: { id: true, depolama_yolu: true, mime: true },
      })
    : [];
  const kapakUrlEntries = await Promise.all(
    kapakDosyalar.map(async (e) => {
      try {
        const url = await presignedDownload(e.depolama_yolu);
        return [e.id, { url, mime: e.mime }] as const;
      } catch {
        // Storage erişilemezse kapak yokmuş gibi davran — kart yine görünür.
        return null;
      }
    }),
  );
  const kapakMap = new Map(
    kapakUrlEntries.filter((x): x is readonly [string, { url: string; mime: string }] => !!x),
  );

  return {
    id: proje.id,
    ad: proje.ad,
    aciklama: proje.aciklama,
    kapak_renk: proje.kapak_renk,
    kapak_ikon: proje.kapak_ikon,
    yildizli_mi: proje.yildizli_mi,
    arsiv_mi: proje.arsiv_mi,
    silindi_mi: proje.silindi_mi,
    listeler: proje.listeler.map((l) => ({
      id: l.id,
      proje_id: l.proje_id,
      ad: l.ad,
      sira: l.sira,
      tip: l.tip,
      arsiv_mi: l.arsiv_mi,
      wip_limit: l.wip_limit,
      kartlar: l.kartlar.map((k) => {
        const tumMaddeler = k.kontrol_listeleri.flatMap((kl) => kl.maddeler);
        const madde_toplam = tumMaddeler.length;
        const madde_tamamlanan = tumMaddeler.filter((m) => m.tamamlandi_mi).length;
        return {
          id: k.id,
          baslik: k.baslik,
          aciklama: k.aciklama,
          sira: k.sira,
          kapak_renk: k.kapak_renk,
          kapak: k.kapak_dosya_id ? kapakMap.get(k.kapak_dosya_id) ?? null : null,
          bitis: k.bitis,
          arsiv_mi: k.arsiv_mi,
          silindi_mi: k.silindi_mi,
          yetkili_sayisi: k._count.yetkililer,
          etiket_sayisi: k._count.etiketler,
          yorum_sayisi: k._count.yorumlar,
          ek_sayisi: k._count.eklentiler,
          madde_toplam,
          madde_tamamlanan,
        };
      }),
    })),
  };
}

// ============================================================
// Liste (kolon) işlemleri
// ============================================================

export async function listeOlustur(
  kullaniciId: string,
  girdi: ListeOlustur,
): Promise<ListeOzeti> {
  await projeyeErisimDogrula(kullaniciId, girdi.proje_id);
  const erisim = await kaynakErisimi(kullaniciId);

  // ADR-0009 — Yeni NORMAL liste Arşiv'in (sira="ZZZZ") ÖNCESİNE eklenir.
  // findFirst + tip=NORMAL ile son normal listenin sıraısını alıp ardı.
  const son = await db.liste.findFirst({
    where: { proje_id: girdi.proje_id, tip: ListeTipi.NORMAL },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.liste.create({
    data: {
      proje_id: girdi.proje_id,
      ad: girdi.ad.trim(),
      sira,
      tip: ListeTipi.NORMAL,
      yetkililer: { create: { kullanici_id: kullaniciId } },
      birimler: erisim.birimId
        ? { create: { birim_id: erisim.birimId } }
        : undefined,
    },
    select: {
      id: true,
      proje_id: true,
      ad: true,
      sira: true,
      tip: true,
      arsiv_mi: true,
      wip_limit: true,
    },
  });

  yayinla(SOCKET.LISTE_OLUSTUR, room.proje(girdi.proje_id), {
    proje_id: girdi.proje_id,
    liste: yeni,
  }).catch(() => {});
  return { ...yeni, kartlar: [] };
}

// ADR-0009 — sistem ARSIV listesinde rename/sil/sıra değişikliği reddedilir.
async function sistemListesiKoru(listeId: string): Promise<void> {
  const l = await db.liste.findUnique({
    where: { id: listeId },
    select: { tip: true },
  });
  if (l?.tip === ListeTipi.ARSIV) {
    throw new EylemHatasi(
      "Arşiv listesi sistem listesidir, değiştirilemez veya silinemez.",
      HATA_KODU.YETKISIZ,
    );
  }
}

export async function listeGuncelle(
  birimId: string,
  girdi: ListeGuncelle,
): Promise<void> {
  const { proje_id } = await listeyiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);
  await sistemListesiKoru(girdi.id);

  const veri: Record<string, unknown> = {};
  if (girdi.ad !== undefined) veri.ad = girdi.ad.trim();
  if (girdi.arsiv_mi !== undefined) veri.arsiv_mi = girdi.arsiv_mi;
  if (girdi.wip_limit !== undefined) veri.wip_limit = girdi.wip_limit;
  await db.liste.update({ where: { id: girdi.id }, data: veri });
  yayinla(SOCKET.LISTE_GUNCELLE, room.proje(proje_id), {
    proje_id,
    liste_id: girdi.id,
  }).catch(() => {});
}

export async function listeSil(birimId: string, id: string): Promise<void> {
  const { proje_id } = await listeyiBulVeProjeAl(birimId, id);
  await projeyeErisimDogrula(birimId, proje_id);
  await sistemListesiKoru(id);
  // Liste tamamen kaldırılır (kartlar onDelete: Cascade ile birlikte gider).
  // Çöp kutusu liste düzeyinde MVP dışında, ileride eklenebilir.
  await db.liste.delete({ where: { id } });
  yayinla(SOCKET.LISTE_SIL, room.proje(proje_id), {
    proje_id,
    liste_id: id,
  }).catch(() => {});
}

async function projeListeleriniRebalance(projeId: string): Promise<void> {
  const listeler = await db.liste.findMany({
    where: { proje_id: projeId },
    orderBy: { sira: "asc" },
    select: { id: true },
  });
  if (listeler.length === 0) return;

  const yeniSiralar: string[] = [];
  let son: string | null = null;
  for (let i = 0; i < listeler.length; i++) {
    const yeni = siraSonuna(son);
    yeniSiralar.push(yeni);
    son = yeni;
  }

  await db.$transaction(
    listeler.map((l, i) =>
      db.liste.update({ where: { id: l.id }, data: { sira: yeniSiralar[i] } }),
    ),
  );
}

export async function listeyeSiraVer(
  birimId: string,
  girdi: ListeSira,
): Promise<{ sira: string }> {
  await projeyeErisimDogrula(birimId, girdi.proje_id);
  // ADR-0009 — sistem ARSIV listesi sürüklenemez.
  await sistemListesiKoru(girdi.id);

  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.liste.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true, proje_id: true, tip: true },
          })
        : null,
      girdi.sonraki_id
        ? db.liste.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true, proje_id: true, tip: true },
          })
        : null,
    ]);
    if (onceki && onceki.proje_id !== girdi.proje_id) {
      throw new EylemHatasi(
        "Önceki liste farklı projeden.",
        HATA_KODU.YETKISIZ,
      );
    }
    if (sonraki && sonraki.proje_id !== girdi.proje_id) {
      throw new EylemHatasi(
        "Sonraki liste farklı projeden.",
        HATA_KODU.YETKISIZ,
      );
    }
    // ADR-0009 — Arşiv listesinin sağına başka liste atılamaz.
    // (Arşiv `onceki` olarak verilmesi yasaktır; `sonraki` her zaman Arşiv olabilir.)
    if (onceki?.tip === ListeTipi.ARSIV) {
      throw new EylemHatasi(
        "Arşiv listesi her zaman en sağdadır; sağına liste konulamaz.",
        HATA_KODU.YETKISIZ,
      );
    }
    return { onceki, sonraki };
  }

  let { onceki, sonraki } = await komsulariOku();

  let yeniSira: string;
  try {
    yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
  } catch (err) {
    if (err instanceof Error && err.message.includes("alfabe tabanı")) {
      await projeListeleriniRebalance(girdi.proje_id);
      const yeni = await komsulariOku();
      onceki = yeni.onceki;
      sonraki = yeni.sonraki;
      yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
    } else {
      throw err;
    }
  }

  await db.liste.update({ where: { id: girdi.id }, data: { sira: yeniSira } });
  yayinla(SOCKET.LISTE_SIRALA, room.proje(girdi.proje_id), {
    proje_id: girdi.proje_id,
    liste_id: girdi.id,
    sira: yeniSira,
  }).catch(() => {});
  return { sira: yeniSira };
}

// ============================================================
// Kart işlemleri
// ============================================================

export async function kartOlustur(
  kullaniciId: string,
  girdi: KartOlustur,
): Promise<ListeKartOzeti & { liste_id: string }> {
  const { proje_id } = await listeyiBulVeProjeAl(kullaniciId, girdi.liste_id);
  await projeyeErisimDogrula(kullaniciId, proje_id);
  const erisim = await kaynakErisimi(kullaniciId);

  const son = await db.kart.findFirst({
    where: { liste_id: girdi.liste_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.kart.create({
    data: {
      liste_id: girdi.liste_id,
      baslik: girdi.baslik.trim(),
      aciklama: girdi.aciklama?.trim() || null,
      sira,
      olusturan_id: kullaniciId,
      yetkililer: { create: { kullanici_id: kullaniciId } },
      birimler: erisim.birimId
        ? { create: { birim_id: erisim.birimId } }
        : undefined,
    },
    select: {
      id: true,
      liste_id: true,
      baslik: true,
      aciklama: true,
      sira: true,
      kapak_renk: true,
      bitis: true,
      arsiv_mi: true,
      silindi_mi: true,
    },
  });

  const sonuc = {
    id: yeni.id,
    liste_id: yeni.liste_id,
    baslik: yeni.baslik,
    aciklama: yeni.aciklama,
    sira: yeni.sira,
    kapak_renk: yeni.kapak_renk,
    kapak: null,
    bitis: yeni.bitis,
    arsiv_mi: yeni.arsiv_mi,
    silindi_mi: yeni.silindi_mi,
    yetkili_sayisi: 1,
    etiket_sayisi: 0,
    yorum_sayisi: 0,
    ek_sayisi: 0,
    madde_toplam: 0,
    madde_tamamlanan: 0,
  };
  yayinla(SOCKET.KART_OLUSTUR, room.proje(proje_id), {
    proje_id,
    kart: sonuc,
  }).catch(() => {});
  return sonuc;
}

export async function kartGuncelle(
  birimId: string,
  girdi: KartGuncelle,
): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);

  const veri: Record<string, unknown> = {};
  if (girdi.baslik !== undefined) veri.baslik = girdi.baslik.trim();
  if (girdi.aciklama !== undefined) veri.aciklama = girdi.aciklama?.trim() || null;
  if (girdi.kapak_renk !== undefined) veri.kapak_renk = girdi.kapak_renk;
  if (girdi.baslangic !== undefined) veri.baslangic = girdi.baslangic;
  if (girdi.bitis !== undefined) veri.bitis = girdi.bitis;
  if (girdi.arsiv_mi !== undefined) veri.arsiv_mi = girdi.arsiv_mi;

  await db.kart.update({ where: { id: girdi.id }, data: veri });
  yayinla(SOCKET.KART_GUNCELLE, room.proje(proje_id), {
    proje_id,
    kart_id: girdi.id,
  }).catch(() => {});
}

export async function kartSil(birimId: string, id: string): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, id);
  await projeyeErisimDogrula(birimId, proje_id);
  await db.kart.update({
    where: { id },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
  yayinla(SOCKET.KART_SIL, room.proje(proje_id), {
    proje_id,
    kart_id: id,
  }).catch(() => {});
}

export async function kartGeriYukle(
  birimId: string,
  id: string,
): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, id);
  await projeyeErisimDogrula(birimId, proje_id);
  await db.kart.update({
    where: { id },
    data: { silindi_mi: false, silinme_zamani: null },
  });
  yayinla(SOCKET.KART_GERI_YUKLE, room.proje(proje_id), {
    proje_id,
    kart_id: id,
  }).catch(() => {});
}

// LexoRank "0" tabanına ulaşıldığında bir listenin tüm kartlarını yeniden
// sıralayıp sira string'lerini geniş aralıklara dağıtır (rebalance).
// Mevcut sıralama korunur — sadece sira string'leri değişir.
async function listeKartlariniRebalance(listeId: string): Promise<void> {
  const kartlar = await db.kart.findMany({
    where: { liste_id: listeId },
    orderBy: { sira: "asc" },
    select: { id: true },
  });
  if (kartlar.length === 0) return;

  // M, T, Z, ZM, ... gibi geniş aralıklı yeni sıralar üret.
  const yeniSiralar: string[] = [];
  let son: string | null = null;
  for (let i = 0; i < kartlar.length; i++) {
    const yeni = siraSonuna(son);
    yeniSiralar.push(yeni);
    son = yeni;
  }

  await db.$transaction(
    kartlar.map((k, i) =>
      db.kart.update({ where: { id: k.id }, data: { sira: yeniSiralar[i] } }),
    ),
  );
}

export async function kartiTasi(
  birimId: string,
  girdi: KartTasi,
): Promise<{ sira: string; liste_id: string }> {
  // ADR-0009 — taşınan kartın mevcut listesi + hedef liste tipini birlikte oku
  // (NORMAL ↔ ARSIV geçişlerinde arsiv_mi/arsiv_oncesi_liste_id de güncellenir).
  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      liste_id: true,
      arsiv_oncesi_liste_id: true,
      liste: { select: { proje_id: true, tip: true } },
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const kaynakProjeId = kart.liste.proje_id;
  const kaynakTip = kart.liste.tip;

  const hedefListe = await db.liste.findUnique({
    where: { id: girdi.hedef_liste_id },
    select: { proje_id: true, tip: true },
  });
  if (!hedefListe) {
    throw new EylemHatasi("Hedef liste bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const hedefProjeId = hedefListe.proje_id;
  const hedefTip = hedefListe.tip;

  // Aynı proje içinde olmalı (proje arası taşıma şu anda kapsam dışı).
  // Plan S3: drag-drop "proje içi/arası" yazıyor — proje arası ileride
  // ProjeYetkilisi yetki kontrolü ile genişletilir; MVP'de proje içi kabul.
  if (kaynakProjeId !== hedefProjeId) {
    throw new EylemHatasi(
      "Kart şu anda sadece aynı proje içinde taşınabilir.",
      HATA_KODU.YETKISIZ,
    );
  }

  await projeyeErisimDogrula(birimId, hedefProjeId);

  // Komşu kartları oku ve doğrula
  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.kart.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true, liste_id: true },
          })
        : null,
      girdi.sonraki_id
        ? db.kart.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true, liste_id: true },
          })
        : null,
    ]);
    if (onceki && onceki.liste_id !== girdi.hedef_liste_id) {
      throw new EylemHatasi(
        "Önceki kart hedef listeden değil.",
        HATA_KODU.YETKISIZ,
      );
    }
    if (sonraki && sonraki.liste_id !== girdi.hedef_liste_id) {
      throw new EylemHatasi(
        "Sonraki kart hedef listeden değil.",
        HATA_KODU.YETKISIZ,
      );
    }
    return { onceki, sonraki };
  }

  let { onceki, sonraki } = await komsulariOku();

  // siraArasi LexoRank "0" tabanına çarpabilir — hedef liste rebalance edip
  // tekrar dene.
  let yeniSira: string;
  try {
    yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
  } catch (err) {
    if (err instanceof Error && err.message.includes("alfabe tabanı")) {
      // Hedef listenin sıralarını rebalance et, komşuları yeniden oku, tekrar dene
      await listeKartlariniRebalance(girdi.hedef_liste_id);
      const yeni = await komsulariOku();
      onceki = yeni.onceki;
      sonraki = yeni.sonraki;
      yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
    } else {
      throw err;
    }
  }

  // ADR-0009 — drag-drop ile NORMAL ↔ ARSIV geçişinde arşiv state'i güncellenir.
  const arsivVerisi: Prisma.KartUncheckedUpdateInput = {};
  if (kaynakTip === ListeTipi.NORMAL && hedefTip === ListeTipi.ARSIV) {
    // Arşivle: eski liste id'sini sakla
    arsivVerisi.arsiv_mi = true;
    arsivVerisi.arsiv_oncesi_liste_id = kart.liste_id;
    arsivVerisi.arsiv_zamani = new Date();
  } else if (kaynakTip === ListeTipi.ARSIV && hedefTip === ListeTipi.NORMAL) {
    // Arşivden çıkar
    arsivVerisi.arsiv_mi = false;
    arsivVerisi.arsiv_oncesi_liste_id = null;
    arsivVerisi.arsiv_zamani = null;
  }

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      liste_id: girdi.hedef_liste_id,
      sira: yeniSira,
      ...arsivVerisi,
    },
  });
  yayinla(SOCKET.KART_TASI, room.proje(hedefProjeId), {
    proje_id: hedefProjeId,
    kart_id: girdi.id,
    liste_id: girdi.hedef_liste_id,
    sira: yeniSira,
  }).catch(() => {});

  return { sira: yeniSira, liste_id: girdi.hedef_liste_id };
}

// ADR-0009 — Kart arşivle/arşivden çıkar (sistem ARSIV listesine taşır veya
// arsiv_oncesi_liste_id'ye geri yükler). Bağlam menüsü ve kart modalı bunu
// kullanır; drag-drop alternatif yol.
export async function kartArsivToggle(
  birimId: string,
  girdi: KartArsiv,
): Promise<{ liste_id: string }> {
  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      liste_id: true,
      arsiv_oncesi_liste_id: true,
      liste: { select: { proje_id: true, tip: true } },
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  const projeId = kart.liste.proje_id;
  await projeyeErisimDogrula(birimId, projeId);

  let hedefListeId: string;
  const guncelleme: Prisma.KartUncheckedUpdateInput = {};

  if (girdi.arsiv) {
    // ARŞİVLE
    if (kart.liste.tip === ListeTipi.ARSIV) {
      // Zaten arşivde — no-op
      return { liste_id: kart.liste_id };
    }
    hedefListeId = await arsivListesiniSagla(projeId);
    guncelleme.arsiv_mi = true;
    guncelleme.arsiv_oncesi_liste_id = kart.liste_id;
    guncelleme.arsiv_zamani = new Date();
  } else {
    // ARŞİVDEN ÇIKAR
    if (kart.liste.tip === ListeTipi.NORMAL) {
      // Zaten arşiv değil — no-op
      return { liste_id: kart.liste_id };
    }
    // Önceki liste hala mevcut mu?
    let geriDonusListeId: string | null = null;
    if (kart.arsiv_oncesi_liste_id) {
      const eski = await db.liste.findUnique({
        where: { id: kart.arsiv_oncesi_liste_id },
        select: { id: true, tip: true, proje_id: true },
      });
      if (
        eski &&
        eski.tip === ListeTipi.NORMAL &&
        eski.proje_id === projeId
      ) {
        geriDonusListeId = eski.id;
      }
    }
    if (!geriDonusListeId) {
      // Önceki liste yoksa veya silinmişse, projenin ilk NORMAL listesine
      const ilkNormal = await db.liste.findFirst({
        where: { proje_id: projeId, tip: ListeTipi.NORMAL },
        orderBy: { sira: "asc" },
        select: { id: true },
      });
      if (!ilkNormal) {
        throw new EylemHatasi(
          "Geri yüklenecek normal liste bulunamadı.",
          HATA_KODU.BULUNAMADI,
        );
      }
      geriDonusListeId = ilkNormal.id;
    }
    hedefListeId = geriDonusListeId;
    guncelleme.arsiv_mi = false;
    guncelleme.arsiv_oncesi_liste_id = null;
    guncelleme.arsiv_zamani = null;
  }

  // Hedef listenin sonuna ekle
  const sonKart = await db.kart.findFirst({
    where: { liste_id: hedefListeId },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const yeniSira = siraSonuna(sonKart?.sira ?? null);

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      liste_id: hedefListeId,
      sira: yeniSira,
      ...guncelleme,
    },
  });

  yayinla(SOCKET.KART_TASI, room.proje(projeId), {
    proje_id: projeId,
    kart_id: girdi.id,
    liste_id: hedefListeId,
    sira: yeniSira,
  }).catch(() => {});

  return { liste_id: hedefListeId };
}

// Liste görünümü için düz kart listesi (DataTable beslemesi).
export type LisedeKart = ListeKartOzeti & {
  liste_id: string;
  liste_ad: string;
};

export async function projedeTumKartlar(
  kullaniciId: string,
  projeId: string,
): Promise<LisedeKart[]> {
  await projeyeErisimDogrula(kullaniciId, projeId);
  const erisim = await kaynakErisimi(kullaniciId);

  const kartlar = await db.kart.findMany({
    where: {
      ...kartGorunurlukWhere(erisim),
      liste: { proje_id: projeId, ...listeGorunurlukWhere(erisim) },
    },
    orderBy: [{ liste: { sira: "asc" } }, { sira: "asc" }],
    select: {
      id: true,
      liste_id: true,
      liste: { select: { ad: true } },
      baslik: true,
      aciklama: true,
      sira: true,
      kapak_renk: true,
      bitis: true,
      arsiv_mi: true,
      silindi_mi: true,
      _count: {
        select: {
          yetkililer: true,
          etiketler: true,
          yorumlar: { where: { silindi_mi: false } },
          eklentiler: { where: { silindi_mi: false } },
        },
      },
      kontrol_listeleri: {
        select: {
          maddeler: { select: { tamamlandi_mi: true } },
        },
      },
    },
  });

  return kartlar.map((k) => {
    const tumMaddeler = k.kontrol_listeleri.flatMap((kl) => kl.maddeler);
    const madde_toplam = tumMaddeler.length;
    const madde_tamamlanan = tumMaddeler.filter((m) => m.tamamlandi_mi).length;
    return {
    id: k.id,
    liste_id: k.liste_id,
    liste_ad: k.liste.ad,
    baslik: k.baslik,
    aciklama: k.aciklama,
    sira: k.sira,
    kapak_renk: k.kapak_renk,
    // Liste görünümü tablo — kapak görseli MVP'de gösterilmez (DataTable
    // satır yüksekliği uniform). Tip uyumu için null.
    kapak: null,
    bitis: k.bitis,
    arsiv_mi: k.arsiv_mi,
    silindi_mi: k.silindi_mi,
    yetkili_sayisi: k._count.yetkililer,
    etiket_sayisi: k._count.etiketler,
    yorum_sayisi: k._count.yorumlar,
    ek_sayisi: k._count.eklentiler,
    madde_toplam,
    madde_tamamlanan,
    };
  });
}
