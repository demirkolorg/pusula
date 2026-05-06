// ADR-0028 / F4 — Dosya yönetimi service katmanı (Prisma + business logic).
//
// Action'lar bu modüldeki helper'ları çağırır; tüm yetki/RBAC kontrolleri
// burada VEYA action wrapper'da yapılır. Service tek bir transaction'a
// güvenir (Kural 45 — çoklu yazma transaction içinde).

import { nanoid } from "nanoid";
import {
  DosyaDurumu,
  DosyaGizlilik,
  DosyaKaynakTipi,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import { dosyaKategorisi, dosyaUzantisi } from "@/lib/dosya-kategori";
import {
  uploadGirdisiniDogrula,
  kategoriBoyutLimiti,
} from "@/lib/dosya-guvenlik";
import {
  DOSYA_BUCKET,
  dosyaObjesiBoyutuAl,
  dosyaObjesiniSil,
  dosyaYoluUret,
  presignedDosyaDownload,
  presignedDosyaUpload,
} from "@/lib/dosya-storage";
import { canDosya, yetkiZorunluDosya } from "@/lib/dosya-yetki";
import { onizlemeStratejisi } from "@/lib/dosya-onizleme";
import { canKart, canListe, canProje } from "@/lib/yetki";
import type {
  DosyaListeFiltre,
  DosyaYuklemeBaslatGirdi,
  DosyaYuklemeOnaylaGirdi,
  DosyaSurumYuklemeBaslatGirdi,
  DosyaSurumYuklemeOnaylaGirdi,
  DosyaAdGuncelleGirdi,
  DosyaAciklamaGuncelleGirdi,
  DosyaGizlilikGuncelleGirdi,
  DosyaEtiketleriGuncelleGirdi,
  DosyaEtiketiOlusturGirdi,
  DosyaBaglantiEkleGirdi,
} from "./schemas";

const UPLOAD_OTURUMU_TTL_DK = 30;

// =====================================================================
// Yardımcılar
// =====================================================================

function hata(mesaj: string, kod: keyof typeof HATA_KODU = "GECERSIZ_GIRDI"): never {
  throw new EylemHatasi(mesaj, HATA_KODU[kod]);
}

async function dosyayiBulSilinmemis(
  dosyaId: string,
): Promise<{
  id: string;
  yukleyen_id: string;
  bucket: string;
  depolama_yolu: string;
  silindi_mi: boolean;
}> {
  const d = await db.dosya.findUnique({
    where: { id: dosyaId },
    select: {
      id: true,
      yukleyen_id: true,
      bucket: true,
      depolama_yolu: true,
      silindi_mi: true,
    },
  });
  if (!d) hata("Dosya bulunamadı.", "BULUNAMADI");
  return d;
}

async function kaynagaErisimZorunlu(
  kullaniciId: string,
  kaynakTip: DosyaKaynakTipi,
  kaynakId: string,
  edit: boolean,
): Promise<{ proje_id: string | null; liste_id: string | null; kart_id: string | null }> {
  if (kaynakTip === "KART") {
    const ok = edit
      ? await canKart(kullaniciId, "kart:edit", kaynakId)
      : await canKart(kullaniciId, "kart:read", kaynakId);
    if (!ok) hata("Bu karta erişim yetkiniz yok.", "YETKISIZ");
    const k = await db.kart.findUnique({
      where: { id: kaynakId },
      select: { id: true, liste: { select: { id: true, proje_id: true } } },
    });
    if (!k) hata("Kart bulunamadı.", "BULUNAMADI");
    return {
      kart_id: k.id,
      liste_id: k.liste.id,
      proje_id: k.liste.proje_id,
    };
  }
  if (kaynakTip === "LISTE") {
    const ok = edit
      ? await canListe(kullaniciId, "liste:edit", kaynakId)
      : await canListe(kullaniciId, "liste:read", kaynakId);
    if (!ok) hata("Bu listeye erişim yetkiniz yok.", "YETKISIZ");
    const l = await db.liste.findUnique({
      where: { id: kaynakId },
      select: { id: true, proje_id: true },
    });
    if (!l) hata("Liste bulunamadı.", "BULUNAMADI");
    return { liste_id: l.id, proje_id: l.proje_id, kart_id: null };
  }
  // PROJE
  const ok = edit
    ? await canProje(kullaniciId, "proje:edit", kaynakId)
    : await canProje(kullaniciId, "proje:read", kaynakId);
  if (!ok) hata("Bu projeye erişim yetkiniz yok.", "YETKISIZ");
  const p = await db.proje.findUnique({
    where: { id: kaynakId },
    select: { id: true },
  });
  if (!p) hata("Proje bulunamadı.", "BULUNAMADI");
  return { proje_id: p.id, liste_id: null, kart_id: null };
}

// =====================================================================
// Upload akışı (Plan Bölüm 10)
// =====================================================================

export interface YuklemeBaslatSonuc {
  oturum_id: string;
  upload_url: string;
  depolama_yolu: string;
  son_kullanma: Date;
}

export async function yuklemeBaslat(
  kullaniciId: string,
  girdi: DosyaYuklemeBaslatGirdi,
): Promise<YuklemeBaslatSonuc> {
  const dogrulama = uploadGirdisiniDogrula(girdi);
  if (!dogrulama.gecerli) {
    throw new EylemHatasi(dogrulama.sebep, HATA_KODU.GECERSIZ_GIRDI);
  }
  await kaynagaErisimZorunlu(kullaniciId, girdi.kaynak_tip, girdi.kaynak_id, true);

  // Yer tutucu dosyaId — gerçek dosya onayda yaratılır.
  const dosyaIdOn = nanoid(16);
  const yol = dosyaYoluUret(dosyaIdOn, 1, girdi.ad, nanoid(12));
  const son_kullanma = new Date(Date.now() + UPLOAD_OTURUMU_TTL_DK * 60_000);

  const oturum = await db.dosyaYuklemeOturumu.create({
    data: {
      kullanici_id: kullaniciId,
      kaynak_tip: girdi.kaynak_tip,
      kaynak_id: girdi.kaynak_id,
      ad: girdi.ad,
      mime: girdi.mime,
      boyut: girdi.boyut,
      depolama_yolu: yol,
      son_kullanma,
    },
    select: { id: true },
  });

  const upload_url = await presignedDosyaUpload(yol, girdi.mime);
  return {
    oturum_id: oturum.id,
    upload_url,
    depolama_yolu: yol,
    son_kullanma,
  };
}

export async function yuklemeOnayla(
  kullaniciId: string,
  girdi: DosyaYuklemeOnaylaGirdi,
): Promise<{ id: string }> {
  const oturum = await db.dosyaYuklemeOturumu.findUnique({
    where: { id: girdi.oturum_id },
  });
  if (!oturum) hata("Yükleme oturumu bulunamadı.", "BULUNAMADI");
  if (oturum.kullanici_id !== kullaniciId) {
    hata("Bu oturuma erişim yetkiniz yok.", "YETKISIZ");
  }
  if (oturum.son_kullanma < new Date()) {
    hata("Yükleme oturumunun süresi dolmuş.", "GECERSIZ_GIRDI");
  }
  if (oturum.durum !== DosyaDurumu.YUKLENIYOR) {
    hata("Oturum zaten tamamlanmış.", "GECERSIZ_GIRDI");
  }

  // Storage'da gerçekten upload edildi mi? (Stat ile boyut doğrulaması)
  let gercekBoyut: number;
  try {
    gercekBoyut = await dosyaObjesiBoyutuAl(oturum.depolama_yolu);
  } catch {
    hata("Dosya storage'da bulunamadı.", "BULUNAMADI");
  }
  if (gercekBoyut !== oturum.boyut) {
    hata(
      `Storage boyutu (${gercekBoyut}) bildirilen boyutla (${oturum.boyut}) uyuşmuyor.`,
      "GECERSIZ_GIRDI",
    );
  }

  const kategori = dosyaKategorisi(oturum.mime, oturum.ad);
  if (gercekBoyut > kategoriBoyutLimiti(kategori)) {
    hata(`${kategori} kategorisi boyut sınırını aşıyor.`, "GECERSIZ_GIRDI");
  }

  const baglantiKaynaklari = await kaynagaErisimZorunlu(
    kullaniciId,
    oturum.kaynak_tip,
    oturum.kaynak_id,
    true,
  );

  const sonuc = await db.$transaction(async (tx) => {
    const dosya = await tx.dosya.create({
      data: {
        yukleyen_id: kullaniciId,
        ad: oturum.ad,
        mime: oturum.mime,
        uzanti: dosyaUzantisi(oturum.ad),
        kategori,
        boyut: gercekBoyut,
        hash_sha256: girdi.hash_sha256 ?? null,
        bucket: DOSYA_BUCKET,
        depolama_yolu: oturum.depolama_yolu,
        durum: DosyaDurumu.HAZIR,
      },
      select: { id: true },
    });
    await tx.dosyaSurumu.create({
      data: {
        dosya_id: dosya.id,
        surum_no: 1,
        yukleyen_id: kullaniciId,
        ad: oturum.ad,
        mime: oturum.mime,
        boyut: gercekBoyut,
        hash_sha256: girdi.hash_sha256 ?? null,
        bucket: DOSYA_BUCKET,
        depolama_yolu: oturum.depolama_yolu,
      },
    });
    await tx.dosyaBaglantisi.create({
      data: {
        dosya_id: dosya.id,
        kaynak_tip: oturum.kaynak_tip,
        kaynak_id: oturum.kaynak_id,
        proje_id: baglantiKaynaklari.proje_id,
        liste_id: baglantiKaynaklari.liste_id,
        kart_id: baglantiKaynaklari.kart_id,
        ekleyen_id: kullaniciId,
        birincil_mi: true,
      },
    });
    await tx.dosyaYuklemeOturumu.update({
      where: { id: oturum.id },
      data: { durum: DosyaDurumu.HAZIR },
    });
    return dosya;
  });

  return { id: sonuc.id };
}

// =====================================================================
// Listeleme (Plan Bölüm 13) — kapsam-aware
// =====================================================================

export interface DosyaListeSatiri {
  id: string;
  ad: string;
  aciklama: string | null;
  mime: string;
  uzanti: string | null;
  kategori: string;
  boyut: number;
  durum: string;
  gizlilik: string;
  silindi_mi: boolean;
  olusturma_zamani: Date;
  yukleyen: { id: string; ad: string; soyad: string };
  baglantilar: Array<{
    kaynak_tip: string;
    proje_id: string | null;
    liste_id: string | null;
    kart_id: string | null;
  }>;
}

export interface DosyaListeSonuc {
  satirlar: DosyaListeSatiri[];
  sonraki_cursor: string | null;
}

export async function dosyalariListele(
  kullaniciId: string,
  filtre: DosyaListeFiltre,
): Promise<DosyaListeSonuc> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);

  const kosullar: Prisma.DosyaWhereInput[] = [];
  if (!filtre.silinmis) kosullar.push({ silindi_mi: false });
  else kosullar.push({ silindi_mi: true });

  if (filtre.kategori) kosullar.push({ kategori: filtre.kategori });
  if (filtre.durum) kosullar.push({ durum: filtre.durum });
  if (filtre.gizlilik) kosullar.push({ gizlilik: filtre.gizlilik });
  if (filtre.yukleyen_id) kosullar.push({ yukleyen_id: filtre.yukleyen_id });
  if (filtre.boyut_min !== undefined)
    kosullar.push({ boyut: { gte: filtre.boyut_min } });
  if (filtre.boyut_max !== undefined)
    kosullar.push({ boyut: { lte: filtre.boyut_max } });
  if (filtre.tarih_baslangic)
    kosullar.push({ olusturma_zamani: { gte: filtre.tarih_baslangic } });
  if (filtre.tarih_bitis)
    kosullar.push({ olusturma_zamani: { lte: filtre.tarih_bitis } });
  if (filtre.arama) {
    kosullar.push({
      OR: [
        { ad: { contains: filtre.arama, mode: "insensitive" } },
        { aciklama: { contains: filtre.arama, mode: "insensitive" } },
      ],
    });
  }

  // Kaynak filtreleri (denormalize alanları sayesinde join'siz)
  if (filtre.kart_id) {
    kosullar.push({ baglantilar: { some: { kart_id: filtre.kart_id } } });
  } else if (filtre.liste_id) {
    kosullar.push({ baglantilar: { some: { liste_id: filtre.liste_id } } });
  } else if (filtre.proje_id) {
    kosullar.push({ baglantilar: { some: { proje_id: filtre.proje_id } } });
  }

  if (filtre.baglantisiz) {
    if (!erisim.makam) {
      // Bağsız listesi yetkili kullanıcılara açık (Plan 11.2)
      hata("Bağsız dosya listesi için yetkiniz yok.", "YETKISIZ");
    }
    kosullar.push({ baglantilar: { none: {} } });
  }

  // Kapsam filtresi: makam değilse, kullanıcının erişebildiği bir bağlantısı
  // olan dosyalar VEYA kendi yüklediği orphan dosyalar.
  if (!erisim.makam) {
    const erisimKosulu = await kullaniciKaynakKapsami(kullaniciId);
    kosullar.push({
      OR: [
        { baglantilar: { some: erisimKosulu } },
        // Kendi yüklediği orphan
        {
          AND: [
            { yukleyen_id: kullaniciId },
            { baglantilar: { none: {} } },
          ],
        },
      ],
    });
  }

  // Sıralama
  const orderBy: Prisma.DosyaOrderByWithRelationInput[] =
    filtre.siralama === "yeni-eklenen"
      ? [{ olusturma_zamani: "desc" }, { id: "desc" }]
      : filtre.siralama === "eski-eklenen"
        ? [{ olusturma_zamani: "asc" }, { id: "asc" }]
        : filtre.siralama === "ad-asc"
          ? [{ ad: "asc" }, { id: "asc" }]
          : filtre.siralama === "ad-desc"
            ? [{ ad: "desc" }, { id: "desc" }]
            : filtre.siralama === "boyut-asc"
              ? [{ boyut: "asc" }, { id: "asc" }]
              : filtre.siralama === "boyut-desc"
                ? [{ boyut: "desc" }, { id: "desc" }]
                : filtre.siralama === "son-indirme"
                  ? [{ son_indirme_zamani: "desc" }, { id: "desc" }]
                  : [{ olusturma_zamani: "desc" }, { id: "desc" }];

  const limit = filtre.limit;
  const cursorOlsa = filtre.cursor
    ? { skip: 1, cursor: { id: filtre.cursor } }
    : {};

  const dosyalar = await db.dosya.findMany({
    where: { AND: kosullar },
    orderBy,
    take: limit + 1,
    ...cursorOlsa,
    select: {
      id: true,
      ad: true,
      aciklama: true,
      mime: true,
      uzanti: true,
      kategori: true,
      boyut: true,
      durum: true,
      gizlilik: true,
      silindi_mi: true,
      olusturma_zamani: true,
      yukleyen: { select: { id: true, ad: true, soyad: true } },
      baglantilar: {
        select: {
          kaynak_tip: true,
          proje_id: true,
          liste_id: true,
          kart_id: true,
        },
      },
    },
  });

  const fazla = dosyalar.length > limit;
  const veri = fazla ? dosyalar.slice(0, limit) : dosyalar;
  const sonraki_cursor = fazla ? veri[veri.length - 1]?.id ?? null : null;

  return { satirlar: veri, sonraki_cursor };
}

