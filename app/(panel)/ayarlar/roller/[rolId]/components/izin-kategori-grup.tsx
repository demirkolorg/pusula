"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type {
  IzinAltGrubu,
  IzinKategoriGrubu,
  IzinSatiri,
} from "./izin-matrisi-helper";

type IzinKategoriGrupProps = {
  grup: IzinKategoriGrubu;
  seciliSet: ReadonlySet<string>;
  baseline: ReadonlySet<string>;
  disabled?: boolean;
  izinTogglela: (kod: string) => void;
  grubuToggle: (izinler: IzinSatiri[]) => void;
};

export function IzinKategoriGrup({
  grup,
  seciliSet,
  baseline,
  disabled,
  izinTogglela,
  grubuToggle,
}: IzinKategoriGrupProps) {
  const [acik, setAcik] = useState(true);
  const tumIzinler = grup.altGruplar.flatMap((a) => a.izinler);
  const tumuSecili =
    grup.toplamSayisi > 0 && grup.secilmisSayisi === grup.toplamSayisi;
  const kismi =
    grup.secilmisSayisi > 0 && grup.secilmisSayisi < grup.toplamSayisi;

  return (
    <div className="bg-background overflow-hidden rounded-md border">
      <header className="flex items-center gap-3 border-b p-3">
        <Checkbox
          checked={tumuSecili}
          indeterminate={kismi}
          onCheckedChange={() => grubuToggle(tumIzinler)}
          disabled={disabled}
          aria-label={`${grup.baslik} kategorisini topluca seç`}
          className="h-5 w-5"
        />
        <button
          type="button"
          onClick={() => setAcik((o) => !o)}
          className="flex min-h-11 flex-1 items-center justify-between gap-2"
          aria-expanded={acik}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{grup.baslik}</span>
            <Badge variant="outline" className="text-[10px]">
              {grup.secilmisSayisi}/{grup.toplamSayisi}
            </Badge>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              acik ? "rotate-180" : "",
            )}
          />
        </button>
      </header>

      {acik && (
        <div className="flex flex-col gap-2 p-2">
          {grup.altGruplar.map((alt) => (
            <AltGrup
              key={alt.altKategori ?? "_genel"}
              alt={alt}
              seciliSet={seciliSet}
              baseline={baseline}
              disabled={disabled}
              izinTogglela={izinTogglela}
              grubuToggle={grubuToggle}
              tekAltGrupMu={grup.altGruplar.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type AltGrupProps = {
  alt: IzinAltGrubu;
  seciliSet: ReadonlySet<string>;
  baseline: ReadonlySet<string>;
  disabled?: boolean;
  izinTogglela: (kod: string) => void;
  grubuToggle: (izinler: IzinSatiri[]) => void;
  tekAltGrupMu: boolean;
};

function AltGrup({
  alt,
  seciliSet,
  baseline,
  disabled,
  izinTogglela,
  grubuToggle,
  tekAltGrupMu,
}: AltGrupProps) {
  const [acik, setAcik] = useState(true);
  const tumuSecili =
    alt.toplamSayisi > 0 && alt.secilmisSayisi === alt.toplamSayisi;
  const kismi =
    alt.secilmisSayisi > 0 && alt.secilmisSayisi < alt.toplamSayisi;

  // Tek alt-grup varsa başlığı atla — düz liste göster (UX sade)
  if (tekAltGrupMu && alt.altKategori === null) {
    return (
      <ul className="divide-y">
        {alt.izinler.map((izin) => (
          <IzinSatiriComp
            key={izin.id}
            izin={izin}
            secili={seciliSet.has(izin.kod)}
            baselinedeMi={baseline.has(izin.kod)}
            disabled={disabled}
            izinTogglela={izinTogglela}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="bg-muted/40 overflow-hidden rounded-md border">
      <header className="flex items-center gap-2 border-b px-2 py-1.5">
        <Checkbox
          checked={tumuSecili}
          indeterminate={kismi}
          onCheckedChange={() => grubuToggle(alt.izinler)}
          disabled={disabled}
          aria-label={`${alt.baslik} alt-grubunu topluca seç`}
          className="h-4 w-4"
        />
        <button
          type="button"
          onClick={() => setAcik((o) => !o)}
          className="flex min-h-9 flex-1 items-center justify-between gap-2"
          aria-expanded={acik}
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {alt.baslik}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {alt.secilmisSayisi}/{alt.toplamSayisi}
            </Badge>
          </div>
          <ChevronDown
            className={cn(
              "text-muted-foreground h-3.5 w-3.5 transition-transform",
              acik ? "rotate-180" : "",
            )}
          />
        </button>
      </header>

      {acik && (
        <ul className="divide-y">
          {alt.izinler.map((izin) => (
            <IzinSatiriComp
              key={izin.id}
              izin={izin}
              secili={seciliSet.has(izin.kod)}
              baselinedeMi={baseline.has(izin.kod)}
              disabled={disabled}
              izinTogglela={izinTogglela}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type IzinSatiriProps = {
  izin: IzinSatiri;
  secili: boolean;
  baselinedeMi: boolean;
  disabled?: boolean;
  izinTogglela: (kod: string) => void;
};

function IzinSatiriComp({
  izin,
  secili,
  baselinedeMi,
  disabled,
  izinTogglela,
}: IzinSatiriProps) {
  const eklenen = secili && !baselinedeMi;
  const kaldirilan = !secili && baselinedeMi;

  return (
    <li
      className={cn(
        "flex items-start gap-3 p-3",
        eklenen && "bg-emerald-50 dark:bg-emerald-950/30",
        kaldirilan && "bg-rose-50 dark:bg-rose-950/30",
      )}
    >
      <Checkbox
        checked={secili}
        onCheckedChange={() => izinTogglela(izin.kod)}
        disabled={disabled}
        aria-label={izin.ad}
        id={`izin-${izin.id}`}
        className="mt-0.5 h-5 w-5"
      />
      <label
        htmlFor={`izin-${izin.id}`}
        className="flex flex-1 cursor-pointer flex-col gap-0.5"
      >
        <span className="text-sm font-medium">{izin.ad}</span>
        <code className="text-muted-foreground text-[10px]">{izin.kod}</code>
        {izin.aciklama && (
          <span className="text-muted-foreground text-xs">
            {izin.aciklama}
          </span>
        )}
      </label>
      {eklenen && (
        <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-700">
          +
        </Badge>
      )}
      {kaldirilan && (
        <Badge className="bg-rose-600 text-[10px] text-white hover:bg-rose-700">
          −
        </Badge>
      )}
    </li>
  );
}
