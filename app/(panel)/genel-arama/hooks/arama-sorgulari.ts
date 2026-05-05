"use client";

// Genel Arama TanStack Query hook'u.
// Kontrol Kural 23 (server-state için TanStack Query, debounce + keepPreviousData).

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { genelAramaEylem } from "../actions";
import type { AramaSorgusu } from "../schemas";
import type { AramaSonucu } from "../tipler";

/**
 * Debounce hook'u — yazı yazılırken her tuş basımında sorgu atmak yerine
 * 250ms bekleme periyodu sonrası tek sorgu atar.
 * Kontrol Kural 132 (resmi araçları tercih et) — lodash-es/debounce yerine
 * inline çünkü tek kullanım, dependency eklemeye değmez.
 */
function useDebounce<T>(deger: T, gecikme = 250): T {
  const [debounced, setDebounced] = useState(deger);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(deger), gecikme);
    return () => clearTimeout(t);
  }, [deger, gecikme]);
  return debounced;
}

/**
 * Komut paleti araması. Sorgu boş veya 2 karakterden kısaysa fetch atılmaz
 * (`enabled: false`). Sonuçlar 30sn cache'lenir; aynı sorgu tekrar yazılırsa
 * anında döner.
 */
export function useGenelArama(girdi: Partial<AramaSorgusu>) {
  const debouncedSorgu = useDebounce(girdi.sorgu ?? "", 250);
  const aktif = debouncedSorgu.trim().length >= 2;

  return useQuery<AramaSonucu[]>({
    queryKey: ["genel-arama", debouncedSorgu, girdi.tipler ?? "hepsi"],
    queryFn: async () => {
      const sonuc = await genelAramaEylem({
        sorgu: debouncedSorgu,
        ...(girdi.tipler ? { tipler: girdi.tipler } : {}),
        limit: girdi.limit ?? 50,
      });
      if (!sonuc.basarili) {
        throw new Error(sonuc.hata);
      }
      return sonuc.veri;
    },
    enabled: aktif,
    staleTime: 30_000, // 30sn — aynı sorgu tekrar yazılırsa anında döner
    placeholderData: keepPreviousData, // yeni sorgu yüklenirken eski sonuç görünür
  });
}
