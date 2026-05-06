// ADR-0028 — Dosyalar / Proje Görünümü (file manager tarzı)
//
// Bu modül, dosyalar sayfasının "Proje Görünümü" sekmesi için iki sorgu sunar:
//
//   1. projeKlasorListesi(kullaniciId) — kullanıcının erişebildiği projeler;
//      her biri için dosya sayısı + en son yükleme zamanı (klasör kartları).
//   2. projeIciDosyaAgaci(kullaniciId, projeId) — bir proje içindeki dosyaları
//      kart/liste hiyerarşisinde gruplar (Windows Explorer benzeri drilldown).
//
// Yetki: `canProje("proje:read")` her drilldown'da; klasör listesinde ise
// `kullaniciErisimBilgisi` + üyelik filtresi (services.ts'in `kullaniciKaynakKapsami`
// fonksiyonu ile aynı mantık) — makam/kaymakam hepsini görür.
//
// Performans: liste sorguları tek pass; dosya tarafı denormalize FK'ler (proje_id,
// liste_id, kart_id) sayesinde join'siz. (Kural 43, 44.)

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kullaniciErisimBilgisi, canProje } from "@/lib/yetki";

// =====================================================================
// Tipler
// =====================================================================

export type ProjeKlasoru = {
  id: string;
  ad: string;
  aciklama: string | null;
  kapak_renk: string | null;
  kapak_ikon: string | null;
  yildizli_mi: boolean;
  dosya_sayisi: number;
  son_dosya_zamani: Date | null;
};

export type ProjeIciDosya = {
  id: string;
  ad: string;
  mime: string;
  uzanti: string | null;
  kategori: string;
  boyut: number;
  durum: string;
  olusturma_zamani: Date;
  yukleyen: { id: string; ad: string; soyad: string };
};

export type ProjeKartGrubu = {
  id: string;
  baslik: string;
  dosyalar: ProjeIciDosya[];
};

export type ProjeListeGrubu = {
  id: string;
  ad: string;
  dosyalar: ProjeIciDosya[]; // doğrudan listeye bağlı, kartı olmayan
  kartlar: ProjeKartGrubu[];
};

export type ProjeIciDosyaAgaci = {
  proje: {
    id: string;
    ad: string;
    aciklama: string | null;
    kapak_renk: string | null;
    kapak_ikon: string | null;
  };
  dogrudan_dosyalar: ProjeIciDosya[]; // proje seviyesinde bağlanmış
  listeler: ProjeListeGrubu[];
  toplam_dosya: number;
};

// =====================================================================
// Yardımcılar
// =====================================================================

function hata(
  mesaj: string,
  kod: keyof typeof HATA_KODU = "GECERSIZ_GIRDI",
): never {
  throw new EylemHatasi(mesaj, HATA_KODU[kod]);
}

const DOSYA_SELECT = {
  id: true,
  ad: true,
  mime: true,
  uzanti: true,
  kategori: true,
  boyut: true,
  durum: true,
  olusturma_zamani: true,
  yukleyen: { select: { id: true, ad: true, soyad: true } },
} as const satisfies Prisma.DosyaSelect;

/**
 * Kullanıcının erişebildiği proje id'lerini döndürür. Makam (SUPER_ADMIN/KAYMAKAM)
 * tüm aktif projeleri görür. Diğerleri: yetkili olduğu proje, birim üyesi olduğu
 * proje veya alt liste/kartında yetkili olduğu proje.
 */
