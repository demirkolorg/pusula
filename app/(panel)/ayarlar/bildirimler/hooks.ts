"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  bildirimTercihGuncelleEylem,
  bildirimTercihleriniListeleEylem,
} from "./actions";
import type { BildirimTercihGuncelle } from "./schemas";
import type { TercihSatir } from "./services";

export const BILDIRIM_TERCIHLERI_KEY = "bildirim-tercihleri";

export function bildirimTercihleriKey() {
  return [BILDIRIM_TERCIHLERI_KEY] as const;
}

type Anahtar = ReturnType<typeof bildirimTercihleriKey>;

export function useBildirimTercihleri() {
  return useQuery({
    queryKey: bildirimTercihleriKey(),
    queryFn: async () => {
      const r = await bildirimTercihleriniListeleEylem(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });
}

// Toggle başına optimistic update — kullanıcı switch'e basar basmaz UI'da
// yansır, server upsert arka planda. Hatada wrapper otomatik rollback +
// toast.hata gösterir.
export function useBildirimTercihGuncelle() {
  const anahtar: Anahtar = bildirimTercihleriKey();
  return useOptimisticMutation<BildirimTercihGuncelle, TercihSatir>({
    queryKey: anahtar,
    mutationFn: eylemMutasyonu(bildirimTercihGuncelleEylem),
    optimistic: (eski, vars) => {
      const liste = eski as TercihSatir[] | undefined;
      if (!liste) return eski;
      return liste.map((s) =>
        s.tip === vars.tip
          ? {
              ...s,
              in_app_acik: vars.in_app_acik ?? s.in_app_acik,
              email_acik: vars.email_acik ?? s.email_acik,
            }
          : s,
      );
    },
    swap: (eski, vars, yanit) => {
      const liste = eski as TercihSatir[] | undefined;
      if (!liste) return eski;
      return liste.map((s) => (s.tip === vars.tip ? yanit : s));
    },
    hataMesaji: "Bildirim tercihi güncellenemedi",
  });
}

// Test/yardımcı: cache'i invalidate et (sayfa init sonrası).
export function useBildirimTercihYenile() {
  const istemci = useQueryClient();
  return () => istemci.invalidateQueries({ queryKey: bildirimTercihleriKey() });
}
