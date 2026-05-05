"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Mini segmented control — Tabs primitive yok (shadcn'de henüz yüklü değil),
// basit button-grup yeterli. Aria-pressed ile semantik switch davranışı.

type Sekme<TKod extends string> = {
  kod: TKod;
  etiket: string;
  sayi: number | undefined;
};

type Props<TKod extends string> = {
  aktif: TKod;
  setAktif: (kod: TKod) => void;
  sekmeler: readonly Sekme<TKod>[];
};

export function OnaylarSegment<TKod extends string>({
  aktif,
  setAktif,
  sekmeler,
}: Props<TKod>) {
  return (
    <div
      role="tablist"
      aria-label="Bekleyen onay türü"
      className="bg-muted/50 inline-flex items-center gap-1 rounded-md p-1 text-sm"
    >
      {sekmeler.map((s) => (
        <button
          key={s.kod}
          type="button"
          role="tab"
          aria-selected={aktif === s.kod}
          onClick={() => setAktif(s.kod)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-medium transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            aktif === s.kod
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s.etiket}
          {typeof s.sayi === "number" && s.sayi > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                aktif === s.kod
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {s.sayi}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
