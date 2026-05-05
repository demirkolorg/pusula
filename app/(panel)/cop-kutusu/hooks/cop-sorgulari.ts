"use client";

// Çöp Kutusu TanStack Query hook'ları.
// Kontrol Kural 23 (server-state için TanStack Query).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  copGeriYukleEylem,
  copKaliciSilEylem,
  copKutusuListeleEylem,
} from "../actions";
import type { CopTipi } from "../schemas";
import type { CopOzeti } from "../services";

const KOK_KEY = ["cop-kutusu"] as const;

export function copKutusuListeKey(tip: CopTipi) {
  return [...KOK_KEY, tip] as const;
}

export function useCopKutusu(tip: CopTipi) {
  return useQuery({
    queryKey: copKutusuListeKey(tip),
    queryFn: async () => {
      const sonuc = await copKutusuListeleEylem({ tip, limit: 50 });
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    staleTime: 30_000,
  });
}

/**
 * Geri yükleme — optimistic: kayıt UI'dan anında çıkarılır; server reddederse
 * geri eklenir. Sonner gerial 5sn (Kural 65) ile undo desteği yok burada
 * (geri yükleme zaten "geri al" gibi); doğrudan başarı toastı.
 */
export function useCopGeriYukle(tip: CopTipi) {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sonuc = await copGeriYukleEylem({ tip, id });
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    onMutate: async (id) => {
      const anahtar = copKutusuListeKey(tip);
      await istemci.cancelQueries({ queryKey: anahtar });
      const onceki = istemci.getQueryData<{
        kayitlar: CopOzeti[];
        toplam: number;
      }>(anahtar);
      if (onceki) {
        istemci.setQueryData(anahtar, {
          ...onceki,
          kayitlar: onceki.kayitlar.filter((k) => k.id !== id),
          toplam: Math.max(0, onceki.toplam - 1),
        });
      }
      return { onceki };
    },
    onError: (err, _id, ctx) => {
      const anahtar = copKutusuListeKey(tip);
      if (ctx?.onceki) istemci.setQueryData(anahtar, ctx.onceki);
      toast.hata("Geri yüklenemedi", { aciklama: (err as Error).message });
    },
    onSuccess: () => {
      toast.basari("Kayıt geri yüklendi");
    },
    onSettled: () => {
      istemci.invalidateQueries({ queryKey: KOK_KEY });
    },
  });
}

/**
 * Kalıcı sil — optimistic kayıt çıkarılır. Sonner sadece başarı/hata; undo YOK
 * (Kural 65 istisnası — gerçek delete'in geri alımı yok).
 */
export function useCopKaliciSil(tip: CopTipi) {
  const istemci = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sonuc = await copKaliciSilEylem({
        tip,
        id,
        onay: "KALICI_SIL_ONAYLA",
      });
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    onMutate: async (id) => {
      const anahtar = copKutusuListeKey(tip);
      await istemci.cancelQueries({ queryKey: anahtar });
      const onceki = istemci.getQueryData<{
        kayitlar: CopOzeti[];
        toplam: number;
      }>(anahtar);
      if (onceki) {
        istemci.setQueryData(anahtar, {
          ...onceki,
          kayitlar: onceki.kayitlar.filter((k) => k.id !== id),
          toplam: Math.max(0, onceki.toplam - 1),
        });
      }
      return { onceki };
    },
    onError: (err, _id, ctx) => {
      const anahtar = copKutusuListeKey(tip);
      if (ctx?.onceki) istemci.setQueryData(anahtar, ctx.onceki);
      toast.hata("Kalıcı silme başarısız", {
        aciklama: (err as Error).message,
      });
    },
    onSuccess: () => {
      toast.basari("Kayıt kalıcı olarak silindi");
    },
    onSettled: () => {
      istemci.invalidateQueries({ queryKey: KOK_KEY });
    },
  });
}
