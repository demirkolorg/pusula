"use client";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useRolSil } from "../hooks/rol-sorgulari";
import type { RolSatiri } from "../services";

type RolSilOnayProps = {
  rol: RolSatiri;
  acik: boolean;
  kapat: () => void;
  aktifKullaniciId: string;
};

export function RolSilOnay({ rol, acik, kapat }: RolSilOnayProps) {
  const sil = useRolSil();

  const sistemKilitli = rol.sistem_rolu;
  const kullaniciSayisi = rol.kullanici_sayisi;
  const engelli = sistemKilitli || kullaniciSayisi > 0;

  const onayla = () => {
    if (engelli) return;
    sil.mutate({ id: rol.id }, { onSuccess: () => kapat() });
  };

  return (
    <ResponsiveDialog
      open={acik}
      onOpenChange={(yeni) => !yeni && kapat()}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Rolü Sil</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            <strong>{rol.ad}</strong> rolünü silmek istediğinize emin misiniz?
            Bu işlem geri alınamaz.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-2 px-4 text-sm sm:px-0">
          {sistemKilitli && (
            <p className="text-amber-600 dark:text-amber-400">
              Sistem rolleri silinemez.
            </p>
          )}
          {!sistemKilitli && kullaniciSayisi > 0 && (
            <p className="text-amber-600 dark:text-amber-400">
              Bu role atanmış {kullaniciSayisi} kullanıcı var. Önce rolü
              kullanıcılardan kaldırın.
            </p>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={kapat}
            disabled={sil.isPending}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onayla}
            disabled={engelli || sil.isPending}
          >
            {sil.isPending ? "Siliniyor…" : "Sil"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
