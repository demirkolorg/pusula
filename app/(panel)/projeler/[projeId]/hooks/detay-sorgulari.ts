"use client";

import { useQuery } from "@tanstack/react-query";
import { ListeTipi } from "@prisma/client";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { siraArasi, siraKarsilastir, siraSonuna } from "@/lib/sira";
import { tempId } from "@/lib/temp-id";
import {
  kartArsivEylem,
  kartGeriYukleEylem,
  kartGuncelleEylem,
  kartOlusturEylem,
  kartSilEylem,
  kartTasiEylem,
  listeGuncelleEylem,
  listeOlusturEylem,
  listeSilEylem,
  listeSiralaEylem,
  projeDetayEylem,
  projeKartlarEylem,
} from "../actions";
import { projeGuncelleEylem } from "../../actions";
import type { ProjeGuncelle } from "../../schemas";
import { kartAktiviteleriKey } from "../aktivite/keys";
import type {
  ListeKartOzeti,
  ListeOzeti,
  LisedeKart,
  ProjeDetayOzeti,
} from "../services";
import type {
  KartArsiv,
  KartGuncelle,
  KartOlustur,
  KartSil,
  KartTasi,
  ListeGuncelle,
  ListeOlustur,
  ListeSira,
  ListeSil,
} from "../schemas";

export const PROJE_DETAY_KEY = "proje-detay";
export const PROJE_KARTLAR_KEY = "proje-kartlar";

export function projeDetayKey(projeId: string) {
  return [PROJE_DETAY_KEY, projeId] as const;
}

export function projeKartlarKey(projeId: string) {
  return [PROJE_KARTLAR_KEY, projeId] as const;
}

export type DetayKey = ReturnType<typeof projeDetayKey>;

// ============================================================
// Sorgular
// ============================================================

// Server'dan gelen veriyi client tarafında ASCII sırasına göre yeniden sırala.
// Postgres'in default collation'ı locale-aware olabiliyor (tr_TR), bu da
// LexoRank string'lerinin ASCII sırasını bozuyor. Defensive normalize.
function detayiNormalle(d: ProjeDetayOzeti): ProjeDetayOzeti {
  return {
    ...d,
    listeler: [...d.listeler]
      .sort((a, b) => siraKarsilastir(a.sira, b.sira))
      .map((l) => ({
        ...l,
        kartlar: [...l.kartlar].sort((a, b) =>
          siraKarsilastir(a.sira, b.sira),
        ),
      })),
  };
}

export function useProjeDetay(projeId: string, ilkVeri?: ProjeDetayOzeti) {
  return useQuery({
    queryKey: projeDetayKey(projeId),
    queryFn: async () => {
      const r = await projeDetayEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return detayiNormalle(r.veri);
    },
    initialData: ilkVeri ? () => detayiNormalle(ilkVeri) : undefined,
    staleTime: Infinity, // realtime gelecek (S5'te); şimdilik manuel invalidate
  });
}

export function useProjeKartlari(projeId: string) {
  return useQuery({
    queryKey: projeKartlarKey(projeId),
    queryFn: async () => {
      const r = await projeKartlarEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri as LisedeKart[];
    },
    staleTime: Infinity,
  });
}

// ============================================================
// Yardımcı: detay cache'inde liste/kart bul ve değiştir
// ============================================================

function detayHaritala(
  eski: unknown,
  donusum: (d: ProjeDetayOzeti) => ProjeDetayOzeti,
): ProjeDetayOzeti | undefined {
  const d = eski as ProjeDetayOzeti | undefined;
  if (!d) return d;
  return donusum(d);
}

function listeyiGuncelle(
  d: ProjeDetayOzeti,
  listeId: string,
  fn: (l: ListeOzeti) => ListeOzeti,
): ProjeDetayOzeti {
  return {
    ...d,
    listeler: d.listeler.map((l) => (l.id === listeId ? fn(l) : l)),
  };
}

function guvenliSiraArasi(
  onceki: string | null,
  sonraki: string | null,
  mevcut: string,
): string {
  try {
    return siraArasi(onceki, sonraki);
  } catch {
    return mevcut;
  }
}

// ============================================================
// Liste mutation'ları
// ============================================================

export function useListeOlustur(anahtar: DetayKey) {
  return useOptimisticMutation<
    ListeOlustur & { id_taslak: string },
    ListeOzeti
  >({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(listeOlusturEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => {
        const sonSira = d.listeler[d.listeler.length - 1]?.sira ?? null;
        const taslak: ListeOzeti = {
          id: vars.id_taslak,
          proje_id: vars.proje_id,
          ad: vars.ad,
          sira: siraSonuna(sonSira),
          tip: ListeTipi.NORMAL,
          arsiv_mi: false,
          wip_limit: null,
          kartlar: [],
        };
        return { ...d, listeler: [...d.listeler, taslak] };
      }),
    swap: (eski, vars, yanit) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler.map((l) =>
          l.id === vars.id_taslak ? { ...yanit, kartlar: l.kartlar } : l,
        ),
      })),
    hataMesaji: "Liste oluşturulamadı",
  });
}

