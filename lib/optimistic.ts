"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { Sonuc } from "@/lib/sonuc";

// Plan: docs/plan.md Bölüm 1.5/F · Kontrol Kural 107-116.
// Tüm server-state mutation'ları bu wrapper üzerinden çalışır.
// Çıplak useMutation + el yazımı onMutate yasak (Kural 108).

type Anahtar = QueryKey;
type Anahtarlar = Anahtar | readonly Anahtar[];

type Cikti<T> = T extends Sonuc<infer V> ? V : T;

type OptimisticConfig<TVars, TVeri, TBaglam> = {
  // İnvalidate edilecek query key (tek veya dizi).
  queryKey: Anahtarlar;
  // Server action veya fetch — Sonuc<V> ya da V dönebilir.
  mutationFn: (girdi: TVars) => Promise<TVeri>;
  // Cache'deki eski veriyi yeni hâline dönüştüren saf fonksiyon.
  // Bir veya birden fazla query key için ayrı handler verilebilir.
  optimistic?: (oldData: unknown, vars: TVars) => unknown;
  // Birden fazla key için ayrı optimistic update tablosu.
  optimisticMap?: ReadonlyArray<{
    queryKey: Anahtar;
    update: (oldData: unknown, vars: TVars) => unknown;
  }>;
  // Toast'a verilecek hata açıklaması (Kural 108).
  hataMesaji: string;
  // Başarı toast'ı opsiyonel (sessiz olması default — UX hızı, Kural 111).
  basariMesaji?: string;
  // Sunucudan gerçek veri gelince geçici kaydı swap et (Kural 109).
  // `sunucuYaniti` Sonuc<X> sarmalayıcısı çözülmüş hâlidir (X).
  swap?: (oldData: unknown, vars: TVars, sunucuYaniti: Cikti<TVeri>) => unknown;
  // ek context callbacks
  onSettledExtra?: () => void;
  ekstra?: Omit<
    UseMutationOptions<TVeri, Error, TVars, TBaglam>,
    "mutationFn" | "onMutate" | "onError" | "onSettled" | "onSuccess"
  >;
};

type Baglam = { snapshots: Array<[Anahtar, unknown]> };

function anahtarlar(input: Anahtarlar): Anahtar[] {
  if (Array.isArray(input) && input.length > 0 && Array.isArray(input[0])) {
    return input as Anahtar[];
  }
  return [input as Anahtar];
}

// Sonuc<T> sarmalayıcısını çöz, hata ise atılır.
function cozumle<T>(deger: T): Cikti<T> {
  if (
    deger &&
    typeof deger === "object" &&
    "basarili" in (deger as Record<string, unknown>)
  ) {
    const s = deger as unknown as Sonuc<unknown>;
    if (!s.basarili) {
      throw new Error(s.hata);
    }
    return s.veri as Cikti<T>;
  }
  return deger as Cikti<T>;
}

export function useOptimisticMutation<TVars, TVeri>(
  cfg: OptimisticConfig<TVars, TVeri, Baglam>,
) {
  const istemci = useQueryClient();

  return useMutation<TVeri, Error, TVars, Baglam>({
    ...(cfg.ekstra ?? {}),
    mutationFn: cfg.mutationFn,

    onMutate: async (vars): Promise<Baglam> => {
      const tumKeyler = cfg.optimisticMap
        ? cfg.optimisticMap.map((m) => m.queryKey)
        : anahtarlar(cfg.queryKey);

      // Çakışan refetch'leri durdur.
      await Promise.all(
        tumKeyler.map((k) => istemci.cancelQueries({ queryKey: k })),
      );

      const snapshots: Array<[Anahtar, unknown]> = [];

      if (cfg.optimisticMap) {
        for (const m of cfg.optimisticMap) {
          const onceki = istemci.getQueryData(m.queryKey);
          snapshots.push([m.queryKey, onceki]);
          istemci.setQueryData(m.queryKey, (old: unknown) =>
            m.update(old, vars),
          );
        }
      } else if (cfg.optimistic) {
        for (const k of tumKeyler) {
          const onceki = istemci.getQueryData(k);
          snapshots.push([k, onceki]);
          istemci.setQueryData(k, (old: unknown) =>
            cfg.optimistic!(old, vars),
          );
        }
      }

      return { snapshots };
    },

    onError: (err, _vars, baglam) => {
      // Snapshot'lardan geri sar.
      if (baglam?.snapshots) {
        for (const [key, eski] of baglam.snapshots) {
          istemci.setQueryData(key, eski);
        }
      }
      toast.hata(cfg.hataMesaji, { aciklama: err.message });
    },

    onSuccess: (yanit, vars) => {
      // Sunucu gerçek veriyi döndüyse (swap varsa) cache'i güncelle.
      if (cfg.swap) {
        const cikti = cozumle(yanit);
        const tumKeyler = cfg.optimisticMap
          ? cfg.optimisticMap.map((m) => m.queryKey)
          : anahtarlar(cfg.queryKey);
        for (const k of tumKeyler) {
          istemci.setQueryData(k, (old: unknown) =>
            cfg.swap!(old, vars, cikti),
          );
        }
      }
      if (cfg.basariMesaji) {
        toast.basari(cfg.basariMesaji);
      }
    },

    onSettled: () => {
      const tumKeyler = cfg.optimisticMap
        ? cfg.optimisticMap.map((m) => m.queryKey)
        : anahtarlar(cfg.queryKey);
      for (const k of tumKeyler) {
        void istemci.invalidateQueries({ queryKey: k });
      }
      cfg.onSettledExtra?.();
    },
  });
}

// Sonuc<T> sarmalayıcısı atan server action'ları, mutation fonksiyonu olarak
// uyarlamak için yardımcı: hata atılır, başarılı veri döner.
export function eylemMutasyonu<TVars, TVeri>(
  fn: (girdi: TVars) => Promise<Sonuc<TVeri>>,
): (girdi: TVars) => Promise<TVeri> {
  return async (girdi) => {
    const r = await fn(girdi);
    if (!r.basarili) throw new Error(r.hata);
    return r.veri;
  };
}
