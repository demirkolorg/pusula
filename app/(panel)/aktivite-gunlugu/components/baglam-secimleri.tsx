"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { AktiviteGunluguFiltre } from "../schemas";
import type { AktiviteBaglamSecenekleri } from "../services";
import {
  baglamEtiketi,
  kartEtiketi,
  secimDegeri,
  TUMU,
} from "./aktivite-filtre-yardimcilari";

type Props = {
  filtre: AktiviteGunluguFiltre;
  baglamSecenekleri: AktiviteBaglamSecenekleri;
  parcaliDegistir: (parca: Partial<AktiviteGunluguFiltre>) => void;
};

export function BaglamSecimleri({
  filtre,
  baglamSecenekleri,
  parcaliDegistir,
}: Props) {
  const listeler = React.useMemo(
    () =>
      baglamSecenekleri.listeler.filter(
        (liste) => !filtre.proje_id || liste.proje_id === filtre.proje_id,
      ),
    [baglamSecenekleri.listeler, filtre.proje_id],
  );
  const kartlar = React.useMemo(
    () =>
      baglamSecenekleri.kartlar.filter((kart) => {
        if (filtre.liste_id) return kart.liste_id === filtre.liste_id;
        if (filtre.proje_id) return kart.proje_id === filtre.proje_id;
        return true;
      }),
    [baglamSecenekleri.kartlar, filtre.liste_id, filtre.proje_id],
  );

  return (
    <>
      <Select
        value={filtre.proje_id ?? TUMU}
        onValueChange={(v) =>
          parcaliDegistir({
            proje_id: secimDegeri(v),
            liste_id: undefined,
            kart_id: undefined,
          })
        }
      >
        <SelectTrigger className="h-10">
          <span className="truncate">
            {baglamEtiketi(
              filtre.proje_id,
              "Tüm projeler",
              baglamSecenekleri.projeler,
            )}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm projeler</SelectItem>
          {baglamSecenekleri.projeler.map((proje) => (
            <SelectItem key={proje.id} value={proje.id}>
              {proje.ad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filtre.liste_id ?? TUMU}
        onValueChange={(v) =>
          parcaliDegistir({ liste_id: secimDegeri(v), kart_id: undefined })
        }
      >
        <SelectTrigger className="h-10">
          <span className="truncate">
            {baglamEtiketi(filtre.liste_id, "Tüm listeler", listeler)}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm listeler</SelectItem>
          {listeler.map((liste) => (
            <SelectItem key={liste.id} value={liste.id}>
              {liste.ad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filtre.kart_id ?? TUMU}
        onValueChange={(v) => parcaliDegistir({ kart_id: secimDegeri(v) })}
      >
        <SelectTrigger className="h-10">
          <span className="truncate">
            {kartEtiketi(filtre.kart_id, baglamSecenekleri)}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm kartlar</SelectItem>
          {kartlar.map((kart) => (
            <SelectItem key={kart.id} value={kart.id}>
              {kart.baslik}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
