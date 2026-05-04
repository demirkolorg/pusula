"use client";

import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { projeDetayKey } from "../hooks/detay-sorgulari";
import { kartAktiviteleriKey } from "../aktivite/keys";
import type { ProjeDetayOzeti } from "../services";
import { kapagiAyarlaEylem, kapagiKaldirEylem } from "./actions";
import type { KapagiAyarla, KapagiKaldir } from "./schemas";

// Kapak görseli URL'i server-side ProjeDetay yanıtında üretilir; ayarla/kaldır
// invalidate ile yenilenir. Optimistic için detay cache'inde kapak alanını
// patch'leriz (URL bilgisi olmadan da en azından eski kapağı kaldırırız).

function detayHaritala(
  eski: unknown,
  donusum: (d: ProjeDetayOzeti) => ProjeDetayOzeti,
): ProjeDetayOzeti | undefined {
  const d = eski as ProjeDetayOzeti | undefined;
  if (!d) return d;
  return donusum(d);
}

export function useKapagiAyarla(projeId: string) {
  return useOptimisticMutation<
    KapagiAyarla & { kapak_url: string; kapak_mime: string },
    { kart_id: string; eklenti_id: string }
  >({
    queryKey: projeDetayKey(projeId),
    mutationFn: ({ kapak_url: _u, kapak_mime: _m, ...vars }) =>
      eylemMutasyonu(kapagiAyarlaEylem)(vars),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler.map((l) => ({
          ...l,
          kartlar: l.kartlar.map((k) =>
            k.id === vars.kart_id
              ? {
                  ...k,
                  kapak_renk: null,
                  kapak: { url: vars.kapak_url, mime: vars.kapak_mime },
                }
              : k,
          ),
        })),
      })),
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.kart_id)],
    hataMesaji: "Kapak ayarlanamadı",
  });
}

export function useKapagiKaldir(projeId: string) {
  return useOptimisticMutation<KapagiKaldir, { kart_id: string }>({
    queryKey: projeDetayKey(projeId),
    mutationFn: eylemMutasyonu(kapagiKaldirEylem),
    optimistic: (eski, vars) =>
      detayHaritala(eski, (d) => ({
        ...d,
        listeler: d.listeler.map((l) => ({
          ...l,
          kartlar: l.kartlar.map((k) =>
            k.id === vars.kart_id ? { ...k, kapak: null } : k,
          ),
        })),
      })),
    ekInvalidate: (vars) => [kartAktiviteleriKey(vars.kart_id)],
    hataMesaji: "Kapak kaldırılamadı",
  });
}
