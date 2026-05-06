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
import { EtiketRozet } from "./etiket-rozet";

type Kayit = {
  id: string;
  ad: string;
  renk: string;
  kart_sayisi: number;
} | null;

type Props = {
  kayit: Kayit;
  kapat: () => void;
  onayla: (id: string) => void;
  yukleniyor?: boolean;
};

export function EtiketSilDiyalog({
  kayit,
  kapat,
  onayla,
  yukleniyor,
}: Props) {
  return (
    <AlertDialog open={!!kayit} onOpenChange={(o) => (o ? null : kapat())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Etiket silinsin mi?</AlertDialogTitle>
          <AlertDialogDescription>
            Aşağıdaki etiketi silmek üzeresiniz. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-muted-foreground flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>Silinecek etiket:</span>
            {kayit && (
              <EtiketRozet
                etiket={{ ad: kayit.ad, renk: kayit.renk }}
                boyut="sm"
              />
            )}
          </div>
          {kayit && kayit.kart_sayisi > 0 && (
            <p className="text-foreground/80">
              Bu etiket{" "}
              <span className="font-medium">{kayit.kart_sayisi}</span> karta
              atanmış. Silinince kartlardan otomatik kaldırılır, kartlar
              silinmez.
            </p>
          )}
        </div>
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
