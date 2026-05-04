"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { KURUM_TIP_LABEL, kurumGorunenAd } from "@/lib/constants/kurum";
import { kurumSecenekleriniGetir } from "../../kurumlar/actions";
import { davetGonderEylem, rolListele } from "../actions";
import { davetGonderSemasi, type DavetGonder } from "../schemas";

const HIC = "__yok__";

type Props = {
  acik: boolean;
  kapat: () => void;
  basaridaTetikle?: () => void;
};

export function DavetGonderSheet({ acik, kapat, basaridaTetikle }: Props) {
  const form = useForm<DavetGonder>({
    resolver: zodResolver(davetGonderSemasi),
    defaultValues: { email: "", rol_id: null, kurum_id: "" },
  });

  React.useEffect(() => {
    if (acik) form.reset({ email: "", rol_id: null, kurum_id: "" });
  }, [acik, form]);

  const rolSorgu = useQuery({
    queryKey: ["roller"],
    queryFn: async () => {
      const r = await rolListele(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: acik,
  });

  const kurumSorgu = useQuery({
    queryKey: ["kurum-secenekleri"],
    queryFn: async () => {
      const r = await kurumSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: acik,
  });

  const gonderMut = useMutation({
    mutationFn: async (veri: DavetGonder) => {
      const r = await davetGonderEylem(veri);
      if (!r.basarili) throw r;
      return r.veri;
    },
    onSuccess: () => {
      toast.basari("Davet gönderildi.");
      basaridaTetikle?.();
      kapat();
    },
  });

  const gonder = form.handleSubmit(async (veri) => {
    try {
      await gonderMut.mutateAsync(veri);
    } catch (err: unknown) {
      const sonuc = err as { hata?: string; alanlar?: Record<string, string> };
      if (sonuc.alanlar) {
        for (const [alan, m] of Object.entries(sonuc.alanlar)) {
          form.setError(alan as keyof DavetGonder, { message: m });
        }
      }
      toast.hata(sonuc.hata ?? "Gönderilemedi");
    }
  });

  const rolDeger = form.watch("rol_id");
  const kurumDeger = form.watch("kurum_id");

  return (
    <ResponsiveDialog open={acik} onOpenChange={(o) => (o ? null : kapat())}>
      <ResponsiveDialogContent className="flex w-full flex-col gap-4 p-0 sm:max-w-md">
        <ResponsiveDialogHeader className="border-b p-4">
          <ResponsiveDialogTitle>Davet Gönder</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            E-posta adresine davet bağlantısı gönderin. Bağlantı 7 gün
            geçerlidir.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={gonder}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-posta</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder="ad.soyad@kurum.gov.tr"
                className="pl-9"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="davet_kurum">Atanacak Kurum</Label>
            <Select
              value={kurumDeger || ""}
              onValueChange={(v) => form.setValue("kurum_id", v ?? "")}
            >
              <SelectTrigger id="davet_kurum">
                <SelectValue>
                  {(v) => {
                    if (!v) return "Kurum seçin";
                    const k = (kurumSorgu.data ?? []).find((x) => x.id === v);
                    return k
                      ? kurumGorunenAd({ ad: k.ad, tip: k.tip })
                      : "Kurum seçin";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(kurumSorgu.data ?? []).map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {kurumGorunenAd({ ad: k.ad, tip: k.tip })}
                    {k.ad && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {KURUM_TIP_LABEL[k.tip]}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.kurum_id && (
              <p className="text-destructive text-sm">
                {form.formState.errors.kurum_id.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Atanacak Rol (opsiyonel)</Label>
            <Select
              value={rolDeger ?? HIC}
              onValueChange={(v) =>
                form.setValue("rol_id", v === HIC ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {(v) => {
                    if (!v || v === HIC) return "Rol yok";
                    const r = (rolSorgu.data ?? []).find((x) => x.id === v);
                    return r ? r.ad : "Rol yok";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={HIC}>Rol yok</SelectItem>
                {(rolSorgu.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <ResponsiveDialogFooter className="border-t p-4">
          <Button type="button" variant="outline" onClick={kapat}>
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={gonder}
            disabled={gonderMut.isPending}
          >
            {gonderMut.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Gönderiliyor
              </>
            ) : (
              "Davet Gönder"
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
