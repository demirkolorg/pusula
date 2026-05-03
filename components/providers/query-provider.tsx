"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";

function istemciOlustur(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let tarayiciIstemcisi: QueryClient | undefined;

function istemciAl(): QueryClient {
  if (isServer) return istemciOlustur();
  if (!tarayiciIstemcisi) tarayiciIstemcisi = istemciOlustur();
  return tarayiciIstemcisi;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const istemci = istemciAl();
  return <QueryClientProvider client={istemci}>{children}</QueryClientProvider>;
}
