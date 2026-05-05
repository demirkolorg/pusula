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

// Sade avatar — initials + deterministic palet token'ı (ad+soyad'dan hash).
// Why semantic palet: tema değiştiğinde (light/dark) veya marka renkleri
// güncellendiğinde avatar'lar otomatik adapte olsun. Inline hex YASAK.
const PALET_SINIFLARI = [
  "bg-palet-kirmizi text-palet-kirmizi-foreground",
  "bg-palet-turuncu text-palet-turuncu-foreground",
  "bg-palet-yesil text-palet-yesil-foreground",
  "bg-palet-zumrut text-palet-zumrut-foreground",
  "bg-palet-camgobegi text-palet-camgobegi-foreground",
  "bg-palet-mavi text-palet-mavi-foreground",
  "bg-palet-mor text-palet-mor-foreground",
  "bg-palet-pembe text-palet-pembe-foreground",
] as const;

export function KisiAvatar({
  ad,
  soyad,
  boyut = "sm",
  className,
  title,
}: Props) {
  const initials = `${(ad?.[0] ?? "?").toUpperCase()}${(soyad?.[0] ?? "").toUpperCase()}`;
  const renkSinifi = paletSinifSec(`${ad} ${soyad}`);
  return (
    <span
      title={title ?? `${ad} ${soyad}`.trim()}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full font-medium",
        boyut === "sm" ? "size-7 text-xs" : "size-9 text-sm",
        renkSinifi,
        className,
      )}
      aria-label={`${ad} ${soyad}`.trim()}
    >
      {initials}
    </span>
  );
}

function paletSinifSec(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALET_SINIFLARI[h % PALET_SINIFLARI.length]!;
}
