import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import { kapsamBaglamiHazirla, kapsamWhere, zenginlestirVeOzetle } from "@/lib/aktivite";
import type {
  AnaSayfaMetrik,
  BenimKartSatirim,
  MakamKpi,
  SonAktiviteSatiri,
  SonZiyaretProjeSatiri,
} from "./schemas";

// Türkiye standardı: hafta Pazartesi başlar. UTC olarak hesaplanır,
// DB karşılaştırmasında saat dilimi farkından bağımsız çalışır.
function buHaftaninBaslangici(simdi: Date = new Date()): Date {
  const tarih = new Date(simdi);
  tarih.setHours(0, 0, 0, 0);
  const gun = tarih.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  const fark = gun === 0 ? -6 : 1 - gun;
  tarih.setDate(tarih.getDate() + fark);
  return tarih;
}

// Kullanıcının erişebildiği projelerin id listesi.
// Yetkili / birim / listede yetkili / kartta yetkili — herhangi bir bağ.
// Makam (SUPER_ADMIN/KAYMAKAM) kullanıcılar için filtre uygulanmaz.
async function erisimliProjeIdleri(kullaniciId: string): Promise<string[] | null> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (erisim.makam) return null; // null = "tüm projeler"

  const birimKosulu = erisim.birimId
    ? { birim_id: erisim.birimId }
    : { birim_id: { in: [] } };

  const erisimKosullari: Prisma.ProjeWhereInput[] = [
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
  ];

  const projeler = await db.proje.findMany({
    where: { silindi_mi: false, OR: erisimKosullari },
    select: { id: true },
  });
  return projeler.map((p) => p.id);
}

// ============================================================
// Metrik kartları (4 küçük sayı + "bu hafta" 3'lüsü)
// ============================================================

export async function anaSayfaMetrikleriniGetir(
  kullaniciId: string,
  email: string,
): Promise<AnaSayfaMetrik> {
  const haftaBasi = buHaftaninBaslangici();
  const simdi = new Date();
  const erisim = await kullaniciErisimBilgisi(kullaniciId);

  // ADR-0026 — makam (KAYMAKAM/SUPER_ADMIN) için sayımlar sistem geneli;
  // kişisel modda kart yetkisi + email/davet_eden_id filtreleri uygulanır.
  if (erisim.makam) return makamMetrikleri(haftaBasi, simdi);
  return kisiselMetrikler(kullaniciId, email, haftaBasi, simdi);
}

async function kisiselMetrikler(
  kullaniciId: string,
  email: string,
  haftaBasi: Date,
  simdi: Date,
): Promise<AnaSayfaMetrik> {
  const benimAcikKartFiltre: Prisma.KartWhereInput = {
    silindi_mi: false,
    arsiv_mi: false,
    tamamlandi_mi: false,
    yetkililer: { some: { kullanici_id: kullaniciId } },
  };

  const [
    acikGorev,
    geciken,
    buHaftaBitenlerim,
    buHaftaTamamladiklarim,
    buHaftaTakim,
    bekleyenDavetGelen,
    bekleyenDavetGiden,
  ] = await Promise.all([
    db.kart.count({ where: benimAcikKartFiltre }),
    db.kart.count({
      where: { ...benimAcikKartFiltre, bitis: { lt: simdi, not: null } },
    }),
    db.kart.count({
      where: {
        silindi_mi: false,
        tamamlandi_mi: true,
        tamamlanma_zamani: { gte: haftaBasi },
        yetkililer: { some: { kullanici_id: kullaniciId } },
      },
    }),
    db.kart.count({
      where: {
        silindi_mi: false,
        tamamlandi_mi: true,
        tamamlayan_id: kullaniciId,
        tamamlanma_zamani: { gte: haftaBasi },
      },
    }),
    takimBuHaftaSayisi(kullaniciId, haftaBasi),
    db.davetTokeni.count({
      where: {
        email,
        kullanildi_mi: false,
        son_kullanma: { gt: simdi },
      },
    }),
    db.davetTokeni.count({
      where: {
        davet_eden_id: kullaniciId,
        kullanildi_mi: false,
        son_kullanma: { gt: simdi },
      },
    }),
  ]);

  return {
    kapsam: "kisisel",
    acikGorev,
    geciken,
    buHaftaBitenlerim,
    buHaftaTamamladiklarim,
    buHaftaTakim,
    bekleyenDavetGelen,
    bekleyenDavetGiden,
    bekleyenDavetTum: bekleyenDavetGelen + bekleyenDavetGiden,
  };
}

