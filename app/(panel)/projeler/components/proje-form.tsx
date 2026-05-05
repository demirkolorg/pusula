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
  kapakArkaplanSinifi,
  type KapakRenk,
} from "@/lib/kapak-renk";
import { ikonMu } from "@/lib/kapak-ikon";
import { ProjeFormIkonBolumu } from "./proje-form-ikon-bolumu";
import { ProjeFormRenkBolumu } from "./proje-form-renk-bolumu";
import { useProjeGuncelle, useProjeOlustur, projelerKey } from "../hooks/proje-sorgulari";
import type { ProjeKart } from "../services";

const formSemasi = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter").max(200),
  aciklama: z.string().max(2000).optional(),
  kapak_renk: z
    .enum(KAPAK_RENK_TOKENLERI)
    .optional()
    .or(z.literal("")),
  // Lucide ikon ismi — boş string = seçilmedi.
  // Geçerlilik runtime'da `ikonMu` ile zorunlu (server-side schema kati).
  kapak_ikon: z.string().max(64).optional().or(z.literal("")),
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

  const baslangicIkon = ikonMu(baslangic?.kapak_ikon) ? baslangic.kapak_ikon : "";

  const form = useForm<FormVeri>({
    resolver: zodResolver(formSemasi),
    defaultValues: {
      ad: baslangic?.ad ?? "",
      aciklama: baslangic?.aciklama ?? "",
      kapak_renk: baslangicRenk,
      kapak_ikon: baslangicIkon,
    },
  });

  React.useEffect(() => {
    form.reset({
      ad: baslangic?.ad ?? "",
      aciklama: baslangic?.aciklama ?? "",
      kapak_renk: baslangicRenk,
      kapak_ikon: baslangicIkon,
    });
  }, [baslangic, baslangicRenk, baslangicIkon, form]);

  const seciliRenk = form.watch("kapak_renk");
  const seciliIkon = form.watch("kapak_ikon") ?? "";

  const gonder = form.handleSubmit((veri) => {
    const ikonGonder = ikonMu(veri.kapak_ikon) ? veri.kapak_ikon : null;
    if (baslangic) {
      guncelle.mutate(
        {
          id: baslangic.id,
          ad: veri.ad,
          aciklama: veri.aciklama || null,
          kapak_renk: veri.kapak_renk || null,
          kapak_ikon: ikonGonder,
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
          kapak_ikon: ikonGonder,
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

          <ProjeFormRenkBolumu
            deger={seciliRenk ?? ""}
            onSec={(yeni) => form.setValue("kapak_renk", yeni)}
          />

          <ProjeFormIkonBolumu
            deger={seciliIkon}
            onSec={(yeni) => form.setValue("kapak_ikon", yeni ?? "")}
            zeminRenkSinifi={kapakArkaplanSinifi(seciliRenk || null)}
          />
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
