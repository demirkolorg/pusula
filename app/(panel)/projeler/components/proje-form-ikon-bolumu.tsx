"use client";

import * as React from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { ImagePlusIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/tr";
import { ikonMu, type KapakIkonu } from "@/lib/kapak-ikon";
import { IkonSecici } from "@/components/ikon-secici";

type Props = {
  // Form state'inden gelen ikon ismi (boş string = seçilmedi)
  deger: string;
  // İkon seçildi/temizlendi
  onSec: (yeniDeger: KapakIkonu | null) => void;
  // Önizleme zemin rengi (form'daki seçili kapak rengi)
  zeminRenkSinifi?: string | null;
};

/**
 * Proje formunda "Kapak İkonu" alanı — picker tetikleyicisi + canlı önizleme.
 * Mikro bileşen (Kontrol Kural 19) — proje-form.tsx 200 satır altına çekmek için
 * ayrıştırıldı.
 */
export function ProjeFormIkonBolumu({ deger, onSec, zeminRenkSinifi }: Props) {
  const seciliMi = ikonMu(deger);
  return (
    <div className="grid gap-2">
      <Label>{tr.proje.form.kapakIkonu}</Label>
      <IkonSecici
        deger={seciliMi ? deger : null}
        onSec={onSec}
        align="start"
        tetikleyici={
          <span
            className={cn(
              "border-input hover:border-foreground inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 text-sm transition",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                  zeminRenkSinifi ?? "bg-muted",
                )}
                aria-hidden
              >
                {seciliMi ? (
                  <DynamicIcon
                    name={deger}
                    className={cn(
                      "size-4",
                      zeminRenkSinifi ? "text-white/90" : "text-muted-foreground",
                    )}
                  />
                ) : (
                  <ImagePlusIcon className="text-muted-foreground size-4" />
                )}
              </span>
              <span className="truncate">
                {seciliMi ? deger : tr.proje.form.ikonYok}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">
              {tr.proje.form.ikonSec}
            </span>
          </span>
        }
      />
    </div>
  );
}

