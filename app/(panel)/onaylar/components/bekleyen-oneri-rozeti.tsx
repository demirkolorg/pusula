"use client";

import * as React from "react";
import { useBekleyenOneriSayimi } from "../hooks";
import { cn } from "@/lib/utils";

// ADR-0019/PR-3 — Sidebar item'ında "Tamamlama Onayları" yanında bekleyen
// öneri sayısını gösteren rozet. Yetki yoksa server 0 döner; rozet gizlenir.
// Sayım staleTime=60s (hooks.ts) + realtime invalidate ile güncellenir.

export function BekleyenOneriRozeti() {
  const sorgu = useBekleyenOneriSayimi();
  const toplam = (sorgu.data?.kart ?? 0) + (sorgu.data?.madde ?? 0);
  if (toplam === 0) return null;
  return (
    <span
      className={cn(
        "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      )}
      aria-label={`${toplam} bekleyen öneri`}
    >
      {toplam}
    </span>
  );
}
