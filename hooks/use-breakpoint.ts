"use client";

import * as React from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

function bpHesapla(width: number): Breakpoint {
  if (width >= DESKTOP_MIN) return "desktop";
  if (width >= TABLET_MIN) return "tablet";
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = React.useState<Breakpoint>("desktop");

  React.useEffect(() => {
    const guncelle = () => setBp(bpHesapla(window.innerWidth));
    guncelle();
    window.addEventListener("resize", guncelle, { passive: true });
    return () => window.removeEventListener("resize", guncelle);
  }, []);

  return bp;
}

export function useMobil(): boolean {
  return useBreakpoint() === "mobile";
}