export function useListeGuncelle(anahtar: DetayKey) {
  return useOptimisticMutation<ListeGuncelle, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(listeGuncelleEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) =>
        listeyiGuncelle(d, vars.id, (l) => ({
          ...l,
          ad: vars.ad ?? l.ad,
          arsiv_mi: vars.arsiv_mi ?? l.arsiv_mi,
          wip_limit:
            vars.wip_limit === undefined ? l.wip_limit : vars.wip_limit,
        })),
      ),
    hataMesaji: "Liste güncellenemedi",
  });
}

export function useListeSil(anahtar: DetayKey) {
  return useOptimisticMutation<ListeSil, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(listeSilEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler.filter((l) => l.id !== vars.id),
      })),
    hataMesaji: "Liste silinemedi",
  });
}

export function useListeSirala(anahtar: DetayKey) {
  return useOptimisticMutation<
    ListeSira & { onceki_sira: string | null; sonraki_sira: string | null },
    { sira: string }
  >({
    queryKey: anahtar,
    mutationFn: ({ id, proje_id, onceki_id, sonraki_id }) =>
      eylemMutasyonu(listeSiralaEylem)({ id, proje_id, onceki_id, sonraki_id }),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler
          .map((l) =>
            l.id === vars.id
              ? {
                  ...l,
                  sira: guvenliSiraArasi(
                    vars.onceki_sira,
                    vars.sonraki_sira,
                    l.sira,
                  ),
                }
              : l,
          )
          .sort((a, b) => siraKarsilastir(a.sira, b.sira)),
      })),
    swap: (eski, vars, yanit) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler
          .map((l) => (l.id === vars.id ? { ...l, sira: yanit.sira } : l))
          .sort((a, b) => siraKarsilastir(a.sira, b.sira)),
      })),
    hataMesaji: "Liste taşınamadı",
  });
}

// ============================================================
// Kart mutation'ları
// ============================================================

export function useKartOlustur(anahtar: DetayKey) {
  return useOptimisticMutation<
    KartOlustur & { id_taslak: string },
    ListeKartOzeti & { liste_id: string }
  >({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(kartOlusturEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) =>
        listeyiGuncelle(d, vars.liste_id, (l) => {
          const sonSira = l.kartlar[l.kartlar.length - 1]?.sira ?? null;
          const taslak: ListeKartOzeti = {
            id: vars.id_taslak,
            baslik: vars.baslik,
            aciklama: vars.aciklama ?? null,
            sira: siraSonuna(sonSira),
            kapak_renk: null,
            kapak: null,
            bitis: null,
            arsiv_mi: false,
            silindi_mi: false,
            yetkili_sayisi: 0,
            etiket_sayisi: 0,
            yorum_sayisi: 0,
            ek_sayisi: 0,
            madde_toplam: 0,
            madde_tamamlanan: 0,
          };
          return { ...l, kartlar: [...l.kartlar, taslak] };
        }),
      ),
    swap: (eski, vars, yanit) =>
      detayHaritala(eski, (d) =>
        listeyiGuncelle(d, vars.liste_id, (l) => ({
          ...l,
          kartlar: l.kartlar.map((k) =>
            k.id === vars.id_taslak ? yanit : k,
          ),
        })),
      ),
    hataMesaji: "Kart oluşturulamadı",
  });
}

export function useKartGuncelle(anahtar: DetayKey) {
  return useOptimisticMutation<KartGuncelle, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(kartGuncelleEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler.map((l) => ({
          ...l,
          kartlar: l.kartlar.map((k) =>
            k.id === vars.id
              ? {
                  ...k,
                  baslik: vars.baslik ?? k.baslik,
                  aciklama:
                    vars.aciklama === undefined ? k.aciklama : vars.aciklama,
                  kapak_renk:
                    vars.kapak_renk === undefined
                      ? k.kapak_renk
                      : vars.kapak_renk,
                  bitis:
                    vars.bitis === undefined ? k.bitis : (vars.bitis ?? null),
                  arsiv_mi: vars.arsiv_mi ?? k.arsiv_mi,
                }
              : k,
          ),
        })),
      })),
    // Kart alanı (başlık/açıklama/bitiş/kapak/arşiv) audit log'a düşer; modal
    // açıkken yan paneldeki Aktivite/Tümü sekmesi anında yansısın.
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.id)],
    hataMesaji: "Kart güncellenemedi",
  });
}

export function useKartSil(anahtar: DetayKey) {
  return useOptimisticMutation<KartSil, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(kartSilEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler.map((l) => ({
          ...l,
          kartlar: l.kartlar.filter((k) => k.id !== vars.id),
        })),
      })),
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.id)],
    hataMesaji: "Kart silinemedi",
  });
}

