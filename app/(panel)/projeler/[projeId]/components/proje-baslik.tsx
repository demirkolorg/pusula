"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KanbanIcon, ListIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { kapakArkaplanSinifi } from "@/lib/kapak-renk";
import type { ProjeDetayOzeti } from "../services";
import { ProjePaylasimPopover } from "./proje-paylasim-popover";

type Props = {
  proje: ProjeDetayOzeti;
  paylasimYonet?: boolean;
};

export function ProjeBaslik({ proje, paylasimYonet = false }: Props) {
  const yol = usePathname();
  const listedeMi = yol?.endsWith("/liste");

  const kapakSinifi = kapakArkaplanSinifi(proje.kapak_renk);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "size-10 shrink-0 rounded-md",
            kapakSinifi ?? "bg-muted",
          )}
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-col">
          <h1 className="flex items-center gap-2 text-xl font-semibold leading-tight">
            {proje.ad}
            {proje.yildizli_mi && (
              <StarIcon
                className="text-secondary size-4"
                fill="currentColor"
              />
            )}
          </h1>
          {proje.aciklama && (
            <p className="text-muted-foreground line-clamp-1 text-sm">
              {proje.aciklama}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          variant={listedeMi ? "outline" : "default"}
          nativeButton={false}
          render={<Link href={`/projeler/${proje.id}`} />}
        >
          <KanbanIcon className="size-4" /> Pano
        </Button>
        <Button
          size="sm"
          variant={listedeMi ? "default" : "outline"}
          nativeButton={false}
          render={<Link href={`/projeler/${proje.id}/liste`} />}
        >
          <ListIcon className="size-4" /> Liste
        </Button>
        {paylasimYonet && <ProjePaylasimPopover projeId={proje.id} />}
      </div>
    </div>
  );
}
