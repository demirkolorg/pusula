"use client";

import * as React from "react";
import { FileIcon, FileTextIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DOSYA_KATEGORI_ETIKETI } from "@/lib/dosya-kategori";
import type { DosyaKategori } from "@prisma/client";
import type { DosyaListeSatiri } from "../services";
import { boyutBicim } from "../helpers/dosya-filtre";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

type Props = {
  satirlar: DosyaListeSatiri[];
  seciliId: string | null;
  onSec: (id: string) => void;
};

function kategoriIcon(kategori: string) {
  if (kategori === "GORSEL") return ImageIcon;
  if (kategori === "PDF") return FileTextIcon;
  if (kategori === "OFIS_BELGESI" || kategori === "TABLO" || kategori === "SUNUM")
    return FileTextIcon;
  return FileIcon;
}

export function DosyaTablo({ satirlar, seciliId, onSec }: Props) {
  if (satirlar.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-12 text-center text-sm">
        Bu filtre ile dosya bulunamadı.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Yükleyen</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">Boyut</TableHead>
            <TableHead>Gizlilik</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {satirlar.map((s) => {
            const Icon = kategoriIcon(s.kategori);
            const secili = s.id === seciliId;
            return (
              <TableRow
                key={s.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  secili && "bg-muted",
                )}
                onClick={() => onSec(s.id)}
                aria-selected={secili}
              >
                <TableCell className="max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Icon className="text-muted-foreground size-4 shrink-0" />
                    <span className="truncate font-medium">{s.ad}</span>
                  </div>
                  {s.aciklama && (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {s.aciklama}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {DOSYA_KATEGORI_ETIKETI[s.kategori as DosyaKategori]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {s.yukleyen.ad} {s.yukleyen.soyad}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm tabular-nums">
                  {TARIH_BICIM.format(s.olusturma_zamani)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {boyutBicim(s.boyut)}
                </TableCell>
                <TableCell>
                  <GizlilikRozeti gizlilik={s.gizlilik} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function GizlilikRozeti({ gizlilik }: { gizlilik: string }) {
  if (gizlilik === "GIZLI") {
    return <Badge variant="destructive" className="font-normal">Gizli</Badge>;
  }
  if (gizlilik === "HASSAS") {
    return <Badge className="font-normal bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200">Hassas</Badge>;
  }
  return <Badge variant="secondary" className="font-normal">Normal</Badge>;
}