// Sistem ölçeği: kart yetkilisi filtresi yok, davet'te gelen/giden ayrımı
// yok (makam zaten tüm sistemi yönetir, ayrım anlamsız). Bu hafta sayıları
// sadece "Takım" satırını besler; kişisel "Sen/bana atanan" alanları 0 döner.
async function makamMetrikleri(
  haftaBasi: Date,
  simdi: Date,
): Promise<AnaSayfaMetrik> {
  const sistemAcikKartFiltre: Prisma.KartWhereInput = {
    silindi_mi: false,
    arsiv_mi: false,
    tamamlandi_mi: false,
  };

  const [acikGorev, geciken, buHaftaTakim, bekleyenDavetTum] = await Promise.all([
    db.kart.count({ where: sistemAcikKartFiltre }),
    db.kart.count({
      where: { ...sistemAcikKartFiltre, bitis: { lt: simdi, not: null } },
    }),
    db.kart.count({
      where: {
        silindi_mi: false,
        tamamlandi_mi: true,
        tamamlanma_zamani: { gte: haftaBasi },
      },
    }),
    db.davetTokeni.count({
      where: { kullanildi_mi: false, son_kullanma: { gt: simdi } },
    }),
  ]);

  return {
    kapsam: "sistem",
    acikGorev,
    geciken,
    buHaftaBitenlerim: 0,
    buHaftaTamamladiklarim: 0,
    buHaftaTakim,
    bekleyenDavetGelen: 0,
    bekleyenDavetGiden: 0,
    bekleyenDavetTum,
  };
}

// Kullanıcının eriştiği projelerde bu hafta tamamlanan tüm kartlar.
async function takimBuHaftaSayisi(
  kullaniciId: string,
  haftaBasi: Date,
): Promise<number> {
  const projeIdler = await erisimliProjeIdleri(kullaniciId);
  const listeFiltre: Prisma.ListeWhereInput =
    projeIdler === null ? {} : { proje_id: { in: projeIdler } };

  return db.kart.count({
    where: {
      silindi_mi: false,
      tamamlandi_mi: true,
      tamamlanma_zamani: { gte: haftaBasi },
      liste: listeFiltre,
    },
  });
}

// ============================================================
// Bana atanan kartlar — sol kolon listesi
// ============================================================

