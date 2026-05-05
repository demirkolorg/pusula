"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { KartTamamlaToggle } from "./kart-tamamla-toggle";
import type { TamamlamaYasak, ToggleModu } from "../kart-tamamla-kontrol";

type Props = {
  baslik: string;
  setBaslik: (yeni: string) => void;
  kaydet: () => void;
  // Trello tarzı tamamlama toggle'ı başlığın solunda. Modal'da her zaman
  // görünür (hover-only davranışı sadece KartMini'de gerekli).
  tamamlandi: boolean;
  toggleModu: ToggleModu;
  onToggleAksiyon: React.ComponentProps<
    typeof KartTamamlaToggle
  >["onAksiyon"];
  // ADR-0018 — yasak nedeni varsa toggle disabled + tooltip dinamik mesaj.
  tamamlamaYasak?: TamamlamaYasak | null;
};

// Sancak referansı: 22px / weight 600 / -0.015em letter-spacing — başlık
// görsel olarak vurgulu fakat hover'da düzenlenebilir alan kabuğunda.
export function KartModalBaslik({
  baslik,
  setBaslik,
  kaydet,
  tamamlandi,
  toggleModu,
  onToggleAksiyon,
  tamamlamaYasak = null,
}: Props) {
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
    <div className="flex items-start gap-2">
      {/* Toggle başlık üstüne hizalanır — başlık satırı 22px, toggle 32px,
          küçük yukarı offset ile optik denge. */}
      <div className="pt-0.5">
        <KartTamamlaToggle
          tamamlandi={tamamlandi}
          modu={toggleModu}
          onAksiyon={onToggleAksiyon}
          yasak={tamamlamaYasak}
          boyut="md"
        />
      </div>
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
          "text-foreground flex-1 resize-none rounded-md border-0 bg-transparent px-1 py-0.5 leading-tight tracking-[-0.015em] outline-none",
          "text-[20px] font-semibold sm:text-[22px]",
          "hover:bg-muted/50 focus-visible:bg-muted/40 focus-visible:ring-ring/40 focus-visible:ring-2",
          // Tamamlanmışsa başlık üstü çizili + soluk; KartMini ile aynı dil.
          tamamlandi && "text-muted-foreground line-through",
        )}
      />
    </div>
  );
}
