"use client";

/* eslint-disable react-hooks/set-state-in-effect -- bitis prop'u
   değişince popover taslağını senkronize ediyoruz; kart-modal ile
   aynı pattern. */

import * as React from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

function tariheCevir(d: Date | string | null): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function metneFormatla(d: Date | null): string {
  if (!d) return "";
  const gun = String(d.getDate()).padStart(2, "0");
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  const yil = d.getFullYear();
  return `${gun}.${ay}.${yil}`;
}

function metinAyristir(metin: string): Date | null {
  const m = metin.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const gun = Number(m[1]);
  const ay = Number(m[2]) - 1;
  const yil = Number(m[3]);
  const d = new Date(yil, ay, gun);
  if (
    d.getDate() !== gun ||
    d.getMonth() !== ay ||
    d.getFullYear() !== yil
  ) {
    return null;
  }
  return d;
}

export function KartBitisPopover({ bitis, trigger, kaydet }: Props) {
  const [acik, setAcik] = React.useState(false);
  const baslangic = tariheCevir(bitis);
  const [tarihTaslak, setTarihTaslak] = React.useState<Date | null>(baslangic);
  const [metinTaslak, setMetinTaslak] = React.useState<string>(
    metneFormatla(baslangic),
  );
  const [gosterilenAy, setGosterilenAy] = React.useState<Date>(
    baslangic ?? new Date(),
  );

  React.useEffect(() => {
    const yeni = tariheCevir(bitis);
    setTarihTaslak(yeni);
    setMetinTaslak(metneFormatla(yeni));
    if (yeni) setGosterilenAy(yeni);
  }, [bitis]);

  const metinDegisti = (deger: string) => {
    setMetinTaslak(deger);
    if (deger.trim() === "") {
      setTarihTaslak(null);
      return;
    }
    const ayristirilan = metinAyristir(deger);
    if (ayristirilan) {
      setTarihTaslak(ayristirilan);
      setGosterilenAy(ayristirilan);
    }
  };

  const takvimSecim = (yeni: Date | undefined) => {
    if (!yeni) return;
    setTarihTaslak(yeni);
    setMetinTaslak(metneFormatla(yeni));
    setGosterilenAy(yeni);
  };

  const onayla = () => {
    if (metinTaslak.trim() !== "" && !metinAyristir(metinTaslak)) return;
    kaydet(tarihTaslak);
    setAcik(false);
  };

  const temizle = () => {
    setTarihTaslak(null);
    setMetinTaslak("");
    kaydet(null);
    setAcik(false);
  };

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent side="bottom" align="start" className="w-auto p-0">
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            <p className="text-sm font-medium">Bitiş tarihi</p>
          </div>

          <Input
            type="text"
            inputMode="numeric"
            placeholder="gg.aa.yyyy"
            value={metinTaslak}
            onChange={(e) => metinDegisti(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onayla();
              }
            }}
            autoFocus
          />

          <Calendar
            mode="single"
            selected={tarihTaslak ?? undefined}
            onSelect={takvimSecim}
            month={gosterilenAy}
            onMonthChange={setGosterilenAy}
            locale={tr}
            weekStartsOn={1}
            captionLayout="dropdown"
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