export async function benimAcikKartlarim(
  kullaniciId: string,
  limit = 10,
): Promise<BenimKartSatirim[]> {
  const kartlar = await db.kart.findMany({
    where: {
      silindi_mi: false,
      arsiv_mi: false,
      tamamlandi_mi: false,
      yetkililer: { some: { kullanici_id: kullaniciId } },
    },
    orderBy: [
      // bitis NULL'lar sona; geciken üste
      { bitis: { sort: "asc", nulls: "last" } },
      { olusturma_zamani: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      baslik: true,
      bitis: true,
      tamamlandi_mi: true,
      liste: {
        select: {
          id: true,
          ad: true,
          proje: {
            select: {
              id: true,
              ad: true,
              kapak_renk: true,
              kapak_ikon: true,
            },
          },
        },
      },
    },
  });

  return kartlar.map((k) => ({
    id: k.id,
    baslik: k.baslik,
    bitis: k.bitis,
    tamamlandi_mi: k.tamamlandi_mi,
    liste: {
      id: k.liste.id,
      ad: k.liste.ad,
      proje: {
        id: k.liste.proje.id,
        ad: k.liste.proje.ad,
        kapak_renk: k.liste.proje.kapak_renk,
        kapak_ikon: k.liste.proje.kapak_ikon,
      },
    },
  }));
}

// ============================================================
// Son aktiviteler — kullanıcının erişebildiği projelerden
// ============================================================

export async function sonAktiviteleriGetir(
  kullaniciId: string,
  limit = 20,
): Promise<SonAktiviteSatiri[]> {
  const baglam = await kapsamBaglamiHazirla(kullaniciId);
  const kosul = kapsamWhere(baglam);

  // Ham audit kayıtlarını çek — `zenginlestirVeOzetle` user-friendly
  // `AktiviteOzeti[]` üretir (mesaj + alan diff'leri + proje/liste/kart bağlamı).
  // Proje aktivite modülüyle aynı tip/UI = tutarlılık.
  const kayitlar = await db.aktiviteLogu.findMany({
    where: kosul,
    orderBy: { zaman: "desc" },
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

  return zenginlestirVeOzetle(kayitlar);
}

// ============================================================
// Son ziyaret edilen projeler
// ============================================================

export async function sonZiyaretEdilenProjeleriGetir(
  kullaniciId: string,
  limit = 6,
): Promise<SonZiyaretProjeSatiri[]> {
  const ziyaretler = await db.projeZiyareti.findMany({
    where: {
      kullanici_id: kullaniciId,
      proje: { silindi_mi: false },
    },
    orderBy: { son_ziyaret: "desc" },
    take: limit,
    select: {
      proje_id: true,
      son_ziyaret: true,
      proje: {
        select: {
          ad: true,
          kapak_renk: true,
          kapak_ikon: true,
          yildizli_mi: true,
        },
      },
    },
  });

  return ziyaretler.map((z) => ({
    proje_id: z.proje_id,
    son_ziyaret: z.son_ziyaret,
    ad: z.proje.ad,
    kapak_renk: z.proje.kapak_renk,
    kapak_ikon: z.proje.kapak_ikon,
    yildizli_mi: z.proje.yildizli_mi,
  }));
}

// ============================================================
// Makam KPI şeridi (ADR-0026) — sadece SUPER_ADMIN/KAYMAKAM
// ============================================================

// Non-makam için null döner; page.tsx mount kararını buna göre verir.
// Yetki kontrolü servis seviyesinde — UI sadece görünür çıkmasın diye değil,
// veri sızmasın diye de kapatır.
export async function makamKpisiniGetir(
  kullaniciId: string,
): Promise<MakamKpi | null> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (!erisim.makam) return null;

  const simdi = new Date();
  const yediGunOnce = new Date(simdi);
  yediGunOnce.setDate(yediGunOnce.getDate() - 7);
  const yirmiDortSaatOnce = new Date(simdi);
  yirmiDortSaatOnce.setHours(yirmiDortSaatOnce.getHours() - 24);

  const [
    aktifProje,
    aktifKullaniciSon7Gun,
    onayBekleyenKullanici,
    kritikHataSon24Sa,
  ] = await Promise.all([
    db.proje.count({ where: { silindi_mi: false } }),
    db.kullanici.count({
      where: {
        silindi_mi: false,
        aktif: true,
        son_giris_zamani: { gte: yediGunOnce },
      },
    }),
    db.kullanici.count({
      where: { silindi_mi: false, onay_durumu: "BEKLIYOR" },
    }),
    db.hataLogu.count({
      where: {
        zaman: { gte: yirmiDortSaatOnce },
        seviye: { in: ["FATAL", "ERROR"] },
        cozuldu_mu: false,
      },
    }),
  ]);

  return {
    aktifProje,
    aktifKullaniciSon7Gun,
    onayBekleyenKullanici,
    kritikHataSon24Sa,
  };
}

// Test edilebilir helper'lar dışarıya açık.
export const _icDestek = { buHaftaninBaslangici };
