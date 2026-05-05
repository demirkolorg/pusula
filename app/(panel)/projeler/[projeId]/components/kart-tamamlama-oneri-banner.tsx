"use client";

import * as React from "react";
import { CheckIcon, InfoIcon, XIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Props = {
  // Yetkili kullanıcı için banner: BEKLIYOR durumunda Onayla/Reddet seçenekleri.
  // Yetkisiz kullanıcı için: sadece "öneriniz onay bekliyor" bilgi.
  yetkili: boolean;
  oneren: { ad: string; soyad: string } | null;
  oneriZamani: Date | null;
  // ADR-0018 — onaylama sırasında kontrol listesi yarımsa Onayla butonu disabled.
  onayDisabledSebebi: string | null;
  onOnayla: () => void;
  onReddet: (sebep: string | null) => void;
};

export function KartTamamlamaOneriBanner({
  yetkili,
  oneren,
  oneriZamani,
  onayDisabledSebebi,
  onOnayla,
  onReddet,
}: Props) {
  const [reddetAcik, setReddetAcik] = React.useState(false);
  const [redSebebi, setRedSebebi] = React.useState("");

  const onerenAd = oneren ? `${oneren.ad} ${oneren.soyad}` : "Bir kullanıcı";
  const zamanMetni = oneriZamani ? TARIH_BICIM.format(oneriZamani) : null;

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
          "flex flex-wrap items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm",
          "dark:border-amber-900/50 dark:bg-amber-950/40",
        )}
        role="status"
      >
        <InfoIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-amber-900 dark:text-amber-100">
            {yetkili
              ? `${onerenAd} bu kartın tamamlandığını bildirdi`
              : "Tamamlanma öneriniz onay bekliyor"}
          </div>
          {zamanMetni && (
            <div className="text-amber-800/80 dark:text-amber-200/70 text-xs mt-0.5">
              {zamanMetni}
            </div>
          )}
        </div>
        {yetkili && (
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={onOnayla}
              disabled={onayDisabledSebebi !== null}
              title={
                onayDisabledSebebi ?? "Öneriyi onayla — kart tamamlanır"
              }
              className="h-7 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-700"
            >
              <CheckIcon className="size-3.5" /> Onayla
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setReddetAcik(true)}
              className="h-7 border-red-300 px-2.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              <XIcon className="size-3.5" /> Reddet
            </Button>
          </div>
        )}
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
