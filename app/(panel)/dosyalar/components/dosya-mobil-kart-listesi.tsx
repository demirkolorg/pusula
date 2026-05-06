"use client";

import * as React from "react";
import { FileIcon, FileTextIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DOSYA_KATEGORI_ETIKETI } from "@/lib/dosya-kategori";
import type { DosyaKategori } from "@prisma/client";
import type { DosyaListeSatiri } from "../services";
import { boyutBicim } from "../helpers/dosya-filtre";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

type Props = {
  satirlar: DosyaListeSatiri[];
  seciliId: string | null;
  onSec: (id: string) => void;
};

function kategoriIkon(kategori: string) {
  if (kategori === "GORSEL") return ImageIcon;
  if (
    kategori === "PDF" ||
    kategori === "OFIS_BELGESI" ||
    kategori === "TABLO" ||
    kategori === "SUNUM"
  )
    return FileTextIcon;
  return FileIcon;
}

export function DosyaMobilKartListesi({ satirlar, seciliId, onSec }: Props) {
  if (satirlar.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
        Bu filtre ile dosya bulunamadı.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {satirlar.map((s) => {
        const Icon = kategoriIkon(s.kategori);
        const secili = s.id === seciliId;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSec(s.id)}
              className={cn(
                "border-input hover:border-foreground/30 flex w-full min-h-[44px] items-start gap-3 rounded-md border bg-background p-3 text-left transition-colors",
                secili && "border-primary bg-muted",
              )}
              aria-pressed={secili}
            >
              <Icon className="text-muted-foreground size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  {s.ad}
                </p>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span>
                    {s.yukleyen.ad} {s.yukleyen.soyad}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {TARIH_BICIM.format(s.olusturma_zamani)}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">{boyutBicim(s.boyut)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {DOSYA_KATEGORI_ETIKETI[s.kategori as DosyaKategori]}
                  </Badge>
                  {s.gizlilik !== "NORMAL" && (
                    <Badge
                      variant={
                        s.gizlilik === "GIZLI" ? "destructive" : "secondary"
                      }
                      className="text-[10px] font-normal"
                    >
                      {s.gizlilik === "GIZLI" ? "Gizli" : "Hassas"}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
