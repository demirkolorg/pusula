"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { tempId } from "@/lib/temp-id";
import { kartAktiviteleriKey } from "../aktivite/keys";
import {
  yorumGuncelleEylem,
  yorumlariListeleEylem,
  yorumOlusturEylem,
  yorumSilEylem,
} from "./actions";
import type {
  YorumGuncelle,
  YorumOlustur,
  YorumSil,
} from "./schemas";
import type { YorumOzeti } from "./services";

export const KART_YORUMLARI_KEY = "kart-yorumlari";

export function kartYorumlariKey(kartId: string) {
  return [KART_YORUMLARI_KEY, kartId] as const;
}

// =====================================================================
// Sorgular
// =====================================================================

export function useKartYorumlari(kartId: string | null) {
  return useQuery({
    queryKey: kartYorumlariKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await yorumlariListeleEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
}

// =====================================================================
// Mutations
// =====================================================================

type OlusturVars = YorumOlustur & {
  id_taslak: string;
  // Optimistic için yazan bilgisi (oturumdan client tarafından doldurulur)
  yazan_id: string;
  yazan: { ad: string; soyad: string; email: string };
};

export function useYorumOlustur(kartId: string) {
  return useOptimisticMutation<OlusturVars, YorumOzeti>({
    queryKey: kartYorumlariKey(kartId),
    mutationFn: ({ id_taslak: _id, yazan_id: _y, yazan: _yz, ...vars }) =>
      eylemMutasyonu(yorumOlusturEylem)(vars),
    optimistic: (eski, vars) => {
      const liste = (eski as YorumOzeti[] | undefined) ?? [];
      const taslak: YorumOzeti = {
        id: vars.id_taslak,
        kart_id: vars.kart_id,
        yazan_id: vars.yazan_id,
        yazan: vars.yazan,
        icerik: vars.icerik,
        duzenlendi_mi: false,
        yanit_yorum_id: vars.yanit_yorum_id ?? null,
        olusturma_zamani: new Date(),
        guncelleme_zamani: new Date(),
      };
      return [...liste, taslak];
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as YorumOzeti[] | undefined) ?? [];
      return liste.map((y) => (y.id === vars.id_taslak ? yanit : y));
    },
    // Yorum yazma audit log'a düşer; Aktivite/Tümü sekmeleri canlı yansısın.
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Yorum gönderilemedi",
  });
}

export function useYorumGuncelle(kartId: string) {
  return useOptimisticMutation<YorumGuncelle, { id: string }>({
    queryKey: kartYorumlariKey(kartId),
    mutationFn: eylemMutasyonu(yorumGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as YorumOzeti[] | undefined) ?? [];
      return liste.map((y) =>
        y.id === vars.id
          ? {
              ...y,
              icerik: vars.icerik,
              duzenlendi_mi: true,
              guncelleme_zamani: new Date(),
            }
          : y,
      );
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Yorum güncellenemedi",
  });
}

export function useYorumSil(kartId: string) {
  return useOptimisticMutation<YorumSil, { id: string }>({
    queryKey: kartYorumlariKey(kartId),
    mutationFn: eylemMutasyonu(yorumSilEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as YorumOzeti[] | undefined) ?? [];
      return liste.filter((y) => y.id !== vars.id);
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Yorum silinemedi",
  });
}

export { tempId };
