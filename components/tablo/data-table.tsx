"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  type RowData,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMobil } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

export type DataTableProps<TData extends RowData, TValue = unknown> = {
  veri: TData[];
  kolonlar: ColumnDef<TData, TValue>[];
  toplam: number;
  sayfalama: PaginationState;
  sayfalamaDegisti: OnChangeFn<PaginationState>;
  siralama?: SortingState;
  siralamaDegisti?: OnChangeFn<SortingState>;
  filtreler?: ColumnFiltersState;
  filtrelerDegisti?: OnChangeFn<ColumnFiltersState>;
  yukleniyor?: boolean;
  bosMesaj?: string;
  kartGorunumu?: (satir: TData) => React.ReactNode;
  satirAnahtari?: (satir: TData) => string;
  className?: string;
};

export function DataTable<TData extends RowData, TValue = unknown>({
  veri,
  kolonlar,
  toplam,
  sayfalama,
  sayfalamaDegisti,
  siralama,
  siralamaDegisti,
  filtreler,
  filtrelerDegisti,
  yukleniyor,
  bosMesaj = "Kayıt bulunamadı.",
  kartGorunumu,
  satirAnahtari,
  className,
}: DataTableProps<TData, TValue>) {
  const mobil = useMobil();

  const tablo = useReactTable({
    data: veri,
    columns: kolonlar,
    pageCount: Math.max(1, Math.ceil(toplam / Math.max(1, sayfalama.pageSize))),
    state: {
      pagination: sayfalama,
      sorting: siralama ?? [],
      columnFilters: filtreler ?? [],
    },
    onPaginationChange: sayfalamaDegisti,
    onSortingChange: siralamaDegisti,
    onColumnFiltersChange: filtrelerDegisti,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const sayfa = sayfalama.pageIndex + 1;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / Math.max(1, sayfalama.pageSize)));

  if (mobil && kartGorunumu) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {yukleniyor ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : veri.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border p-6 text-center text-sm">
            {bosMesaj}
          </div>
        ) : (
          veri.map((satir, idx) => (
            <div
              key={satirAnahtari ? satirAnahtari(satir) : idx}
              className="rounded-xl border p-3"
            >
              {kartGorunumu(satir)}
            </div>
          ))
        )}
        <Sayfalama
          sayfa={sayfa}
          toplamSayfa={toplamSayfa}
          yukleniyor={yukleniyor}
          oncekiTikla={() => tablo.previousPage()}
          sonrakiTikla={() => tablo.nextPage()}
          onceki={tablo.getCanPreviousPage()}
          sonraki={tablo.getCanNextPage()}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {tablo.getHeaderGroups().map((grup) => (
              <TableRow key={grup.id}>
                {grup.headers.map((baslik) => (
                  <TableHead key={baslik.id}>
                    {baslik.isPlaceholder
                      ? null
                      : flexRender(baslik.column.columnDef.header, baslik.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {yukleniyor ? (
              [0, 1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  {kolonlar.map((_, k) => (
                    <TableCell key={k}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tablo.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={kolonlar.length}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  {bosMesaj}
                </TableCell>
              </TableRow>
            ) : (
              tablo.getRowModel().rows.map((satir) => (
                <TableRow key={satir.id}>
                  {satir.getVisibleCells().map((hucre) => (
                    <TableCell key={hucre.id}>
                      {flexRender(hucre.column.columnDef.cell, hucre.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Sayfalama
        sayfa={sayfa}
        toplamSayfa={toplamSayfa}
        yukleniyor={yukleniyor}
        oncekiTikla={() => tablo.previousPage()}
        sonrakiTikla={() => tablo.nextPage()}
        onceki={tablo.getCanPreviousPage()}
        sonraki={tablo.getCanNextPage()}
      />
    </div>
  );
}

type SayfalamaProps = {
  sayfa: number;
  toplamSayfa: number;
  onceki: boolean;
  sonraki: boolean;
  oncekiTikla: () => void;
  sonrakiTikla: () => void;
  yukleniyor?: boolean;
};

function Sayfalama({
  sayfa,
  toplamSayfa,
  onceki,
  sonraki,
  oncekiTikla,
  sonrakiTikla,
  yukleniyor,
}: SayfalamaProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-muted-foreground text-xs">
        Sayfa <span className="font-medium">{sayfa}</span> / {toplamSayfa}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={oncekiTikla}
          disabled={!onceki || yukleniyor}
        >
          Önceki
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={sonrakiTikla}
          disabled={!sonraki || yukleniyor}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
