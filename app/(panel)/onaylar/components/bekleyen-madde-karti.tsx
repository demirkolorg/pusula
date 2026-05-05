"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FolderIcon,
  XIcon,
} from "lucide-react";
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
import type { BekleyenMaddeOzeti } from "../services";

const ZAMAN_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Props = {
  madde: BekleyenMaddeOzeti;
  onOnayla: () => void;
  onReddet: (sebep: string | null) => void;
};

export function BekleyenMaddeKarti({ madde, onOnayla, onReddet }: Props) {
  const [reddetAcik, setReddetAcik] = React.useState(false);
  const [redSebebi, setRedSebebi] = React.useState("");

  const onerenAd = madde.oneren
    ? `${madde.oneren.ad} ${madde.oneren.soyad}`
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
          <div className="flex items-start gap-2">
            <FileTextIcon className="text-muted-foreground size-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-snug">{madde.metin}</span>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <Link
              href={`/projeler/${madde.proje_id}?kart=${madde.kart_id}`}
              className="hover:underline inline-flex items-center gap-1 font-medium text-foreground/80"
            >
              {madde.kart_baslik}
              <ExternalLinkIcon className="size-3" />
            </Link>
            <span className="inline-flex items-center gap-1">
              <FolderIcon className="size-3" /> {madde.proje_ad}
            </span>
            <span>· {madde.kontrol_listesi_ad}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            <span className="font-medium text-foreground/80">{onerenAd}</span>{" "}
            önerdi · {ZAMAN_BICIM.format(madde.tamamlanma_oneri_zamani)}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={onOnayla}
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
            <AlertDialogTitle>Madde önerisini reddet</AlertDialogTitle>
            <AlertDialogDescription>
              {onerenAd} maddenin tamamlandığını bildirdi. Reddederseniz kullanıcıya
              bildirim gider.
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
