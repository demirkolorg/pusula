"use client";

import * as React from "react";
import { CalendarOffIcon, CheckIcon } from "lucide-react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  TARIH_ONAYLARI,
  tarihOnayHesapla,
  type TarihOnayari,
} from "./kart-baglam-tarih-helper";

type Props = {
  mevcut: Date | string | null;
  kaydet: (yeni: Date | null) => void;
};

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

// Bağlam menüsünde "Tarih ›" submenu — preset'ler + Kaldır.
// "Tarih seç..." daha hassas seçim için modal akışına bırakılır
// (KartBitisPopover) — chip'e yönlendirme yeterli.
export function KartBaglamTarihSubmenu({ mevcut, kaydet }: Props) {
  const mevcutDate = mevcut
    ? mevcut instanceof Date
      ? mevcut
      : new Date(mevcut)
    : null;
  const mevcutEtiket =
    mevcutDate && !Number.isNaN(mevcutDate.getTime())
      ? TARIH_BICIM.format(mevcutDate)
      : null;

  const sec = (anahtar: TarihOnayari) => {
    const yeni = tarihOnayHesapla(anahtar);
    kaydet(yeni);
  };

  return (
    <>
      {mevcutEtiket && (
        <>
          <div className="text-muted-foreground px-2 py-1 text-xs">
            Şu an: {mevcutEtiket}
          </div>
          <ContextMenuSeparator />
        </>
      )}
      {TARIH_ONAYLARI.map((o) => {
        const tahmin = tarihOnayHesapla(o.anahtar);
        const tahminEtiket = tahmin ? TARIH_BICIM.format(tahmin) : null;
        const aynisiMi =
          mevcutDate &&
          tahmin &&
          mevcutDate.toDateString() === tahmin.toDateString();
        return (
          <ContextMenuItem key={o.anahtar} onClick={() => sec(o.anahtar)}>
            <span className="flex-1">{o.etiket}</span>
            {tahminEtiket && (
              <span className="text-muted-foreground text-xs">
                {tahminEtiket}
              </span>
            )}
            {aynisiMi && <CheckIcon className="size-3.5" />}
          </ContextMenuItem>
        );
      })}
      {mevcutEtiket && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => kaydet(null)}>
            <CalendarOffIcon /> Tarihi kaldır
          </ContextMenuItem>
        </>
      )}
    </>
  );
}