async function erisilebilenProjeIdleri(
  kullaniciId: string,
): Promise<{ tumu: boolean; idler: string[] }> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (erisim.makam) {
    return { tumu: true, idler: [] };
  }
  const projeler = await db.proje.findMany({
    where: {
      silindi_mi: false,
      OR: [
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        erisim.birimId
          ? { birimler: { some: { birim_id: erisim.birimId } } }
          : { id: { in: [] } },
        {
          listeler: {
            some: {
              OR: [
                { yetkililer: { some: { kullanici_id: kullaniciId } } },
                erisim.birimId
                  ? { birimler: { some: { birim_id: erisim.birimId } } }
                  : { id: { in: [] } },
                {
                  kartlar: {
                    some: {
                      yetkililer: { some: { kullanici_id: kullaniciId } },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  return { tumu: false, idler: projeler.map((p) => p.id) };
}

// =====================================================================
// Klasör (proje) listesi — Proje Görünümü ana sayfa
// =====================================================================

export async function projeKlasorListesi(
  kullaniciId: string,
): Promise<ProjeKlasoru[]> {
  const erisim = await erisilebilenProjeIdleri(kullaniciId);

  const projeler = await db.proje.findMany({
    where: {
      silindi_mi: false,
      ...(erisim.tumu ? {} : { id: { in: erisim.idler } }),
    },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      kapak_ikon: true,
      yildizli_mi: true,
    },
    orderBy: [{ ad: "asc" }],
  });
  if (projeler.length === 0) return [];

  // Her projenin dosya sayısı + son dosya zamanı — tek groupBy çağrısı.
  const sayimlar = await db.dosyaBaglantisi.groupBy({
    by: ["proje_id"],
    where: {
      proje_id: { in: projeler.map((p) => p.id) },
      dosya: { silindi_mi: false },
    },
    _count: { _all: true },
    _max: { olusturma_zamani: true },
  });
  const sayimMap = new Map(
    sayimlar
      .filter((s): s is typeof s & { proje_id: string } => s.proje_id !== null)
      .map((s) => [
        s.proje_id,
        {
          adet: s._count._all,
          son: s._max.olusturma_zamani,
        },
      ]),
  );

  return projeler.map((p) => {
    const s = sayimMap.get(p.id);
    return {
      id: p.id,
      ad: p.ad,
      aciklama: p.aciklama,
      kapak_renk: p.kapak_renk,
      kapak_ikon: p.kapak_ikon,
      yildizli_mi: p.yildizli_mi,
      dosya_sayisi: s?.adet ?? 0,
      son_dosya_zamani: s?.son ?? null,
    };
  });
}

// =====================================================================
// Proje içi dosya ağacı — drilldown
// =====================================================================

export async function projeIciDosyaAgaci(
  kullaniciId: string,
  projeId: string,
): Promise<ProjeIciDosyaAgaci> {
  if (!(await canProje(kullaniciId, "proje:read", projeId))) {
    hata("Bu projeye erişim yetkiniz yok.", "YETKISIZ");
  }

  const proje = await db.proje.findUnique({
    where: { id: projeId, silindi_mi: false },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      kapak_ikon: true,
    },
  });
  if (!proje) hata("Proje bulunamadı.", "BULUNAMADI");

  // Tek sorguda projeye bağlı tüm aktif dosyaları + bağlantı meta'larını çek.
  const baglantilar = await db.dosyaBaglantisi.findMany({
    where: {
      proje_id: projeId,
      dosya: { silindi_mi: false },
    },
    select: {
      kaynak_tip: true,
      liste_id: true,
      kart_id: true,
      olusturma_zamani: true,
      dosya: { select: DOSYA_SELECT },
    },
    orderBy: { olusturma_zamani: "desc" },
  });

  // Aynı dosya birden çok bağlantıda görünebilir → set ile tekille,
  // hiyerarşide en spesifik bağlantıyı koru (KART > LISTE > PROJE).
  const yerlesim = new Map<
    string,
    {
      dosya: ProjeIciDosya;
      yer: "KART" | "LISTE" | "PROJE";
      liste_id: string | null;
      kart_id: string | null;
    }
  >();
  for (const b of baglantilar) {
    const yer: "KART" | "LISTE" | "PROJE" =
      b.kart_id ? "KART" : b.liste_id ? "LISTE" : "PROJE";
    const onceki = yerlesim.get(b.dosya.id);
    if (
      onceki &&
      oncelikSayisi(onceki.yer) >= oncelikSayisi(yer)
    ) {
      continue;
    }
    yerlesim.set(b.dosya.id, {
      dosya: b.dosya as ProjeIciDosya,
      yer,
      liste_id: b.liste_id,
      kart_id: b.kart_id,
    });
  }

  const listeIdleri = new Set<string>();
  const kartIdleri = new Set<string>();
  for (const v of yerlesim.values()) {
    if (v.liste_id) listeIdleri.add(v.liste_id);
    if (v.kart_id) kartIdleri.add(v.kart_id);
  }

  const [listeler, kartlar] = await Promise.all([
    listeIdleri.size > 0
      ? db.liste.findMany({
          where: { id: { in: Array.from(listeIdleri) }, proje_id: projeId },
          select: { id: true, ad: true, sira: true },
          orderBy: { sira: "asc" },
        })
      : Promise.resolve([]),
    kartIdleri.size > 0
      ? db.kart.findMany({
          where: {
            id: { in: Array.from(kartIdleri) },
            liste: { proje_id: projeId },
          },
          select: {
            id: true,
            baslik: true,
            sira: true,
            liste_id: true,
          },
          orderBy: { sira: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Liste id → kart listesi map'i + listeId yoksa fallback için ayrı kova.
  const listeMap = new Map<string, ProjeListeGrubu>();
  for (const l of listeler) {
    listeMap.set(l.id, { id: l.id, ad: l.ad, dosyalar: [], kartlar: [] });
  }

  const kartMap = new Map<string, ProjeKartGrubu & { liste_id: string }>();
  for (const k of kartlar) {
    kartMap.set(k.id, {
      id: k.id,
      baslik: k.baslik,
      liste_id: k.liste_id,
      dosyalar: [],
    });
  }

  const dogrudan: ProjeIciDosya[] = [];
  for (const v of yerlesim.values()) {
    if (v.yer === "KART" && v.kart_id) {
      const k = kartMap.get(v.kart_id);
      if (k) {
        k.dosyalar.push(v.dosya);
        continue;
      }
    }
    if (v.yer === "LISTE" && v.liste_id) {
      const l = listeMap.get(v.liste_id);
      if (l) {
        l.dosyalar.push(v.dosya);
        continue;
      }
    }
    dogrudan.push(v.dosya);
  }

  // Kartları ait olduğu listenin altına yerleştir.
  for (const k of kartMap.values()) {
    const l = listeMap.get(k.liste_id);
    if (l) {
      l.kartlar.push({ id: k.id, baslik: k.baslik, dosyalar: k.dosyalar });
    } else {
      // Liste silinmişse veya proje değişmişse: doğrudan kova yerine
      // sentetik "Bilinmeyen liste" oluşturmaktansa kart dosyalarını
      // dogrudan'a ekle (kullanıcı yine erişebilsin).
      dogrudan.push(...k.dosyalar);
    }
  }

  return {
    proje: proje!,
    dogrudan_dosyalar: dogrudan,
    listeler: Array.from(listeMap.values()),
    toplam_dosya: yerlesim.size,
  };
}

// =====================================================================
// Yardımcı: bağlantı önceliği
// =====================================================================

function oncelikSayisi(yer: "KART" | "LISTE" | "PROJE"): number {
  switch (yer) {
    case "KART":
      return 3;
    case "LISTE":
      return 2;
    case "PROJE":
      return 1;
  }
}
