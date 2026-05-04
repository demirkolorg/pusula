"use client";

import * as React from "react";
import { DownloadIcon, FileIcon, ImageIcon, Loader2Icon, PaperclipIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { yuklemeBaslatEylem, yuklemeOnaylaEylem } from "../actions";
import {
  eklentiIndir,
  kartEklentileriKey,
  useEklentiSil,
  useKartEklentileri,
} from "../hooks";
import type { EklentiOzeti } from "../services";
import { useQueryClient } from "@tanstack/react-query";
import { useOturumKullanicisi } from "@/hooks/use-oturum";

type Props = { kartId: string };

export function EklentiPaneli({ kartId }: Props) {
  const sorgu = useKartEklentileri(kartId);
  const sil = useEklentiSil(kartId);
  const istemci = useQueryClient();
  const oturumQ = useOturumKullanicisi();
  const [yukleniyor, setYukleniyor] = React.useState<Set<string>>(new Set());
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [drag, setDrag] = React.useState(false);

  const dosyalariYukle = async (dosyalar: FileList | File[]) => {
    const oturum = oturumQ.data;
    if (!oturum) {
      toast.uyari("Oturum bulunamadı.");
      return;
    }
    const arr = Array.from(dosyalar);
    for (const f of arr) {
      const tIsim = `${f.name}-${Date.now()}`;
      setYukleniyor((s) => new Set(s).add(tIsim));
      try {
        // 1) Server'dan presigned PUT URL al
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
        // 2) MinIO'ya doğrudan PUT
        const putR = await fetch(baslatR.veri.upload_url, {
          method: "PUT",
          body: f,
          headers: { "Content-Type": f.type || "application/octet-stream" },
        });
        if (!putR.ok) {
          toast.hata(`'${f.name}' yüklenemedi (storage hatası).`);
          continue;
        }
        // 3) Metadata'yı DB'ye yaz
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
        // Cache'i tazele
        await istemci.invalidateQueries({ queryKey: kartEklentileriKey(kartId) });
      } catch (e) {
        toast.hata(`'${f.name}' yüklenemedi.`);
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
    // Yeni sekmede aç — presigned URL süreli
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Eklentiler</p>

      {/* Drop zone + dosya seç */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length > 0) {
            void dosyalariYukle(e.dataTransfer.files);
          }
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed py-3 text-xs transition",
          drag ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void dosyalariYukle(e.target.files);
              // input reset, aynı dosyayı tekrar seçilebilsin
              e.target.value = "";
            }
          }}
        />
        <UploadIcon className="size-3.5" />
        <span className="text-muted-foreground">
          Dosya bırakın veya seçmek için tıklayın · max 25 MB
        </span>
      </label>

      {yukleniyor.size > 0 && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Loader2Icon className="size-3 animate-spin" />
          {yukleniyor.size} dosya yükleniyor…
        </div>
      )}

      {/* Liste */}
      {sorgu.isLoading ? (
        <p className="text-muted-foreground text-xs">Yükleniyor…</p>
      ) : (sorgu.data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground text-xs">Henüz eklenti yok.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {sorgu.data?.map((e) => (
            <li
              key={e.id}
              className="hover:bg-accent/30 flex items-center gap-2 rounded px-2 py-1.5"
            >
              <DosyaIkon mime={e.mime} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{e.ad}</p>
                <p className="text-muted-foreground text-[11px]">
                  {boyutBicim(e.boyut)} · {e.yukleyen.ad} {e.yukleyen.soyad[0]}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => indir(e)}
                aria-label="İndir"
              >
                <DownloadIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => sil.mutate({ id: e.id })}
                aria-label="Sil"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DosyaIkon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) {
    return <ImageIcon className="text-muted-foreground size-4" />;
  }
  return <FileIcon className="text-muted-foreground size-4" />;
}

function boyutBicim(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

// Sidebar'dan açılabilir kompakt buton (Trello pattern: tek tıkla file picker)
export function EklentiSidebarButonu({ kartId }: { kartId: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const istemci = useQueryClient();
  const oturumQ = useOturumKullanicisi();

  const yukle = async (dosyalar: FileList) => {
    const oturum = oturumQ.data;
    if (!oturum) {
      toast.uyari("Oturum bulunamadı.");
      return;
    }
    for (const f of Array.from(dosyalar)) {
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
    }
    await istemci.invalidateQueries({ queryKey: kartEklentileriKey(kartId) });
  };

  return (
    <>
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
      <Button
        variant="ghost"
        className="justify-start"
        onClick={() => inputRef.current?.click()}
      >
        <PaperclipIcon className="size-4" /> Eklenti
      </Button>
    </>
  );
}
