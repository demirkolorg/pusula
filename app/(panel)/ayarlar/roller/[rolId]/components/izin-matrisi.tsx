"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  grubuToggle,
  izinleriAra,
  izinleriKategoriyeGore,
  izinTogglela,
  tumuToggle,
  type IzinSatiri,
} from "./izin-matrisi-helper";
import { IzinKategoriGrup } from "./izin-kategori-grup";

type IzinMatrisiProps = {
  izinler: IzinSatiri[];
  secili: Set<string>;
  baseline: ReadonlySet<string>;
  onChange: (yeni: Set<string>) => void;
  disabled?: boolean;
};

export function IzinMatrisi({
  izinler,
  secili,
  baseline,
  onChange,
  disabled,
}: IzinMatrisiProps) {
  const [arama, setArama] = useState("");

  const aramaFiltreli = useMemo(
    () => izinleriAra(izinler, arama),
    [izinler, arama],
  );
  const gruplar = useMemo(
    () => izinleriKategoriyeGore(aramaFiltreli, secili),
    [aramaFiltreli, secili],
  );

  const tumIzinSayisi = aramaFiltreli.length;
  const seciliSayisi = aramaFiltreli.filter((i) => secili.has(i.kod)).length;
  const tumuSecili = tumIzinSayisi > 0 && seciliSayisi === tumIzinSayisi;

  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="İzin ara…"
            className="pl-9"
            aria-label="İzin ara"
          />
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Badge variant="outline" className="text-xs">
            {seciliSayisi}/{tumIzinSayisi} seçili
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || tumIzinSayisi === 0}
            onClick={() => onChange(tumuToggle(secili, aramaFiltreli))}
          >
            {tumuSecili ? "Tümünü Kaldır" : "Tümünü Seç"}
          </Button>
        </div>
      </div>

      {gruplar.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          Eşleşen izin bulunamadı.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gruplar.map((grup) => (
            <li key={grup.kategori}>
              <IzinKategoriGrup
                grup={grup}
                seciliSet={secili}
                baseline={baseline}
                disabled={disabled}
                izinTogglela={(kod) => onChange(izinTogglela(secili, kod))}
                grubuToggle={(izinler) =>
                  onChange(grubuToggle(secili, izinler))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Re-export Checkbox kullanımı için tip uyumu
export { Checkbox };
