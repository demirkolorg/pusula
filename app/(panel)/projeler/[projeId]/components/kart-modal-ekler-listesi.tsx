"use client";

import * as React from "react";
import {
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PaperclipIcon,
  Trash2Icon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useOturumKullanicisi } from "@/hooks/use-oturum";
import { yuklemeBaslatEylem, yuklemeOnaylaEylem } from "../eklenti/actions";
import {
  eklentiIndir,
  kartEklentileriKey,
  useEklentiSil,
  useKartEklentileri,
} from "../eklenti/hooks";
import type { EklentiOzeti } from "../eklenti/services";
import { UyeAvatar } from "../uye/components/uye-avatar";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type Props = { kartId: string };

// Sancak referansı: sağ üstte "Dosya yükle" butonu + drop zone, altında
// attach-row listesi (32px thumb + ad + meta satırı + indir/more aksiyon).
export function KartModalEklerListesi({ kartId }: Props) {
  const sorgu = useKartEklentileri(kartId);
  const sil = useEklentiSil(kartId);
  const istemci = useQueryClient();
  const oturumQ = useOturumKullanicisi();
  const [yukleniyor, setYukleniyor] = React.useState<Set<string>>(new Set());
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const yukle = async (dosyalar: FileList | File[]) => {
    if (!oturumQ.data) {
      toast.uyari("Oturum bulunamadı.");
      return;
    }
    for (const f of Array.from(dosyalar)) {
      const tIsim = `${f.name}-${Date.now()}`;
      setYukleniyor((s) => new Set(s).add(tIsim));
      try {
        const baslatR = await yuklemeBaslatEylem({
          kart_id: kartId,
          ad: f.name,
          mime: f.type || "application/octet-stream",
          boyut: f.size,
        });
        if (!baslatR.basarili) {
          toast.hata(baslatR.hata);
          continue;
        }
        const putR = await fetch(baslatR.veri.upload_url, {
          method: "PUT",
          body: f,
          headers: { "Content-Type": f.type || "application/octet-stream" },
        });
        if (!putR.ok) {
          toast.hata(`'${f.name}' yüklenemedi.`);
          continue;
        }
        const onayR = await yuklemeOnaylaEylem({
          kart_id: kartId,
          ad: f.name,
          mime: f.type || "application/octet-stream",
          boyut: f.size,
          depolama_yolu: baslatR.veri.depolama_yolu,
        });
        if (!onayR.basarili) {
          toast.hata(onayR.hata);
          continue;
        }
        await istemci.invalidateQueries({
          queryKey: kartEklentileriKey(kartId),
        });
      } finally {
        setYukleniyor((s) => {
          const ns = new Set(s);
          ns.delete(tIsim);
          return ns;
        });
      }
    }
  };

  const indir = async (e: EklentiOzeti) => {
    const url = await eklentiIndir(e.id);
    if (!url) {
      toast.hata("İndirme bağlantısı alınamadı.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-[12px]"
          onClick={() => inputRef.current?.click()}
        >
          <PaperclipIcon className="size-3" /> Dosya yükle
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void yukle(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length > 0) void yukle(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col gap-1.5 rounded-md border border-dashed p-1 transition",
          drag && "border-primary bg-primary/5",
        )}
      >
        {yukleniyor.size > 0 && (
          <div className="text-muted-foreground flex items-center gap-1.5 px-2 py-1 text-[11px]">
            <Loader2Icon className="size-3 animate-spin" />
            {yukleniyor.size} dosya yükleniyor…
          </div>
        )}

        {sorgu.isLoading ? (
          <p className="text-muted-foreground/80 px-2 py-3 text-center text-xs">
            Yükleniyor…
          </p>
        ) : (sorgu.data?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground/80 px-2 py-3 text-center text-xs">
            Henüz ek yok. Sürükleyerek bırak ya da &ldquo;Dosya yükle&rdquo;.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sorgu.data?.map((e) => (
              <li key={e.id}>
                <EkSatiri ek={e} indir={indir} sileBas={(id) => sil.mutate({ id })} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EkSatiri({
  ek,
  indir,
  sileBas,
}: {
  ek: EklentiOzeti;
  indir: (e: EklentiOzeti) => void;
  sileBas: (id: string) => void;
}) {
  return (
    <div className="border-input hover:border-foreground/30 hover:bg-muted/40 group flex items-center gap-2 rounded-md border bg-background px-1.5 py-1.5 transition-colors">
      <DosyaThumb mime={ek.mime} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[12.5px] font-medium">
          {ek.ad}
        </p>
        <div className="text-muted-foreground/80 mt-0.5 flex items-center gap-1.5 text-[10.5px]">
          <UyeAvatar
            ad={ek.yukleyen.ad}
            soyad={ek.yukleyen.soyad}
            className="size-3.5 text-[7px]"
          />
          <span className="truncate">
            {ek.yukleyen.ad} {ek.yukleyen.soyad}
          </span>
          <span>·</span>
          <span className="tabular-nums">
            {TARIH_BICIM.format(ek.olusturma_zamani)}
          </span>
          <span>·</span>
          <span className="tabular-nums">{boyutBicim(ek.boyut)}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-6"
          onClick={() => indir(ek)}
          aria-label="İndir"
        >
          <DownloadIcon className="size-3" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-6"
                aria-label="Daha fazla"
              >
                <MoreHorizontalIcon className="size-3" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem variant="destructive" onClick={() => sileBas(ek.id)}>
              <Trash2Icon className="size-3.5" /> Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function DosyaThumb({ mime }: { mime: string }) {
  const renk = mimeRengi(mime);
  const Icon = renk.icon;
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded",
        renk.bg,
        renk.fg,
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}

function mimeRengi(mime: string): {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  fg: string;
} {
  if (mime.startsWith("image/")) {
    return { icon: ImageIcon, bg: "bg-purple-100 dark:bg-purple-950/40", fg: "text-purple-700 dark:text-purple-300" };
  }
  if (mime === "application/pdf") {
    return { icon: FileTextIcon, bg: "bg-red-100 dark:bg-red-950/40", fg: "text-red-700 dark:text-red-300" };
  }
  if (mime.includes("word") || mime.includes("document")) {
    return { icon: FileTextIcon, bg: "bg-primary/10", fg: "text-primary" };
  }
  return { icon: FileIcon, bg: "bg-muted", fg: "text-muted-foreground" };
}

function boyutBicim(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}
