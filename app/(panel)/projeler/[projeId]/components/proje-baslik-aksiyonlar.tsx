"use client";

import * as React from "react";
import {
  ArchiveIcon,
  DownloadIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  ShieldCheckIcon,
  TextIcon,
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
import type { ProjeDetayOzeti } from "../services";
import {
  ProjeBaslikDialoglari,
  type DialogModu,
} from "./proje-baslik-dialoglari";
import { projeDetayiniJsonOlarakIndir } from "./proje-disa-aktar";

export type ProjeBaslikAksiyonYetkileri = {
  arama: boolean;
  yetkililerYonet: boolean;
  duzenle: boolean;
  arsivle: boolean;
};

type Props = {
  proje: ProjeDetayOzeti;
  yetkiler: ProjeBaslikAksiyonYetkileri;
  onAramaAc: () => void;
  className?: string;
};

// Header sağ blok — Yetkililer · Arama · ⋮ More menu.
// Kompakt: mobilde sadece ikon, sm+ etiket görünür. Hit target 44px (Kural 11).
export function ProjeBaslikAksiyonlar({
  proje,
  yetkiler,
  onAramaAc,
  className,
}: Props) {
  const [dialogModu, setDialogModu] = React.useState<DialogModu>(null);

  const disaAktar = () => {
    try {
      projeDetayiniJsonOlarakIndir(proje);
      toast.basari("Proje JSON olarak indirildi");
    } catch (err) {
      toast.hata("Dışa aktarma başarısız");
      console.error("proje-disa-aktar:", err);
    }
  };

  // Menü öğesi sayısı sıfırsa More butonunu hiç render etme.
  const menudeAksiyonVar =
    yetkiler.duzenle || yetkiler.arsivle || /* dışa aktar herkese */ true;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {yetkiler.yetkililerYonet && (
        <YetkililerPaneliPopover
          kaynak={{
            tip: "proje",
            projeId: proje.id,
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

      {menudeAksiyonVar && (
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
            {yetkiler.duzenle && (
              <>
                <DropdownMenuItem onClick={() => setDialogModu("ad")}>
                  <PencilIcon className="size-4" /> Adı düzenle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogModu("aciklama")}>
                  <TextIcon className="size-4" /> Açıklama
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={disaAktar}>
              <DownloadIcon className="size-4" /> Dışa aktar
            </DropdownMenuItem>
            {yetkiler.arsivle && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDialogModu("arsivle")}
                >
                  <ArchiveIcon className="size-4" /> Arşivle
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ProjeBaslikDialoglari
        proje={proje}
        mod={dialogModu}
        setMod={setDialogModu}
      />
    </div>
  );
}
