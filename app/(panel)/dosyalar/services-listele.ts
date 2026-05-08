// ADR-0028 / Sprint 3 S3-3 — Dosya listele/detay/indir/önizle/metin akışları.

import { DosyaDurumu, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import { presignedDosyaDownload } from "@/lib/dosya-storage";
import { yetkiZorunluDosya } from "@/lib/dosya-yetki";
import { kullaniciDosyaBaglantiKapsami } from "@/lib/yetki-erisim";
import { onizlemeStratejisi } from "@/lib/dosya-onizleme";
import type { DosyaListeFiltre } from "./schemas";
import { dosyayiBulSilinmemis, hata } from "./services-ortak";

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
    const erisimKosulu = await kullaniciDosyaBaglantiKapsami(kullaniciId);
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
  const url = await presignedDosyaDownload(d.depolama_yolu, d.mime);
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
  const url = await presignedDosyaDownload(d.depolama_yolu, d.mime);
  await db.dosyaErisimLogu.create({
    data: { dosya_id: dosyaId, kullanici_id: kullaniciId, tip: "ONIZLEME" },
  });
  return { url, strateji };
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

  const url = await presignedDosyaDownload(d.depolama_yolu, d.mime);
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
