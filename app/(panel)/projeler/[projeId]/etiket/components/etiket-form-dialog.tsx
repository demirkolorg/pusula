"use client";

/* eslint-disable react-hooks/set-state-in-effect -- duzenlenen prop'u
   değişince form state'ini senkronize ediyoruz; kart-bitis-popover ile
   aynı pattern. */

import * as React from "react";
import { TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { tempId } from "@/lib/temp-id";
import { ETIKET_RENKLERI, type EtiketRenk } from "../schemas";
import { useEtiketGuncelle, useEtiketOlustur } from "../hooks";
import type { EtiketOzeti } from "../services";
import { EtiketRozet } from "./etiket-rozet";

type Props = {
  acik: boolean;
  kapat: () => void;
  projeId: string;
  // Düzenleme modu için başlangıç verisi; null ise yeni etiket modu.
  duzenlenen: EtiketOzeti | null;
};

export function EtiketFormDialog({
  acik,
  kapat,
  projeId,
  duzenlenen,
}: Props) {
  const duzenleme = !!duzenlenen;
  const [ad, setAd] = React.useState("");
  const [renk, setRenk] = React.useState<EtiketRenk>(ETIKET_RENKLERI[0]);

  const olustur = useEtiketOlustur(projeId);
  const guncelle = useEtiketGuncelle(projeId);

  React.useEffect(() => {
    if (acik) {
      setAd(duzenlenen?.ad ?? "");
      setRenk((duzenlenen?.renk as EtiketRenk) ?? ETIKET_RENKLERI[0]);
    }
  }, [acik, duzenlenen]);

  const yukleniyor = olustur.isPending || guncelle.isPending;

  async function gonder(ev: React.FormEvent) {
    ev.preventDefault();
    const adKirpilmis = ad.trim();
    if (!adKirpilmis) {
      toast.uyari("Etiket adı zorunlu");
      return;
    }
    if (duzenleme && duzenlenen) {
      await guncelle.mutateAsync({ id: duzenlenen.id, ad: adKirpilmis, renk });
    } else {
      await olustur.mutateAsync({
        id_taslak: tempId(),
        proje_id: projeId,
        ad: adKirpilmis,
        renk,
      });
    }
    kapat();
  }

  return (
    <ResponsiveDialog open={acik} onOpenChange={(o) => (o ? null : kapat())}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <TagIcon className="size-4" />
            {duzenleme ? "Etiketi düzenle" : "Yeni etiket"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {duzenleme
              ? "Etiketin adını ve rengini güncelleyin."
              : "Bu projede kullanılacak yeni bir etiket tanımlayın."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={gonder} className="flex flex-col gap-4 px-4 sm:px-0">
          <div className="flex justify-center py-1">
            <EtiketRozet
              etiket={{ ad: ad || "Önizleme", renk }}
              boyut="md"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="etiket-form-ad">Ad</Label>
            <Input
              id="etiket-form-ad"
              autoFocus
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              maxLength={40}
              placeholder="Örn. Acil"
            />
            <p className="text-muted-foreground text-xs">
              En fazla 40 karakter. Aynı projede benzersiz olmalı.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Renk</Label>
            <div className="grid grid-cols-5 gap-2">
              {ETIKET_RENKLERI.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRenk(r)}
                  className={cn(
                    "ring-offset-background h-11 min-h-11 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    renk === r && "ring-2 ring-foreground ring-offset-2",
                  )}
                  style={{ backgroundColor: r }}
                  aria-label={`Renk ${r}`}
                  aria-pressed={renk === r}
                />
              ))}
            </div>
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={kapat}
              disabled={yukleniyor}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={yukleniyor}>
              {duzenleme ? "Güncelle" : "Oluştur"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
