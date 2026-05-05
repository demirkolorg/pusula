"use client";

import { useQuery } from "@tanstack/react-query";
import { kartAktiviteleriEylem, projeAktiviteleriEylem } from "./actions";
// Saf key tanımları ayrı dosyada — diğer hook'lar `ekInvalidate` için bu
// modülü import edebilir; aktivite/actions zincirini test ortamına çekmez.
export {
  KART_AKTIVITELERI_KEY,
  kartAktiviteleriKey,
  PROJE_AKTIVITELERI_KEY,
  projeAktiviteleriKey,
} from "./keys";
import { kartAktiviteleriKey, projeAktiviteleriKey } from "./keys";

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

// Proje altındaki TÜM kayıtların audit log'u — header'dan açılan modalde
// kullanılır. `etkin` ile modal kapalıyken sorgu durdurulur (network
// tasarrufu — ilk açılışta tetiklensin).
export function useProjeAktiviteleri(
  projeId: string | null,
  etkin: boolean = true,
) {
  return useQuery({
    queryKey: projeAktiviteleriKey(projeId ?? ""),
    enabled: !!projeId && etkin,
    queryFn: async () => {
      const r = await projeAktiviteleriEylem({ proje_id: projeId! });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
}
