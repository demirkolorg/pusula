"use client";

import * as React from "react";
import {
  ArchiveIcon,
  MoreVerticalIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { YetkililerPaneliPopover } from "../yetkili/components/yetkililer-paneli";

export type ProjeBaslikAksiyonYetkileri = {
  arama: boolean;
  yetkililerYonet: boolean;
  arsivle: boolean;
};

type Props = {
  projeId: string;
  yetkiler: ProjeBaslikAksiyonYetkileri;
  onAramaAc: () => void;
  className?: string;
};

// Header sağ blok — Yetkililer · Arama · ⋮ More menu.
// Kompakt: mobilde sadece ikon, sm+ etiket görünür. Hit target 44px (Kural 11).
export function ProjeBaslikAksiyonlar({
  projeId,
  yetkiler,
  onAramaAc,
  className,
}: Props) {
  const yakinda = (etiket: string) => () =>
    toast.bilgi(`${etiket} yakında eklenecek`);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {yetkiler.yetkililerYonet && (
        <YetkililerPaneliPopover
          kaynak={{
            tip: "proje",
            projeId,
            izinler: { birimYonet: true, kisiYonet: true },
          }}
          align="end"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Yetkililer"
              title="Yetkililer"
              className="min-h-9"
            >
              <ShieldCheckIcon className="size-4" />
              <span className="hidden md:inline">Yetkililer</span>
            </Button>
          }
        />
      )}

      {yetkiler.arama && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onAramaAc}
          aria-label="Kart ara (Ctrl+K)"
          title="Kart ara — Ctrl+K"
          className="min-h-9 min-w-9"
        >
          <SearchIcon className="size-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Daha fazla işlem"
              title="Daha fazla"
              className="min-h-9 min-w-9"
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={yakinda("Adı düzenle")}>
            Adı düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={yakinda("Açıklama")}>
            Açıklama
          </DropdownMenuItem>
          <DropdownMenuItem onClick={yakinda("Dışa aktar")}>
            Dışa aktar
          </DropdownMenuItem>
          {yetkiler.arsivle && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={yakinda("Arşivle")}
              >
                <ArchiveIcon className="size-4" /> Arşivle
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
