"use client";

import * as React from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { kapakArkaplanSinifi } from "@/lib/kapak-renk";
import { toast } from "@/lib/toast";
import {
  projeDetayKey,
  useProjeDetayGuncelle,
} from "../hooks/detay-sorgulari";
import type { ProjeDetayOzeti } from "../services";

type Props = {
  proje: ProjeDetayOzeti;
  yildizlayabilir: boolean;
  className?: string;
};

// Header sol bloğu — proje ikonu + kategori (breadcrumb) + başlık + yıldız.
// Açıklama tooltip'e taşındı (header'ı şişirmesin); kart modal'da tam metin var.
export function ProjeBaslikKimlik({
  proje,
  yildizlayabilir,
  className,
}: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(proje.id), [proje.id]);
  const guncelle = useProjeDetayGuncelle(anahtar);
  const kapakSinifi = kapakArkaplanSinifi(proje.kapak_renk);

  const yildizToggle = () => {
    if (!yildizlayabilir) return;
    const sonraki = !proje.yildizli_mi;
    guncelle.mutate({ id: proje.id, yildizli_mi: sonraki });
    toast.bilgi(sonraki ? "Projeye yıldız eklendi" : "Yıldız kaldırıldı");
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div
        className={cn(
          "size-9 shrink-0 rounded-md sm:size-10",
          kapakSinifi ?? "bg-muted",
        )}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
          Proje
        </span>
        <h1
          className="flex min-w-0 items-center gap-1.5 text-sm font-semibold sm:text-base"
          title={proje.aciklama ?? proje.ad}
        >
          <span className="truncate">{proje.ad}</span>
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
