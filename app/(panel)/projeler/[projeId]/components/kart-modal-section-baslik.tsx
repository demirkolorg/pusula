"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: React.ComponentType<{ className?: string }>;
  baslik: string;
  ekstra?: React.ReactNode;
  className?: string;
};

// Sancak `section-h` — küçük, uppercase, harf aralıklı bölüm başlığı.
// İkon + metin + sağda ekstra (progress bar / sayı).
export function KartModalSectionBaslik({
  icon: Icon,
  baslik,
  ekstra,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
        <Icon className="size-3" />
        <span>{baslik}</span>
      </div>
      {ekstra && <div className="flex items-center gap-2">{ekstra}</div>}
    </div>
  );
}
