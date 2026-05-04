"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  baslik: string;
  setBaslik: (yeni: string) => void;
  kaydet: () => void;
};

// Sancak referansı: 22px / weight 600 / -0.015em letter-spacing — başlık
// görsel olarak vurgulu fakat hover'da düzenlenebilir alan kabuğunda.
export function KartModalBaslik({ baslik, setBaslik, kaydet }: Props) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // Otomatik yükseklik — uzun başlıklar wrap olur, scrollbar göstermez.
  const yenidenBoyutlandir = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    yenidenBoyutlandir();
  }, [baslik, yenidenBoyutlandir]);

  return (
    <textarea
      ref={ref}
      aria-label="Kart başlığı"
      value={baslik}
      onChange={(e) => setBaslik(e.target.value)}
      onBlur={kaydet}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      rows={1}
      className={cn(
        "text-foreground w-full resize-none rounded-md border-0 bg-transparent px-1 py-0.5 leading-tight tracking-[-0.015em] outline-none",
        "text-[20px] font-semibold sm:text-[22px]",
        "hover:bg-muted/50 focus-visible:bg-muted/40 focus-visible:ring-ring/40 focus-visible:ring-2",
      )}
    />
  );
}
