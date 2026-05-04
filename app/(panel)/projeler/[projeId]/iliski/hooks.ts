"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { tempId } from "@/lib/temp-id";
import { kartAktiviteleriKey } from "../aktivite/keys";
import {
  iliskiOlusturEylem,
  iliskiSilEylem,
  kartIliskileriListeleEylem,
  projedeKartiAraEylem,
} from "./actions";
import type {
  IliskiOlustur,
  IliskiSil,
  ProjeKartiAra,
} from "./schemas";
import type { IliskiOzeti } from "./services";

export const KART_ILISKI_KEY = "kart-iliskileri";
export const PROJE_KART_ARA_KEY = "proje-kart-ara";

export function kartIliskiKey(kartId: string) {
  return [KART_ILISKI_KEY, kartId] as const;
}

export function projeKartAraKey(projeId: string, q: string) {
  return [PROJE_KART_ARA_KEY, projeId, q] as const;
}

export function useKartIliskileri(kartId: string | null) {
  return useQuery({
    queryKey: kartIliskiKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kartIliskileriListeleEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
}

export function useProjedeKartAra(
  projeId: string,
  q: string,
  haricKartId?: string,
) {
  return useQuery({
    queryKey: projeKartAraKey(projeId, q),
    queryFn: async () => {
      const r = await projedeKartiAraEylem({
        proje_id: projeId,
        q,
        haric_kart_id: haricKartId,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// =====================================================================
// Mutations
// =====================================================================

type OlusturVars = IliskiOlustur & {
  id_taslak: string;
  // Optimistic için diğer kart bilgisi (UI'dan geçirilir)
  diger_kart: {
    id: string;
    baslik: string;
    liste_ad: string;
  };
};

export function useIliskiOlustur(kartId: string) {
  return useOptimisticMutation<OlusturVars, { id: string }>({
    queryKey: kartIliskiKey(kartId),
    mutationFn: ({ id_taslak: _id, diger_kart: _d, ...vars }) =>
      eylemMutasyonu(iliskiOlusturEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as IliskiOzeti[] | undefined) ?? [];
      const taslak: IliskiOzeti = {
        id: vars.id_taslak,
        tip: vars.tip,
        yon: vars.kart_a_id === kartId ? "giden" : "gelen",
        diger_kart: {
          id: vars.diger_kart.id,
          baslik: vars.diger_kart.baslik,
          liste_ad: vars.diger_kart.liste_ad,
          silindi_mi: false,
          arsiv_mi: false,
        },
      };
      return [...liste, taslak];
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as IliskiOzeti[] | undefined) ?? [];
      return liste.map((r) => (r.id === vars.id_taslak ? { ...r, id: yanit.id } : r));
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "İlişki oluşturulamadı",
  });
}

export function useIliskiSil(kartId: string) {
  return useOptimisticMutation<IliskiSil, { id: string }>({
    queryKey: kartIliskiKey(kartId),
    mutationFn: eylemMutasyonu(iliskiSilEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as IliskiOzeti[] | undefined) ?? [];
      return liste.filter((r) => r.id !== vars.id);
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "İlişki silinemedi",
  });
}

export { tempId };
export type { ProjeKartiAra };
