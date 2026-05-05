"use client";

import * as React from "react";
import Link from "next/link";
import { CheckIcon, ExternalLinkIcon, FolderIcon, ListIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BekleyenKartOzeti } from "../services";

const ZAMAN_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Props = {
  kart: BekleyenKartOzeti;
  onOnayla: () => void;
  onReddet: (sebep: string | null) => void;
  // Sert blok — kontrol listesi yarımsa Onayla butonu disabled.
  onayDisabledSebebi: string | null;
};

export function BekleyenKartKarti({
  kart,
  onOnayla,
  onReddet,
  onayDisabledSebebi,
}: Props) {
  const [reddetAcik, setReddetAcik] = React.useState(false);
  const [redSebebi, setRedSebebi] = React.useState("");

  const onerenAd = kart.oneren
    ? `${kart.oneren.ad} ${kart.oneren.soyad}`
    : "Bilinmeyen kullanıcı";

  const reddetiTamamla = () => {
    const sebep = redSebebi.trim();
    setReddetAcik(false);
    setRedSebebi("");
    onReddet(sebep || null);
  };

  return (
    <>
      <div
        className={cn(
          "bg-card flex flex-col gap-2 rounded-md border p-3 shadow-sm",
          "sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        )}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/projeler/${kart.proje_id}?kart=${kart.id}`}
              className="hover:underline truncate font-medium"
              title={kart.baslik}
            >
              {kart.baslik}
            </Link>
            <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0" />
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <FolderIcon className="size-3" /> {kart.proje_ad}
            </span>
            <span className="inline-flex items-center gap-1">
              <ListIcon className="size-3" /> {kart.liste_ad}
            </span>
            {kart.madde_toplam > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5",
                  kart.madde_tamamlanan < kart.madde_toplam
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                )}
                aria-label={`${kart.madde_tamamlanan}/${kart.madde_toplam} madde tamamlandı`}
              >
                {kart.madde_tamamlanan}/{kart.madde_toplam} madde
              </span>
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            <span className="font-medium text-foreground/80">{onerenAd}</span>{" "}
            önerdi · {ZAMAN_BICIM.format(kart.tamamlanma_oneri_zamani)}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={onOnayla}
            disabled={onayDisabledSebebi !== null}
            title={onayDisabledSebebi ?? "Öneriyi onayla — kart tamamlanır"}
            className="h-8 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-700"
          >
            <CheckIcon className="size-3.5" /> Onayla
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setReddetAcik(true)}
            className="h-8 border-red-300 px-2.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            <XIcon className="size-3.5" /> Reddet
          </Button>
        </div>
      </div>

      <AlertDialog open={reddetAcik} onOpenChange={setReddetAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tamamlama önerisini reddet</AlertDialogTitle>
            <AlertDialogDescription>
              {onerenAd} kartın tamamlandığını bildirdi. Reddederseniz kullanıcıya
              bildirim gider; sebep belirtmek opsiyonel ama tavsiye edilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={redSebebi}
            onChange={(e) => setRedSebebi(e.target.value)}
            placeholder="Red sebebi (opsiyonel)"
            maxLength={500}
            rows={3}
            className="resize-none"
            aria-label="Red sebebi"
          />
          <div className="text-muted-foreground text-right text-[11px]">
            {redSebebi.length}/500
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRedSebebi("")}>
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={reddetiTamamla}
              className="bg-red-600 hover:bg-red-700"
            >
              Reddet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
