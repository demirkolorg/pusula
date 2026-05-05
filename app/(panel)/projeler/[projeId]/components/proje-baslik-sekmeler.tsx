"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KanbanIcon, ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  projeId: string;
  className?: string;
};

// Görünüm tipi seçici — Pano · Liste. Yetkililer ayrı bir görünüm değil
// (popover olarak sağ blokta yer alır), sekme şeridinde yer almaz.
export function ProjeBaslikSekmeler({ projeId, className }: Props) {
  const yol = usePathname();
  const listedeMi = yol?.endsWith("/liste") ?? false;

  return (
    <div
      role="tablist"
      aria-label="Görünüm"
      className={cn(
        "border-input bg-background inline-flex items-center gap-0.5 rounded-md border p-[3px]",
        className,
      )}
    >
      <SekmeBaglanti
        href={`/projeler/${projeId}`}
        aktif={!listedeMi}
        ikon={<KanbanIcon className="size-3.5" />}
        etiket="Pano"
      />
      <SekmeBaglanti
        href={`/projeler/${projeId}/liste`}
        aktif={listedeMi}
        ikon={<ListIcon className="size-3.5" />}
        etiket="Liste"
      />
    </div>
  );
}

function SekmeBaglanti({
  href,
  aktif,
  ikon,
  etiket,
}: {
  href: string;
  aktif: boolean;
  ikon: React.ReactNode;
  etiket: string;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={aktif}
      className={cn(
        "inline-flex h-8 min-h-9 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors sm:min-h-8",
        aktif
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {ikon}
      <span>{etiket}</span>
    </Link>
  );
}
