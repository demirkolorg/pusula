"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { rolCogaltSemasi, type RolCogaltGirdi } from "../schemas";
import { useRolCogalt } from "../hooks/rol-sorgulari";
import type { RolSatiri } from "../services";

type RolCogaltDialogProps = {
  kaynak: RolSatiri;
  acik: boolean;
  kapat: () => void;
};

export function RolCogaltDialog({
  kaynak,
  acik,
  kapat,
}: RolCogaltDialogProps) {
  const router = useRouter();
  const cogalt = useRolCogalt();

  const form = useForm<RolCogaltGirdi>({
    resolver: zodResolver(rolCogaltSemasi),
    defaultValues: {
      kaynakId: kaynak.id,
      kod: `${kaynak.kod}_KOPYA`,
      ad: `${kaynak.ad} (Kopya)`,
      aciklama: kaynak.aciklama,
    },
  });

  useEffect(() => {
    if (acik) {
      form.reset({
        kaynakId: kaynak.id,
        kod: `${kaynak.kod}_KOPYA`,
        ad: `${kaynak.ad} (Kopya)`,
        aciklama: kaynak.aciklama,
      });
    }
  }, [acik, kaynak, form]);

  const onayla = form.handleSubmit((veri) => {
    cogalt.mutate(veri, {
      onSuccess: (sonuc) => {
        kapat();
        if (sonuc?.id) router.push(`/ayarlar/roller/${sonuc.id}`);
      },
    });
  });

  return (
    <ResponsiveDialog
      open={acik}
      onOpenChange={(yeni) => !yeni && kapat()}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Rolü Çoğalt</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            &ldquo;{kaynak.ad}&rdquo; rolünün izinlerini taşıyan yeni bir rol
            oluşturulur.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={onayla} className="flex flex-col gap-4 px-4 sm:px-0">
          <div className="grid gap-2">
            <Label htmlFor="cogalt-ad">Yeni Rol Adı</Label>
            <Input id="cogalt-ad" {...form.register("ad")} />
            {form.formState.errors.ad && (
              <p className="text-destructive text-xs">
                {form.formState.errors.ad.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cogalt-kod">Yeni Kod</Label>
            <Input
              id="cogalt-kod"
              autoCapitalize="characters"
              {...form.register("kod", {
                onChange: (e) => {
                  e.target.value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9_]/g, "");
                },
              })}
            />
            {form.formState.errors.kod && (
              <p className="text-destructive text-xs">
                {form.formState.errors.kod.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cogalt-aciklama">Açıklama</Label>
            <Textarea
              id="cogalt-aciklama"
              rows={3}
              {...form.register("aciklama")}
            />
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={kapat}
              disabled={cogalt.isPending}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={cogalt.isPending}>
              {cogalt.isPending ? "Çoğaltılıyor…" : "Çoğalt"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
