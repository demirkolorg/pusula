"use client";

import * as React from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  projeDetayKey,
  useProjeDetayGuncelle,
} from "../hooks/detay-sorgulari";
import type { ProjeDetayOzeti } from "../services";
import { ProjeBaslikAdInline } from "./proje-baslik-ad-inline";
import { ProjeBaslikIkonPopover } from "./proje-baslik-ikon-popover";

type Props = {
  proje: ProjeDetayOzeti;
  yildizlayabilir: boolean;
  duzenleyebilir: boolean;
  className?: string;
};

// Header sol bloğu — kapak (renk + ikon, popover) + kategori + ad (inline edit) + yıldız.
// Açıklama tooltip'e taşındı (header'ı şişirmesin); kart modal'da tam metin var.
export function ProjeBaslikKimlik({
  proje,
  yildizlayabilir,
  duzenleyebilir,
  className,
}: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(proje.id), [proje.id]);
  const guncelle = useProjeDetayGuncelle(anahtar);

  const yildizToggle = () => {
    if (!yildizlayabilir) return;
    const sonraki = !proje.yildizli_mi;
    guncelle.mutate({ id: proje.id, yildizli_mi: sonraki });
    toast.bilgi(sonraki ? "Projeye yıldız eklendi" : "Yıldız kaldırıldı");
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <ProjeBaslikIkonPopover
        projeId={proje.id}
        ad={proje.ad}
        kapakRenk={proje.kapak_renk}
        kapakIkon={proje.kapak_ikon}
        duzenleyebilir={duzenleyebilir}
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
          Proje
        </span>
        <h1 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold sm:text-base">
          <ProjeBaslikAdInline
            projeId={proje.id}
            ad={proje.ad}
            duzenleyebilir={duzenleyebilir}
            className="min-w-0"
          />
          {yildizlayabilir ? (
            <button
              type="button"
              onClick={yildizToggle}
              aria-label={
                proje.yildizli_mi ? "Yıldızı kaldır" : "Projeye yıldız ekle"
              }
              aria-pressed={proje.yildizli_mi}
              className={cn(
                "shrink-0 rounded p-0.5 transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                proje.yildizli_mi
                  ? "text-secondary"
                  : "text-muted-foreground/40 hover:text-secondary",
              )}
            >
              <StarIcon
                className="size-4"
                fill={proje.yildizli_mi ? "currentColor" : "none"}
              />
            </button>
          ) : (
            proje.yildizli_mi && (
              <StarIcon
                className="text-secondary size-4 shrink-0"
                fill="currentColor"
                aria-label="Yıldızlı"
              />
            )
          )}
        </h1>
      </div>
    </div>
  );
}
