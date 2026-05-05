"use client";

// Proje Şablonları TanStack Query hook'ları.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  sablonGuncelleEylem,
  sablonlariListeleEylem,
  sablonOlusturEylem,
  sablonSilEylem,
} from "../actions";
import type {
  SablonGuncelle,
  SablonOlustur,
  SablonSil,
} from "../schemas";
import type { SablonOzet } from "../services";

const KEY = ["sablonlar"] as const;

export function useSablonlar() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const sonuc = await sablonlariListeleEylem(undefined);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    staleTime: 60_000,
  });
}

export function useSablonOlustur() {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: async (girdi: SablonOlustur) => {
      const sonuc = await sablonOlusturEylem(girdi);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    onSuccess: () => {
      toast.basari("Şablon oluşturuldu");
      istemci.invalidateQueries({ queryKey: KEY });
    },
    onError: (err) => {
      toast.hata("Şablon oluşturulamadı", { aciklama: (err as Error).message });
    },
  });
}

export function useSablonGuncelle() {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: async (girdi: SablonGuncelle) => {
      const sonuc = await sablonGuncelleEylem(girdi);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    onSuccess: () => {
      toast.basari("Şablon güncellendi");
      istemci.invalidateQueries({ queryKey: KEY });
    },
    onError: (err) => {
      toast.hata("Şablon güncellenemedi", { aciklama: (err as Error).message });
    },
  });
}

export function useSablonSil() {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: async (girdi: SablonSil) => {
      const sonuc = await sablonSilEylem(girdi);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    onMutate: async (girdi) => {
      await istemci.cancelQueries({ queryKey: KEY });
      const onceki = istemci.getQueryData<SablonOzet[]>(KEY);
      if (onceki) {
        istemci.setQueryData<SablonOzet[]>(
          KEY,
          onceki.filter((s) => s.id !== girdi.id),
        );
      }
      return { onceki };
    },
    onError: (err, _girdi, ctx) => {
      if (ctx?.onceki) istemci.setQueryData(KEY, ctx.onceki);
      toast.hata("Şablon silinemedi", { aciklama: (err as Error).message });
    },
    onSuccess: () => {
      toast.basari("Şablon silindi");
    },
    onSettled: () => {
      istemci.invalidateQueries({ queryKey: KEY });
    },
  });
}
