"use client";

import * as React from "react";
import { FilterIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

const TUMU = "__tumu__";

type Props = {
  filtre: AktiviteGunluguFiltre;
  kaynakTipleri: readonly string[];
  disaAktarabilir: boolean;
  filtreDegisti: (filtre: AktiviteGunluguFiltre) => void;
  disaAktar: () => void;
};

function filtreTemizle(filtre: AktiviteGunluguFiltre): AktiviteGunluguFiltre {
  return { limit: filtre.limit, kapsam: "tum" };
}

function islemSecimi(
  deger: string | null,
): AktiviteGunluguFiltre["islem"] | undefined {
  if (deger === "CREATE" || deger === "UPDATE" || deger === "DELETE") {
    return deger;
  }
  return undefined;
}

function kapsamSecimi(deger: string | null): AktiviteGunluguFiltre["kapsam"] {
  return deger === "benim" ? "benim" : "tum";
}

function kaynakTipSecimi(deger: string | null): string | undefined {
  if (!deger || deger === TUMU) return undefined;
  return deger;
}

function FiltreFormu({
  filtre,
  kaynakTipleri,
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
    Boolean(filtre.kaynak_tip);

  return (
    <form
      onSubmit={aramaUygula}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <Input
        key={filtre.arama ?? "bos"}
        name="arama"
        defaultValue={filtre.arama ?? ""}
        placeholder="Aktivite ara"
        className="sm:max-w-xs"
      />
      <Select
        value={filtre.kapsam}
        onValueChange={(v) =>
          parcaliDegistir({ kapsam: kapsamSecimi(v) })
        }
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tum">Tüm takım</SelectItem>
          <SelectItem value="benim">Sadece benim</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filtre.islem ?? TUMU}
        onValueChange={(v) =>
          parcaliDegistir({
            islem: islemSecimi(v),
          })
        }
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm işlemler</SelectItem>
          <SelectItem value="CREATE">Yeni</SelectItem>
          <SelectItem value="UPDATE">Güncelleme</SelectItem>
          <SelectItem value="DELETE">Silme</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filtre.kaynak_tip ?? TUMU}
        onValueChange={(v) =>
          parcaliDegistir({ kaynak_tip: kaynakTipSecimi(v) })
        }
      >
        <SelectTrigger className="sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TUMU}>Tüm kaynaklar</SelectItem>
          {kaynakTipleri.map((tip) => (
            <SelectItem key={tip} value={tip}>
              {tip}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="secondary">
        Ara
      </Button>
      {aktif && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => filtreDegisti(filtreTemizle(filtre))}
        >
          <XIcon className="size-4" />
          Temizle
        </Button>
      )}
      {disaAktarabilir && (
        <Button type="button" variant="outline" onClick={disaAktar}>
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
      <div className="bg-background/95 sticky top-0 z-20 border-b py-3 backdrop-blur">
        <FiltreFormu {...props} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b py-3">
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
          Dışa aktar
        </Button>
      )}
    </div>
  );
}
