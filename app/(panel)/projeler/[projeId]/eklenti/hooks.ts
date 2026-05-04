"use client";

import { useQuery } from "@tanstack/react-query";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { tempId } from "@/lib/temp-id";
import { kartAktiviteleriKey } from "../aktivite/keys";
import {
  eklentileriListeleEylem,
  eklentiIndirEylem,
  eklentiSilEylem,
} from "./actions";
import type { EklentiSil } from "./schemas";
import type { EklentiOzeti } from "./services";

export const KART_EKLENTILERI_KEY = "kart-eklentileri";

export function kartEklentileriKey(kartId: string) {
  return [KART_EKLENTILERI_KEY, kartId] as const;
}

// =====================================================================
// Sorgu
// =====================================================================

export function useKartEklentileri(kartId: string | null) {
  return useQuery({
    queryKey: kartEklentileriKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await eklentileriListeleEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
}

// =====================================================================
// Silme (optimistic)
// =====================================================================

export function useEklentiSil(kartId: string) {
  return useOptimisticMutation<EklentiSil, { id: string }>({
    queryKey: kartEklentileriKey(kartId),
    mutationFn: eylemMutasyonu(eklentiSilEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as EklentiOzeti[] | undefined) ?? [];
      return liste.filter((e) => e.id !== vars.id);
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Eklenti silinemedi",
  });
}

// =====================================================================
// İndirme — presigned URL aç
// =====================================================================

export async function eklentiIndir(eklentiId: string): Promise<string | null> {
  const r = await eklentiIndirEylem({ id: eklentiId });
  if (!r.basarili) return null;
  return r.veri.url;
}

export { tempId };
