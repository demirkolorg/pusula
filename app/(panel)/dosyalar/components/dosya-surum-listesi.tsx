"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DownloadIcon,
  Loader2Icon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import {
  dosyaIndirEylem,
  dosyaSurumYuklemeBaslatEylem,
  dosyaSurumYuklemeOnaylaEylem,
} from "../actions";
import { dosyaDetayKey } from "../hooks/kullan-dosya-detay";
import { boyutBicim } from "../helpers/dosya-filtre";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Surum = {
  id: string;
  surum_no: number;
  ad: string;
  boyut: number;
  olusturma_zamani: Date;
  aciklama: string | null;
};

type Props = {
  dosyaId: string;
  surumler: Surum[];
};

export function DosyaSurumListesi({ dosyaId, surumler }: Props) {
  const istemci = useQueryClient();
  const [yukleniyor, setYukleniyor] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const aktifSurumNo = surumler[0]?.surum_no ?? null;

  const yeniSurumYukle = async (dosya: File) => {
    setYukleniyor(true);
    try {
      const baslatR = await dosyaSurumYuklemeBaslatEylem({
        dosya_id: dosyaId,
        ad: dosya.name,
        mime: dosya.type || "application/octet-stream",
        boyut: dosya.size,
      });
      if (!baslatR.basarili) {
        toast.hata(baslatR.hata);
        return;
      }
      const putR = await fetch(baslatR.veri.upload_url, {
        method: "PUT",
        body: dosya,
        headers: {
          "Content-Type": dosya.type || "application/octet-stream",
        },
      });
      if (!putR.ok) {
        toast.hata(`'${dosya.name}' yüklenemedi.`);
        return;
      }
      const onayR = await dosyaSurumYuklemeOnaylaEylem({
        oturum_id: baslatR.veri.oturum_id,
      });
      if (!onayR.basarili) {
        toast.hata(onayR.hata);
        return;
      }
      toast.basari("Yeni sürüm yüklendi.");
      await istemci.invalidateQueries({ queryKey: dosyaDetayKey(dosyaId) });
    } finally {
      setYukleniyor(false);
    }
  };

  const surumIndir = async () => {
    // Aktif sürümü indirir; geçmiş sürüm indirme F8'de.
    const r = await dosyaIndirEylem({ id: dosyaId });
    if (!r.basarili) {
      toast.hata(r.hata);
      return;
    }
    window.open(r.veri.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Toplam {surumler.length} sürüm — aktif: v{aktifSurumNo ?? "-"}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={yukleniyor}
          onClick={() => inputRef.current?.click()}
        >
          {yukleniyor ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          Yeni Sürüm
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              void yeniSurumYukle(f);
              e.target.value = "";
            }
          }}
        />
      </div>

      {surumler.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Henüz sürüm yok.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {surumler.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-md border bg-background p-2.5"
            >
              <Badge
                variant={s.surum_no === aktifSurumNo ? "default" : "outline"}
                className="shrink-0 font-normal"
              >
                v{s.surum_no}
                {s.surum_no === aktifSurumNo && " · aktif"}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.ad}</p>
                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="tabular-nums">
                    {TARIH_BICIM.format(s.olusturma_zamani)}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">{boyutBicim(s.boyut)}</span>
                </div>
                {s.aciklama && (
                  <p className="text-muted-foreground/90 mt-1 text-xs">
                    {s.aciklama}
                  </p>
                )}
              </div>
              {s.surum_no === aktifSurumNo && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={surumIndir}
                  aria-label="Aktif sürümü indir"
                  className="size-8"
                >
                  <DownloadIcon className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
