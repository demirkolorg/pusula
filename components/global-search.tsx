"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

/**
 * Header'daki arama tetikleyicisi. Tıklandığında / odaklandığında / Cmd-K /
 * Cmd-Space basıldığında KomutPaleti açılır (paletin kendi keyboard listener'ı
 * panel layout'unda mount edilmiş). Bu bileşen sadece görsel ipucu — input
 * gibi görünür ama gerçek arama Cmd-K modal'ında olur.
 *
 * Tıklama, modal'ı açan keyboard event'i programatik olarak yayar (CustomEvent
 * yerine basit pattern: özel keydown dispatch tutarlı çalışmıyor; bunun yerine
 * window'a bir CustomEvent atıyoruz).
 */
export function GlobalSearch() {
  const tetikle = () => {
    // Cmd-K event'ini yapay üret — KomutPaleti'nin global listener'ı yakalar.
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );
  };

  return (
    <button
      type="button"
      onClick={tetikle}
      className="text-muted-foreground bg-background hover:border-foreground/30 focus-visible:ring-ring relative flex h-8 w-72 max-w-full items-center gap-2 rounded-md border px-2.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
      aria-label="Genel arama"
    >
      <SearchIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="flex-1 truncate">Ara…</span>
      <kbd className="bg-muted text-muted-foreground hidden items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
