"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarIcon, ListIcon, TagIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tablo/data-table";
import { cn } from "@/lib/utils";
import { kapakArkaplanSinifi } from "@/lib/kapak-renk";
import { useProjeKartlari } from "../../hooks/detay-sorgulari";
import type { LisedeKart } from "../../services";

function tarihFormat(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d instanceof Date ? d : new Date(d));
}

type Props = {
  projeId: string;
};

export function KartListeIstemci({ projeId }: Props) {
  const sorgu = useProjeKartlari(projeId);
  const veri = React.useMemo(() => sorgu.data ?? [], [sorgu.data]);

  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const kolonlar: ColumnDef<LisedeKart>[] = React.useMemo(
    () => [
      {
        accessorKey: "baslik",
        header: "Başlık",
        cell: ({ row }) => (
          <Link
            href={`/kartlar/${row.original.id}`}
            className="hover:underline"
          >
            <div className="flex items-center gap-2">
              {(() => {
                const sinif = kapakArkaplanSinifi(row.original.kapak_renk);
                return sinif ? (
                  <span
                    className={cn("size-3 shrink-0 rounded-sm", sinif)}
                    aria-hidden="true"
                  />
                ) : null;
              })()}
              <span className="font-medium">{row.original.baslik}</span>
            </div>
          </Link>
        ),
      },
      {
        accessorKey: "liste_ad",
        header: "Liste",
        cell: ({ row }) => (
          <Badge variant="outline">
            <ListIcon className="size-3" /> {row.original.liste_ad}
          </Badge>
        ),
      },
      {
        accessorKey: "bitis",
        header: "Bitiş",
        cell: ({ row }) => (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
            <CalendarIcon className="size-3" />
            {tarihFormat(row.original.bitis)}
          </span>
        ),
      },
      {
        accessorKey: "uye_sayisi",
        header: "Üyeler",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm">
            <UsersIcon className="size-3" /> {row.original.uye_sayisi}
          </span>
        ),
      },
      {
        accessorKey: "etiket_sayisi",
        header: "Etiketler",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm">
            <TagIcon className="size-3" /> {row.original.etiket_sayisi}
          </span>
        ),
      },
    ],
    [],
  );

  // Client-side pagination (server "all kartlar" döndürdüğü için).
  const sayfalanmis = React.useMemo(() => {
    const bas = sayfalama.pageIndex * sayfalama.pageSize;
    return veri.slice(bas, bas + sayfalama.pageSize);
  }, [veri, sayfalama]);

  return (
    <DataTable<LisedeKart>
      veri={sayfalanmis}
      kolonlar={kolonlar}
      toplam={veri.length}
      sayfalama={sayfalama}
      sayfalamaDegisti={setSayfalama}
      yukleniyor={sorgu.isLoading}
      bosMesaj="Bu projede kart yok."
      satirAnahtari={(s) => s.id}
      kartGorunumu={(s) => (
        <Link href={`/kartlar/${s.id}`} className="block">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{s.baslik}</span>
              <Badge variant="outline" className="shrink-0">
                {s.liste_ad}
              </Badge>
            </div>
            {s.aciklama && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {s.aciklama}
              </p>
            )}
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="size-3" /> {tarihFormat(s.bitis)}
              </span>
              {s.uye_sayisi > 0 && (
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="size-3" /> {s.uye_sayisi}
                </span>
              )}
              {s.etiket_sayisi > 0 && (
                <span className="inline-flex items-center gap-1">
                  <TagIcon className="size-3" /> {s.etiket_sayisi}
                </span>
              )}
            </div>
          </div>
        </Link>
      )}
    />
  );
}
