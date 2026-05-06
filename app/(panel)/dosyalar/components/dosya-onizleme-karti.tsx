"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon,
  ImageIcon,
  PresentationIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dosyaOnizlemeEylem } from "../actions";
import type { ProjeIciDosya } from "../services-proje-gorunumu";
import { boyutBicim } from "../helpers/dosya-filtre";

// Proje görünümünde her dosya için tek kart. Görsel kategorilerinde
// tarayıcıda thumbnail; diğer kategorilerde renkli ikon kutusu.
//
// Lazy thumbnail: presigned URL maliyetli olduğu için sadece kart viewport'a
// girince fetch edilir (IntersectionObserver). Görünmeyen 100+ kart için
// 100 ek istek atılmaz.

type Props = {
  dosya: ProjeIciDosya;
  onSec: (dosyaId: string) => void;
  seciliMi?: boolean;
};

const KATEGORI_BICIM: Record<
  string,
  {
    Icon: React.ComponentType<{ className?: string }>;
    renk: string;
  }
> = {
  GORSEL: {
    Icon: ImageIcon,
    renk: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  PDF: {
    Icon: FileTextIcon,
    renk: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200",
  },
  OFIS_BELGESI: {
    Icon: FileTypeIcon,
    renk: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200",
  },
  TABLO: {
    Icon: FileSpreadsheetIcon,
    renk:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200",
  },
  SUNUM: {
    Icon: PresentationIcon,
    renk:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200",
  },
  METIN: {
    Icon: FileTextIcon,
    renk: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200",
  },
  ARSIV: {
    Icon: ArchiveIcon,
    renk:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  },
  DIGER: {
    Icon: FileIcon,
    renk: "bg-muted text-muted-foreground",
  },
};

const SVG_MIME = "image/svg+xml";

export function DosyaOnizlemeKarti({ dosya, onSec, seciliMi }: Props) {
  const bicim = KATEGORI_BICIM[dosya.kategori] ?? KATEGORI_BICIM.DIGER!;
  const Icon = bicim.Icon;

  const gorselMi =
    dosya.kategori === "GORSEL" &&
    dosya.mime.toLowerCase() !== SVG_MIME &&
    dosya.durum === "HAZIR";

  return (
    <button
      type="button"
      onClick={() => onSec(dosya.id)}
      className={cn(
        "group bg-card relative flex flex-col gap-2 overflow-hidden rounded-lg border p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/30",
        seciliMi && "border-primary ring-1 ring-primary",
      )}
      aria-label={`${dosya.ad} dosyasını aç`}
    >
      <div className="bg-muted/20 relative flex h-20 w-full items-center justify-center overflow-hidden rounded-md">
        {gorselMi ? (
          <ThumbnailGorsel dosyaId={dosya.id} ad={dosya.ad} />
        ) : (
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-md",
              bicim.renk,
            )}
            aria-hidden
          >
            <Icon className="size-6" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium" title={dosya.ad}>
          {dosya.ad}
        </p>
        <p className="text-muted-foreground tabular-nums truncate text-[10px]">
          {boyutBicim(dosya.boyut)}
        </p>
      </div>
    </button>
  );
}

function ThumbnailGorsel({ dosyaId, ad }: { dosyaId: string; ad: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [gorunur, setGorunur] = React.useState(false);

  React.useEffect(() => {
    if (gorunur) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setGorunur(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [gorunur]);

  const sorgu = useQuery({
    queryKey: ["dosya-onizleme-url", dosyaId],
    enabled: gorunur,
    queryFn: async () => {
      const r = await dosyaOnizlemeEylem({ id: dosyaId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 8 * 60_000,
  });

  return (
    <div ref={ref} className="flex size-full items-center justify-center p-1">
      {sorgu.data?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sorgu.data.url}
          alt={ad}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      ) : (
        <ImageIcon className="text-muted-foreground/60 size-6" />
      )}
    </div>
  );
}
