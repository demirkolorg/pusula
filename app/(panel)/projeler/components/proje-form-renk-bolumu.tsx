"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PALET_RENKLERI,
  kapakArkaplanSinifi,
  kapakEtiketi,
  type KapakRenk,
} from "@/lib/kapak-renk";

type Props = {
  // Form state'inden gelen renk token'ı (boş string = renk yok)
  deger: string;
  onSec: (yeniDeger: KapakRenk | "") => void;
};

/**
 * Proje formunda "Kapak Rengi" alanı — 12 palet swatch + "renk yok" butonu.
 * Mikro bileşen (Kontrol Kural 19) — proje-form.tsx 200 satır altına çekmek için
 * ayrıştırıldı.
 */
export function ProjeFormRenkBolumu({ deger, onSec }: Props) {
  return (
    <div className="grid gap-2">
      <Label>Kapak Rengi</Label>
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-7">
        <button
          type="button"
          onClick={() => onSec("")}
          className={cn(
            "border-input hover:border-foreground inline-flex size-9 items-center justify-center rounded-md border bg-transparent text-xs",
            !deger && "border-foreground",
          )}
          aria-label="Renk yok"
          aria-pressed={!deger}
        >
          —
        </button>
        {PALET_RENKLERI.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onSec(r)}
            className={cn(
              "hover:ring-foreground inline-flex size-9 items-center justify-center rounded-md text-white ring-2 ring-transparent transition",
              kapakArkaplanSinifi(r),
              deger === r && "ring-foreground",
            )}
            aria-label={`Renk: ${kapakEtiketi(r) ?? r}`}
            aria-pressed={deger === r}
            title={kapakEtiketi(r) ?? r}
          >
            {deger === r ? "✓" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
