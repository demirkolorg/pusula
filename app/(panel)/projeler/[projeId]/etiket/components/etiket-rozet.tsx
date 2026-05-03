"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { EtiketOzeti } from "../services";

type Props = {
  etiket: Pick<EtiketOzeti, "ad" | "renk">;
  boyut?: "sm" | "md";
  className?: string;
};

// Trello-tarzı renkli rozet. Hex renk inline style ile uygulanır.
// Metin rengi açık/koyu otomatik seçilir (basit luminance hesabı).
export function EtiketRozet({ etiket, boyut = "sm", className }: Props) {
  const metinRengi = aydinlikMi(etiket.renk) ? "#171717" : "#ffffff";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-medium leading-none",
        boyut === "sm" ? "h-5 px-1.5 text-xs" : "h-6 px-2 text-sm",
        className,
      )}
      style={{ backgroundColor: etiket.renk, color: metinRengi }}
    >
      {etiket.ad}
    </span>
  );
}

function aydinlikMi(hex: string): boolean {
  // #rgb veya #rrggbb destekli; geçersizse koyu kabul et.
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  let r: number, g: number, b: number;
  const h = m[1]!;
  if (h.length === 3) {
    r = parseInt(h[0]! + h[0]!, 16);
    g = parseInt(h[1]! + h[1]!, 16);
    b = parseInt(h[2]! + h[2]!, 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  // YIQ luminance — basit ve hızlı
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}
