"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { tempId } from "@/lib/temp-id";
import {
  projeArsivleEylem,
  projeGeriYukleEylem,
  projeGuncelleEylem,
  projeListele,
  projeOlusturEylem,
  projeSilEylem,
} from "../actions";
import type { ProjeKart } from "../services";
import type {
  ProjeArsiv,
  ProjeGuncelle,
  ProjeListe,
  ProjeOlustur,
  ProjeSil,
} from "../schemas";

export const PROJE_QUERY_KEY = "projeler";

export function projelerKey(filtre: ProjeListe["filtre"], arama: string) {
  return [PROJE_QUERY_KEY, { filtre, arama }] as const;
}

export function useProjeler(filtre: ProjeListe["filtre"], arama: string) {
  return useQuery({
    queryKey: projelerKey(filtre, arama),
    queryFn: async () => {
      const r = await projeListele({ filtre, arama: arama || undefined });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });
}

type ListeAnahtari = ReturnType<typeof projelerKey>;

// Yeni proje — geçici ID ile optimistic, sunucudan gelince swap.
export function useProjeOlustur(anahtar: ListeAnahtari) {
  return useOptimisticMutation<ProjeOlustur & { id_taslak: string }, ProjeKart>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(projeOlusturEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeKart[] | undefined) ?? [];
      const taslak: ProjeKart = {
        id: vars.id_taslak,
        ad: vars.ad,
        aciklama: vars.aciklama ?? null,
        kapak_renk: vars.kapak_renk ?? null,
        yildizli_mi: false,
        arsiv_mi: false,
        silindi_mi: false,
        sira: "zzz",
        uye_sayisi: 1,
        liste_sayisi: 0,
        olusturma_zamani: new Date(),
      };
      return [...liste, taslak];
    },
    swap: (eski, vars, yanit) => {
      const liste = (eski as ProjeKart[] | undefined) ?? [];
      return liste.map((p) =>
        p.id === vars.id_taslak ? { ...p, ...yanit } : p,
      );
    },
    hataMesaji: "Proje oluşturulamadı",
  });
}

export function useProjeGuncelle(anahtar: ListeAnahtari) {
  return useOptimisticMutation<ProjeGuncelle, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(projeGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeKart[] | undefined) ?? [];
      return liste.map((p) =>
        p.id === vars.id
          ? {
              ...p,
              ad: vars.ad ?? p.ad,
              aciklama: vars.aciklama === undefined ? p.aciklama : vars.aciklama,
              kapak_renk:
                vars.kapak_renk === undefined ? p.kapak_renk : vars.kapak_renk,
              yildizli_mi: vars.yildizli_mi ?? p.yildizli_mi,
            }
          : p,
      );
    },
    hataMesaji: "Proje güncellenemedi",
  });
}

export function useProjeArsivle(anahtar: ListeAnahtari) {
  return useOptimisticMutation<ProjeArsiv, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(projeArsivleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeKart[] | undefined) ?? [];
      return liste.filter((p) => p.id !== vars.id);
    },
    hataMesaji: "Proje arşivlenemedi",
  });
}

export function useProjeSil(anahtar: ListeAnahtari) {
  return useOptimisticMutation<ProjeSil, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(projeSilEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeKart[] | undefined) ?? [];
      return liste.filter((p) => p.id !== vars.id);
    },
    hataMesaji: "Proje silinemedi",
  });
}

export function useProjeGeriYukle(anahtar: ListeAnahtari) {
  return useOptimisticMutation<{ id: string }, { id: string }>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(projeGeriYukleEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as ProjeKart[] | undefined) ?? [];
      return liste.filter((p) => p.id !== vars.id);
    },
    hataMesaji: "Proje geri yüklenemedi",
  });
}

// Yardımcı: yeni proje için geçici ID üret.
export { tempId };
// `eylemMutasyonu` ihtiyaç olunca dış kullanımda kalsın.
export { eylemMutasyonu };
