"use client";

import * as React from "react";
import { DownloadIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMobil } from "@/hooks/use-breakpoint";
import type { AktiviteGunluguFiltre } from "../schemas";
import type { AktiviteBaglamSecenekleri } from "../services";
import { kaynakTipEtiketi } from "../etiketler";
import {
  filtreTemizle,
  islemEtiketi,
  islemSecimi,
  kapsamEtiketi,
  kapsamSecimi,
  secimDegeri,
  TUMU,
} from "./aktivite-filtre-yardimcilari";
import { BaglamSecimleri } from "./baglam-secimleri";

type Props = {
  filtre: AktiviteGunluguFiltre;
  kaynakTipleri: readonly string[];
  baglamSecenekleri: AktiviteBaglamSecenekleri;
  disaAktarabilir: boolean;
  filtreDegisti: (filtre: AktiviteGunluguFiltre) => void;
  disaAktar: () => void;
};

function FiltreFormu({
  filtre,
  kaynakTipleri,
  baglamSecenekleri,
  disaAktarabilir,
  filtreDegisti,
  disaAktar,
}: Props) {
  function parcaliDegistir(parca: Partial<AktiviteGunluguFiltre>) {
    const { cursor: _cursor, ...temel } = filtre;
    filtreDegisti({ ...temel, ...parca });
  }

  function aramaUygula(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ham = formData.get("arama");
    const temiz = typeof ham === "string" ? ham.trim() : "";
    parcaliDegistir({ arama: temiz.length > 0 ? temiz : undefined });
  }

  const aktif =
    filtre.kapsam !== "tum" ||
    Boolean(filtre.arama) ||
    Boolean(filtre.islem) ||
    Boolean(filtre.kaynak_tip) ||
    Boolean(filtre.proje_id) ||
    Boolean(filtre.liste_id) ||
    Boolean(filtre.kart_id);

  return (
    <form
      onSubmit={aramaUygula}
      className="grid gap-2 md:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(150px,0.8fr))] xl:grid-cols-[minmax(240px,1.35fr)_repeat(6,minmax(150px,0.8fr))_auto_auto]"
    >
      <Input
        key={filtre.arama ?? "bos"}
        name="arama"
        defaultValue={filtre.arama ?? ""}
        placeholder="Aktivite ara"
        className="h-10"
      />
      <Select
        value={filtre.kapsam}
        onValueChange={(v) => parcaliDegistir({ kapsam: kapsamSecimi(v) })}
      >
        <SelectTrigger className="h-10">
          <span className="truncate">{kapsamEtiketi(filtre.kapsam)}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tum">Tüm ekip</SelectItem>
          <SelectItem value="benim">Sadece benim</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filtre.islem ?? TUMU}
        onValueChange={(v) => parcaliDegistir({ islem: islemSecimi(v) })}
      >
        <SelectTrigger className="h-10">
          <span className="truncate">{islemEtiketi(filtre.islem)}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm işlemler</SelectItem>
          <SelectItem value="CREATE">Yeni kayıt</SelectItem>
          <SelectItem value="UPDATE">Güncelleme</SelectItem>
          <SelectItem value="DELETE">Silme</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filtre.kaynak_tip ?? TUMU}
        onValueChange={(v) => parcaliDegistir({ kaynak_tip: secimDegeri(v) })}
      >
        <SelectTrigger className="h-10">
          <span className="truncate">
            {filtre.kaynak_tip
              ? kaynakTipEtiketi(filtre.kaynak_tip)
              : "Tüm kaynaklar"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm kaynaklar</SelectItem>
          {kaynakTipleri.map((tip) => (
            <SelectItem key={tip} value={tip}>
              {kaynakTipEtiketi(tip)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <BaglamSecimleri
        filtre={filtre}
        baglamSecenekleri={baglamSecenekleri}
        parcaliDegistir={parcaliDegistir}
      />
      <Button type="submit" variant="secondary" className="h-10">
        <SearchIcon className="size-4" />
        Ara
      </Button>
      {aktif && (
        <Button
          type="button"
          variant="ghost"
          className="h-10"
          onClick={() => filtreDegisti(filtreTemizle(filtre))}
        >
          <XIcon className="size-4" />
          Temizle
        </Button>
      )}
      {disaAktarabilir && (
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={disaAktar}
        >
          <DownloadIcon className="size-4" />
          Dışa aktar
        </Button>
      )}
    </form>
  );
}

export function AktiviteFiltreleri(props: Props) {
  const mobil = useMobil();
  if (!mobil) {
    return (
      <div className="bg-background/95 sticky top-0 z-20 border-b p-3 backdrop-blur">
        <FiltreFormu {...props} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b p-3">
      <Sheet>
        <SheetTrigger render={<Button type="button" variant="outline" size="sm" />}>
          <FilterIcon className="size-4" />
          Filtreler
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtreler</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FiltreFormu {...props} />
          </div>
        </SheetContent>
      </Sheet>
      {props.disaAktarabilir && (
        <Button type="button" variant="outline" size="sm" onClick={props.disaAktar}>
          <DownloadIcon className="size-4" />
          Dışa aktar
        </Button>
      )}
    </div>
  );
}
