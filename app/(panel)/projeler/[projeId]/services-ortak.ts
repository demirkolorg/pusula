// Sprint 3 / S3-2 — Proje detay servisi parça dosyası: ortak helper + tip.
// ADR-0032 mega dosya bölmesi. services-liste / services-kart / services-detay
// hepsi bu dosyadaki helper ve tipleri kullanır.

import { ListeTipi, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import type { TiptapDokuman } from "@/lib/tiptap";

// =====================================================================
// ADR-0009 — Arşiv sistem listesi sabitleri
// =====================================================================
// `ARSIV_LISTESI_SIRA` LexoRank'in "Z" prefix sona ekleme garantisi;
// NORMAL listeler arasındaki yeni sıralar bunun öncesini üretir.
export const ARSIV_LISTESI_SIRA = "ZZZZ";
export const ARSIV_LISTESI_AD = "Arşiv";

// =====================================================================
// Tipler
// =====================================================================

export type KartKapakOzeti = {
  url: string;
  mime: string;
};

// ADR-0019 string union — Prisma enum'u runtime'da import etmeden literal
// type kullanımı (kart-tamamla-kontrol.ts'teki OneriDurumu ile aynı).
export type OneriDurumu = "YOK" | "BEKLIYOR" | "REDDEDILDI";

export type ListeKartOzeti = {
  id: string;
  baslik: string;
  // ADR-0023 — Tiptap zengin metin. `aciklama_dokuman` ProseMirror Doc JSON;
  // `aciklama_metin` server'da türetilen düz metin (line-clamp listesi,
  // arama önizleme, tsvector). UI editör `aciklama_dokuman`'a yazar.
  aciklama_dokuman: TiptapDokuman | null;
  aciklama_metin: string | null;
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
  // Trello tarzı kart bütünü tamamlama bayrağı. Kontrol listesi maddelerinden
  // bağımsız; KartMini ve KartModalBaslik solundaki yuvarlak toggle'ı sürer.
  tamamlandi_mi: boolean;
  // ADR-0019 — öneri/onay flow alanları. UI'daki ToggleModu hesabı bu alanları
  // okur (oneriDurumuHesapla helper'ı).
  tamamlanma_oneri_durumu: OneriDurumu;
  tamamlanma_oneren_id: string | null;
  tamamlanma_oneren: { ad: string; soyad: string } | null;
  tamamlanma_oneri_zamani: Date | null;
  tamamlanma_red_sebebi: string | null;
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

// Liste görünümü için düz kart listesi (DataTable beslemesi).
export type LisedeKart = ListeKartOzeti & {
  liste_id: string;
  liste_ad: string;
};

// =====================================================================
// Erişim helper'ı + görünürlük where'leri
// =====================================================================

export type KaynakErisimi = {
  kullaniciId: string;
  birimId: string | null;
  makam: boolean;
};

export async function kaynakErisimi(
  kullaniciId: string,
): Promise<KaynakErisimi> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  return { kullaniciId, birimId: erisim.birimId, makam: erisim.makam };
}

export function listeGorunurlukWhere(
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
    kosullar.push({
      proje: { birimler: { some: { birim_id: erisim.birimId } } },
    });
    kosullar.push({ birimler: { some: { birim_id: erisim.birimId } } });
  }
  return { arsiv_mi: false, OR: kosullar };
}

export function kartGorunurlukWhere(
  erisim: KaynakErisimi,
): Prisma.KartWhereInput {
  // ADR-0009 — Arşivlenen kart fiziksel olarak ARSIV sistem listesine taşınır;
  // `arsiv_mi` flag'i artık gizleme amaçlı değil, UI durum (Arşivle ↔ Arşivden
  // çıkar) içindir. Kanban'da Arşiv listesinin kartlarını gösterebilmek için
  // bu filtre kaldırıldı; "ARSIV listede gizlemek" ile "kart arşivlendi" aynı
  // kavram olduğundan filtre çift filtrelemeye yol açıyordu.
  if (erisim.makam) return { silindi_mi: false };
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
  return { silindi_mi: false, OR: kosullar };
}

// =====================================================================
// Yetkilendirme yardımcıları (proje/liste/kart varlık + soft-delete)
// =====================================================================

export async function projeyeErisimDogrula(
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

export async function listeyiBulVeProjeAl(
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

export async function kartiBulVeProjeAl(
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

// =====================================================================
// Ziyaret kaydı — ana sayfa "son ziyaret edilen" widget'ı için
// =====================================================================

// Sprint 2 / S2-8 — kullanıcı sayfayı her açışta upsert tetikleniyordu;
// kart navigasyonu sayfayı tekrar yükler → her tıklama 1× yazma. 1 saatlik
// throttle: son ziyaret <1 saat ise upsert atlanır. findUnique okuması
// tek index hit, write'tan çok daha ucuz.
const ZIYARET_THROTTLE_MS = 60 * 60 * 1000;

export async function projeyiZiyaretEt(
  kullaniciId: string,
  projeId: string,
): Promise<void> {
  try {
    const mevcut = await db.projeZiyareti.findUnique({
      where: {
        kullanici_id_proje_id: {
          kullanici_id: kullaniciId,
          proje_id: projeId,
        },
      },
      select: { son_ziyaret: true },
    });
    if (
      mevcut &&
      Date.now() - mevcut.son_ziyaret.getTime() < ZIYARET_THROTTLE_MS
    ) {
      return;
    }
    await db.projeZiyareti.upsert({
      where: {
        kullanici_id_proje_id: {
          kullanici_id: kullaniciId,
          proje_id: projeId,
        },
      },
      create: { kullanici_id: kullaniciId, proje_id: projeId },
      update: { son_ziyaret: new Date() },
    });
  } catch {
    // Soft fail — ziyaret kaydı kritik değil, sayfa render bloklanmasın.
  }
}