async function kullaniciKaynakKapsami(
  kullaniciId: string,
): Promise<Prisma.DosyaBaglantisiWhereInput> {
  // Kullanıcının erişebildiği proje/liste/kart id'lerini topla; tek where
  // koşulu olarak döner. Kapsamın dışındaki bağlantılar sızmaz.
  const erisim = await kullaniciErisimBilgisi(kullaniciId);

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
  const projeIdleri = projeler.map((p) => p.id);

  return {
    OR: [
      { proje_id: { in: projeIdleri } },
      { liste_id: { not: null }, proje_id: { in: projeIdleri } },
      { kart_id: { not: null }, proje_id: { in: projeIdleri } },
    ],
  };
}

// =====================================================================
// Detay
// =====================================================================

export async function dosyaDetay(kullaniciId: string, dosyaId: string) {
  await yetkiZorunluDosya(kullaniciId, "dosya:read", dosyaId);
  const d = await db.dosya.findUnique({
    where: { id: dosyaId },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      mime: true,
      uzanti: true,
      kategori: true,
      boyut: true,
      hash_sha256: true,
      durum: true,
      gizlilik: true,
      silindi_mi: true,
      silinme_zamani: true,
      olusturma_zamani: true,
      guncelleme_zamani: true,
      indirme_sayisi: true,
      son_indirme_zamani: true,
      yukleyen: { select: { id: true, ad: true, soyad: true } },
      baglantilar: {
        select: {
          id: true,
          kaynak_tip: true,
          kaynak_id: true,
          proje_id: true,
          liste_id: true,
          kart_id: true,
          ekleyen_id: true,
          olusturma_zamani: true,
        },
      },
      surumler: {
        orderBy: { surum_no: "desc" },
        select: {
          id: true,
          surum_no: true,
          ad: true,
          boyut: true,
          olusturma_zamani: true,
          aciklama: true,
        },
      },
      etiketler: {
        select: {
          etiket: { select: { id: true, ad: true, renk: true } },
        },
      },
    },
  });
  if (!d) hata("Dosya bulunamadı.", "BULUNAMADI");

  // Bağlı kaynak adlarını paralel çek — UI'da id yerine isim gösterilir.
  const kartIdleri = Array.from(
    new Set(d.baglantilar.filter((b) => b.kart_id).map((b) => b.kart_id!)),
  );
  const listeIdleri = Array.from(
    new Set(d.baglantilar.filter((b) => b.liste_id).map((b) => b.liste_id!)),
  );
  const projeIdleri = Array.from(
    new Set(d.baglantilar.filter((b) => b.proje_id).map((b) => b.proje_id!)),
  );

  const [kartlar, listeler, projeler] = await Promise.all([
    kartIdleri.length
      ? db.kart.findMany({
          where: { id: { in: kartIdleri } },
          select: { id: true, baslik: true, liste: { select: { proje_id: true } } },
        })
      : Promise.resolve([]),
    listeIdleri.length
      ? db.liste.findMany({
          where: { id: { in: listeIdleri } },
          select: { id: true, ad: true, proje_id: true },
        })
      : Promise.resolve([]),
    projeIdleri.length
      ? db.proje.findMany({
          where: { id: { in: projeIdleri } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
  ]);

  const kartMap = new Map(kartlar.map((k) => [k.id, k]));
  const listeMap = new Map(listeler.map((l) => [l.id, l]));
  const projeMap = new Map(projeler.map((p) => [p.id, p]));

  const baglantilarZenginlestirilmis = d.baglantilar.map((b) => {
    if (b.kaynak_tip === "KART" && b.kart_id) {
      const k = kartMap.get(b.kart_id);
      const projeId = k?.liste.proje_id ?? b.proje_id ?? null;
      return {
        ...b,
        kaynak_ad: k?.baslik ?? "Silinmiş kart",
        rota_proje_id: projeId,
      };
    }
    if (b.kaynak_tip === "LISTE" && b.liste_id) {
      const l = listeMap.get(b.liste_id);
      return {
        ...b,
        kaynak_ad: l?.ad ?? "Silinmiş liste",
        rota_proje_id: l?.proje_id ?? b.proje_id ?? null,
      };
    }
    if (b.kaynak_tip === "PROJE" && b.proje_id) {
      const p = projeMap.get(b.proje_id);
      return {
        ...b,
        kaynak_ad: p?.ad ?? "Silinmiş proje",
        rota_proje_id: p?.id ?? null,
      };
    }
    return { ...b, kaynak_ad: null as string | null, rota_proje_id: null };
  });

  return { ...d!, baglantilar: baglantilarZenginlestirilmis };
}

// =====================================================================
// İndir / Önizle (DosyaErisimLogu yazar)
// =====================================================================

export async function indirUrl(
  kullaniciId: string,
  dosyaId: string,
): Promise<{ url: string }> {
  await yetkiZorunluDosya(kullaniciId, "dosya:download", dosyaId);
  const d = await dosyayiBulSilinmemis(dosyaId);
  const url = await presignedDosyaDownload(d.depolama_yolu);
  await db.dosyaErisimLogu.create({
    data: { dosya_id: dosyaId, kullanici_id: kullaniciId, tip: "INDIRME" },
  });
  await db.dosya.update({
    where: { id: dosyaId },
    data: {
      indirme_sayisi: { increment: 1 },
      son_indirme_zamani: new Date(),
    },
  });
  return { url };
}

export async function onizlemeUrl(
  kullaniciId: string,
  dosyaId: string,
): Promise<{ url: string; strateji: string }> {
  await yetkiZorunluDosya(kullaniciId, "dosya:preview", dosyaId);
  const d = await db.dosya.findUnique({
    where: { id: dosyaId },
    select: {
      depolama_yolu: true,
      kategori: true,
      mime: true,
      durum: true,
      silindi_mi: true,
    },
  });
  if (!d || d.silindi_mi) hata("Dosya bulunamadı.", "BULUNAMADI");
  const strateji = onizlemeStratejisi(d.kategori, d.mime, d.durum);
  const url = await presignedDosyaDownload(d.depolama_yolu);
  await db.dosyaErisimLogu.create({
    data: { dosya_id: dosyaId, kullanici_id: kullaniciId, tip: "ONIZLEME" },
  });
  return { url, strateji };
}

// =====================================================================
// Metadata güncelleme
// =====================================================================

export async function adGuncelle(
  kullaniciId: string,
  girdi: DosyaAdGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:edit-meta", girdi.id);
  await db.dosya.update({
    where: { id: girdi.id },
    data: { ad: girdi.ad, uzanti: dosyaUzantisi(girdi.ad) },
  });
}

export async function aciklamaGuncelle(
  kullaniciId: string,
  girdi: DosyaAciklamaGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:edit-meta", girdi.id);
  await db.dosya.update({
    where: { id: girdi.id },
    data: { aciklama: girdi.aciklama },
  });
}

export async function gizlilikGuncelle(
  kullaniciId: string,
  girdi: DosyaGizlilikGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:edit-gizlilik", girdi.id);
  await db.dosya.update({
    where: { id: girdi.id },
    data: { gizlilik: girdi.gizlilik },
  });
}

// =====================================================================
// Etiket
// =====================================================================

export async function etiketleriGuncelle(
  kullaniciId: string,
  girdi: DosyaEtiketleriGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:tag", girdi.dosya_id);
  await db.$transaction(async (tx) => {
    await tx.dosyaEtiketBaglantisi.deleteMany({
      where: { dosya_id: girdi.dosya_id },
    });
    if (girdi.etiket_idleri.length === 0) return;
    await tx.dosyaEtiketBaglantisi.createMany({
      data: girdi.etiket_idleri.map((etiket_id) => ({
        dosya_id: girdi.dosya_id,
        etiket_id,
      })),
      skipDuplicates: true,
    });
  });
}

export async function etiketOlustur(
  kullaniciId: string,
  girdi: DosyaEtiketiOlusturGirdi,
): Promise<{ id: string }> {
  // Resource bağı yok — sistem izni (DOSYA_ETIKET_YONET) action wrapper'da
  // kontrol edilir; burada sadece create.
  const e = await db.dosyaEtiketi.create({
    data: {
      proje_id: girdi.proje_id ?? null,
      ad: girdi.ad,
      renk: girdi.renk ?? null,
      olusturan_id: kullaniciId,
    },
    select: { id: true },
  });
  return e;
}

export async function etiketSil(etiketId: string): Promise<void> {
  await db.dosyaEtiketi.delete({ where: { id: etiketId } });
}

// =====================================================================
// Bağlantı
// =====================================================================

export async function baglantiEkle(
  kullaniciId: string,
  girdi: DosyaBaglantiEkleGirdi,
): Promise<{ id: string }> {
  await yetkiZorunluDosya(kullaniciId, "dosya:link-add", girdi.dosya_id);
  const baglantiAlanlari = await kaynagaErisimZorunlu(
    kullaniciId,
    girdi.kaynak_tip,
    girdi.kaynak_id,
    true,
  );
  const yeni = await db.dosyaBaglantisi.create({
    data: {
      dosya_id: girdi.dosya_id,
      kaynak_tip: girdi.kaynak_tip,
      kaynak_id: girdi.kaynak_id,
      proje_id: baglantiAlanlari.proje_id,
      liste_id: baglantiAlanlari.liste_id,
      kart_id: baglantiAlanlari.kart_id,
      ekleyen_id: kullaniciId,
      birincil_mi: false,
    },
    select: { id: true },
  });
  return yeni;
}

export async function baglantiKaldir(
  kullaniciId: string,
  baglantiId: string,
): Promise<void> {
  const b = await db.dosyaBaglantisi.findUnique({
    where: { id: baglantiId },
    select: { dosya_id: true, kaynak_tip: true, kaynak_id: true },
  });
  if (!b) hata("Bağlantı bulunamadı.", "BULUNAMADI");
  // Hedef kaynakta edit yetkisi gerekir
  await kaynagaErisimZorunlu(kullaniciId, b.kaynak_tip, b.kaynak_id, true);
  // Dosyaya da link-remove izni
  await yetkiZorunluDosya(kullaniciId, "dosya:link-remove", b.dosya_id);
  await db.dosyaBaglantisi.delete({ where: { id: baglantiId } });
}

// =====================================================================
// Sürüm yükleme (mevcut Dosya'ya yeni sürüm)
// =====================================================================

export async function surumYuklemeBaslat(
  kullaniciId: string,
  girdi: DosyaSurumYuklemeBaslatGirdi,
): Promise<YuklemeBaslatSonuc> {
  await yetkiZorunluDosya(kullaniciId, "dosya:version-add", girdi.dosya_id);
  const dogrulama = uploadGirdisiniDogrula({
    ad: girdi.ad,
    mime: girdi.mime,
    boyut: girdi.boyut,
  });
  if (!dogrulama.gecerli) {
    throw new EylemHatasi(dogrulama.sebep, HATA_KODU.GECERSIZ_GIRDI);
  }
  const surumler = await db.dosyaSurumu.findMany({
    where: { dosya_id: girdi.dosya_id },
    orderBy: { surum_no: "desc" },
    take: 1,
    select: { surum_no: true },
  });
  const yeniSurumNo = (surumler[0]?.surum_no ?? 0) + 1;
  const yol = dosyaYoluUret(girdi.dosya_id, yeniSurumNo, girdi.ad, nanoid(12));
  const son_kullanma = new Date(Date.now() + UPLOAD_OTURUMU_TTL_DK * 60_000);
  // Surum yükleme oturumu için kaynak_tip null'lanamaz; convention olarak
  // KART tip + dosya_id kullan (ama gerçek kaynak girişten gelmiyor → hatalı).
  // Bu yüzden surum oturumunu doğrudan inline takip edeceğiz; mevcut tablo
  // kaynak alanlarını dosyanın birincil bağlantısından çek.
  const birincil = await db.dosyaBaglantisi.findFirst({
    where: { dosya_id: girdi.dosya_id, birincil_mi: true },
    select: { kaynak_tip: true, kaynak_id: true },
  });
  if (!birincil) hata("Dosyanın birincil bağlantısı yok.", "BULUNAMADI");

  const oturum = await db.dosyaYuklemeOturumu.create({
    data: {
      kullanici_id: kullaniciId,
      kaynak_tip: birincil.kaynak_tip,
      kaynak_id: birincil.kaynak_id,
      ad: girdi.ad,
      mime: girdi.mime,
      boyut: girdi.boyut,
      depolama_yolu: yol,
      son_kullanma,
      hata: `surum:${girdi.dosya_id}:${yeniSurumNo}`, // hata alanını surum işaretçisi olarak kullan
    },
    select: { id: true },
  });
  const upload_url = await presignedDosyaUpload(yol, girdi.mime);
  return { oturum_id: oturum.id, upload_url, depolama_yolu: yol, son_kullanma };
}

export async function surumYuklemeOnayla(
  kullaniciId: string,
  girdi: DosyaSurumYuklemeOnaylaGirdi,
): Promise<{ surum_id: string }> {
  const oturum = await db.dosyaYuklemeOturumu.findUnique({
    where: { id: girdi.oturum_id },
  });
  if (!oturum) hata("Oturum bulunamadı.", "BULUNAMADI");
  if (oturum.kullanici_id !== kullaniciId) hata("Yetkisiz.", "YETKISIZ");
  if (!oturum.hata?.startsWith("surum:")) hata("Sürüm oturumu değil.", "GECERSIZ_GIRDI");
  const parcalar = oturum.hata.split(":");
  const dosyaId = parcalar[1];
  const surumNoStr = parcalar[2];
  if (!dosyaId || !surumNoStr) hata("Sürüm oturumu bozuk.", "GECERSIZ_GIRDI");
  const surumNo = Number(surumNoStr);
  if (!Number.isFinite(surumNo)) hata("Sürüm numarası geçersiz.", "GECERSIZ_GIRDI");
  await yetkiZorunluDosya(kullaniciId, "dosya:version-add", dosyaId);

  let gercekBoyut: number;
  try {
    gercekBoyut = await dosyaObjesiBoyutuAl(oturum.depolama_yolu);
  } catch {
    hata("Dosya storage'da bulunamadı.", "BULUNAMADI");
  }
  if (gercekBoyut !== oturum.boyut) {
    hata("Boyut uyuşmazlığı.", "GECERSIZ_GIRDI");
  }

  const surum = await db.$transaction(async (tx) => {
    const yeni = await tx.dosyaSurumu.create({
      data: {
        dosya_id: dosyaId,
        surum_no: surumNo,
        yukleyen_id: kullaniciId,
        ad: oturum.ad,
        mime: oturum.mime,
        boyut: gercekBoyut,
        bucket: DOSYA_BUCKET,
        depolama_yolu: oturum.depolama_yolu,
        aciklama: girdi.aciklama ?? null,
      },
      select: { id: true },
    });
    await tx.dosya.update({
      where: { id: dosyaId },
      data: {
        aktif_surum_id: yeni.id,
        ad: oturum.ad,
        mime: oturum.mime,
        uzanti: dosyaUzantisi(oturum.ad),
        boyut: gercekBoyut,
        depolama_yolu: oturum.depolama_yolu,
      },
    });
    await tx.dosyaYuklemeOturumu.update({
      where: { id: oturum.id },
      data: { durum: DosyaDurumu.HAZIR },
    });
    return yeni;
  });
  return { surum_id: surum.id };
}

// =====================================================================
// Sil / Geri yükle / Kalıcı sil
// =====================================================================

export async function sil(
  kullaniciId: string,
  dosyaId: string,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:delete", dosyaId);
  await db.dosya.update({
    where: { id: dosyaId },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
}

export async function geriYukle(
  kullaniciId: string,
  dosyaId: string,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:restore", dosyaId);
  await db.dosya.update({
    where: { id: dosyaId },
    data: { silindi_mi: false, silinme_zamani: null },
  });
}

export async function kaliciSil(
  kullaniciId: string,
  dosyaId: string,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:purge", dosyaId);

  // Tüm sürümlerin storage objelerini sil + DB cascade
  const surumler = await db.dosyaSurumu.findMany({
    where: { dosya_id: dosyaId },
    select: { depolama_yolu: true },
  });
  await db.dosya.delete({ where: { id: dosyaId } });

  // Storage silme idempotent — başarısız obje cleanup cron'a düşer.
  for (const s of surumler) {
    try {
      await dosyaObjesiniSil(s.depolama_yolu);
    } catch {
      // Orphan obje — periodik GC.
    }
  }
}

// =====================================================================
// Metin önizleme — server-side fetch + boyut limiti
// =====================================================================

const METIN_ONIZLEME_MAKS_BYTE = 1024 * 1024; // 1MB

export async function metinIcerikGetir(
  kullaniciId: string,
  dosyaId: string,
): Promise<{ icerik: string; kesildi: boolean }> {
  await yetkiZorunluDosya(kullaniciId, "dosya:preview", dosyaId);

  const d = await db.dosya.findUnique({
    where: { id: dosyaId },
    select: {
      mime: true,
      boyut: true,
      kategori: true,
      durum: true,
      silindi_mi: true,
      depolama_yolu: true,
    },
  });
  if (!d || d.silindi_mi) hata("Dosya bulunamadı.", "BULUNAMADI");
  if (d.durum !== DosyaDurumu.HAZIR) hata("Dosya hazır değil.", "GECERSIZ_GIRDI");
  if (d.kategori !== "METIN") {
    hata("Bu dosya tipi metin önizleme desteklemez.", "GECERSIZ_GIRDI");
  }

  const url = await presignedDosyaDownload(d.depolama_yolu);
  const yanit = await fetch(url);
  if (!yanit.ok) {
    hata("Dosya storage'dan okunamadı.", "BULUNAMADI");
  }

  // Boyut limiti — büyük log dosyalarını streamleme yerine truncate.
  const buffer = await yanit.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const kesildi = bytes.length > METIN_ONIZLEME_MAKS_BYTE;
  const sinirli = kesildi
    ? bytes.subarray(0, METIN_ONIZLEME_MAKS_BYTE)
    : bytes;
  const icerik = new TextDecoder("utf-8", { fatal: false }).decode(sinirli);

  await db.dosyaErisimLogu.create({
    data: { dosya_id: dosyaId, kullanici_id: kullaniciId, tip: "ONIZLEME" },
  });

  return { icerik, kesildi };
}

// =====================================================================
// canDosya re-export (hooks ve UI için yardımcı)
// =====================================================================

export { canDosya };
