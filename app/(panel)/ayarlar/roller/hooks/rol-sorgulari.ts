"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  kullaniciyaRolAtaEylem,
  rolCogaltEylem,
  rolDetayiEylem,
  rolGuncelleEylem,
  rolIzinleriniGuncelleEylem,
  rolleriListeleEylem,
  rolOlusturEylem,
  rolSilEylem,
  tumIzinleriListeleEylem,
} from "../actions";
import type {
  KullaniciyaRolAtaGirdi,
  RolCogaltGirdi,
  RolGuncelleGirdi,
  RolIzinleriniGuncelleGirdi,
  RolOlusturGirdi,
} from "../schemas";
import type { RolDetay, RolSatiri } from "../services";

export const ROL_QUERY_KEY = "roller";
export const IZIN_QUERY_KEY = "izinler";

export function rollerKey(arama?: string) {
  return [ROL_QUERY_KEY, { arama: arama ?? "" }] as const;
}

export function rolDetayKey(rolId: string) {
  return [ROL_QUERY_KEY, "detay", rolId] as const;
}

export function tumIzinlerKey() {
  return [IZIN_QUERY_KEY] as const;
}

// ============================================================
// Sorgular
// ============================================================

export function useRoller(arama?: string) {
  return useQuery({
    queryKey: rollerKey(arama),
    queryFn: async () => {
      const r = await rolleriListeleEylem({ arama });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30 * 1000,
  });
}

export function useRolDetay(rolId: string) {
  return useQuery({
    queryKey: rolDetayKey(rolId),
    queryFn: async () => {
      const r = await rolDetayiEylem({ id: rolId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30 * 1000,
  });
}

export function useTumIzinler() {
  return useQuery({
    queryKey: tumIzinlerKey(),
    queryFn: async () => {
      const r = await tumIzinleriListeleEylem(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    // İzin kataloğu sabit — uzun staleTime
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Mutasyonlar (optimistic — Kural 107-116)
// ============================================================

export function useRolOlustur() {
  return useOptimisticMutation<RolOlusturGirdi, { id: string }>({
    queryKey: [ROL_QUERY_KEY],
    mutationFn: eylemMutasyonu(rolOlusturEylem),
    hataMesaji: "Rol oluşturulamadı",
    basariMesaji: "Rol oluşturuldu",
  });
}

export function useRolGuncelle() {
  return useOptimisticMutation<RolGuncelleGirdi, { id: string }>({
    queryKey: [ROL_QUERY_KEY],
    mutationFn: eylemMutasyonu(rolGuncelleEylem),
    optimistic: (old, vars) => {
      if (!Array.isArray(old)) return old;
      return (old as RolSatiri[]).map((r) =>
        r.id === vars.id
          ? { ...r, ad: vars.ad, aciklama: vars.aciklama ?? null }
          : r,
      );
    },
    hataMesaji: "Rol güncellenemedi",
    ekInvalidate: (vars) => [rolDetayKey(vars.id)],
  });
}

export function useRolIzinleriniGuncelle(rolId: string) {
  return useOptimisticMutation<
    RolIzinleriniGuncelleGirdi,
    { izin_versiyonu: number }
  >({
    queryKey: rolDetayKey(rolId),
    mutationFn: eylemMutasyonu(rolIzinleriniGuncelleEylem),
    optimistic: (old, vars) => {
      if (!old) return old;
      return { ...(old as RolDetay), izinler: vars.izinler };
    },
    hataMesaji: "Yetkiler güncellenemedi",
    basariMesaji: "Yetkiler kaydedildi",
    ekInvalidate: [[ROL_QUERY_KEY]],
  });
}

export function useRolCogalt() {
  return useOptimisticMutation<RolCogaltGirdi, { id: string }>({
    queryKey: [ROL_QUERY_KEY],
    mutationFn: eylemMutasyonu(rolCogaltEylem),
    hataMesaji: "Rol çoğaltılamadı",
    basariMesaji: "Rol çoğaltıldı",
  });
}

export function useRolSil() {
  return useOptimisticMutation<{ id: string }, { id: string }>({
    queryKey: [ROL_QUERY_KEY],
    mutationFn: eylemMutasyonu(rolSilEylem),
    optimistic: (old, vars) => {
      if (!Array.isArray(old)) return old;
      return (old as RolSatiri[]).filter((r) => r.id !== vars.id);
    },
    hataMesaji: "Rol silinemedi",
    basariMesaji: "Rol silindi",
  });
}

export function useKullaniciyaRolAta() {
  return useOptimisticMutation<
    KullaniciyaRolAtaGirdi,
    { kullaniciId: string }
  >({
    queryKey: [ROL_QUERY_KEY],
    mutationFn: eylemMutasyonu(kullaniciyaRolAtaEylem),
    hataMesaji: "Rol ataması yapılamadı",
    basariMesaji: "Rol ataması güncellendi",
  });
}
