"use client";

/* eslint-disable react-hooks/set-state-in-effect -- bitis prop'u
   değişince popover taslağını senkronize ediyoruz; kart-modal ile
   aynı pattern. */

import * as React from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  bitis: Date | string | null;
  trigger: React.ReactNode;
  kaydet: (yeni: Date | null) => void;
};

function tarihInputDegeri(d: Date | string | null): string {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

export function KartBitisPopover({ bitis, trigger, kaydet }: Props) {
  const [acik, setAcik] = React.useState(false);
  const [taslak, setTaslak] = React.useState<string>(tarihInputDegeri(bitis));

  React.useEffect(() => {
    setTaslak(tarihInputDegeri(bitis));
  }, [bitis]);

  const onayla = () => {
    const yeniTarih = taslak ? new Date(taslak) : null;
    if (taslak && yeniTarih && Number.isNaN(yeniTarih.getTime())) return;
    kaydet(yeniTarih);
    setAcik(false);
  };

  const temizle = () => {
    setTaslak("");
    kaydet(null);
    setAcik(false);
  };

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="bottom"
        align="start"
        className="w-64 p-0"
      >
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            <p className="text-sm font-medium">Bitiş tarihi</p>
          </div>

          <Input
            type="date"
            value={taslak}
            onChange={(e) => setTaslak(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onayla();
              }
            }}
            autoFocus
          />

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={onayla} className="flex-1">
              Kaydet
            </Button>
            {bitis && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={temizle}
                aria-label="Tarihi kaldır"
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
