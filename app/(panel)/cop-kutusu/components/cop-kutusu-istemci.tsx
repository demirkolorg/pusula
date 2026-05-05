"use client";

// Çöp Kutusu istemci bileşeni — tab bar + liste + onay dialogları.
// Komut paleti tasarım dili (renkli ikon, sayaç pill) referans alındı.

import { useState } from "react";
import {
  FolderKanbanIcon,
  KanbanSquareIcon,
  MessageSquareIcon,
  PaperclipIcon,
  RotateCcwIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  useCopGeriYukle,
  useCopKaliciSil,
  useCopKutusu,
} from "../hooks/cop-sorgulari";
import { COP_TIPLERI, type CopTipi } from "../schemas";
import type { CopOzeti } from "../services";

type Sekme = {
  id: CopTipi;
  baslik: string;
  ikon: LucideIcon;
};

const SEKMELER: Sekme[] = [
  { id: "proje", baslik: "Projeler", ikon: FolderKanbanIcon },
  { id: "kart", baslik: "Kartlar", ikon: KanbanSquareIcon },
  { id: "yorum", baslik: "Yorumlar", ikon: MessageSquareIcon },
  { id: "eklenti", baslik: "Eklentiler", ikon: PaperclipIcon },
];

// Komut paleti ile aynı renk paleti — tutarlılık için.
const TIP_RENK: Record<CopTipi, { bg: string; metin: string }> = {
  proje: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    metin: "text-indigo-600 dark:text-indigo-400",
  },
  kart: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    metin: "text-blue-600 dark:text-blue-400",
  },
  yorum: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    metin: "text-emerald-600 dark:text-emerald-400",
  },
  eklenti: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    metin: "text-sky-600 dark:text-sky-400",
  },
};

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

type Props = {
  // Makam mı? Kalıcı sil butonu sadece makam için görünür.
  makamMi: boolean;
};

export function CopKutusuIstemci({ makamMi }: Props) {
  const [aktifSekme, setAktifSekme] = useState<CopTipi>("proje");
  const [silinecek, setSilinecek] = useState<CopOzeti | null>(null);

  const { data, isLoading } = useCopKutusu(aktifSekme);
  const geriYukle = useCopGeriYukle(aktifSekme);
  const kaliciSil = useCopKaliciSil(aktifSekme);

  const kayitlar = data?.kayitlar ?? [];

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Çöp Kutusu</h1>
        <p className="text-muted-foreground text-sm">
          Silinmiş projeler, kartlar, yorumlar ve eklentiler. 30 gün sonra
          otomatik olarak kalıcı silinir.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="bg-muted/30 scrollbar-hide flex flex-wrap items-center gap-1.5 overflow-x-auto rounded-md border px-3 py-2">
        {SEKMELER.map((sekme) => {
          const aktif = aktifSekme === sekme.id;
          const Ikon = sekme.ikon;
          return (
            <button
              key={sekme.id}
              type="button"
              onClick={() => setAktifSekme(sekme.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                aktif
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background hover:bg-accent text-muted-foreground hover:text-foreground",
              )}
            >
              <Ikon className="h-3.5 w-3.5" />
              <span>{sekme.baslik}</span>
            </button>
          );
        })}
      </div>

      {/* İçerik */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted/30 flex items-start gap-4 rounded-lg p-3"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : kayitlar.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            Çöp kutusu bu kategoride boş.
          </div>
        ) : (
          <ul className="space-y-2">
            {kayitlar.map((k) => (
              <CopSatiri
                key={k.id}
                kayit={k}
                makamMi={makamMi}
                geriYukleniyor={
                  geriYukle.isPending && geriYukle.variables === k.id
                }
                onGeriYukle={() => geriYukle.mutate(k.id)}
                onKaliciSil={() => setSilinecek(k)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Kalıcı sil onay dialog */}
      <AlertDialog
        open={silinecek !== null}
        onOpenChange={(acik) => !acik && setSilinecek(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kalıcı olarak sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{silinecek?.baslik}</span> kalıcı
              olarak silinecek. Bu işlem <strong>geri alınamaz</strong>. Bağlı
              tüm liste, kart, yorum ve eklentiler de silinir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (silinecek) kaliciSil.mutate(silinecek.id);
                setSilinecek(null);
              }}
            >
              Kalıcı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CopSatiri({
  kayit,
  makamMi,
  geriYukleniyor,
  onGeriYukle,
  onKaliciSil,
}: {
  kayit: CopOzeti;
  makamMi: boolean;
  geriYukleniyor: boolean;
  onGeriYukle: () => void;
  onKaliciSil: () => void;
}) {
  const renk = TIP_RENK[kayit.tip];
  const Ikon = SEKMELER.find((s) => s.id === kayit.tip)!.ikon;

  return (
    <li className="bg-card hover:border-foreground/20 flex items-start gap-3 rounded-lg border p-3 transition-colors">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          renk.bg,
        )}
      >
        <Ikon className={cn("h-5 w-5", renk.metin)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{kayit.baslik}</div>
        {kayit.detay && (
          <div className="text-muted-foreground truncate text-xs">
            {kayit.detay}
          </div>
        )}
        <div className="text-muted-foreground/80 mt-1 text-[11px]">
          Silinme: {TARIH_FORMAT.format(kayit.silinme_zamani)}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
        <Button
          size="sm"
          variant="outline"
          onClick={onGeriYukle}
          disabled={geriYukleniyor}
        >
          <RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" />
          Geri Yükle
        </Button>
        {makamMi && (
          <Button size="sm" variant="ghost" onClick={onKaliciSil}>
            <Trash2Icon className="text-destructive mr-1.5 h-3.5 w-3.5" />
            <span className="text-destructive">Kalıcı Sil</span>
          </Button>
        )}
      </div>
    </li>
  );
}
