"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { tempId } from "@/lib/temp-id";
import { useProjeRoom, useSocketEvents } from "@/hooks/use-socket";
import { SOCKET } from "@/lib/socket-events";
import { projeDetayKey } from "../hooks/detay-sorgulari";
import { kartAktiviteleriKey } from "../aktivite/keys";
import type { ProjeDetayOzeti } from "../services";
import {
  etiketDetayEylem,
  etiketGuncelleEylem,
  etiketKartlariEylem,
  etiketleriListeleEylem,
  etiketOlusturEylem,
  etiketSilEylem,
  kartaEtiketEkleEylem,
  kartaEtiketKaldirEylem,
  kartinEtiketleriEylem,
} from "./actions";
import type {
  EtiketGuncelle,
  EtiketOlustur,
  EtiketSil,
  KartaEtiketEkle,
  KartaEtiketKaldir,
} from "./schemas";
import type {
  EtiketDetay,
  EtiketKartlariSayfasi,
  EtiketOzeti,
} from "./services";

export const ETIKETLER_KEY = "etiketler";
export const KART_ETIKETLERI_KEY = "kart-etiketleri";
export const ETIKET_DETAY_KEY = "etiket-detay";
export const ETIKET_KARTLARI_KEY = "etiket-kartlari";

export function etiketlerKey(projeId: string) {
  return [ETIKETLER_KEY, projeId] as const;
}

export function kartEtiketleriKey(kartId: string) {
  return [KART_ETIKETLERI_KEY, kartId] as const;
}

export function etiketDetayKey(etiketId: string) {
  return [ETIKET_DETAY_KEY, etiketId] as const;
}

export function etiketKartlariKey(
  etiketId: string,
  sayfa: number,
  sayfaBoyutu: number,
) {
  return [ETIKET_KARTLARI_KEY, etiketId, { sayfa, sayfaBoyutu }] as const;
}

// =====================================================================
// Sorgular
// =====================================================================

