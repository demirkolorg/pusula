"use client";

import * as React from "react";
import { ImageOffIcon, PaletteIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  KAPAK_RENK_TOKENLERI,
  kapakArkaplanSinifi,
  kapakEtiketi,
  type KapakRenk,
} from "@/lib/kapak-renk";
import {
  useKapakRenginiAyarla,
  useKapakRenginiKaldir,
} from "../kapak/hooks";

type Props = {
  kartId: string;
  projeId: string;
  mevcut: string | null;
  duzenleyebilir: boolean;
  trigger: React.ReactNode;
};

// Kart kapağı için renk seçici. 15 token (3 sistem + 12 palet) grid'de
// gösterilir, mevcut renk yüzükle işaretlenir, "Kaldır" butonu varolan rengi
// siler. Görsel kapak akışı (Eklenti paneli) ayrı — burada sadece renk.
export function KartKapakPopover({
  kartId,
  projeId,
  mevcut,
  duzenleyebilir,
  trigger,
}: Props) {
  const [acik, setAcik] = React.useState(false);
  const ayarla = useKapakRenginiAyarla(projeId);
  const kaldir = useKapakRenginiKaldir(projeId);

  const sec = (renk: KapakRenk) => {
    if (!duzenleyebilir) return;
    ayarla.mutate({ kart_id: kartId, renk });
    setAcik(false);
  };

  const sil = () => {
    if (!duzenleyebilir) return;
    kaldir.mutate({ kart_id: kartId });
    setAcik(false);
  };

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="bottom"
        align="start"
        className="w-72 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-1.5">
          <PaletteIcon className="size-3.5" />
          <p className="text-sm font-medium">Kapak rengi</p>
        </div>

        <div
          role="radiogroup"
          aria-label="Kapak rengi seçenekleri"
          className="grid grid-cols-5 gap-1.5"
        >
          {KAPAK_RENK_TOKENLERI.map((token) => {
            const sinif = kapakArkaplanSinifi(token);
            const etiket = kapakEtiketi(token) ?? token;
            const seciliMi = mevcut === token;
            return (
              <button
                key={token}
                type="button"
                role="radio"
                aria-checked={seciliMi}
                aria-label={etiket}
                title={etiket}
                disabled={!duzenleyebilir}
                onClick={() => sec(token)}
                className={cn(
                  "ring-offset-popover h-11 rounded-md transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  sinif,
                  seciliMi && "ring-foreground ring-2 ring-offset-2",
                )}
              />
            );
          })}
        </div>

        {mevcut && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sil}
            disabled={!duzenleyebilir}
            className="mt-3 w-full"
          >
            <ImageOffIcon className="size-3.5" />
            Rengi kaldır
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
