import { QueryClient } from "@tanstack/react-query";

// Test icin tanimli bir QueryClient: retry yok, cache hemen GC olsun.
// Optimistic update'lerin tahmin edilebilir akisini saglar.
export function testQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // gcTime'i sonsuz tut: setQueryData ile yazilan observer'siz veri test
        // boyunca cache'te kalsin (gcTime: 0 olursa hemen silinir).
        gcTime: Infinity,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
