"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  ad: string;
  soyad: string;
  boyut?: "sm" | "md";
  className?: string;
  title?: string;
};

// Sade avatar — initials + deterministic renk (ad+soyad'dan hash).
// Trello tarzı; foto destek MVP dışı.
export function UyeAvatar({ ad, soyad, boyut = "sm", className, title }: Props) {
  const initials = `${(ad?.[0] ?? "?").toUpperCase()}${(soyad?.[0] ?? "").toUpperCase()}`;
  const renk = renkSec(`${ad} ${soyad}`);
  return (
    <span
      title={title ?? `${ad} ${soyad}`.trim()}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white select-none",
        boyut === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        className,
      )}
      style={{ backgroundColor: renk }}
      aria-label={`${ad} ${soyad}`.trim()}
    >
      {initials}
    </span>
  );
}

const PALET = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
];

function renkSec(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALET[h % PALET.length]!;
}
