"use client";

import { useQuery } from "@tanstack/react-query";
import { kartAktiviteleriEylem } from "./actions";
// Saf key tanımları ayrı dosyada — diğer hook'lar `ekInvalidate` için bu
// modülü import edebilir; aktivite/actions zincirini test ortamına çekmez.
export { KART_AKTIVITELERI_KEY, kartAktiviteleriKey } from "./keys";
import { kartAktiviteleriKey } from "./keys";

// Read-only — optimistic mutation yok (Kural 113 kapsamı dışı zaten;
// audit log'a kullanıcı doğrudan yazmaz, mutation'lar arka planda yazar).
export function useKartAktiviteleri(kartId: string | null) {
  return useQuery({
    queryKey: kartAktiviteleriKey(kartId ?? ""),
    enabled: !!kartId,
    queryFn: async () => {
      const r = await kartAktiviteleriEylem({ kart_id: kartId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    // Kart üzerinde yapılan diğer mutation'lar invalidate eder; staleTime
    // 30sn yeterli — yarı-canlı timeline.
    staleTime: 30_000,
  });
}
