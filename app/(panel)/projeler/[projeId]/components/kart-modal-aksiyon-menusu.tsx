"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ClockIcon,
  CopyIcon,
  HashIcon,
  LinkIcon,
  MoreHorizontalIcon,
  StarIcon,
  Trash2Icon,
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

type Props = {
  arsivMi: boolean;
  baglantiKopyala: () => void;
  kodKopyala: () => void;
  arsivToggle: () => void;
  sileBas: () => void;
};

// Sancak referansı: top-bar "more" menüsü — Bağlantı, Kod, Çoğalt, Şablon,
// Geçmiş, Arşivle, (separator), Sil.
// Backend'i hazır olmayanlar (Çoğalt / Şablon / Geçmiş) "Yakında" toast atar
// — UI'da yer tutuyor ki layout S5+ ile tamamlanırken kayma olmasın.
export function KartModalAksiyonMenusu({
  arsivMi,
  baglantiKopyala,
  kodKopyala,
  arsivToggle,
  sileBas,
}: Props) {
  const yakinda = (etiket: string) => () =>
    toast.bilgi(`${etiket} yakında eklenecek`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Daha fazla işlem"
            title="Daha fazla — çoğalt, arşivle, şablon yap, geçmiş, sil"
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <p className="text-muted-foreground px-1.5 py-1 text-xs font-medium">
          Kart işlemleri
        </p>

        <DropdownMenuItem onClick={baglantiKopyala}>
          <LinkIcon className="size-4" /> Bağlantıyı kopyala
        </DropdownMenuItem>
        <DropdownMenuItem onClick={kodKopyala}>
          <HashIcon className="size-4" /> Kart kodunu kopyala
        </DropdownMenuItem>
        <DropdownMenuItem onClick={yakinda("Çoğalt")}>
          <CopyIcon className="size-4" /> Çoğalt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={yakinda("Şablon olarak kaydet")}>
          <StarIcon className="size-4" /> Şablon olarak kaydet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={yakinda("Geçmiş")}>
          <ClockIcon className="size-4" /> Geçmişi gör
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={arsivToggle}>
          {arsivMi ? (
            <>
              <ArchiveRestoreIcon className="size-4" /> Arşivden çıkar
            </>
          ) : (
            <>
              <ArchiveIcon className="size-4" /> Arşivle
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={sileBas}>
          <Trash2Icon className="size-4" /> Kartı sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
