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

// Sprint 4 / S4-10 — Eski YIQ formülü WCAG ile uyumsuzdu; orta-açık
// renklerde kontrast yetersiz kalıyordu. WCAG 2.1 SC 1.4.3 (AA) için
// sRGB → linear → relative luminance hesabı.
//
// Algoritma: https://www.w3.org/WAI/GL/wiki/Relative_luminance
// L = 0.2126 R + 0.7152 G + 0.0722 B
// Renk channel'ları önce sRGB → linear dönüşümü ile düzeltilir.
function aydinlikMi(hex: string): boolean {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const h = m[1]!;
  let r8: number, g8: number, b8: number;
  if (h.length === 3) {
    r8 = parseInt(h[0]! + h[0]!, 16);
    g8 = parseInt(h[1]! + h[1]!, 16);
    b8 = parseInt(h[2]! + h[2]!, 16);
  } else {
    r8 = parseInt(h.slice(0, 2), 16);
    g8 = parseInt(h.slice(2, 4), 16);
    b8 = parseInt(h.slice(4, 6), 16);
  }
  const linear = (c8: number): number => {
    const c = c8 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * linear(r8) + 0.7152 * linear(g8) + 0.0722 * linear(b8);
  // WCAG eşiği ~0.179 (luminance 0.179 = sRGB ~ 117). Bu eşikte hem
  // beyaz hem siyah metin kabul edilebilir kontrast verir; hesaplı
  // tarafta beyaz metin için biraz daha güvenli olarak siyaha düş.
  return L > 0.179;
}
