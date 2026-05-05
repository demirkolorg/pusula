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
      <header className="border-b p-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheckIcon className="size-3.5" />
          <h2 className="text-sm font-semibold">{panelBasligi(kaynak)}</h2>
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {panelAciklamasi(kaynak)}
        </p>
      </header>

      <div className="grid gap-5 p-3 md:grid-cols-2 md:gap-6 md:divide-x">
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
