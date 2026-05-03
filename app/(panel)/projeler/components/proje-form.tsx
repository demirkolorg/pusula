"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { toast } from "@/lib/toast";
import { tempId } from "@/lib/temp-id";
import { cn } from "@/lib/utils";
import {
  KAPAK_RENK_TOKENLERI,
  PALET_RENKLERI,
  kapakArkaplanSinifi,
  kapakEtiketi,
  type KapakRenk,
} from "@/lib/kapak-renk";
import { useProjeGuncelle, useProjeOlustur, projelerKey } from "../hooks/proje-sorgulari";
import type { ProjeKart } from "../services";

const formSemasi = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter").max(200),
  aciklama: z.string().max(2000).optional(),
  kapak_renk: z
    .enum(KAPAK_RENK_TOKENLERI)
    .optional()
    .or(z.literal("")),
});

type FormVeri = z.infer<typeof formSemasi>;

type Props = {
  acik: boolean;
  kapat: () => void;
  baslangic: ProjeKart | null;
  filtre: "aktif" | "yildizli" | "arsiv" | "silinmis";
  arama: string;
};

export function ProjeFormSheet({ acik, kapat, baslangic, filtre, arama }: Props) {
  const anahtar = projelerKey(filtre, arama);
  const olustur = useProjeOlustur(anahtar);
  const guncelle = useProjeGuncelle(anahtar);

  const baslangicRenk = (
    baslangic?.kapak_renk &&
    (KAPAK_RENK_TOKENLERI as readonly string[]).includes(baslangic.kapak_renk)
      ? (baslangic.kapak_renk as KapakRenk)
      : ""
  );

  const form = useForm<FormVeri>({
    resolver: zodResolver(formSemasi),
    defaultValues: {
      ad: baslangic?.ad ?? "",
      aciklama: baslangic?.aciklama ?? "",
      kapak_renk: baslangicRenk,
    },
  });

  React.useEffect(() => {
    form.reset({
      ad: baslangic?.ad ?? "",
      aciklama: baslangic?.aciklama ?? "",
      kapak_renk: baslangicRenk,
    });
  }, [baslangic, baslangicRenk, form]);

  const seciliRenk = form.watch("kapak_renk");

  const gonder = form.handleSubmit((veri) => {
    if (baslangic) {
      guncelle.mutate(
        {
          id: baslangic.id,
          ad: veri.ad,
          aciklama: veri.aciklama || null,
          kapak_renk: veri.kapak_renk || null,
        },
        {
          onSuccess: () => {
            toast.basari("Proje güncellendi");
            kapat();
          },
        },
      );
    } else {
      olustur.mutate(
        {
          id_taslak: tempId(),
          ad: veri.ad,
          aciklama: veri.aciklama || null,
          kapak_renk: veri.kapak_renk || null,
        },
        {
          onSuccess: () => {
            toast.basari("Proje oluşturuldu");
            kapat();
          },
        },
      );
    }
  });

  const yukleniyor = olustur.isPending || guncelle.isPending;

  return (
    <ResponsiveDialog open={acik} onOpenChange={(a) => !a && kapat()}>
      <ResponsiveDialogContent className="w-full sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {baslangic ? "Projeyi Düzenle" : "Yeni Proje"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {baslangic
              ? "Proje bilgilerini güncelleyin."
              : "Yeni proje oluşturup ilk listeleri ekleyin."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={gonder} className="grid gap-4 px-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ad">Proje Adı</Label>
            <Input
              id="ad"
              {...form.register("ad")}
              placeholder="Örn. Mart Ayı Hizmet Takibi"
              autoFocus
            />
            {form.formState.errors.ad && (
              <p className="text-destructive text-xs">
                {form.formState.errors.ad.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aciklama">Açıklama (opsiyonel)</Label>
            <Textarea
              id="aciklama"
              rows={3}
              {...form.register("aciklama")}
              placeholder="Bu proje neyi takip ediyor?"
            />
          </div>

          <div className="grid gap-2">
            <Label>Kapak Rengi</Label>
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-7">
              <button
                type="button"
                onClick={() => form.setValue("kapak_renk", "")}
                className={cn(
                  "border-input hover:border-foreground inline-flex size-9 items-center justify-center rounded-md border bg-transparent text-xs",
                  !seciliRenk && "border-foreground",
                )}
                aria-label="Renk yok"
                aria-pressed={!seciliRenk}
              >
                —
              </button>
              {PALET_RENKLERI.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => form.setValue("kapak_renk", r)}
                  className={cn(
                    "hover:ring-foreground inline-flex size-9 items-center justify-center rounded-md text-white ring-2 ring-transparent transition",
                    kapakArkaplanSinifi(r),
                    seciliRenk === r && "ring-foreground",
                  )}
                  aria-label={`Renk: ${kapakEtiketi(r) ?? r}`}
                  aria-pressed={seciliRenk === r}
                  title={kapakEtiketi(r) ?? r}
                >
                  {seciliRenk === r ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>
        </form>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={kapat}>
            İptal
          </Button>
          <Button onClick={gonder} disabled={yukleniyor}>
            {baslangic ? "Kaydet" : "Oluştur"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
