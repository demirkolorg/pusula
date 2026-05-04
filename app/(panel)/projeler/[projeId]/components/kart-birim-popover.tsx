"use client";

import * as React from "react";
import { Building2Icon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KartBirimler } from "./kart-birimler";

type Props = {
  kartId: string;
  trigger: React.ReactNode;
};

// KartBirimler içeriğini popover'a sarar — kart-modal'da meta chip
// strip'inden tetiklenir. Mevcut KartBirimler'in iş mantığı (eklenti
// listesi + ekleme select'i) aynen korunur, sadece sunum değişir.
export function KartBirimPopover({ kartId, trigger }: Props) {
  const [acik, setAcik] = React.useState(false);
  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent side="bottom" align="start" className="w-80 p-0">
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-1.5">
            <Building2Icon className="size-3.5" />
            <p className="text-sm font-medium">Birimler</p>
          </div>
          <KartBirimler kartId={kartId} gosterimMod="kompakt" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