export function useKartGeriYukle(anahtar: DetayKey) {
  return useOptimisticMutation<{ id: string }, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(kartGeriYukleEylem),
    optimistic: (eski) => eski, // veriyi geri yükledikten sonra invalidate getirir
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.id)],
    hataMesaji: "Kart geri yüklenemedi",
  });
}

// ADR-0009 — Kart arşivle/arşivden çıkar.
// Optimistic: kartı kaynaktan çıkar, hedef listeye (Arşiv veya geri yükleme
// hedef'i) ekle. Hedef arşivden çıkarmada arsiv_oncesi_liste_id'den biliniyorsa
// orası, yoksa ilk NORMAL liste (server da aynı kuralı uygular).
export function useKartArsivToggle(anahtar: DetayKey) {
  return useOptimisticMutation<KartArsiv, { liste_id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(kartArsivEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => {
        const arsivListesi = d.listeler.find((l) => l.tip === ListeTipi.ARSIV);
        if (!arsivListesi) return d;

        // Kartı bul + kaynaktan çıkar
        let bulunan: ListeKartOzeti | undefined;
        const aktifsiz = d.listeler.map((l) => {
          const idx = l.kartlar.findIndex((k) => k.id === vars.id);
          if (idx >= 0) {
            bulunan = l.kartlar[idx];
            return { ...l, kartlar: l.kartlar.filter((_, i) => i !== idx) };
          }
          return l;
        });
        if (!bulunan) return d;

        // Hedef liste id'si: arşivle → Arşiv listesi; arşivden çıkar → ilk NORMAL.
        // Server arsiv_oncesi_liste_id'yi tercih eder; cevap invalidate ile gelir.
        const hedefListeId = vars.arsiv
          ? arsivListesi.id
          : aktifsiz.find((l) => l.tip === ListeTipi.NORMAL)?.id;
        if (!hedefListeId) return d;

        const hedef = aktifsiz.find((l) => l.id === hedefListeId);
        const sonSira = hedef?.kartlar[hedef.kartlar.length - 1]?.sira ?? null;
        const yeniKart: ListeKartOzeti = {
          ...bulunan,
          arsiv_mi: vars.arsiv,
          sira: siraSonuna(sonSira),
        };

        return {
          ...d,
          listeler: aktifsiz.map((l) =>
            l.id === hedefListeId
              ? { ...l, kartlar: [...l.kartlar, yeniKart] }
              : l,
          ),
        };
      }),
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.id)],
    hataMesaji: "Kart arşivlenemedi",
  });
}

// Kart taşıma (drag-drop): kanban-pano dragOver sırasında cache'i ZATEN
// transient olarak yeni pozisyona getiriyor. Burada optimistic update YOK —
// kanban-pano `dragBaslat`'ta orijinal snapshot alıyor, hata durumunda manuel
// restore ediyor. Bu sayede dragOver'da bozulmuş cache rollback'e karışmıyor
// (örn. server "Sonraki kart hedef listeden değil" derse veri kaybı olmaz).
export function useKartTasi(anahtar: DetayKey) {
  return useOptimisticMutation<
    KartTasi & {
      kaynak_liste_id: string;
      onceki_sira: string | null;
      sonraki_sira: string | null;
    },
    { sira: string; liste_id: string }
  >({
    queryKey: anahtar,
    mutationFn: ({ id, hedef_liste_id, onceki_id, sonraki_id }) =>
      eylemMutasyonu(kartTasiEylem)({
        id,
        hedef_liste_id,
        onceki_id,
        sonraki_id,
      }),
    // optimistic YOK — wrapper snapshot almaz, otomatik rollback yapmaz
    // Kart taşıma da audit log'a düşer; aktivite log'u canlı yansısın.
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.id)],
    hataMesaji: "Kart taşınamadı",
  });
}

// Proje detay sayfasında ad/açıklama/yıldız/kapak güncelleme — projeler liste
// hook'unun (`useProjeGuncelle`) optimistic'i `ProjeKart[]` varsayar; detay
// cache'i tek obje olduğundan ayrı bir wrapper. Aynı server action'ı kullanır.
export function useProjeDetayGuncelle(anahtar: DetayKey) {
  return useOptimisticMutation<ProjeGuncelle, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(projeGuncelleEylem),
    optimistic: (eski, vars) => {
      const d = eski as ProjeDetayOzeti | undefined;
      if (!d) return eski;
      return {
        ...d,
        ad: vars.ad ?? d.ad,
        aciklama: vars.aciklama === undefined ? d.aciklama : vars.aciklama,
        kapak_renk:
          vars.kapak_renk === undefined ? d.kapak_renk : vars.kapak_renk,
        yildizli_mi: vars.yildizli_mi ?? d.yildizli_mi,
      } satisfies ProjeDetayOzeti;
    },
    hataMesaji: "Proje güncellenemedi",
  });
}

export { tempId };
