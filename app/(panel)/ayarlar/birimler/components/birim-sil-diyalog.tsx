"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Kayit = {
  id: string;
  gorunenAd: string;
  kullanici_sayisi: number;
} | null;

type Props = {
  kayit: Kayit;
  kapat: () => void;
  onayla: (id: string) => void;
  yukleniyor?: boolean;
};

export function BirimSilDiyalog({ kayit, kapat, onayla, yukleniyor }: Props) {
  return (
    <AlertDialog open={!!kayit} onOpenChange={(o) => (o ? null : kapat())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Birim silinsin mi?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium">{kayit?.gorunenAd}</span> biriminu
            sileceksiniz.
            {kayit && kayit.kullanici_sayisi > 0 ? (
              <span className="mt-2 block">
                Bu birima bağlı {kayit.kullanici_sayisi} kullanıcı var.
                Bağlantılar etkilenebilir.
              </span>
            ) : null}
            <span className="mt-2 block">
              Silme işlemi geri alınabilir (yumuşak silme).
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={yukleniyor}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => kayit && onayla(kayit.id)}
            disabled={yukleniyor}
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
