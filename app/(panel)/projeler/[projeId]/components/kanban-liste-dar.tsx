"use client";

// useSortable ref'i ve listener'ı parent'tan render'da iletilir (dnd-kit
// resmi pattern'i). React Compiler refs kuralı kanban-liste.tsx ve
// kart-mini.tsx ile aynı — disable.
/* eslint-disable react-hooks/refs */

// Daraltılmış kanban listesi görünümü. Görsel-only: sortable ref/listener'ları
// parent'tan alır, body droppable yok (kart drop edilemez — plan kararı).
// Yatay sıralama korunur (sortable handle başlık bloğunda).

import * as React from "react";
import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { PanelLeftOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ListeOzeti } from "../services";

// useSortable'ın public return tipinden parça çıkar — internal path import
// gerekmez, tipler dnd-kit'le senkron kalır.
type Sortable = ReturnType<typeof useSortable>;
type SortableProps = {
  setNodeRef: Sortable["setNodeRef"];
  attributes: Sortable["attributes"];
  listeners: Sortable["listeners"];
  style: CSSProperties;
};

type Props = {
  liste: ListeOzeti;
  sortableProps: SortableProps;
  onGenislet: () => void;
  // Pano üzerinde kart sürükleniyor mu? true ise daraltılmış listede "buraya
  // bırakamazsın" görsel ipucu (kırmızı kesik border + cursor not-allowed).
  // Boolean prop her render değişebilir ama dnd-kit'i etkilemez (sadece UI).
  kartSurukleniyor: boolean;
};

export function KanbanListeDar({
  liste,
  sortableProps,
  onGenislet,
  kartSurukleniyor,
}: Props) {
  return (
    <div
      ref={sortableProps.setNodeRef}
      style={sortableProps.style}
      className={cn(
        // Temel görünüm — w-12 sabit, dikey rotated başlık için yeterli yer.
        "flex w-12 shrink-0 flex-col items-center self-start rounded-lg border",
        "h-72 gap-2 py-2",
        "transition-colors", // hover/drag uyarısı için yumuşak renk geçişi
        // Drag uyarısı: aktif kart sürükleniyorsa kırmızı kesik border.
        // Layout shift YOK (Kural 141) — yalnız border-color/style değişiyor.
        kartSurukleniyor
          ? "border-destructive/60 bg-destructive/5 cursor-not-allowed border-dashed"
          : "bg-muted/40 hover:border-foreground/30",
      )}
      aria-disabled={kartSurukleniyor || undefined}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Listeyi genişlet"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onGenislet();
              }}
            />
          }
        >
          <PanelLeftOpenIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="right">Listeyi genişlet</TooltipContent>
      </Tooltip>

      {/* Drag handle: başlık + kart sayısı dikey rotated. writing-mode:
          vertical-rl varsayılan tepeden aşağı yazar; rotate-180 ile Trello
          tarzı aşağıdan yukarı okunur. Sortable listener'ları bu blokta. */}
      <div
        {...sortableProps.attributes}
        {...(sortableProps.listeners ?? {})}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 px-1",
          "[writing-mode:vertical-rl] rotate-180",
          "select-none text-sm font-medium",
          kartSurukleniyor ? "cursor-not-allowed" : "cursor-grab",
        )}
        style={{ touchAction: "none" }}
        aria-label={`${liste.ad} (${liste.kartlar.length} kart)`}
      >
        <span className="truncate" style={{ maxBlockSize: "200px" }}>
          {liste.ad}
        </span>
        <span className="text-muted-foreground text-xs font-normal">
          {liste.kartlar.length}
        </span>
      </div>
    </div>
  );
}
