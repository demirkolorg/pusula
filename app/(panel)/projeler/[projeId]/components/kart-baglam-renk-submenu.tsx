"use client";

import * as React from "react";
import { ImageOffIcon } from "lucide-react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  KAPAK_RENK_TOKENLERI,
  kapakArkaplanSinifi,
  kapakEtiketi,
} from "@/lib/kapak-renk";
import {
  useKapakRenginiAyarla,
  useKapakRenginiKaldir,
} from "../kapak/hooks";

type Props = {
  kartId: string;
  projeId: string;
  mevcut: string | null;
};

// Bağlam menüsü "Kapak rengi ›" submenu — 5×3 mini grid + "Rengi kaldır".
// Trello'nun sağ tık tarzı: hızlı tek tık, modal açmaz.
export function KartBaglamRenkSubmenu({ kartId, projeId, mevcut }: Props) {
  const ayarla = useKapakRenginiAyarla(projeId);
  const kaldir = useKapakRenginiKaldir(projeId);

  return (
    <div className="p-1">
      <div
        role="radiogroup"
        aria-label="Kapak rengi"
        className="grid grid-cols-5 gap-1.5 p-1.5"
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
              onClick={() =>
                ayarla.mutate({ kart_id: kartId, renk: token })
              }
              className={cn(
                "h-8 w-8 rounded-md transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-popover",
                sinif,
                seciliMi && "ring-2 ring-foreground ring-offset-2",
              )}
            />
          );
        })}
      </div>
      {mevcut && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => kaldir.mutate({ kart_id: kartId })}>
            <ImageOffIcon /> Rengi kaldır
          </ContextMenuItem>
        </>
      )}
    </div>
  );
}