export function useEtiketler(projeId: string) {
  return useQuery({
    queryKey: etiketlerKey(projeId),
    queryFn: async () => {
      const r = await etiketleriListeleEylem({ proje_id: projeId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

export function useKartEtiketleri(kartId: string | null) {
  return useQuery({
    queryKey: kartEtiketleriKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kartinEtiketleriEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

// =====================================================================
// Etiket CRUD mutations (proje düzeyinde)
// =====================================================================

export function useEtiketOlustur(projeId: string) {
  return useOptimisticMutation<
    EtiketOlustur & { id_taslak: string },
    EtiketOzeti
  >({
    queryKey: etiketlerKey(projeId),
    mutationFn: ({ id_taslak: _id_taslak, ...vars }) =>
      eylemMutasyonu(etiketOlusturEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as EtiketOzeti[] | undefined) ?? [];
      const taslak: EtiketOzeti = {
        id: vars.id_taslak,
        proje_id: vars.proje_id,
        ad: vars.ad,
        renk: vars.renk,
      };
      return [...liste, taslak];
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as EtiketOzeti[] | undefined) ?? [];
      return liste.map((e) => (e.id === vars.id_taslak ? yanit : e));
    },
    hataMesaji: "Etiket eklenemedi",
  });
}

export function useEtiketGuncelle(projeId: string) {
  return useOptimisticMutation<EtiketGuncelle, { id: string }>({
    queryKey: etiketlerKey(projeId),
    mutationFn: eylemMutasyonu(etiketGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as EtiketOzeti[] | undefined) ?? [];
      return liste.map((e) =>
        e.id === vars.id
          ? { ...e, ad: vars.ad ?? e.ad, renk: vars.renk ?? e.renk }
          : e,
      );
    },
    hataMesaji: "Etiket güncellenemedi",
  });
}

export function useEtiketSil(projeId: string) {
  return useOptimisticMutation<EtiketSil, { id: string }>({
    queryKey: [etiketlerKey(projeId), projeDetayKey(projeId)] as const,
    mutationFn: eylemMutasyonu(etiketSilEylem),
    optimisticMap: [
      {
        queryKey: etiketlerKey(projeId),
        update: (eski, vars) => {
          const liste = (eski as EtiketOzeti[] | undefined) ?? [];
          return liste.filter((e) => e.id !== vars.id);
        },
      },
      {
        // Detay cache'inde silinmiş etiket sayısını da güncelle
        queryKey: projeDetayKey(projeId),
        update: (eski) => {
          // Etiket sayıları sadece _count.etiketler — invalidate ile düzelir.
          // Burada veriye dokunmuyoruz; onSettled invalidate yenileyecek.
          return eski;
        },
      },
    ],
    hataMesaji: "Etiket silinemedi",
  });
}

// =====================================================================
// Karta etiket ata / kaldır mutations
// =====================================================================

export function useKartaEtiketEkle(kartId: string, projeId: string) {
  return useOptimisticMutation<KartaEtiketEkle, { kart_id: string; etiket_id: string }>({
    queryKey: [
      kartEtiketleriKey(kartId),
      projeDetayKey(projeId),
    ] as const,
    mutationFn: eylemMutasyonu(kartaEtiketEkleEylem),
    optimisticMap: [
      {
        queryKey: kartEtiketleriKey(kartId),
        update: (eski, vars) => {
          const ids = (eski as string[] | undefined) ?? [];
          if (ids.includes(vars.etiket_id)) return ids;
          return [...ids, vars.etiket_id];
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpEtiketSayisi(eski, vars.kart_id, +1),
      },
    ],
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Etiket eklenemedi",
  });
}

export function useKartaEtiketKaldir(kartId: string, projeId: string) {
  return useOptimisticMutation<KartaEtiketKaldir, { kart_id: string; etiket_id: string }>({
    queryKey: [
      kartEtiketleriKey(kartId),
      projeDetayKey(projeId),
    ] as const,
    mutationFn: eylemMutasyonu(kartaEtiketKaldirEylem),
    optimisticMap: [
      {
        queryKey: kartEtiketleriKey(kartId),
        update: (eski, vars) => {
          const ids = (eski as string[] | undefined) ?? [];
          return ids.filter((id) => id !== vars.etiket_id);
        },
      },
      {
        queryKey: projeDetayKey(projeId),
        update: (eski, vars) => bumpEtiketSayisi(eski, vars.kart_id, -1),
      },
    ],
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Etiket kaldırılamadı",
  });
}

// Detay cache'inde kartın etiket_sayisi'nı +1/-1 değiştir (badge için).
function bumpEtiketSayisi(
  eski: unknown,
  kartId: string,
  delta: 1 | -1,
): unknown {
  const d = eski as ProjeDetayOzeti | undefined;
  if (!d) return eski;
  return {
    ...d,
    listeler: d.listeler.map((l) => ({
      ...l,
      kartlar: l.kartlar.map((k) =>
        k.id === kartId
          ? { ...k, etiket_sayisi: Math.max(0, k.etiket_sayisi + delta) }
          : k,
      ),
    })),
  };
}

// =====================================================================
// Etiket detay + kartları (yönetim & detay sayfaları için)
// =====================================================================

export function useEtiketDetay(etiketId: string) {
  return useQuery({
    queryKey: etiketDetayKey(etiketId),
    queryFn: async () => {
      const r = await etiketDetayEylem({ id: etiketId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri as EtiketDetay;
    },
    staleTime: 30_000,
  });
}

export function useEtiketKartlari(
  etiketId: string,
  sayfa: number,
  sayfaBoyutu: number,
) {
  return useQuery({
    queryKey: etiketKartlariKey(etiketId, sayfa, sayfaBoyutu),
    queryFn: async () => {
      const r = await etiketKartlariEylem({
        etiket_id: etiketId,
        sayfa,
        sayfa_boyutu: sayfaBoyutu,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri as EtiketKartlariSayfasi;
    },
    staleTime: 30_000,
  });
}

// =====================================================================
// Realtime — proje room'unda etiket CRUD eventleri (Kural 56, 114)
// =====================================================================

const ETIKET_EVENTLERI = [
  SOCKET.ETIKET_OLUSTU,
  SOCKET.ETIKET_GUNCELLENDI,
  SOCKET.ETIKET_SILINDI,
] as const;

type EtiketOlusmaPayload = EtiketOzeti;
type EtiketGuncellemePayload = { id: string; ad?: string; renk?: string };
type EtiketSilmePayload = { id: string };

export function useEtiketRealtime(projeId: string): void {
  useProjeRoom(projeId);
  const istemci = useQueryClient();

  useSocketEvents<
    EtiketOlusmaPayload | EtiketGuncellemePayload | EtiketSilmePayload
  >(
    ETIKET_EVENTLERI,
    (event, zarf) => {
      if (event === SOCKET.ETIKET_OLUSTU) {
        const yeni = zarf.veri as EtiketOlusmaPayload;
        istemci.setQueryData<EtiketOzeti[]>(etiketlerKey(projeId), (eski) => {
          const liste = eski ?? [];
          if (liste.some((e) => e.id === yeni.id)) return liste;
          return [...liste, yeni];
        });
      } else if (event === SOCKET.ETIKET_GUNCELLENDI) {
        const v = zarf.veri as EtiketGuncellemePayload;
        istemci.setQueryData<EtiketOzeti[]>(etiketlerKey(projeId), (eski) => {
          const liste = eski ?? [];
          return liste.map((e) =>
            e.id === v.id
              ? { ...e, ad: v.ad ?? e.ad, renk: v.renk ?? e.renk }
              : e,
          );
        });
        void istemci.invalidateQueries({ queryKey: etiketDetayKey(v.id) });
      } else if (event === SOCKET.ETIKET_SILINDI) {
        const v = zarf.veri as EtiketSilmePayload;
        istemci.setQueryData<EtiketOzeti[]>(etiketlerKey(projeId), (eski) => {
          const liste = eski ?? [];
          return liste.filter((e) => e.id !== v.id);
        });
      }
    },
    { selfFilter: true },
  );

  // Modül seviyesi sabit dizi referans için (Kural 134) — eslint deps
  React.useDebugValue(projeId);
}

export { tempId };
