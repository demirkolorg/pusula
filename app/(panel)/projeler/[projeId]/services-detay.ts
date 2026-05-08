// Sprint 3 / S3-2 — Proje detay servisi parça dosyası: read/listele.
// ADR-0032 mega dosya bölmesi.
//
// İçerik:
//   - projeDetayiniGetir   — Pano + liste görünümü ortak veri (proje + listeler + kartlar)
//   - projedeTumKartlar    — Liste görünümü tablo beslemesi (DataTable)

import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { presignedDownload } from "@/lib/storage";
import type { TiptapDokuman } from "@/lib/tiptap";
import {
  type LisedeKart,
  type ProjeDetayOzeti,
  kartGorunurlukWhere,
  kaynakErisimi,
  listeGorunurlukWhere,
  projeyeErisimDogrula,
} from "./services-ortak";

// =====================================================================
// Proje detayı (pano + liste görünümü ortak veri)
// =====================================================================

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
              aciklama_dokuman: true,
              aciklama_metin: true,
              sira: true,
              kapak_renk: true,
              kapak_dosya_id: true,
              bitis: true,
              arsiv_mi: true,
              silindi_mi: true,
              tamamlandi_mi: true,
              tamamlanma_oneri_durumu: true,
              tamamlanma_oneren_id: true,
              tamamlanma_oneri_zamani: true,
              tamamlanma_red_sebebi: true,
              oneren: { select: { ad: true, soyad: true } },
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
  // Sprint 2 / S2-14 — ADR-0028 F8/F9: Dosya modeline geçiş. Kart.kapak_dosya_id
  // artık Dosya.id'ye işaret eder; Eklenti read-only ve drop edilecek (S2-16).
  const kapakDosyalar = kapakIdler.length
    ? await db.dosya.findMany({
        where: { id: { in: kapakIdler }, silindi_mi: false },
        select: { id: true, depolama_yolu: true, mime: true },
      })
    : [];
  const kapakUrlEntries = await Promise.all(
    kapakDosyalar.map(async (e) => {
      try {
        const url = await presignedDownload(e.depolama_yolu, e.mime);
        return [e.id, { url, mime: e.mime }] as const;
      } catch {
        // Storage erişilemezse kapak yokmuş gibi davran — kart yine görünür.
        return null;
      }
    }),
  );
  const kapakMap = new Map(
    kapakUrlEntries.filter(
      (x): x is readonly [string, { url: string; mime: string }] => !!x,
    ),
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
        const madde_tamamlanan = tumMaddeler.filter(
          (m) => m.tamamlandi_mi,
        ).length;
        return {
          id: k.id,
          baslik: k.baslik,
          // Prisma Json bridging — server-side schema ile yazılan değer.
          aciklama_dokuman: (k.aciklama_dokuman ?? null) as TiptapDokuman | null,
          aciklama_metin: k.aciklama_metin,
          sira: k.sira,
          kapak_renk: k.kapak_renk,
          kapak: k.kapak_dosya_id
            ? kapakMap.get(k.kapak_dosya_id) ?? null
            : null,
          bitis: k.bitis,
          arsiv_mi: k.arsiv_mi,
          silindi_mi: k.silindi_mi,
          tamamlandi_mi: k.tamamlandi_mi,
          tamamlanma_oneri_durumu: k.tamamlanma_oneri_durumu,
          tamamlanma_oneren_id: k.tamamlanma_oneren_id,
          tamamlanma_oneren: k.oneren,
          tamamlanma_oneri_zamani: k.tamamlanma_oneri_zamani,
          tamamlanma_red_sebebi: k.tamamlanma_red_sebebi,
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

// =====================================================================
// Liste görünümü (tablo beslemesi)
// =====================================================================

// Sprint 2 / S2-5 — pagination yokluğu kritik perf bulgusu (K-11). MVP için
// hard cap; cursor-based gelişme ileride DataTable server-side pagination
// ile birlikte gelir (Sprint 5 / observability ile birlikte).
const PROJE_KART_HARD_LIMIT = 1000;

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
    take: PROJE_KART_HARD_LIMIT,
    orderBy: [{ liste: { sira: "asc" } }, { sira: "asc" }],
    select: {
      id: true,
      liste_id: true,
      liste: { select: { ad: true } },
      baslik: true,
      aciklama_dokuman: true,
      aciklama_metin: true,
      sira: true,
      kapak_renk: true,
      bitis: true,
      arsiv_mi: true,
      silindi_mi: true,
      tamamlandi_mi: true,
      tamamlanma_oneri_durumu: true,
      tamamlanma_oneren_id: true,
      tamamlanma_oneri_zamani: true,
      tamamlanma_red_sebebi: true,
      oneren: { select: { ad: true, soyad: true } },
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
      aciklama_dokuman: (k.aciklama_dokuman ?? null) as TiptapDokuman | null,
      aciklama_metin: k.aciklama_metin,
      sira: k.sira,
      kapak_renk: k.kapak_renk,
      // Liste görünümü tablo — kapak görseli MVP'de gösterilmez (DataTable
      // satır yüksekliği uniform). Tip uyumu için null.
      kapak: null,
      bitis: k.bitis,
      arsiv_mi: k.arsiv_mi,
      silindi_mi: k.silindi_mi,
      tamamlandi_mi: k.tamamlandi_mi,
      tamamlanma_oneri_durumu: k.tamamlanma_oneri_durumu,
      tamamlanma_oneren_id: k.tamamlanma_oneren_id,
      tamamlanma_oneren: k.oneren,
      tamamlanma_oneri_zamani: k.tamamlanma_oneri_zamani,
      tamamlanma_red_sebebi: k.tamamlanma_red_sebebi,
      yetkili_sayisi: k._count.yetkililer,
      etiket_sayisi: k._count.etiketler,
      yorum_sayisi: k._count.yorumlar,
      ek_sayisi: k._count.eklentiler,
      madde_toplam,
      madde_tamamlanan,
    };
  });
}
