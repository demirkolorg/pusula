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
import { rolOlusturSemasi, type RolOlusturGirdi } from "../schemas";
import { useRolOlustur } from "../hooks/rol-sorgulari";

type RolFormDialogProps = {
  acik: boolean;
  kapat: () => void;
};

export function RolFormDialog({ acik, kapat }: RolFormDialogProps) {
  const router = useRouter();
  const olustur = useRolOlustur();

  const form = useForm<RolOlusturGirdi>({
    resolver: zodResolver(rolOlusturSemasi),
    defaultValues: { kod: "", ad: "", aciklama: null, izinler: [] },
  });

  useEffect(() => {
    if (acik) form.reset({ kod: "", ad: "", aciklama: null, izinler: [] });
  }, [acik, form]);

  const onayla = form.handleSubmit((veri) => {
    olustur.mutate(veri, {
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
          <ResponsiveDialogTitle>Yeni Rol</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Rolü oluşturduktan sonra izinlerini düzenleyebilirsiniz.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={onayla} className="flex flex-col gap-4 px-4 sm:px-0">
          <div className="grid gap-2">
            <Label htmlFor="rol-ad">Rol Adı</Label>
            <Input
              id="rol-ad"
              placeholder="Örn. Denetim Sorumlusu"
              {...form.register("ad")}
            />
            {form.formState.errors.ad && (
              <p className="text-destructive text-xs">
                {form.formState.errors.ad.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rol-kod">Kod</Label>
            <Input
              id="rol-kod"
              placeholder="DENETIM_SORUMLUSU"
              autoCapitalize="characters"
              {...form.register("kod", {
                onChange: (e) => {
                  e.target.value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9_]/g, "");
                },
              })}
            />
            <p className="text-muted-foreground text-xs">
              Büyük harfle başlamalı; harf, rakam, alt çizgi.
            </p>
            {form.formState.errors.kod && (
              <p className="text-destructive text-xs">
                {form.formState.errors.kod.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rol-aciklama">Açıklama (opsiyonel)</Label>
            <Textarea
              id="rol-aciklama"
              rows={3}
              placeholder="Rolün rolünü kısaca açıklayın."
              {...form.register("aciklama")}
            />
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={kapat}
              disabled={olustur.isPending}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={olustur.isPending}>
              {olustur.isPending ? "Oluşturuluyor…" : "Oluştur"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
