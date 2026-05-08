"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const koyu = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      // Sprint 4 / S4-8 — `aria-pressed` toggle semantic'ı: AT
      // "koyu tema açık/kapalı" durumunu butonun üzerinde duyurur.
      // Sun/Moon icon'ları `aria-hidden` (label zaten tema değiştirme).
      aria-label="Temayı değiştir"
      aria-pressed={koyu}
      onClick={() => setTheme(koyu ? "light" : "dark")}
      className="relative"
    >
      <SunIcon
        aria-hidden
        className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
      />
      <MoonIcon
        aria-hidden
        className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
      />
    </Button>
  );
}
