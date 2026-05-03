"use client";

import { useQuery } from "@tanstack/react-query";

export type OturumKullanicisi = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  kurum_id: string;
};

export const OTURUM_KEY = ["oturum-kullanicisi"] as const;

export function useOturumKullanicisi() {
  return useQuery({
    queryKey: OTURUM_KEY,
    queryFn: async (): Promise<OturumKullanicisi | null> => {
      const r = await fetch("/api/oturum", { cache: "no-store" });
      if (!r.ok) return null;
      const data = await r.json() as { kullanici: OturumKullanicisi | null };
      return data.kullanici;
    },
    // Oturum bir session içinde değişmez — Infinite cache; logout'ta invalidate
    staleTime: Infinity,
  });
}
