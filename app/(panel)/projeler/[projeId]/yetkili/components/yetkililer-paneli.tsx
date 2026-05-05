"use client";

import * as React from "react";
import { ShieldCheckIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  panelAciklamasi,
  panelBasligi,
  type YetkiliKaynagi,
} from "../yetkili-tipler";
import { YetkiliBirimSutunu } from "./yetkili-birim-sutunu";
import { YetkiliKisiSutunu } from "./yetkili-kisi-sutunu";

type PanelProps = {
  kaynak: YetkiliKaynagi;
  className?: string;
};

// Why polimorfik tek panel: proje/liste/kart yetkilendirme arayüzleri
// kullanıcıda farklı zihinsel modeller doğurmasın diye tek tasarım, tek
// etkileşim. Veri kaynağı `kaynak.tip`'e göre adaptör seçer; UI tutarlı kalır.
export function YetkililerPaneli({ kaynak, className }: PanelProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <header className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <span
            className="bg-muted flex size-8 items-center justify-center rounded-md"
            aria-hidden
          >
            <ShieldCheckIcon className="size-4" />
          </span>
          <div className="grid gap-0.5">
            <h2 className="text-sm font-semibold leading-none">
              {panelBasligi(kaynak)}
            </h2>
            <p className="text-muted-foreground text-xs">
              {panelAciklamasi(kaynak)}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-2 md:gap-6 md:divide-x md:divide-border">
        <div className="md:pr-4">
          <YetkiliBirimSutunu kaynak={kaynak} />
        </div>
        <div className="md:pl-4">
          <YetkiliKisiSutunu kaynak={kaynak} />
        </div>
      </div>
    </div>
  );
}

type PopoverProps = {
  kaynak: YetkiliKaynagi;
  trigger: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export function YetkililerPaneliPopover({
  kaynak,
  trigger,
  side = "bottom",
  align = "start",
}: PopoverProps) {
  const [acik, setAcik] = React.useState(false);
  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side={side}
        align={align}
        className="w-[min(48rem,calc(100vw-2rem))] p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <YetkililerPaneli kaynak={kaynak} />
      </PopoverContent>
    </Popover>
  );
}
