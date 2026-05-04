import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { presignedDownload } from "@/lib/storage";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import type {
  KartGuncelle,
  KartOlustur,
  KartTasi,
  ListeGuncelle,
  ListeOlustur,
  ListeSira,
} from "./schemas";

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
  uye_sayisi: number;
  etiket_sayisi: number;
};

export type ListeOzeti = {
  id: string;
  proje_id: string;
  ad: string;
  sira: string;
  arsiv_mi: boolean;
  wip_limit: number | null;
  kartlar: ListeKartOzeti[];
};

export type ProjeDetayOzeti = {
  id: string;
  ad: string;
  aciklama: string | null;
  kapak_renk: string | null;
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
  // Saf model: liste sadece dogrudan atama (uye/birim) veya alt karta atama varsa gorunur
  const kartKosullari: Prisma.KartWhereInput[] = [
    { uyeler: { some: { kullanici_id: erisim.kullaniciId } } },
  ];
  if (erisim.birimId) {
    kartKosullari.push({ birimler: { some: { birim_id: erisim.birimId } } });
  }
  const kosullar: Prisma.ListeWhereInput[] = [
    { uyeler: { some: { kullanici_id: erisim.kullaniciId } } },
    { kartlar: { some: { OR: kartKosullari } } },
  ];
  if (erisim.birimId) {
    kosullar.push({ birimler: { some: { birim_id: erisim.birimId } } });
  }
  return { arsiv_mi: false, OR: kosullar };
}

function kartGorunurlukWhere(
  erisim: KaynakErisimi,
): Prisma.KartWhereInput {
  if (erisim.makam) return { silindi_mi: false, arsiv_mi: false };
  // Saf model: kart sadece dogrudan atama varsa gorunur
  const kosullar: Prisma.KartWhereInput[] = [
    { uyeler: { some: { kullanici_id: erisim.kullaniciId } } },
  ];
  if (erisim.birimId) {
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
              _count: { select: { uyeler: true, etiketler: true } },
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
    yildizli_mi: proje.yildizli_mi,
    arsiv_mi: proje.arsiv_mi,
    silindi_mi: proje.silindi_mi,
    listeler: proje.listeler.map((l) => ({
      id: l.id,
      proje_id: l.proje_id,
      ad: l.ad,
      sira: l.sira,
      arsiv_mi: l.arsiv_mi,
      wip_limit: l.wip_limit,
      kartlar: l.kartlar.map((k) => ({
        id: k.id,
        baslik: k.baslik,
        aciklama: k.aciklama,
        sira: k.sira,
        kapak_renk: k.kapak_renk,
        kapak: k.kapak_dosya_id ? kapakMap.get(k.kapak_dosya_id) ?? null : null,
        bitis: k.bitis,
        arsiv_mi: k.arsiv_mi,
        silindi_mi: k.silindi_mi,
        uye_sayisi: k._count.uyeler,
        etiket_sayisi: k._count.etiketler,
      })),
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

  const son = await db.liste.findFirst({
    where: { proje_id: girdi.proje_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.liste.create({
    data: {
      proje_id: girdi.proje_id,
      ad: girdi.ad.trim(),
      sira,
      uyeler: { create: { kullanici_id: kullaniciId } },
      birimler: erisim.birimId
        ? { create: { birim_id: erisim.birimId } }
        : undefined,
    },
    select: {
      id: true,
      proje_id: true,
      ad: true,
      sira: true,
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

export async function listeGuncelle(
  birimId: string,
  girdi: ListeGuncelle,
): Promise<void> {
  const { proje_id } = await listeyiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);

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

  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.liste.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true, proje_id: true },
          })
        : null,
      girdi.sonraki_id
        ? db.liste.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true, proje_id: true },
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
      uyeler: { create: { kullanici_id: kullaniciId } },
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
    uye_sayisi: 1,
    etiket_sayisi: 0,
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
  const { proje_id: kaynakProjeId } = await kartiBulVeProjeAl(birimId, girdi.id);
  const { proje_id: hedefProjeId } = await listeyiBulVeProjeAl(
    birimId,
    girdi.hedef_liste_id,
  );

  // Aynı proje içinde olmalı (proje arası taşıma şu anda kapsam dışı).
  // Plan S3: drag-drop "proje içi/arası" yazıyor — proje arası ileride
  // ProjeUyesi yetki kontrolü ile genişletilir; MVP'de proje içi kabul.
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

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      liste_id: girdi.hedef_liste_id,
      sira: yeniSira,
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
      _count: { select: { uyeler: true, etiketler: true } },
    },
  });

  return kartlar.map((k) => ({
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
    uye_sayisi: k._count.uyeler,
    etiket_sayisi: k._count.etiketler,
  }));
}
