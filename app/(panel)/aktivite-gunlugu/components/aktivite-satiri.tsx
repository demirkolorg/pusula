"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  KATEGORI_IKON,
  kategoriArkaplan,
  kategoriYazi,
} from "@/app/(panel)/projeler/[projeId]/aktivite/components/aktivite-listesi";
import type { AktiviteGunluguSatiri } from "../services";

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const ISLEM_ETIKETI: Record<AktiviteGunluguSatiri["islem"], string> = {
  CREATE: "Yeni",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
};

function islemRengi(islem: AktiviteGunluguSatiri["islem"]): "secondary" | "outline" | "destructive" {
  if (islem === "DELETE") return "destructive";
  if (islem === "CREATE") return "secondary";
  return "outline";
}

export function AktiviteSatiri({
  aktivite,
  detayAc,
}: {
  aktivite: AktiviteGunluguSatiri;
  detayAc: (aktivite: AktiviteGunluguSatiri) => void;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];

  return (
    <article className="border-b px-3 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full",
            kategoriArkaplan(aktivite.kategori),
          )}
          aria-hidden
        >
          <Ikon className={cn("size-4", kategoriYazi(aktivite.kategori))} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6">{aktivite.anlati.metin}</p>
            <time className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {TARIH_FORMAT.format(new Date(aktivite.zaman))}
            </time>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={islemRengi(aktivite.islem)}>
              {ISLEM_ETIKETI[aktivite.islem]}
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px]">
              {aktivite.kaynak_tip}
            </Badge>
            {aktivite.sebep && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                Gerekçe: {aktivite.sebep}
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => detayAc(aktivite)}
        >
          Detay
        </Button>
      </div>
    </article>
  );
}
