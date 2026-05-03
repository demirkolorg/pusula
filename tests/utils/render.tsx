import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { testQueryClient } from "./query-client";

type SaricıOps = {
  queryClient?: QueryClient;
};

// QueryClientProvider ile sarip render eden yardimci.
// Optimistic mutation testlerinde QueryClient'a dogrudan erisim icin client'i da geri donduruyoruz.
export function ozelRender(
  ui: ReactElement,
  ops: SaricıOps & Omit<RenderOptions, "wrapper"> = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = ops.queryClient ?? testQueryClient();

  function Sarici({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  const sonuc = render(ui, { wrapper: Sarici, ...ops });
  return Object.assign(sonuc, { queryClient });
}

export * from "@testing-library/react";
