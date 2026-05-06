"use client";

// Şablon oluştur/düzenle dialog (ADR-0021).
// Form alanları: ad, açıklama, renk, ikon, listeler.
// Liste yönetimi: SablonListeYonetici (yukarı/aşağı buton ile sırala).

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  KAPAK_RENK_TOKENLERI,
  kapakArkaplanSinifi,
  type KapakRenk,
} from "@/lib/kapak-renk";
import { ikonMu } from "@/lib/kapak-ikon";
import { ProjeFormIkonBolumu } from "@/app/(panel)/projeler/components/proje-form-ikon-bolumu";
import { ProjeFormRenkBolumu } from "@/app/(panel)/projeler/components/proje-form-renk-bolumu";
import { useSablonGuncelle, useSablonOlustur } from "../hooks/sablon-sorgulari";
import type { SablonOzet } from "../services";
import { SablonListeYonetici } from "./sablon-liste-yonetici";
import type { SablonListeTaslagi } from "./sablon-form-helper";

const formSemasi = z.object({
  ad: z
    .string()
    .trim()
    .min(2, "En az 2 karakter")
    .max(80, "En fazla 80 karakter"),
  aciklama: z.string().max(500).optional(),
  kapak_renk: z.enum(KAPAK_RENK_TOKENLERI).optional().or(z.literal("")),
  kapak_ikon: z.string().max(64).optional().or(z.literal("")),
  listeler: z
    .array(
      z.object({
        ad: z
          .string()
          .trim()
          .min(1, "Liste adı boş olamaz")
          .max(60, "En fazla 60 karakter"),
        wip_limit: z
          .number()
          .int()
          .min(1, "1 ile 999 arası")
          .max(999, "1 ile 999 arası")
          .nullable(),
      }),
    )
    .max(20, "En fazla 20 liste"),
});

type FormVeri = z.infer<typeof formSemasi>;

type Props = {
  acik: boolean;
  kapat: () => void;
  baslangic: SablonOzet | null;
};

export function SablonFormDialog({ acik, kapat, baslangic }: Props) {
  const olustur = useSablonOlustur();
  const guncelle = useSablonGuncelle();

  const duzenleme = baslangic !== null;

  const baslangicRenk =
    baslangic?.kapak_renk &&
    (KAPAK_RENK_TOKENLERI as readonly string[]).includes(baslangic.kapak_renk)
      ? (baslangic.kapak_renk as KapakRenk)
      : "";
  const baslangicIkon = ikonMu(baslangic?.kapak_ikon)
    ? baslangic.kapak_ikon
    : "";

  const form = useForm<FormVeri>({
    resolver: zodResolver(formSemasi),
    defaultValues: {
      ad: "",
      aciklama: "",
      kapak_renk: "",
      kapak_ikon: "",
      listeler: [],
    },
  });

  React.useEffect(() => {
    if (!acik) return;
    form.reset({
      ad: baslangic?.ad ?? "",
      aciklama: baslangic?.aciklama ?? "",
      kapak_renk: baslangicRenk,
      kapak_ikon: baslangicIkon,
      listeler:
        baslangic?.listeler.map((l) => ({
          ad: l.ad,
          wip_limit: l.wip_limit ?? null,
        })) ?? [],
    });
  }, [acik, baslangic, baslangicRenk, baslangicIkon, form]);

  const seciliRenk = form.watch("kapak_renk");
  const seciliIkon = form.watch("kapak_ikon") ?? "";

  const gonder = form.handleSubmit((veri) => {
    const ikonGonder = ikonMu(veri.kapak_ikon) ? veri.kapak_ikon : null;
    const ortakGirdi = {
      ad: veri.ad,
      aciklama: veri.aciklama || null,
      kapak_renk: veri.kapak_renk || null,
      kapak_ikon: ikonGonder,
      listeler: veri.listeler.map((l) => ({
        ad: l.ad,
        wip_limit: l.wip_limit ?? null,
      })),
    };

    if (duzenleme && baslangic) {
      guncelle.mutate(
        { id: baslangic.id, ...ortakGirdi },
        { onSuccess: () => kapat() },
      );
      return;
    }
    olustur.mutate(ortakGirdi, { onSuccess: () => kapat() });
  });

  const yukleniyor = olustur.isPending || guncelle.isPending;
  const listeHatalari = (
    form.formState.errors.listeler as
      | Array<{ ad?: { message?: string }; wip_limit?: { message?: string } }>
      | undefined
  )?.map((h) =>
    h
      ? {
          ad: h.ad?.message,
          wip_limit: h.wip_limit?.message,
        }
      : undefined,
  );

  return (
    <ResponsiveDialog open={acik} onOpenChange={(a) => !a && kapat()}>
      <ResponsiveDialogContent className="w-full sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {duzenleme ? "Şablonu Düzenle" : "Yeni Şablon"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {duzenleme
              ? "Şablon bilgilerini ve listeleri güncelle."
              : "Hazır liste yapısı kaydet — sonra yeni proje oluştururken seç."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={gonder} className="grid gap-4 px-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="sablon-ad">Şablon Adı</Label>
            <Input
              id="sablon-ad"
              {...form.register("ad")}
              placeholder="Örn. Aylık Denetim"
              autoFocus
            />
            {form.formState.errors.ad && (
              <p className="text-destructive text-xs">
                {form.formState.errors.ad.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sablon-aciklama">Açıklama (opsiyonel)</Label>
            <Textarea
              id="sablon-aciklama"
              rows={2}
              {...form.register("aciklama")}
              placeholder="Bu şablon ne için kullanılır?"
            />
            {form.formState.errors.aciklama && (
              <p className="text-destructive text-xs">
                {form.formState.errors.aciklama.message}
              </p>
            )}
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

          <Controller
            control={form.control}
            name="listeler"
            render={({ field }) => (
              <SablonListeYonetici
                listeler={field.value as SablonListeTaslagi[]}
                onChange={(yeni) => field.onChange(yeni)}
                hatalar={listeHatalari}
              />
            )}
          />

          {form.formState.errors.listeler?.message && (
            <p className="text-destructive text-xs">
              {form.formState.errors.listeler.message}
            </p>
          )}
        </form>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={kapat}>
            İptal
          </Button>
          <Button onClick={gonder} disabled={yukleniyor}>
            {duzenleme ? "Kaydet" : "Oluştur"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
