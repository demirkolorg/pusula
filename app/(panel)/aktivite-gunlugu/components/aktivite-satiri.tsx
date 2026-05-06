"use client";

import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  KATEGORI_IKON,
  kategoriArkaplan,
  kategoriYazi,
} from "@/app/(panel)/projeler/[projeId]/aktivite/components/aktivite-listesi";
import { ISLEM_ETIKETI, kaynakTipEtiketi } from "../etiketler";
import type { AktiviteGunluguSatiri } from "../services";

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

function islemRengi(
  islem: AktiviteGunluguSatiri["islem"],
): "secondary" | "outline" | "destructive" {
  if (islem === "DELETE") return "destructive";
  if (islem === "CREATE") return "secondary";
  return "outline";
}

function metinParcalari(aktivite: AktiviteGunluguSatiri) {
  const vurgular = [
    aktivite.baglam?.proje?.ad,
    aktivite.baglam?.liste?.ad,
    aktivite.baglam?.kart?.baslik,
  ]
    .filter((deger): deger is string => Boolean(deger))
    .map((deger) => `'${deger}'`);

  return vurgular.reduce<Array<{ metin: string; vurgulu: boolean }>>(
    (parcalar, vurgu) =>
      parcalar.flatMap((parca) => {
        if (parca.vurgulu || !parca.metin.includes(vurgu)) return [parca];
        const bolunmus = parca.metin.split(vurgu);
        return bolunmus.flatMap((metin, index) =>
          index === bolunmus.length - 1
            ? [{ metin, vurgulu: false }]
            : [
                { metin, vurgulu: false },
                { metin: vurgu, vurgulu: true },
              ],
        );
      }),
    [{ metin: aktivite.anlati.metin, vurgulu: false }],
  );
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
    <article className="border-b bg-card px-3 py-4 transition-colors hover:bg-muted/35 sm:px-4">
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
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-[1120px] text-sm leading-6">
              {metinParcalari(aktivite).map((parca, index) =>
                parca.vurgulu ? (
                  <strong key={`${parca.metin}-${index}`} className="font-semibold">
                    {parca.metin}
                  </strong>
                ) : (
                  <span key={`${parca.metin}-${index}`}>{parca.metin}</span>
                ),
              )}
            </p>
            <time className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {TARIH_FORMAT.format(new Date(aktivite.zaman))}
            </time>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={islemRengi(aktivite.islem)}>
              {ISLEM_ETIKETI[aktivite.islem]}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {kaynakTipEtiketi(aktivite.kaynak_tip)}
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
          className="shrink-0"
          onClick={() => detayAc(aktivite)}
        >
          Detay
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </article>
  );
}
