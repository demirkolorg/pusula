"use client";

// Proje Şablonları yönetim sayfası — kart-grid liste.
// Sistem şablonları görüntüleme + kullanıcı şablon oluştur/düzenle/sil.

import { useState } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  FolderKanbanIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useSablonlar, useSablonSil } from "../hooks/sablon-sorgulari";
import type { SablonOzet } from "../services";
import { kapakKutusuSiniflari } from "@/lib/kapak-renk";
import { cn } from "@/lib/utils";
import { SablonFormDialog } from "./sablon-form";

type Props = {
  kullaniciId: string;
};

export function SablonlarIstemci({ kullaniciId }: Props) {
  const { data: sablonlar, isLoading } = useSablonlar();
  const sil = useSablonSil();
  const [silinecek, setSilinecek] = useState<SablonOzet | null>(null);
  const [duzenlenecek, setDuzenlenecek] = useState<SablonOzet | null>(null);
  const [yeniDialogAcik, setYeniDialogAcik] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proje Şablonları</h1>
          <p className="text-muted-foreground text-sm">
            Sistem şablonları (sabit) ve kendi oluşturduğun şablonlar. Yeni
            proje oluştururken şablon seçerek hazır liste yapısıyla
            başlayabilirsin.
          </p>
        </div>
        <Button
          onClick={() => setYeniDialogAcik(true)}
          className="shrink-0"
        >
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Yeni Şablon
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : !sablonlar || sablonlar.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          Henüz şablon yok.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sablonlar.map((s) => (
            <SablonKart
              key={s.id}
              sablon={s}
              kullaniciSahip={s.olusturan_id === kullaniciId}
              onSil={() => setSilinecek(s)}
              onDuzenle={() => setDuzenlenecek(s)}
            />
          ))}
        </div>
      )}

      <SablonFormDialog
        acik={yeniDialogAcik}
        kapat={() => setYeniDialogAcik(false)}
        baslangic={null}
      />

      <SablonFormDialog
        acik={duzenlenecek !== null}
        kapat={() => setDuzenlenecek(null)}
        baslangic={duzenlenecek}
      />

      <AlertDialog
        open={silinecek !== null}
        onOpenChange={(acik) => !acik && setSilinecek(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şablonu sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{silinecek?.ad}</span> şablonu
              silinecek. Daha önce bu şablondan oluşturulmuş projeler etkilenmez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (silinecek) sil.mutate({ id: silinecek.id });
                setSilinecek(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SablonKart({
  sablon,
  kullaniciSahip,
  onSil,
  onDuzenle,
}: {
  sablon: SablonOzet;
  kullaniciSahip: boolean;
  onSil: () => void;
  onDuzenle: () => void;
}) {
  const kutuSinifi = kapakKutusuSiniflari(sablon.kapak_renk ?? null);
  const ikonAdi = sablon.kapak_ikon || "folder-kanban";
  const duzenlenebilir = !sablon.sistem_mi && kullaniciSahip;

  return (
    <div className="bg-card flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:border-foreground/30">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            kutuSinifi,
          )}
        >
          <DynamicIcon
            name={ikonAdi as never}
            className="h-6 w-6"
            fallback={() => <FolderKanbanIcon className="h-6 w-6" />}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-medium">{sablon.ad}</h3>
            {sablon.sistem_mi && (
              <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium">
                <ShieldCheckIcon className="h-3 w-3" />
                Sistem
              </span>
            )}
          </div>
          {sablon.aciklama && (
            <p className="text-muted-foreground mt-1 text-xs">
              {sablon.aciklama}
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase">
          Listeler ({sablon.listeler.length})
        </div>
        {sablon.listeler.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            Hiç liste yok — sıfırdan başlarsın.
          </p>
        ) : (
          <ul className="space-y-1">
            {sablon.listeler.map((l) => (
              <li
                key={l.id}
                className="bg-muted/50 rounded px-2 py-1 text-xs"
              >
                {l.ad}
                {l.wip_limit && (
                  <span className="text-muted-foreground ml-1.5">
                    (WIP: {l.wip_limit})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {duzenlenebilir && (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={onDuzenle}>
            <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
            Düzenle
          </Button>
          <Button size="sm" variant="ghost" onClick={onSil}>
            <Trash2Icon className="text-destructive mr-1.5 h-3.5 w-3.5" />
            <span className="text-destructive">Sil</span>
          </Button>
        </div>
      )}
    </div>
  );
}
